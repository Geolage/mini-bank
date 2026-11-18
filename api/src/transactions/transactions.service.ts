import { NotFoundException, Injectable } from '@nestjs/common';
import type { Prisma, Transaction } from '@prisma/client';
import { buildCreatedAtFilter } from '../common/utils/date-filter.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ListTransactionsQueryDto } from './dto/list-transactions-query.dto.js';
import type {
  PaginatedTransactionsDto,
  TransactionDto,
} from './dto/transaction.dto.js';
import { TransactionDirection } from './types/transaction-direction.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForAccount(
    userId: string,
    accountId: string,
    query: ListTransactionsQueryDto,
  ): Promise<PaginatedTransactionsDto> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const { page, pageSize, type, from, to } = query;
    const createdAt = buildCreatedAtFilter(from, to);
    const where: Prisma.TransactionWhereInput = {
      ...(type === TransactionDirection.OUTGOING
        ? { fromAccountId: accountId }
        : type === TransactionDirection.INCOMING
          ? { toAccountId: accountId }
          : {
              OR: [
                { fromAccountId: accountId },
                { toAccountId: accountId },
              ],
            }),
      ...(createdAt ? { createdAt } : {}),
    };

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: transactions.map(toTransactionDto),
      page,
      pageSize,
      total,
    };
  }
}

function toTransactionDto(transaction: Transaction): TransactionDto {
  return {
    id: transaction.id,
    reference: transaction.reference,
    fromAccountId: transaction.fromAccountId,
    toAccountId: transaction.toAccountId,
    amount: transaction.amount.toFixed(2),
    currency: transaction.currency,
    status: transaction.status,
    note: transaction.note,
    createdAt: transaction.createdAt.toISOString(),
  };
}
