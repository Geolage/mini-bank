import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type Currency, Prisma, TransactionStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export interface TransferExecutionParams {
  actorId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: Prisma.Decimal;
  currency: Currency;
  note: string | null;
  idempotencyKey: string;
  orderId?: string;
}

@Injectable()
export class TransferLedgerService {
  async execute(
    tx: Prisma.TransactionClient,
    params: TransferExecutionParams,
  ): Promise<{ id: string; reference: string }> {
    for (const accountId of [params.fromAccountId, params.toAccountId].sort()) {
      await tx.$queryRaw`SELECT id FROM accounts WHERE id = ${accountId} FOR UPDATE`;
    }

    const locked = await tx.account.findMany({
      where: {
        id: { in: [params.fromAccountId, params.toAccountId] },
      },
    });
    const lockedSource = locked.find(
      (account) => account.id === params.fromAccountId,
    );

    if (!lockedSource) {
      throw new NotFoundException('Source account not found');
    }

    if (lockedSource.balance.lt(params.amount)) {
      throw new BadRequestException('Insufficient funds');
    }

    await tx.account.update({
      where: { id: params.fromAccountId },
      data: { balance: { decrement: params.amount } },
    });
    await tx.account.update({
      where: { id: params.toAccountId },
      data: { balance: { increment: params.amount } },
    });

    const reference = `TXN-${randomUUID()}`;
    const transaction = await tx.transaction.create({
      data: {
        reference,
        fromAccountId: params.fromAccountId,
        toAccountId: params.toAccountId,
        amount: params.amount,
        currency: params.currency,
        status: TransactionStatus.COMPLETED,
        idempotencyKey: params.idempotencyKey,
        note: params.note,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.actorId,
        action: 'TRANSFER_CREATED',
        resourceType: 'Transaction',
        resourceId: transaction.id,
        metadata: {
          reference,
          fromAccountId: params.fromAccountId,
          toAccountId: params.toAccountId,
          amount: params.amount.toFixed(2),
          currency: params.currency,
          ...(params.orderId ? { orderId: params.orderId } : {}),
        },
      },
    });

    return { id: transaction.id, reference };
  }
}
