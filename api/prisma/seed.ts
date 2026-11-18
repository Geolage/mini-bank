import {
  AccountType,
  Currency,
  PrismaClient,
  Role,
  TransactionStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch {
  // .env is optional when variables are already exported.
}

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Password123!';

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const operator = await prisma.user.upsert({
    where: { email: 'operator@minibank.dev' },
    update: {},
    create: {
      email: 'operator@minibank.dev',
      name: 'Alex Chen',
      passwordHash,
      role: Role.OPERATOR,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@minibank.dev' },
    update: {},
    create: {
      email: 'viewer@minibank.dev',
      name: 'Jamie Lin',
      passwordHash,
      role: Role.VIEWER,
    },
  });

  const operatorUsd = await prisma.account.upsert({
    where: { accountNumber: 'MB-1001-0001' },
    update: {},
    create: {
      userId: operator.id,
      accountNumber: 'MB-1001-0001',
      type: AccountType.CHECKING,
      currency: Currency.USD,
      balance: '12500.00',
    },
  });

  const operatorHkd = await prisma.account.upsert({
    where: { accountNumber: 'MB-1001-0002' },
    update: {},
    create: {
      userId: operator.id,
      accountNumber: 'MB-1001-0002',
      type: AccountType.SAVINGS,
      currency: Currency.HKD,
      balance: '48000.00',
    },
  });

  const viewerUsd = await prisma.account.upsert({
    where: { accountNumber: 'MB-2001-0001' },
    update: {},
    create: {
      userId: viewer.id,
      accountNumber: 'MB-2001-0001',
      type: AccountType.CHECKING,
      currency: Currency.USD,
      balance: '3200.00',
    },
  });

  const viewerHkd = await prisma.account.upsert({
    where: { accountNumber: 'MB-2001-0002' },
    update: {},
    create: {
      userId: viewer.id,
      accountNumber: 'MB-2001-0002',
      type: AccountType.CHECKING,
      currency: Currency.HKD,
      balance: '1500.00',
    },
  });

  const transactions = [
    {
      reference: 'SEED-TXN-001',
      fromAccountId: operatorUsd.id,
      toAccountId: viewerUsd.id,
      amount: '250.00',
      currency: Currency.USD,
      idempotencyKey: 'seed-idem-001',
      note: 'Dinner split',
    },
    {
      reference: 'SEED-TXN-002',
      fromAccountId: viewerUsd.id,
      toAccountId: operatorUsd.id,
      amount: '75.50',
      currency: Currency.USD,
      idempotencyKey: 'seed-idem-002',
      note: 'Concert ticket',
    },
    {
      reference: 'SEED-TXN-003',
      fromAccountId: operatorHkd.id,
      toAccountId: viewerHkd.id,
      amount: '1200.00',
      currency: Currency.HKD,
      idempotencyKey: 'seed-idem-003',
      note: 'Rent share',
    },
    {
      reference: 'SEED-TXN-004',
      fromAccountId: viewerHkd.id,
      toAccountId: operatorHkd.id,
      amount: '300.00',
      currency: Currency.HKD,
      idempotencyKey: 'seed-idem-004',
      note: 'Groceries',
    },
    {
      reference: 'SEED-TXN-005',
      fromAccountId: operatorUsd.id,
      toAccountId: viewerUsd.id,
      amount: '42.00',
      currency: Currency.USD,
      idempotencyKey: 'seed-idem-005',
      note: 'Coffee beans',
    },
    {
      reference: 'SEED-TXN-006',
      fromAccountId: viewerUsd.id,
      toAccountId: operatorUsd.id,
      amount: '18.75',
      currency: Currency.USD,
      idempotencyKey: 'seed-idem-006',
      note: 'Lunch',
    },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.upsert({
      where: { reference: transaction.reference },
      update: {},
      create: { ...transaction, status: TransactionStatus.COMPLETED },
    });
  }

  await prisma.auditLog.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      actorId: operator.id,
      action: 'SEED_ACCOUNTS_CREATED',
      resourceType: 'Account',
      resourceId: operatorUsd.id,
      metadata: { source: 'seed', accounts: 4 },
    },
  });

  await prisma.auditLog.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      actorId: viewer.id,
      action: 'SEED_TRANSACTIONS_CREATED',
      resourceType: 'Transaction',
      resourceId: 'SEED-TXN-001',
      metadata: { source: 'seed', transactions: transactions.length },
    },
  });

  console.log('Seed complete.');
  console.log(`Operator: operator@minibank.dev / ${SEED_PASSWORD}`);
  console.log(`Viewer:   viewer@minibank.dev / ${SEED_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
