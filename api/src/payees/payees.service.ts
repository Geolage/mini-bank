import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePayeeDto } from './dto/create-payee.dto.js';
import type {
  ListPayeesQueryDto,
  PayeeSort,
} from './dto/list-payees-query.dto.js';
import type { PayeeDto, PaginatedPayeesDto } from './dto/payee.dto.js';
import type { UpdatePayeeDto } from './dto/update-payee.dto.js';

const ORDER_BY: Record<PayeeSort, Prisma.PayeeOrderByWithRelationInput[]> = {
  name: [{ name: 'asc' }, { id: 'asc' }],
  nameDesc: [{ name: 'desc' }, { id: 'desc' }],
  updated: [{ updatedAt: 'desc' }, { id: 'desc' }],
  created: [{ createdAt: 'desc' }, { id: 'desc' }],
};

@Injectable()
export class PayeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query: ListPayeesQueryDto,
  ): Promise<PaginatedPayeesDto> {
    const where: Prisma.PayeeWhereInput = {
      userId,
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { accountNumber: { contains: query.q, mode: 'insensitive' } },
              { bankName: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [payees, total] = await this.prisma.$transaction([
      this.prisma.payee.findMany({
        where,
        orderBy: ORDER_BY[query.sort],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.payee.count({ where }),
    ]);

    return {
      items: payees.map(toPayeeDto),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async findOne(userId: string, id: string): Promise<PayeeDto> {
    return toPayeeDto(await this.findOwned(userId, id));
  }

  async create(userId: string, dto: CreatePayeeDto): Promise<PayeeDto> {
    try {
      const payee = await this.prisma.payee.create({
        data: {
          userId,
          name: dto.name.trim(),
          accountNumber: dto.accountNumber,
          bankName: dto.bankName?.trim() || 'MiniBank',
          note: dto.note?.trim() || null,
        },
      });

      await this.audit(userId, 'PAYEE_CREATED', payee.id, payee);
      return toPayeeDto(payee);
    } catch (error) {
      throw asDuplicate(error);
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdatePayeeDto,
  ): Promise<PayeeDto> {
    await this.findOwned(userId, id);

    try {
      const payee = await this.prisma.payee.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.accountNumber !== undefined
            ? { accountNumber: dto.accountNumber }
            : {}),
          ...(dto.bankName !== undefined
            ? { bankName: dto.bankName.trim() || 'MiniBank' }
            : {}),
          ...(dto.note !== undefined ? { note: dto.note.trim() || null } : {}),
        },
      });

      await this.audit(userId, 'PAYEE_UPDATED', payee.id, payee);
      return toPayeeDto(payee);
    } catch (error) {
      throw asDuplicate(error);
    }
  }

  async remove(userId: string, id: string): Promise<PayeeDto> {
    const payee = await this.findOwned(userId, id);
    await this.prisma.payee.delete({ where: { id } });
    await this.audit(userId, 'PAYEE_DELETED', id, payee);
    return toPayeeDto(payee);
  }

  private async findOwned(userId: string, id: string) {
    const payee = await this.prisma.payee.findFirst({ where: { id, userId } });
    if (!payee) throw new NotFoundException('Payee not found');
    return payee;
  }

  private async audit(
    userId: string,
    action: string,
    resourceId: string,
    payee: { name: string; accountNumber: string },
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action,
        resourceType: 'Payee',
        resourceId,
        metadata: { name: payee.name, accountNumber: payee.accountNumber },
      },
    });
  }
}

function toPayeeDto(payee: {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PayeeDto {
  return {
    id: payee.id,
    name: payee.name,
    accountNumber: payee.accountNumber,
    bankName: payee.bankName,
    note: payee.note,
    createdAt: payee.createdAt.toISOString(),
    updatedAt: payee.updatedAt.toISOString(),
  };
}

function asDuplicate(error: unknown): unknown {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return new ConflictException(
      'A payee with this account number already exists',
    );
  }
  return error;
}
