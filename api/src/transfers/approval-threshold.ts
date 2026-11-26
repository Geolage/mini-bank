import { Prisma } from '@prisma/client';

export const DEFAULT_APPROVAL_THRESHOLD = '5000.00';

export function readApprovalThreshold(
  value: string | undefined,
): Prisma.Decimal {
  const raw = value?.trim() || DEFAULT_APPROVAL_THRESHOLD;

  let threshold: Prisma.Decimal;
  try {
    threshold = new Prisma.Decimal(raw);
  } catch {
    throw new Error(
      'TRANSFER_APPROVAL_THRESHOLD must be a positive decimal amount',
    );
  }

  if (!threshold.isFinite() || threshold.lte(0)) {
    throw new Error(
      'TRANSFER_APPROVAL_THRESHOLD must be a positive decimal amount',
    );
  }

  return threshold;
}
