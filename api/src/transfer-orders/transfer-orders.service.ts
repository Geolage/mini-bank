import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, TransferOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { TransferResultDto } from '../transfers/dto/transfer-result.dto.js';
import { TransferLedgerService } from '../transfers/transfer-ledger.service.js';
import type {
  ApproveTransferOrderDto,
  RejectTransferOrderDto,
} from './dto/decide-transfer-order.dto.js';
import type { ListTransferOrdersQueryDto } from './dto/list-transfer-orders-query.dto.js';
import type {
  PaginatedTransferOrdersDto,
  TransferOrderDto,
} from './dto/transfer-order.dto.js';

const ORDER_INCLUDE = {
  maker: { select: { id: true, name: true, username: true } },
  checker: { select: { id: true, name: true, username: true } },
  fromAccount: { select: { id: true, accountNumber: true, type: true } },
  toAccount: { select: { id: true, accountNumber: true, type: true } },
} satisfies Prisma.TransferOrderInclude;

type TransferOrderWithRelations = Prisma.TransferOrderGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;

@Injectable()
export class TransferOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: TransferLedgerService,
  ) {}

  async list(
    userId: string,
    role: Role,
    query: ListTransferOrdersQueryDto,
  ): Promise<PaginatedTransferOrdersDto> {
    const where: Prisma.TransferOrderWhereInput = {
      ...(role === Role.OPERATOR ? { makerId: userId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.transferOrder.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.transferOrder.count({ where }),
    ]);

    return {
      items: orders.map(toTransferOrderDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  approve(
    checkerId: string,
    orderId: string,
    dto: ApproveTransferOrderDto,
  ): Promise<TransferResultDto> {
    return this.prisma.$transaction(async (tx) => {
      const order = await this.lockOrder(tx, orderId);

      if (order.status !== TransferOrderStatus.PENDING) {
        throw new ConflictException('Transfer order is no longer pending');
      }

      if (order.makerId === checkerId) {
        throw new ForbiddenException(
          'You cannot approve your own transfer order',
        );
      }

      const executed = await this.ledger.execute(tx, {
        actorId: checkerId,
        fromAccountId: order.fromAccountId,
        toAccountId: order.toAccountId,
        amount: order.amount,
        currency: order.currency,
        note: order.note,
        idempotencyKey: `approval:${order.id}`,
        orderId: order.id,
      });

      await tx.transferOrder.update({
        where: { id: order.id },
        data: {
          status: TransferOrderStatus.APPROVED,
          checkerId,
          decidedAt: new Date(),
          decisionNote: dto.decisionNote?.trim() || null,
          transactionId: executed.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: checkerId,
          action: 'TRANSFER_ORDER_APPROVED',
          resourceType: 'TransferOrder',
          resourceId: order.id,
          metadata: {
            reference: order.reference,
            transactionId: executed.id,
            transactionReference: executed.reference,
            amount: order.amount.toFixed(2),
            currency: order.currency,
          },
        },
      });

      return { ...executed, status: 'COMPLETED' as const };
    });
  }

  reject(
    checkerId: string,
    orderId: string,
    dto: RejectTransferOrderDto,
  ): Promise<TransferResultDto> {
    return this.prisma.$transaction(async (tx) => {
      const order = await this.lockOrder(tx, orderId);

      if (order.status !== TransferOrderStatus.PENDING) {
        throw new ConflictException('Transfer order is no longer pending');
      }

      if (order.makerId === checkerId) {
        throw new ForbiddenException(
          'You cannot reject your own transfer order',
        );
      }

      const reason = dto.decisionNote.trim();
      if (!reason) {
        throw new BadRequestException('A rejection reason is required');
      }

      await tx.transferOrder.update({
        where: { id: order.id },
        data: {
          status: TransferOrderStatus.REJECTED,
          checkerId,
          decidedAt: new Date(),
          decisionNote: reason,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: checkerId,
          action: 'TRANSFER_ORDER_REJECTED',
          resourceType: 'TransferOrder',
          resourceId: order.id,
          metadata: {
            reference: order.reference,
            decisionNote: reason,
          },
        },
      });

      return {
        id: order.id,
        reference: order.reference,
        status: 'REJECTED' as const,
      };
    });
  }

  cancel(userId: string, orderId: string): Promise<TransferResultDto> {
    return this.prisma.$transaction(async (tx) => {
      const order = await this.lockOrder(tx, orderId);

      if (order.makerId !== userId) {
        throw new ForbiddenException(
          'Only the maker can cancel this transfer order',
        );
      }

      if (order.status !== TransferOrderStatus.PENDING) {
        throw new ConflictException('Transfer order is no longer pending');
      }

      await tx.transferOrder.update({
        where: { id: order.id },
        data: {
          status: TransferOrderStatus.CANCELLED,
          decidedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'TRANSFER_ORDER_CANCELLED',
          resourceType: 'TransferOrder',
          resourceId: order.id,
          metadata: { reference: order.reference },
        },
      });

      return {
        id: order.id,
        reference: order.reference,
        status: 'CANCELLED' as const,
      };
    });
  }

  private async lockOrder(tx: Prisma.TransactionClient, orderId: string) {
    await tx.$queryRaw`SELECT id FROM transfer_orders WHERE id = ${orderId} FOR UPDATE`;

    const order = await tx.transferOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Transfer order not found');
    }

    return order;
  }
}

function toTransferOrderDto(
  order: TransferOrderWithRelations,
): TransferOrderDto {
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    amount: order.amount.toFixed(2),
    currency: order.currency,
    note: order.note,
    createdAt: order.createdAt.toISOString(),
    decidedAt: order.decidedAt?.toISOString() ?? null,
    decisionNote: order.decisionNote,
    maker: order.maker,
    checker: order.checker,
    fromAccount: order.fromAccount,
    toAccount: order.toAccount,
    transactionId: order.transactionId,
  };
}
