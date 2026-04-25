import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const CATEGORY_LABELS = {
  correction: "调整",
  food: "餐饮",
  fun: "娱乐",
  home: "居家",
  interest: "理财",
  other: "其他",
  salary: "工资",
  shop: "购物",
  trade: "转账",
  transport: "交通",
};

const CATEGORY_TAG_TYPES = {
  correction: "transfer",
  food: "shopping",
  fun: "shopping",
  home: "shopping",
  interest: "investment",
  other: "shopping",
  salary: "income",
  shop: "shopping",
  trade: "transfer",
  transport: "transport",
};

const ACCOUNT_ICON_MAP = {
  alipay: "alipay",
  wechat: "wechat",
  okx: "okx",
  binance: "binance",
  bitget: "bitget",
  huobi: "huobi",
  "fa-building-columns": "landmark",
  "fa-wallet": "cash",
  "fa-piggy-bank": "cash",
};

const EXCHANGE_NAMES = ["OKX", "币安", "Bitget", "火币", "Huobi", "易换"];

function parseArgs(argv) {
  const args = { replace: false, file: "" };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--replace") {
      args.replace = true;
    } else if (!args.file) {
      args.file = arg;
    }
  }
  return args;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateLabel(date) {
  const now = new Date();
  const target = new Date(date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sample = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((today - sample) / 86400000);
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

  if (diffDays === 0) return `今天 ${target.getMonth() + 1}月${target.getDate()}日`;
  if (diffDays === 1) return `昨天 ${target.getMonth() + 1}月${target.getDate()}日`;
  return `${target.getMonth() + 1}月${target.getDate()}日 ${weekdays[target.getDay()]}`;
}

function formatFullDate(date) {
  const target = new Date(date);
  const year = target.getFullYear();
  const month = target.getMonth() + 1;
  const day = target.getDate();
  const hour = String(target.getHours()).padStart(2, "0");
  const minute = String(target.getMinutes()).padStart(2, "0");
  return `${year}年${month}月${day}日 ${hour}:${minute}`;
}

function inferAccountType(account) {
  const name = String(account.name || "");
  const icon = String(account.icon || "");
  if (name.includes("现金") || icon === "fa-wallet") return "cash";
  if (name.includes("银行") || name.includes("Bank") || icon === "fa-building-columns") return "bank";
  if (name.includes("支付宝") || name.includes("微信")) return "wallet";
  if (EXCHANGE_NAMES.some((item) => name.includes(item)) || ["okx", "binance", "bitget", "huobi"].includes(icon)) {
    return "exchange";
  }
  return account.currency === "USDT" ? "exchange" : "other";
}

function normalizeAccountIcon(account) {
  const direct = ACCOUNT_ICON_MAP[account.icon];
  if (direct) {
    if (account.name === "火币") return "huobi";
    return direct;
  }
  if (String(account.name || "").includes("Bank") || String(account.name || "").includes("银行")) return "landmark";
  if (String(account.name || "").includes("现金")) return "cash";
  return "cash";
}

function normalizeTransactionIcon(account, transaction) {
  const icon = normalizeAccountIcon(account || {});
  if (transaction.type === "income" && transaction.category === "interest") {
    return account?.currency === "USDT" ? "bitget" : "landmark";
  }
  if (transaction.category === "transport") return "mastercard";
  if (transaction.category === "trade") return icon === "cash" ? "landmark" : icon;
  if (transaction.category === "interest") return icon === "cash" ? "landmark" : icon;
  return icon;
}

function normalizeIconBg(iconType) {
  switch (iconType) {
    case "alipay":
      return "bg-[#1677ff]";
    case "wechat":
      return "bg-[#07c160]";
    case "okx":
    case "bitget":
      return "bg-black";
    case "binance":
      return "bg-[#f0b90a]";
    case "huobi":
      return "bg-[#1853db]";
    case "landmark":
      return "bg-[#5c8af0]";
    case "mastercard":
      return "bg-white border border-gray-200";
    case "cash":
      return "bg-[#e6f4ff]";
    default:
      return "bg-[#1677ff]";
  }
}

function mapAccount(account) {
  const type = inferAccountType(account);
  const icon = normalizeAccountIcon(account);
  const sub =
    type === "exchange"
      ? "旧库迁移 · 交易账户"
      : type === "bank"
        ? "旧库迁移 · 银行账户"
        : type === "wallet"
          ? "旧库迁移 · 电子钱包"
          : type === "cash"
            ? "旧库迁移 · 现金账户"
            : "旧库迁移";

  return {
    name: account.name || "未命名账户",
    sub,
    type,
    balance: formatMoney(account.balance),
    currency: account.currency || "CNY",
    icon,
    apy_limit: String(account.tierLimit ?? 0),
    apy_base_rate: String(account.apy ?? 0),
    apy_overflow_rate: String(account.excessApy ?? 0),
  };
}

function mapTransaction(transaction, accountMap) {
  const account = accountMap.get(transaction.accountId);
  const transactionDate = new Date(transaction.date);
  const isIncome = transaction.type === "income";
  const category = transaction.category || "other";
  const amountValue = Number(transaction.amount || 0);
  const title =
    transaction.merchant ||
    transaction.source ||
    `${CATEGORY_LABELS[category] || "收支"}记录`;
  const subtitle = account?.name || "旧库迁移";
  const iconType = normalizeTransactionIcon(account, transaction);

  return {
    dateLabel: formatDateLabel(transactionDate),
    iconBg: normalizeIconBg(iconType),
    iconType,
    title,
    subtitle,
    tag: CATEGORY_LABELS[category] || "其他",
    tagType: CATEGORY_TAG_TYPES[category] || (isIncome ? "income" : "shopping"),
    amount: `${isIncome ? "+" : "-"}${formatMoney(amountValue)}`,
    isIncome,
    time: `${String(transactionDate.getHours()).padStart(2, "0")}:${String(transactionDate.getMinutes()).padStart(2, "0")}`,
    fullDate: formatFullDate(transactionDate),
    currency: transaction.currency || account?.currency || "CNY",
    paymentMethod: account?.name || transaction.source || "旧库账户",
    note: transaction.note || "",
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    throw new Error("Usage: node scripts/migrate-bitledger-export.mjs <export.json> [--replace]");
  }

  const absoluteFile = path.resolve(args.file);
  const raw = JSON.parse(fs.readFileSync(absoluteFile, "utf8"));
  const state = raw.main_doc?.state;
  if (!state || !Array.isArray(state.accounts) || !Array.isArray(state.transactions)) {
    throw new Error("Invalid export file: expected main_doc.state.accounts and main_doc.state.transactions");
  }

  const mappedAccounts = state.accounts.map(mapAccount);
  const accountMap = new Map(state.accounts.map((account, index) => [account.id, mappedAccounts[index]]));
  const mappedTransactions = state.transactions
    .slice()
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .map((transaction) => mapTransaction(transaction, accountMap));

  console.log(JSON.stringify({
    sourceFile: absoluteFile,
    replace: args.replace,
    accountCount: mappedAccounts.length,
    transactionCount: mappedTransactions.length,
    firstAccount: mappedAccounts[0],
    firstTransaction: mappedTransactions[0],
  }, null, 2));

  if (!args.replace) {
    console.log("Dry run only. Re-run with --replace to write into Supabase Postgres.");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or POSTGRES_URL is required");
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query("begin");
    await client.query("delete from public.transactions");
    await client.query("delete from public.accounts");

    await client.query(
      `insert into public.accounts
        (name, sub, type, balance, currency, icon, apy_limit, apy_base_rate, apy_overflow_rate)
       select
         x.name,
         x.sub,
         x.type,
         x.balance,
         x.currency,
         x.icon,
         x.apy_limit,
         x.apy_base_rate,
         x.apy_overflow_rate
       from jsonb_to_recordset($1::jsonb) as x(
         name text,
         sub text,
         type text,
         balance text,
         currency text,
         icon text,
         apy_limit text,
         apy_base_rate text,
         apy_overflow_rate text
       )`,
      [JSON.stringify(mappedAccounts)],
    );

    await client.query(
      `insert into public.transactions
        ("dateLabel", "iconBg", "iconType", title, subtitle, tag, "tagType", amount, "isIncome", time, "fullDate", currency, "paymentMethod", note)
       select
         x."dateLabel",
         x."iconBg",
         x."iconType",
         x.title,
         x.subtitle,
         x.tag,
         x."tagType",
         x.amount,
         x."isIncome",
         x.time,
         x."fullDate",
         x.currency,
         x."paymentMethod",
         x.note
       from jsonb_to_recordset($1::jsonb) as x(
         "dateLabel" text,
         "iconBg" text,
         "iconType" text,
         title text,
         subtitle text,
         tag text,
         "tagType" text,
         amount text,
         "isIncome" boolean,
         time text,
         "fullDate" text,
         currency text,
         "paymentMethod" text,
         note text
       )`,
      [JSON.stringify(mappedTransactions)],
    );

    await client.query("commit");
    console.log(`Imported ${mappedAccounts.length} accounts and ${mappedTransactions.length} transactions.`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
