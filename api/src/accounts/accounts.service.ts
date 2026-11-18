import { Injectable, NotFoundException } from '@nestjs/common';
import type { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AccountDto } from './dto/account.dto.js';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<AccountDto[]> {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return accounts.map(toAccountDto);
  }

  async findOneForUser(userId: string, accountId: string): Promise<AccountDto> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return toAccountDto(account);
  }
}

function toAccountDto(account: Account): AccountDto {
  return {
    id: account.id,
    accountNumber: account.accountNumber,
    type: account.type,
    currency: account.currency,
    balance: account.balance.toFixed(2),
  };
}
