import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransferOrderStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { readApprovalThreshold } from './approval-threshold.js';
import type { CreateTransferDto } from './dto/create-transfer.dto.js';
import type {
  TransferResultDto,
  TransferResultStatus,
} from './dto/transfer-result.dto.js';
import { TransferLedgerService } from './transfer-ledger.service.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TransfersService {
  private readonly approvalThreshold: Prisma.Decimal;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: TransferLedgerService,
  ) {
    this.approvalThreshold = readApprovalThreshold(
      process.env.TRANSFER_APPROVAL_THRESHOLD,
    );
  }

  async create(
    userId: string,
    dto: CreateTransferDto,
    idempotencyKey: string | undefined,
  ): Promise<TransferResultDto> {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    if (!UUID_PATTERN.test(idempotencyKey)) {
      throw new BadRequestException('Idempotency-Key must be a UUID');
    }

    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lte(0)) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const replay = await this.findReplay(tx, userId, idempotencyKey);
        if (replay) return replay;

        const source = await tx.account.findFirst({
          where: { id: dto.fromAccountId, userId },
        });

        if (!source) {
          throw new NotFoundException('Source account not found');
        }

        const target = await tx.account.findUnique({
          where: { accountNumber: dto.toAccountNumber },
        });

        if (!target) {
          throw new NotFoundException('Destination account not found');
        }

        if (source.id === target.id) {
          throw new BadRequestException('Cannot transfer to the same account');
        }

        if (source.currency !== target.currency) {
          throw new BadRequestException(
            'Source and destination currencies must match',
          );
        }

        if (amount.gte(this.approvalThreshold)) {
          if (source.balance.lt(amount)) {
            throw new BadRequestException('Insufficient funds');
          }

          const order = await tx.transferOrder.create({
            data: {
              reference: `ORD-${randomUUID()}`,
              idempotencyKey,
              makerId: userId,
              fromAccountId: source.id,
              toAccountId: target.id,
              amount,
              currency: source.currency,
              note: dto.note ?? null,
              status: TransferOrderStatus.PENDING,
            },
          });

          await tx.auditLog.create({
            data: {
              actorId: userId,
              action: 'TRANSFER_ORDER_CREATED',
              resourceType: 'TransferOrder',
              resourceId: order.id,
              metadata: {
                reference: order.reference,
                fromAccountId: source.id,
                toAccountId: target.id,
                amount: amount.toFixed(2),
                currency: source.currency,
              },
            },
          });

          return {
            id: order.id,
            reference: order.reference,
            status: 'PENDING_APPROVAL' as const,
          };
        }

        const executed = await this.ledger.execute(tx, {
          actorId: userId,
          fromAccountId: source.id,
          toAccountId: target.id,
          amount,
          currency: source.currency,
          note: dto.note ?? null,
          idempotencyKey,
        });

        return { ...executed, status: 'COMPLETED' as const };
      });
    } catch (error) {
      if (isIdempotencyConflict(error)) {
        const replay = await this.findReplay(
          this.prisma,
          userId,
          idempotencyKey,
        );
        if (replay) return replay;
      }

      throw error;
    }
  }

  private async findReplay(
    client: Pick<
      Prisma.TransactionClient,
      'transaction' | 'account' | 'transferOrder'
    >,
    userId: string,
    idempotencyKey: string,
  ): Promise<TransferResultDto | null> {
    const existing = await client.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      const owned = await client.account.findFirst({
        where: { id: existing.fromAccountId, userId },
        select: { id: true },
      });

      if (!owned) {
        throw new ConflictException('Idempotency key is already in use');
      }

      return {
        id: existing.id,
        reference: existing.reference,
        status: 'COMPLETED',
      };
    }

    const existingOrder = await client.transferOrder.findUnique({
      where: { idempotencyKey },
    });

    if (existingOrder) {
      if (existingOrder.makerId !== userId) {
        throw new ConflictException('Idempotency key is already in use');
      }

      return {
        id: existingOrder.id,
        reference: existingOrder.reference,
        status: mapOrderStatus(existingOrder.status),
      };
    }

    return null;
  }
}

function mapOrderStatus(status: TransferOrderStatus): TransferResultStatus {
  switch (status) {
    case TransferOrderStatus.APPROVED:
      return 'COMPLETED';
    case TransferOrderStatus.REJECTED:
      return 'REJECTED';
    case TransferOrderStatus.CANCELLED:
      return 'CANCELLED';
    default:
      return 'PENDING_APPROVAL';
  }
}

function isIdempotencyConflict(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) return target.includes('idempotency_key');
  return target === 'idempotency_key';
}
