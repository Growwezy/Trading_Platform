import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

/**
 * Trader-first approach: this script stands in for the Admin/Super Admin UI
 * that doesn't exist yet. It creates one tenant, one KYC-approved trader with
 * a funded balance, and a few tradable symbols — enough to build and test the
 * trading engine against without building real admin screens first.
 *
 * Idempotent: safe to re-run; skips anything that already exists.
 */

const DEMO_SUBDOMAIN = "demo";
const TRADER_EMAIL = "trader@demo.test";
const TRADER_PASSWORD = "Password123!";
const STARTING_BALANCE = 10_000;

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: DEMO_SUBDOMAIN },
    update: {},
    create: {
      subdomain: DEMO_SUBDOMAIN,
      companyName: "Demo Broker",
      status: "active",
    },
  });
  console.log(`Tenant: ${tenant.subdomain} (${tenant.id})`);

  let group = await prisma.group.findFirst({ where: { tenantId: tenant.id, name: "Default" } });
  if (!group) {
    group = await prisma.group.create({ data: { tenantId: tenant.id, name: "Default" } });
  }

  let trader = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: TRADER_EMAIL },
  });
  if (!trader) {
    const passwordHash = await bcrypt.hash(TRADER_PASSWORD, 12);
    trader = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        role: "trader",
        email: TRADER_EMAIL,
        passwordHash,
        emailVerifiedAt: new Date(),
        groupId: group.id,
      },
    });
    console.log(`Trader: ${trader.email} / ${TRADER_PASSWORD}`);
  } else {
    console.log(`Trader already exists: ${trader.email}`);
  }

  const existingKyc = await prisma.kycSubmission.findFirst({ where: { userId: trader.id } });
  if (!existingKyc) {
    await prisma.kycSubmission.create({
      data: {
        tenantId: tenant.id,
        userId: trader.id,
        submittedData: { note: "seed data — pre-approved" },
        documents: [],
        status: "approved",
        reviewedAt: new Date(),
      },
    });
    console.log("KYC: approved (seed)");
  }

  // Placeholder figures — TRADING_ENGINE.md open items (#10 leverage model,
  // #16 min/max lot size) aren't resolved yet. Revisit once they are.
  // baseSpreadPoints is a direct price-unit offset (pricing.service.ts's documented
  // simplification, not pips) — e.g. 0.0002 on EURUSD is a realistic ~2-pip spread.
  const symbolDefs = [
    { code: "EURUSD", assetClass: "forex", provider: "twelvedata", contractSize: 100_000, baseSpreadPoints: 0.0002, maxLeverage: 100 },
    { code: "BTCUSDT", assetClass: "crypto", provider: "binance", contractSize: 1, baseSpreadPoints: 5, maxLeverage: 20 },
    { code: "XAUUSD", assetClass: "commodity", provider: "twelvedata", contractSize: 100, baseSpreadPoints: 0.3, maxLeverage: 50 },
  ] as const;

  for (const def of symbolDefs) {
    const symbol = await prisma.symbol.upsert({
      where: { code: def.code },
      update: {
        assetClass: def.assetClass,
        provider: def.provider,
        contractSize: def.contractSize,
        baseSpreadPoints: def.baseSpreadPoints,
        maxLeverage: def.maxLeverage,
      },
      create: {
        code: def.code,
        assetClass: def.assetClass,
        provider: def.provider,
        contractSize: def.contractSize,
        baseSpreadPoints: def.baseSpreadPoints,
        maxLeverage: def.maxLeverage,
      },
    });

    await prisma.tenantSymbol.upsert({
      where: { tenantId_symbolId: { tenantId: tenant.id, symbolId: symbol.id } },
      update: {},
      create: {
        tenantId: tenant.id,
        symbolId: symbol.id,
        enabled: true,
        leverageCap: def.maxLeverage,
        minLot: 0.01,
        maxLot: 10,
      },
    });

    const existingMarkup = await prisma.groupMarkup.findFirst({
      where: { tenantId: tenant.id, groupId: group.id, symbolId: symbol.id },
    });
    if (!existingMarkup) {
      await prisma.groupMarkup.create({
        data: { tenantId: tenant.id, groupId: group.id, symbolId: symbol.id, markupPoints: 0 },
      });
    }
  }
  console.log(`Symbols enabled: ${symbolDefs.map((s) => s.code).join(", ")}`);

  const hasTransactions = await prisma.transaction.findFirst({ where: { userId: trader.id } });
  if (!hasTransactions) {
    await prisma.$transaction(async (tx) => {
      const deposit = await tx.deposit.create({
        data: {
          tenantId: tenant.id,
          userId: trader.id,
          amount: STARTING_BALANCE,
          method: "bank",
          status: "approved",
          reviewedAt: new Date(),
        },
      });

      await tx.transaction.create({
        data: {
          tenantId: tenant.id,
          userId: trader.id,
          type: "deposit",
          amount: STARTING_BALANCE,
          balanceAfter: STARTING_BALANCE,
          referenceTable: "deposits",
          referenceId: deposit.id,
        },
      });

      await tx.user.update({
        where: { id: trader.id },
        data: { balance: { increment: STARTING_BALANCE } },
      });
    });
    console.log(`Funded: +${STARTING_BALANCE} via deposit + transaction row`);
  } else {
    console.log("Trader already funded — skipping deposit.");
  }

  console.log("\nSeed complete.");
  console.log(`Login: email=${TRADER_EMAIL} password=${TRADER_PASSWORD} on tenant "${DEMO_SUBDOMAIN}"`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
