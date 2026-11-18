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

const DEMO_ACCOUNTS = [
  {
    username: 'admin',
    email: 'admin@minibank.dev',
    name: 'Admin',
    password: '11111111',
    role: Role.OPERATOR,
  },
  {
    username: 'visitor',
    email: 'visitor@minibank.dev',
    name: 'Visitor',
    password: '00000000',
    role: Role.VIEWER,
  },
];

// Superseded by DEMO_ACCOUNTS. They must be removed, not just skipped, because the
// upserts below key on account numbers: leaving the old users behind would keep two
// sets of accounts and break the balances and row counts the Cypress suite asserts.
const LEGACY_EMAILS = ['operator@minibank.dev', 'viewer@minibank.dev'];

async function removeLegacyUsers(): Promise<void> {
  const legacyUsers = await prisma.user.findMany({
    where: { email: { in: LEGACY_EMAILS } },
    select: { id: true },
  });

  if (legacyUsers.length === 0) return;

  const userIds = legacyUsers.map((user) => user.id);
  const legacyAccounts = await prisma.account.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const accountIds = legacyAccounts.map((account) => account.id);

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actorId: { in: userIds } },
        ...(accountIds.length > 0 ? [{ resourceId: { in: accountIds } }] : []),
      ],
    },
  });

  if (accountIds.length > 0) {
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      },
    });
  }

  await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log(`Removed ${legacyUsers.length} legacy demo user(s).`);
}

async function upsertUser(account: (typeof DEMO_ACCOUNTS)[number]) {
  return prisma.user.upsert({
    where: { username: account.username },
    update: {
      email: account.email,
      name: account.name,
      passwordHash: await bcrypt.hash(account.password, 10),
      role: account.role,
    },
    create: {
      username: account.username,
      email: account.email,
      name: account.name,
      passwordHash: await bcrypt.hash(account.password, 10),
      role: account.role,
    },
  });
}

async function main() {
  await removeLegacyUsers();

  const admin = await upsertUser(DEMO_ACCOUNTS[0]);
  const visitor = await upsertUser(DEMO_ACCOUNTS[1]);

  const adminUsd = await prisma.account.upsert({
    where: { accountNumber: 'MB-1001-0001' },
    update: {},
    create: {
      userId: admin.id,
      accountNumber: 'MB-1001-0001',
      type: AccountType.CHECKING,
      currency: Currency.USD,
      balance: '12500.00',
    },
  });

  const adminHkd = await prisma.account.upsert({
    where: { accountNumber: 'MB-1001-0002' },
    update: {},
    create: {
      userId: admin.id,
      accountNumber: 'MB-1001-0002',
      type: AccountType.SAVINGS,
      currency: Currency.HKD,
      balance: '48000.00',
    },
  });

  const visitorUsd = await prisma.account.upsert({
    where: { accountNumber: 'MB-2001-0001' },
    update: {},
    create: {
      userId: visitor.id,
      accountNumber: 'MB-2001-0001',
      type: AccountType.CHECKING,
      currency: Currency.USD,
      balance: '3200.00',
    },
  });

  const visitorHkd = await prisma.account.upsert({
    where: { accountNumber: 'MB-2001-0002' },
    update: {},
    create: {
      userId: visitor.id,
      accountNumber: 'MB-2001-0002',
      type: AccountType.CHECKING,
      currency: Currency.HKD,
      balance: '1500.00',
    },
  });

  const transactions = [
    {
      reference: 'SEED-TXN-001',
      fromAccountId: adminUsd.id,
      toAccountId: visitorUsd.id,
      amount: '250.00',
      currency: Currency.USD,
      idempotencyKey: 'seed-idem-001',
      note: 'Dinner split',
    },
    {
      reference: 'SEED-TXN-002',
      fromAccountId: visitorUsd.id,
      toAccountId: adminUsd.id,
      amount: '75.50',
      currency: Currency.USD,
      idempotencyKey: 'seed-idem-002',
      note: 'Concert ticket',
    },
    {
      reference: 'SEED-TXN-003',
      fromAccountId: adminHkd.id,
      toAccountId: visitorHkd.id,
      amount: '1200.00',
      currency: Currency.HKD,
      idempotencyKey: 'seed-idem-003',
      note: 'Rent share',
    },
    {
      reference: 'SEED-TXN-004',
      fromAccountId: visitorHkd.id,
      toAccountId: adminHkd.id,
      amount: '300.00',
      currency: Currency.HKD,
      idempotencyKey: 'seed-idem-004',
      note: 'Groceries',
    },
    {
      reference: 'SEED-TXN-005',
      fromAccountId: adminUsd.id,
      toAccountId: visitorUsd.id,
      amount: '42.00',
      currency: Currency.USD,
      idempotencyKey: 'seed-idem-005',
      note: 'Coffee beans',
    },
    {
      reference: 'SEED-TXN-006',
      fromAccountId: visitorUsd.id,
      toAccountId: adminUsd.id,
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

  const payees = [
    {
      userId: admin.id,
      name: 'Visitor checking',
      accountNumber: visitorUsd.accountNumber,
      note: 'Dinner splits and coffee',
    },
    {
      userId: admin.id,
      name: 'Visitor HKD',
      accountNumber: visitorHkd.accountNumber,
      note: 'Rent share',
    },
    {
      userId: visitor.id,
      name: 'Admin checking',
      accountNumber: adminUsd.accountNumber,
      note: 'Concert tickets',
    },
    {
      userId: visitor.id,
      name: 'Admin HKD savings',
      accountNumber: adminHkd.accountNumber,
      note: null,
    },
  ];

  for (const payee of payees) {
    await prisma.payee.upsert({
      where: {
        userId_accountNumber: {
          userId: payee.userId,
          accountNumber: payee.accountNumber,
        },
      },
      update: {},
      create: payee,
    });
  }

  await prisma.auditLog.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: { actorId: admin.id },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      actorId: admin.id,
      action: 'SEED_ACCOUNTS_CREATED',
      resourceType: 'Account',
      resourceId: adminUsd.id,
      metadata: { source: 'seed', accounts: 4 },
    },
  });

  await prisma.auditLog.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: { actorId: visitor.id },
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      actorId: visitor.id,
      action: 'SEED_TRANSACTIONS_CREATED',
      resourceType: 'Transaction',
      resourceId: 'SEED-TXN-001',
      metadata: { source: 'seed', transactions: transactions.length },
    },
  });

  console.log('Seed complete.');
  for (const account of DEMO_ACCOUNTS) {
    console.log(
      `${account.role.padEnd(8)} ${account.username} | ${account.email} | ${account.password}`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
