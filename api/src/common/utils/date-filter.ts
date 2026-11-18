import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

export function buildCreatedAtFilter(
  from: string | undefined,
  to: string | undefined,
): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? parseInclusiveEnd(to) : undefined;

  if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
    throw new BadRequestException('`from` must be before or equal to `to`');
  }

  const filter: Prisma.DateTimeFilter = {};
  if (fromDate) filter.gte = fromDate;
  if (toDate) filter.lte = toDate;
  return filter;
}

function parseInclusiveEnd(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T23:59:59.999Z`)
    : new Date(value);
}
