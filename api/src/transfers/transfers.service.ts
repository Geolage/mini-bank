import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTransferDto } from './dto/create-transfer.dto.js';
import type { TransferResultDto } from './dto/transfer-result.dto.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

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

        for (const accountId of [source.id, target.id].sort()) {
          await tx.$queryRaw`SELECT id FROM accounts WHERE id = ${accountId} FOR UPDATE`;
        }

        const locked = await tx.account.findMany({
          where: { id: { in: [source.id, target.id] } },
        });
        const lockedSource = locked.find(
          (account) => account.id === source.id,
        );

        if (!lockedSource) {
          throw new NotFoundException('Source account not found');
        }

        if (lockedSource.balance.lt(amount)) {
          throw new BadRequestException('Insufficient funds');
        }

        await tx.account.update({
          where: { id: source.id },
          data: { balance: { decrement: amount } },
        });
        await tx.account.update({
          where: { id: target.id },
          data: { balance: { increment: amount } },
        });

        const reference = `TXN-${randomUUID()}`;
        const transaction = await tx.transaction.create({
          data: {
            reference,
            fromAccountId: source.id,
            toAccountId: target.id,
            amount,
            currency: source.currency,
            status: TransactionStatus.COMPLETED,
            idempotencyKey,
            note: dto.note ?? null,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: userId,
            action: 'TRANSFER_CREATED',
            resourceType: 'Transaction',
            resourceId: transaction.id,
            metadata: {
              reference,
              fromAccountId: source.id,
              toAccountId: target.id,
              amount: amount.toFixed(2),
              currency: source.currency,
            },
          },
        });

        return { id: transaction.id, reference };
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
    client: Pick<Prisma.TransactionClient, 'transaction' | 'account'>,
    userId: string,
    idempotencyKey: string,
  ): Promise<TransferResultDto | null> {
    const existing = await client.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (!existing) return null;

    const owned = await client.account.findFirst({
      where: { id: existing.fromAccountId, userId },
      select: { id: true },
    });

    if (!owned) {
      throw new ConflictException('Idempotency key is already in use');
    }

    return { id: existing.id, reference: existing.reference };
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
