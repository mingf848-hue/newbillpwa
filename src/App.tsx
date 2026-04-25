// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef } from 'react';
import RebuiltHomePage from './RebuiltHomePage';
import {
  Search, Bell, Calendar, ChevronDown, Eye, ArrowUpRight, ChevronRight,
  Home, FileText, PieChart, Wallet, PenLine, BarChart2, PieChart as PieChartIcon,
  ArrowRightLeft, AlertTriangle, ArrowDownRight, TrendingUp, X, ArrowUp, Info,
  Filter, Landmark, CreditCard, Tag as TagIcon, CalendarDays, Pen, Check,
  ChevronLeft, Plus, Banknote, MoreHorizontal
} from 'lucide-react';

// ==========================================
// 0. SUPABASE REST API CONFIGURATION
// ==========================================
const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const fetchSupabase = async (endpoint, method = "GET", body = null) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }
  const options = {
    method,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const SEED_ACCOUNTS = [
  { name: "Mashreq Bank", sub: "储蓄账户 · 5821", type: "bank", balance: "39,256.54", currency: "AED", icon: "mashreq" },
  { name: "中国建设银行", sub: "借记卡 · 8899", type: "bank", balance: "19,230.27", currency: "CNY", icon: "ccb" },
  { name: "支付宝", sub: "余额及余额宝", type: "wallet", balance: "12,450.80", currency: "CNY", icon: "alipay" },
  { name: "微信", sub: "零钱", type: "wallet", balance: "8,313.51", currency: "CNY", icon: "wechat" },
  { name: "OKX 交易所账户", sub: "现货账户 · ADCB **** 1234", type: "exchange", balance: "12,845.68", currency: "USDT", icon: "okx" },
  { name: "币安 交易所账户", sub: "资金账户", type: "exchange", balance: "11,237.41", currency: "USDT", icon: "binance" },
  { name: "Bitget 交易所账户", sub: "现货账户", type: "exchange", balance: "9,113.11", currency: "USDT", icon: "bitget" },
  { name: "火币 交易所账户", sub: "现货账户", type: "exchange", balance: "8,500.00", currency: "USDT", icon: "huobi" },
  { name: "现金 (AED)", sub: "钱包现金", type: "cash", balance: "8,129.00", currency: "AED", icon: "cash" }
];

const SEED_TRANSACTIONS = [
  { dateLabel: '今天 4月23日', iconBg: 'bg-black', iconType: 'apple', title: 'Apple Pay 自动记账', subtitle: 'ADCB **** 1234', tag: '购物', tagType: 'shopping', amount: '-89.90', isIncome: false, time: '18:45', fullDate: '2026年4月23日 18:45', currency: 'AED', paymentMethod: 'Apple Pay', note: '给家人买礼物' },
  { dateLabel: '今天 4月23日', iconBg: 'bg-[#10a37f]', iconType: 'openai', title: 'Ai', subtitle: 'ADCB **** 1234', tag: '订阅', tagType: 'subscription', amount: '-19.99', isIncome: false, time: '16:32', fullDate: '2026年4月23日 16:32', currency: 'AED', paymentMethod: 'ADCB', note: '' },
  { dateLabel: '今天 4月23日', iconBg: 'bg-[#26A17B]', iconType: 'usdt', title: 'OKX 理财收益', subtitle: 'OKX 资金账户', tag: '理财', tagType: 'investment', amount: '+1,200.00', isIncome: true, time: '09:15', fullDate: '2026年4月23日 09:15', currency: 'USDT', paymentMethod: 'OKX', note: '' },
  { dateLabel: '今天 4月23日', iconBg: 'bg-[#5c8af0]', iconType: 'landmark', title: '转账给张三', subtitle: 'ADCB **** 1234', tag: '转账', tagType: 'transfer', amount: '-500.00', isIncome: false, time: '08:20', fullDate: '2026年4月23日 08:20', currency: 'AED', paymentMethod: 'ADCB', note: '' },
  { dateLabel: '昨天 4月22日', iconBg: 'bg-[#1677ff]', iconType: 'alipay', title: '支付宝 转账', subtitle: '支付宝账户', tag: '转账', tagType: 'transfer', amount: '+2,500.00', isIncome: true, time: '21:35', fullDate: '2026年4月22日 21:35', currency: 'AED', paymentMethod: '支付宝', note: '' },
  { dateLabel: '昨天 4月22日', iconBg: 'bg-black', iconType: 'bitget', title: 'Bitget 理财收益', subtitle: 'Bitget 资金账户', tag: '理财', tagType: 'investment', amount: '+4,000.00', isIncome: true, time: '14:10', fullDate: '2026年4月22日 14:10', currency: 'USDT', paymentMethod: 'Bitget', note: '' },
  { dateLabel: '昨天 4月22日', iconBg: 'bg-[#fee000]', iconType: 'noon', title: 'Noon', subtitle: 'Mashreq **** 5678', tag: '购物', tagType: 'shopping', amount: '-245.60', isIncome: false, time: '11:05', fullDate: '2026年4月22日 11:05', currency: 'AED', paymentMethod: 'Mashreq Bank', note: '' },
  { dateLabel: '昨天 4月22日', iconBg: 'bg-[#e6f4ff]', iconType: 'cash', title: '线下超市购物', subtitle: '现金支付', tag: '购物', tagType: 'shopping', amount: '-1,000.00', isIncome: false, time: '09:00', fullDate: '2026年4月22日 09:00', currency: 'AED', paymentMethod: '现金', note: '' },
  { dateLabel: '4月21日 星期一', iconBg: 'bg-[#232f3e]', iconType: 'amazon', title: 'Amazon.ae', subtitle: 'ADCB **** 1234', tag: '购物', tagType: 'shopping', amount: '-112.36', isIncome: false, time: '20:22', fullDate: '2026年4月21日 20:22', currency: 'AED', paymentMethod: 'ADCB', note: '' },
  { dateLabel: '4月21日 星期一', iconBg: 'bg-white border border-gray-200', iconType: 'mastercard', title: 'Careem', subtitle: 'Mashreq **** 5678', tag: '交通', tagType: 'transport', amount: '-35.00', isIncome: false, time: '18:08', fullDate: '2026年4月21日 18:08', currency: 'AED', paymentMethod: 'Mashreq Bank', note: '' },
  { dateLabel: '4月21日 星期一', iconBg: 'bg-[#26A17B]', iconType: 'usdt', title: 'OKX 理财收益', subtitle: 'OKX 资金账户', tag: '理财', tagType: 'investment', amount: '+2,300.00', isIncome: true, time: '10:30', fullDate: '2026年4月21日 10:30', currency: 'USDT', paymentMethod: 'OKX', note: '' }
];

const parseTransactionDate = (fullDate) => {
  const match = String(fullDate || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const isSameDay = (a, b) => (
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
);

const getWeekRange = (referenceDate) => {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

function useSupabaseData() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        let accs = [];
        let txs = [];
        try { accs = await fetchSupabase("accounts?select=*"); } catch (e) { console.warn("Accounts table missing or fetch failed"); }
        try { txs = await fetchSupabase("transactions?select=*"); } catch (e) { console.warn("Transactions table missing or fetch failed"); }

        // Auto-seed to Database if empty
        if (accs.length === 0) {
          console.log("Seeding accounts to Supabase...");
          try { accs = await fetchSupabase("accounts", "POST", SEED_ACCOUNTS); } 
          catch (e) { accs = SEED_ACCOUNTS; }
        }
        if (txs.length === 0) {
          console.log("Seeding transactions to Supabase...");
          try { txs = await fetchSupabase("transactions", "POST", SEED_TRANSACTIONS); } 
          catch (e) { txs = SEED_TRANSACTIONS; }
        }

        setAccounts(accs);
        setTransactions(txs);
      } catch (e) {
        console.error("Initialization Error:", e);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const updateTransaction = async (id, updates) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (id && String(id).length > 10) { // Check if valid DB UUID
      try { await fetchSupabase(`transactions?id=eq.${id}`, "PATCH", updates); } 
      catch (e) { console.error("Update failed", e); }
    }
  };

  const createTransaction = async (payload) => {
    const [created] = await fetchSupabase("transactions", "POST", payload);
    setTransactions(prev => [created, ...prev]);
    return created;
  };

  const createAccount = async (payload) => {
    const [created] = await fetchSupabase("accounts", "POST", payload);
    setAccounts(prev => [created, ...prev]);
    return created;
  };

  const updateAccount = async (id, updates) => {
    setAccounts(prev => prev.map(account => account.id === id ? { ...account, ...updates } : account));
    if (id && String(id).length > 10) {
      await fetchSupabase(`accounts?id=eq.${id}`, "PATCH", updates);
    }
  };

  return { accounts, transactions, loading, updateTransaction, createTransaction, createAccount, updateAccount };
}

// ==========================================
// 1. ALL SVG ICONS & CHARTS
// ==========================================
const LogoIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[26px] h-[26px]">
    <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z" fill="#1677FF"/>
    <path d="M12.5 10H17.5C19.433 10 21 11.567 21 13.5C21 14.88 20.2 16.07 19.048 16.653C20.553 17.152 21.5 18.6 21.5 20.5C21.5 22.433 19.933 24 18 24H12.5V10Z" fill="white"/>
    <path d="M15 12.5V15.5H17.5C18.328 15.5 19 14.828 19 14C19 13.172 18.328 12.5 17.5 12.5H15Z" fill="#1677FF"/>
    <path d="M15 18V21.5H18C18.966 21.5 19.75 20.716 19.75 19.75C19.75 18.784 18.966 18 18 18H15Z" fill="#1677FF"/>
  </svg>
);

// ==========================================
// BRAND LOGO API CONFIGURATION
// ==========================================
const BRAND_LOGOS = {
  apple:      { url: 'https://cdn.simpleicons.org/apple/ffffff',       bg: '#000000' },
  openai:     { url: 'https://cdn.simpleicons.org/openai/ffffff',      bg: '#10a37f' },
  alipay:     { url: 'https://cdn.simpleicons.org/alipay/ffffff',      bg: '#1677ff' },
  wechat:     { url: 'https://cdn.simpleicons.org/wechat/ffffff',      bg: '#07c160' },
  okx:        { url: 'https://cdn.simpleicons.org/okx/ffffff',         bg: '#000000' },
  binance:    { url: 'https://cdn.simpleicons.org/binance/1e2329',     bg: '#fcd535' },
  bitget:     { url: 'https://logo.clearbit.com/bitget.com',           bg: '#00e5c0' },
  huobi:      { url: 'https://logo.clearbit.com/htx.com',             bg: '#1853db' },
  gateio:     { url: 'https://logo.clearbit.com/gate.io',             bg: '#0d6efd' },
  kucoin:     { url: 'https://logo.clearbit.com/kucoin.com',          bg: '#24ae8f' },
  mexc:       { url: 'https://logo.clearbit.com/mexc.com',            bg: '#2152f3' },
  bybit:      { url: 'https://logo.clearbit.com/bybit.com',           bg: '#121214' },
  mashreq:    { url: 'https://logo.clearbit.com/mashreq.com',         bg: '#f37021' },
  adcb:       { url: 'https://logo.clearbit.com/adcb.com',            bg: '#ffffff' },
  ccb:        { url: 'https://logo.clearbit.com/ccb.com',             bg: '#003B90' },
  usdt:       { url: 'https://cdn.simpleicons.org/tether/ffffff',      bg: '#26A17B' },
  bitcoin:    { url: 'https://cdn.simpleicons.org/bitcoin/ffffff',     bg: '#F7931A' },
  ethereum:   { url: 'https://cdn.simpleicons.org/ethereum/ffffff',    bg: '#627EEA' },
  amazon:     { url: 'https://cdn.simpleicons.org/amazon/ff9900',      bg: '#232f3e' },
  mastercard: { url: 'https://logo.clearbit.com/mastercard.com',      bg: '#ffffff' },
  noon:       { url: 'https://logo.clearbit.com/noon.com',            bg: '#fee000' },
};

const BrandLogo = ({ type, size = 36 }) => {
  const [error, setError] = useState(false);
  const config = BRAND_LOGOS[type];
  const imgSize = Math.round(size * 0.6);
  const fallback = (
    <div className="rounded-full flex items-center justify-center shrink-0 bg-[#8e8e93]" style={{ width: size, height: size }}>
      <Landmark style={{ width: imgSize, height: imgSize }} className="text-white" strokeWidth={2.5} />
    </div>
  );
  if (!config) return fallback;
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ width: size, height: size, backgroundColor: config.bg }}>
      {error
        ? <Landmark style={{ width: imgSize, height: imgSize }} className="text-white" strokeWidth={2.5} />
        : <img src={config.url} alt={type} style={{ width: imgSize, height: imgSize, objectFit: 'contain' }} onError={() => setError(true)} />
      }
    </div>
  );
};

const CashIcon = ({ size = 36 }) => (
  <div className="rounded-full flex items-center justify-center shrink-0 bg-[#e6f4ff] border-2 border-[#52c41a]" style={{ width: size, height: size }}>
    <Banknote style={{ width: Math.round(size * 0.5), height: Math.round(size * 0.5) }} className="text-[#52c41a]" />
  </div>
);

const CNYIcon = () => (<svg viewBox="0 0 24 24" className="w-[20px] h-[20px] shrink-0"><circle cx="12" cy="12" r="12" fill="#E60012" /><text x="12" y="16.5" fontSize="13" fill="white" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">¥</text></svg>);
const TetherIcon = () => <BrandLogo type="usdt" size={20} />;
const BitcoinIcon = () => <BrandLogo type="bitcoin" size={20} />;
const EthereumIcon = () => <BrandLogo type="ethereum" size={20} />;

// Helper for dynamic icon loading
const getIconByString = (type, size = 'small') => {
  const px = size === 'large' ? 48 : 36;
  if (type === 'cash') return <CashIcon size={px} />;
  if (type === 'landmark') return (
    <div className="rounded-full flex items-center justify-center shrink-0 bg-[#5c8af0]" style={{ width: px, height: px }}>
      <Landmark style={{ width: Math.round(px * 0.5), height: Math.round(px * 0.5) }} className="text-white" strokeWidth={2.5} />
    </div>
  );
  return <BrandLogo type={type} size={px} />;
};

// UI Detail Icons
const CheckCircleSolid = () => (<svg viewBox="0 0 24 24" className="w-[20px] h-[20px]"><circle cx="12" cy="12" r="12" fill="#1677ff"/><path d="M16.5 8.5L10.5 14.5L7.5 11.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>);
const ClearInputIcon = () => (<svg viewBox="0 0 16 16" className="w-[16px] h-[16px] text-[#c7c7cc]" fill="currentColor"><circle cx="8" cy="8" r="8" /><path d="M10.5 5.5L5.5 10.5M5.5 5.5L10.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>);
const ForkKnifeIcon = ({ className }) => (<svg viewBox="0 0 24 24" fill="currentColor" className={className || "w-[14px] h-[14px] text-[#3a3a3c]"}><path d="M11 2v9c0 1.1-.9 2-2 2H8v9H6v-9H5c-1.1 0-2-.9-2-2V2h2v7h2V2h2v7h2V2h2zm7 0h2v20h-2v-9c-2.2 0-4-1.8-4-4V2h2v7h2V2h2v7h2V2h2zm7 0h2v20h-2v-9c-2.2 0-4-1.8-4-4V2h2v7h2V2z"/></svg>);
const CarIcon = ({ className }) => (<svg viewBox="0 0 24 24" fill="currentColor" className={className || "w-[14px] h-[14px] text-[#3a3a3c]"}><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>);
const BagIcon = ({ className }) => (<svg viewBox="0 0 24 24" fill="currentColor" className={className || "w-[14px] h-[14px] text-[#3a3a3c]"}><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z"/></svg>);
const TransferIcon = ({ className }) => (<svg viewBox="0 0 24 24" fill="currentColor" className={className || "w-[14px] h-[14px] text-[#3a3a3c]"}><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H7v2h10.01v3L21 9z"/></svg>);
const TrendIcon = ({ className }) => (<svg viewBox="0 0 24 24" fill="currentColor" className={className || "w-[14px] h-[14px] text-[#3a3a3c]"}><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>);
const CapIcon = ({ className }) => (<svg viewBox="0 0 24 24" fill="currentColor" className={className || "w-[14px] h-[14px] text-[#3a3a3c]"}><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2.12-1.15V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>);
const EllipsisIcon = ({ className }) => (<svg viewBox="0 0 24 24" fill="currentColor" className={className || "w-[14px] h-[14px] text-[#3a3a3c]"}><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>);

// Charts
const HomeDonutChart = () => {
  const r = 14;
  return (
    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
      <circle cx="18" cy="18" r={r} fill="transparent" stroke="#e5e7eb" strokeWidth="6" strokeDasharray="8 92" strokeDashoffset="-92" strokeLinecap="butt"/>
      <circle cx="18" cy="18" r={r} fill="transparent" stroke="#f59e0b" strokeWidth="6" strokeDasharray="9.6 90.4" strokeDashoffset="-82.4" strokeLinecap="butt"/>
      <circle cx="18" cy="18" r={r} fill="transparent" stroke="#fbbf24" strokeWidth="6" strokeDasharray="13.5 86.5" strokeDashoffset="-68.9" strokeLinecap="butt"/>
      <circle cx="18" cy="18" r={r} fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray="16.7 83.3" strokeDashoffset="-52.2" strokeLinecap="butt"/>
      <circle cx="18" cy="18" r={r} fill="transparent" stroke="#8b5cf6" strokeWidth="6" strokeDasharray="20.4 79.6" strokeDashoffset="-31.8" strokeLinecap="butt"/>
      <circle cx="18" cy="18" r={r} fill="transparent" stroke="#1677ff" strokeWidth="6" strokeDasharray="31.8 68.2" strokeDashoffset="0" strokeLinecap="butt"/>
      <circle cx="18" cy="18" r="11" fill="white" />
    </svg>
  );
};

const DetailedSVGDonut = () => {
  const donutData = [
    { color: '#4c78fe', percent: 31.8 }, { color: '#8862fe', percent: 20.4 },
    { color: '#a78dfe', percent: 16.7 }, { color: '#f5ad41', percent: 13.5 },
    { color: '#ffd24d', percent: 9.6 }, { color: '#e5e5ea', percent: 8.0 }, 
  ];
  let cumulativeOffset = 0;
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full transform -rotate-90">
      {donutData.map((item, i) => {
        const gap = 1.5;
        const dash = item.percent - gap > 0 ? item.percent - gap : 0;
        const remainder = 100 - dash;
        const strokeDasharray = `${dash} ${remainder}`;
        const strokeDashoffset = -cumulativeOffset;
        cumulativeOffset += item.percent;
        return (
          <circle key={i} cx="20" cy="20" r="15.9155" fill="transparent" stroke={item.color} strokeWidth="5" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="butt" />
        );
      })}
    </svg>
  );
};

const AssetsDonutChart = ({ percentages }) => {
  const r = 15.9154943;
  let offset = 0;
  return (
    <svg viewBox="0 0 38 38" className="w-full h-full transform -rotate-90">
      {percentages.map((item, idx) => {
        const pct = parseFloat(item.pct);
        const dash = pct > 0 ? pct : 0;
        const strokeDasharray = `${dash} ${100 - dash}`;
        const strokeDashoffset = -offset;
        offset += pct;
        return (
          <circle key={idx} cx="19" cy="19" r={r} fill="transparent" stroke={item.stroke} strokeWidth="5.5" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="butt"/>
        );
      })}
    </svg>
  );
};

// ==========================================
// 2. CONFIGURATIONS
// ==========================================
const STATS_BAR_CHART_DATA = [
  { month: '11月', in: 32.8, out: 5.6 }, { month: '12月', in: 35.6, out: 6.1 },
  { month: '1月', in: 42.1, out: 6.8 }, { month: '2月', in: 38.7, out: 5.9 },
  { month: '3月', in: 50.3, out: 6.3 }, { month: '4月', in: 47.6, out: 7.1, isCurrent: true },
];

const STATS_PIE_CHART_DATA = [
  { name: '餐饮', color: '#4c78fe', percent: '31.8%' }, { name: '交通', color: '#8862fe', percent: '20.4%' },
  { name: '购物', color: '#a78dfe', percent: '16.7%' }, { name: '转账', color: '#f5ad41', percent: '13.5%' },
  { name: '理财', color: '#ffd24d', percent: '9.6%' }, { name: '其他', color: '#c5cbe1', percent: '8.0%' },
];

const STATS_RANKING_DATA = [
  { rank: 1, name: '餐饮', amount: '2,260.35', percent: '31.8%', icon: <ForkKnifeIcon />, isRed: true, badgeBg: 'bg-[#fff1b8]', badgeText: 'text-[#fa8c16]', iconColor: 'text-[#3a3a3c]' },
  { rank: 2, name: '交通', amount: '1,451.70', percent: '20.4%', icon: <CarIcon />, badgeBg: 'bg-[#e6e8eb]', badgeText: 'text-[#8c8c8c]', iconColor: 'text-[#3a3a3c]' },
  { rank: 3, name: '购物', amount: '1,184.26', percent: '16.7%', icon: <BagIcon />, badgeBg: 'bg-[#ffe4cc]', badgeText: 'text-[#d46b08]', iconColor: 'text-[#3a3a3c]' },
  { rank: 4, name: '转账', amount: '961.20', percent: '13.5%', icon: <TransferIcon />, badgeBg: 'bg-[#f4f5f8]', badgeText: 'text-[#c7c7cc]', iconColor: 'text-[#3a3a3c]' },
  { rank: 5, name: '理财', amount: '682.10', percent: '9.6%', icon: <TrendIcon />, badgeBg: 'bg-[#f4f5f8]', badgeText: 'text-[#c7c7cc]', iconColor: 'text-[#3a3a3c]' },
];

const STATS_INSIGHT_MODAL_DATA = [
  { rank: 1, name: '餐饮', amount: '2,260.35', percent: '+18.6%', icon: <ForkKnifeIcon />, width: '100%', badgeBg: 'bg-[#fff1b8]', badgeText: 'text-[#fa8c16]' },
  { rank: 2, name: '购物', amount: '1,184.26', percent: '+17.3%', icon: <BagIcon />, width: '60%', badgeBg: 'bg-[#e6e8eb]', badgeText: 'text-[#8c8c8c]' },
  { rank: 3, name: '交通', amount: '1,451.70', percent: '+11.8%', icon: <CarIcon />, width: '45%', badgeBg: 'bg-[#ffe4cc]', badgeText: 'text-[#d46b08]' },
  { rank: 4, name: '转账', amount: '961.20', percent: '+8.7%', icon: <TransferIcon />, width: '35%', badgeBg: 'bg-[#f4f5f8]', badgeText: 'text-[#a1a1aa]' },
  { rank: 5, name: '教育', amount: '580.00', percent: '+6.3%', icon: <CapIcon />, width: '20%', badgeBg: 'bg-[#f4f5f8]', badgeText: 'text-[#a1a1aa]' },
];

const STATS_DETAIL_MODAL_DATA = [
  { name: '餐饮', amount: '2,260.35', percent: '31.8%', trend: '+18.6%', icon: <ForkKnifeIcon /> },
  { name: '交通', amount: '1,451.70', percent: '20.4%', trend: '+11.8%', icon: <CarIcon /> },
  { name: '购物', amount: '1,184.26', percent: '16.7%', trend: '+17.3%', icon: <BagIcon /> },
  { name: '转账', amount: '961.20', percent: '13.5%', trend: '+8.7%', icon: <TransferIcon /> },
  { name: '理财', amount: '682.10', percent: '9.6%', trend: '+3.2%', icon: <TrendIcon /> },
  { name: '其他', amount: '570.10', percent: '8.0%', trend: '+2.1%', icon: <EllipsisIcon /> },
];

const BILLS_FILTER_OPTIONS = [
  { id: 'all', name: '全部支付方式', icon: <CheckCircleSolid /> },
  { id: 'ADCB', name: 'ADCB', icon: <BrandLogo type="adcb" size={20} /> },
  { id: 'Apple Pay', name: 'Apple Pay', icon: <BrandLogo type="apple" size={20} /> },
  { id: 'Mashreq Bank', name: 'Mashreq Bank', icon: <BrandLogo type="mashreq" size={20} /> },
  { id: '支付宝', name: '支付宝', icon: <BrandLogo type="alipay" size={20} /> },
  { id: 'OKX', name: 'OKX', icon: <BrandLogo type="okx" size={20} /> },
  { id: 'Bitget', name: 'Bitget', icon: <BrandLogo type="bitget" size={20} /> },
  { id: '现金', name: '现金', icon: <CashIcon size={20} /> },
];

const BILLS_CALENDAR_DAYS = [
  { val: 30, type: 'prev' }, { val: 31, type: 'prev' }, 
  { val: 1, type: 'curr' }, { val: 2, type: 'curr' }, { val: 3, type: 'curr' }, { val: 4, type: 'curr' }, { val: 5, type: 'curr' },
  { val: 6, type: 'curr' }, { val: 7, type: 'curr' }, { val: 8, type: 'curr' }, { val: 9, type: 'curr' }, { val: 10, type: 'curr' }, { val: 11, type: 'curr' }, { val: 12, type: 'curr' },
  { val: 13, type: 'curr' }, { val: 14, type: 'curr' }, { val: 15, type: 'curr' }, { val: 16, type: 'curr' }, { val: 17, type: 'curr' }, { val: 18, type: 'curr' }, { val: 19, type: 'curr' },
  { val: 20, type: 'curr' }, { val: 21, type: 'curr' }, { val: 22, type: 'curr' }, { val: 23, type: 'curr' }, { val: 24, type: 'curr' }, { val: 25, type: 'curr' }, { val: 26, type: 'curr' },
  { val: 27, type: 'curr' }, { val: 28, type: 'curr' }, { val: 29, type: 'curr' }, { val: 30, type: 'curr' }, 
  { val: 1, type: 'next' }, { val: 2, type: 'next' }, { val: 3, type: 'next' }
];

// Helper components
const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

const Tag = ({ type, text }) => {
  const styles = { shopping: 'bg-[#fff0f6] text-[#eb2f96]', subscription: 'bg-[#f9f0ff] text-[#722ed1]', investment: 'bg-[#e6f4ff] text-[#1677ff]', transfer: 'bg-[#fff7e6] text-[#ff8c00]', transport: 'bg-[#e6f4ff] text-[#1677ff]' };
  return (<span className={`text-[10px] px-[6px] py-[2px] rounded-[4px] font-medium ${styles[type]}`}>{text}</span>);
};
const ToggleSwitch = ({ checked, onChange }) => (
  <button type="button" aria-label={checked ? '关闭开关' : '打开开关'} className={`w-[46px] h-[28px] rounded-full p-[2px] transition-colors duration-300 ease-in-out cursor-pointer shrink-0 ${checked ? 'bg-[#1677ff]' : 'bg-[#e5e5ea]'}`} onClick={onChange}>
     <div className={`w-[24px] h-[24px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}></div>
  </button>
);
const AccountRow = ({ icon, name, balance, onClick }) => (
  <button className="w-full flex items-center justify-between active:opacity-60 bg-transparent rounded-md transition-colors" onClick={onClick}>
    <div className="flex items-center space-x-[6px] min-w-0 flex-1 pr-[8px]">
      <div className="shrink-0 flex items-center justify-center">{icon}</div><span className="text-[12px] font-medium text-[#5c5c5e] truncate">{name}</span>
    </div>
    <div className="flex items-center shrink-0">
      <span className="text-[12px] font-semibold text-[#1c1c1e]">{balance}</span><ChevronRight className="w-[12px] h-[12px] text-[#c7c7cc] ml-[2px]" strokeWidth={2.5} />
    </div>
  </button>
);
const QuickAddRow = ({ icon, name, type, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between py-[12px] border-b border-[#f4f5f8] last:border-0 active:opacity-60 transition-opacity">
    <div className="flex items-center space-x-[12px]">
      <div className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center overflow-hidden shrink-0">{icon}</div><span className="text-[14px] font-medium text-[#1c1c1e]">{name}</span>
    </div>
    <div className="flex items-center shrink-0">
      <span className="text-[12px] text-[#8e8e93]">{type}</span><ChevronRight className="w-[14px] h-[14px] text-[#c7c7cc] ml-[4px]" strokeWidth={2.5} />
    </div>
  </button>
);

const ProfileAvatarButton = ({ onClick }) => (
  <button onClick={onClick} aria-label="个人中心" className="w-[28px] h-[28px] rounded-full bg-blue-100 overflow-hidden flex items-center justify-center active:scale-95 transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
  </button>
);

const ActionToast = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed left-1/2 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[900] -translate-x-1/2 px-[14px] py-[9px] rounded-full bg-[#1c1c1e]/90 text-white text-[13px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)] pointer-events-none animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap">
      {message}
    </div>
  );
};

const getActionText = (element) => {
  if (!element) return '';
  const label = element.getAttribute('data-action-label') || element.getAttribute('aria-label') || element.textContent;
  return (label || '').replace(/\s+/g, ' ').trim();
};


// ==========================================
// 3. GLOBAL TAB BAR & MESSAGE CENTER
// ==========================================
const GlobalTabBar = ({ activeTab, setActiveTab }) => (
  <div className="w-full bg-[#fdfdfd] border-t border-[#f0f0f0] flex justify-between items-center px-[40px] pt-[14px] pb-[calc(2px+env(safe-area-inset-bottom))] shrink-0 z-[200]">
    <button onClick={() => setActiveTab('home')} className="flex flex-col items-center active:scale-95 transition-transform w-[48px]">
      <Home className={`w-[22px] h-[22px] ${activeTab === 'home' ? 'text-[#1677ff] fill-[#1677ff]' : 'text-[#8e8e93]'}`} strokeWidth={1.5} />
      <span className={`text-[10px] mt-[4px] ${activeTab === 'home' ? 'font-semibold text-[#1677ff]' : 'font-medium text-[#8e8e93]'}`}>首页</span>
    </button>
    <button onClick={() => setActiveTab('bills')} className="flex flex-col items-center active:scale-95 transition-transform w-[48px]">
      <FileText className={`w-[22px] h-[22px] ${activeTab === 'bills' ? 'text-[#1677ff] fill-[#1677ff]' : 'text-[#8e8e93]'}`} strokeWidth={1.5} />
      <span className={`text-[10px] mt-[4px] ${activeTab === 'bills' ? 'font-semibold text-[#1677ff]' : 'font-medium text-[#8e8e93]'}`}>账单</span>
    </button>
    <button onClick={() => setActiveTab('stats')} className="flex flex-col items-center active:scale-95 transition-transform w-[48px]">
      <div className="relative">
        <PieChart className={`w-[22px] h-[22px] ${activeTab === 'stats' ? 'text-[#1677ff] fill-[#1677ff]' : 'text-[#8e8e93]'}`} strokeWidth={1.5} />
        {activeTab === 'stats' && (
          <div className="absolute -top-[2px] -right-[2px] w-[8px] h-[8px] bg-white rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[10px] h-[10px] text-[#1677ff]"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
        )}
      </div>
      <span className={`text-[10px] mt-[4px] ${activeTab === 'stats' ? 'font-semibold text-[#1677ff]' : 'font-medium text-[#8e8e93]'}`}>统计</span>
    </button>
    <button onClick={() => setActiveTab('assets')} className="flex flex-col items-center active:scale-95 transition-transform w-[48px]">
      <Wallet className={`w-[22px] h-[22px] ${activeTab === 'assets' ? 'text-[#1677ff] fill-[#1677ff]' : 'text-[#8e8e93]'}`} strokeWidth={1.5} />
      <span className={`text-[10px] mt-[4px] ${activeTab === 'assets' ? 'font-semibold text-[#1677ff]' : 'font-medium text-[#8e8e93]'}`}>资产</span>
    </button>
  </div>
);

const MessageCenterModal = ({ isOpen, onClose, notify }) => {
  if (!isOpen) return null;
  const handleNoticeClick = (message) => {
    notify(message);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[600] flex justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-[430px] h-full pointer-events-none">
          <div className="absolute top-[86px] right-[16px] w-[320px] bg-white rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-[16px] pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="absolute -top-[6px] right-[58px] w-[14px] h-[14px] bg-white transform rotate-45 border-t border-l border-[#f0f0f0] rounded-sm"></div>
              <div className="flex items-center text-[#5c5c5e] mb-[12px] px-[4px]">
                 <Bell className="w-[16px] h-[16px] mr-[6px]" strokeWidth={2} />
                 <span className="text-[14px] font-medium">消息中心</span>
              </div>
              <div className="space-y-[8px]">
                  <button onClick={() => handleNoticeClick('已打开信用卡还款提醒')} className="w-full text-left flex items-start bg-white border border-[#f4f5f8] rounded-[16px] p-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative cursor-pointer active:bg-gray-50 transition-colors">
                     <div className="w-[36px] h-[36px] rounded-full bg-[#fff7ed] flex items-center justify-center shrink-0 mr-[12px]"><Calendar className="text-[#f59e0b] w-[18px] h-[18px]" strokeWidth={2.5} /></div>
                     <div className="flex-1 pr-[16px]">
                        <div className="text-[13px] font-bold text-[#1c1c1e]">待处理事项</div>
                        <div className="text-[14px] text-[#f59e0b] font-medium mt-[2px] mb-[2px]">3天后 · 信用卡还款日</div>
                        <div className="text-[11px] text-[#8e8e93]">建议提前处理，避免逾期</div>
                     </div>
                     <div className="w-[6px] h-[6px] rounded-full bg-[#f59e0b] absolute top-[26px] right-[14px]"></div>
                  </button>
                  <button onClick={() => handleNoticeClick('已打开预算预警通知')} className="w-full text-left flex items-start bg-white border border-[#f4f5f8] rounded-[16px] p-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative cursor-pointer active:bg-gray-50 transition-colors">
                     <div className="w-[36px] h-[36px] rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0 mr-[12px]"><AlertTriangle className="text-[#ff3b30] w-[18px] h-[18px]" strokeWidth={2.5} /></div>
                     <div className="flex-1 pr-[16px]">
                        <div className="text-[13px] font-bold text-[#1c1c1e]">预算预警通知</div>
                        <div className="text-[14px] text-[#ff3b30] font-medium mt-[2px] mb-[2px]">本月餐饮预算已使用 80%</div>
                        <div className="text-[11px] text-[#8e8e93]">建议控制本周支出</div>
                     </div>
                     <div className="w-[6px] h-[6px] rounded-full bg-[#ff3b30] absolute top-[26px] right-[14px]"></div>
                  </button>
              </div>
              <div className="mt-[16px] flex items-center justify-center pb-[4px]">
                  <button onClick={() => handleNoticeClick('已查看全部通知')} className="flex items-center text-[13px] font-medium text-[#1677ff] active:opacity-60 transition-opacity">查看全部通知 <ChevronRight className="w-[14px] h-[14px] ml-[2px]" strokeWidth={2.5}/></button>
              </div>
          </div>
      </div>
    </div>
  );
};


// ==========================================
// 4. EXACT PAGE COMPONENTS WITH DYNAMIC DB
// ==========================================

const HomePage = ({ setIsMessageCenterOpen, transactions, setActiveTab, notify }) => {
  const [homePeriod, setHomePeriod] = useState('月');
  const switchHomePeriod = (period) => {
    setHomePeriod(period);
    notify(`首页已切换为${period}视图`);
  };
  const openBills = (message = '已进入账单页') => {
    setActiveTab('bills');
    notify(message);
  };

  return (
    <div className="bg-[#f4f5f8] font-sans text-gray-900 pb-[24px] relative overflow-x-hidden animate-in fade-in duration-300">
      <div className="px-[16px] pt-[env(safe-area-inset-top,52px)] pb-[10px] flex items-center justify-between sticky top-0 z-[15] bg-[#f4f5f8]/95 backdrop-blur-sm">
        <div className="flex items-center space-x-[6px]">
          <LogoIcon />
          <span className="text-[20px] font-bold text-[#1c1c1e] italic tracking-tight" style={{fontFamily: 'Helvetica Neue, Arial, sans-serif'}}>BitLedger <span className="text-[#1677ff]">Pro</span></span>
        </div>
        <div className="flex items-center space-x-[16px]">
          <button aria-label="搜索" onClick={() => notify('已打开搜索入口')} className="active:opacity-60 transition-opacity"><Search className="w-[20px] h-[20px] text-[#1c1c1e]" strokeWidth={2} /></button>
          <button aria-label="消息中心" onClick={() => setIsMessageCenterOpen(true)} className="relative active:opacity-60 transition-opacity">
            <Bell className="w-[20px] h-[20px] text-[#1c1c1e]" strokeWidth={2} />
            <div className="absolute -top-[1px] right-[1px] w-[7px] h-[7px] bg-[#ff3b30] rounded-full border-[1.5px] border-[#f4f5f8]"></div>
          </button>
          <ProfileAvatarButton onClick={() => notify('已打开个人中心')} />
        </div>
      </div>

      <div className="px-[16px] space-y-[14px]">
        {/* Date & Filter */}
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => notify('已选择 2026年4月')} className="flex items-center space-x-[4px] bg-white h-[34px] px-[10px] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.02)] whitespace-nowrap active:scale-95 transition-transform">
            <Calendar className="w-[15px] h-[15px] text-[#8e8e93]" strokeWidth={2} />
            <span className="text-[13px] font-medium text-[#1c1c1e]">2026年4月</span>
            <ChevronDown className="w-[13px] h-[13px] text-[#8e8e93]" strokeWidth={2.5} />
          </button>
          <div className="flex bg-white rounded-[8px] p-[2px] shadow-[0_1px_4px_rgba(0,0,0,0.02)] shrink-0">
            {['月', '年', '自定义'].map((period) => (
              <button key={period} onClick={() => switchHomePeriod(period)} className={`${period === '自定义' ? 'w-[46px]' : 'w-[36px]'} py-[4px] text-[12px] rounded-[6px] transition-all ${homePeriod === period ? 'font-semibold text-[#1677ff] bg-[#f0f5ff]' : 'font-medium text-[#8e8e93] active:opacity-60'}`}>{period}</button>
            ))}
          </div>
        </div>

        {/* Main Balance Card */}
        <div className="bg-white rounded-[24px] p-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div className="flex items-center space-x-[6px] text-[#8e8e93] mb-[8px]"><span className="text-[13px]">本月结余 (CNY)</span><Eye className="w-[16px] h-[16px]" strokeWidth={2} /></div>
          <div className="text-[40px] font-bold text-[#1677ff] tracking-tight leading-none mb-[12px]" style={{fontFamily: 'Helvetica Neue, Arial, sans-serif'}}>40,446.45</div>
          <div className="flex items-center text-[12px]"><span className="text-[#8e8e93] mr-[8px]">较上月</span><span className="text-[#1677ff] flex items-center font-medium"><ArrowUpRight className="w-[12px] h-[12px] mr-[2px]" strokeWidth={2.5} /> 20.1%</span></div>
          <div className="absolute bottom-0 right-0 w-[65%] h-[90px] pointer-events-none">
            <div className="absolute top-[4px] right-[18%] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] text-[#1677ff] font-semibold px-[8px] py-[3px] rounded-[6px] z-10 flex flex-col items-center">
              <div className="text-[#8e8e93] text-[9px] mb-[1px] font-normal scale-90">4月30日</div><div className="text-[11px] leading-none">40,446.45</div>
            </div>
            <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="none">
              <defs><linearGradient id="homeBlueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1677ff" stopOpacity="0.2" /><stop offset="100%" stopColor="#1677ff" stopOpacity="0" /></linearGradient></defs>
              <path d="M-10,65 C20,65 30,75 50,60 C70,45 80,65 100,50 C120,35 140,55 160,25 C175,5 190,15 210,10" fill="none" stroke="#1677ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M-10,65 C20,65 30,75 50,60 C70,45 80,65 100,50 C120,35 140,55 160,25 C175,5 190,15 210,10 L210,80 L-10,80 Z" fill="url(#homeBlueGrad)" />
              <circle cx="160" cy="25" r="3.5" fill="#1677ff" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Income / Expense Cards */}
        <div className="grid grid-cols-2 gap-[14px]">
          <div className="bg-white rounded-[20px] p-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative">
            <div className="text-[12px] text-[#8e8e93] mb-[6px]">本月收入 (CNY)</div><div className="text-[22px] font-bold text-[#10b981] mb-[8px] leading-none">47,556.16</div>
            <div className="flex items-center text-[11px]"><span className="text-[#8e8e93] mr-[6px]">较上月</span><span className="text-[#10b981] flex items-center font-medium"><ArrowUpRight className="w-[10px] h-[10px] mr-[2px]" strokeWidth={3} /> 18.7%</span></div>
            <div className="absolute bottom-[14px] right-[14px] w-[28px] h-[28px] bg-[#ecfdf5] rounded-[8px] flex items-center justify-center"><ArrowUpRight className="w-[18px] h-[18px] text-[#10b981]" strokeWidth={2.5} /></div>
          </div>
          <div className="bg-white rounded-[20px] p-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative">
            <div className="text-[12px] text-[#8e8e93] mb-[6px]">本月支出 (CNY)</div><div className="text-[22px] font-bold text-[#ff3b30] mb-[8px] leading-none">7,109.71</div>
            <div className="flex items-center text-[11px]"><span className="text-[#8e8e93] mr-[6px]">较上月</span><span className="text-[#ff3b30] flex items-center font-medium"><ArrowUpRight className="w-[10px] h-[10px] mr-[2px]" strokeWidth={3} /> 13.2%</span></div>
            <div className="absolute bottom-[14px] right-[14px] w-[28px] h-[28px] bg-[#fff0f0] rounded-[8px] flex items-center justify-center"><ArrowUpRight className="w-[18px] h-[18px] text-[#ff3b30] transform rotate-90" strokeWidth={2.5} /></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-between items-center px-[16px] py-[8px]">
          <button onClick={() => openBills('已进入账单页，可点任意账单编辑备注')} className="flex flex-col items-center space-y-[8px] active:scale-95 transition-transform"><div className="w-[46px] h-[46px] bg-[#1677ff] rounded-full flex items-center justify-center shadow-[0_6px_16px_rgba(22,119,255,0.25)]"><PenLine className="w-[20px] h-[20px] text-white" strokeWidth={2} /></div><span className="text-[12px] font-medium text-[#1c1c1e]">记一笔</span></button>
          <button onClick={() => notify('已定位到预算进度')} className="flex flex-col items-center space-y-[8px] active:scale-95 transition-transform"><div className="w-[46px] h-[46px] bg-[#10b981] rounded-full flex items-center justify-center shadow-[0_6px_16px_rgba(16,185,129,0.25)]"><PieChartIcon className="w-[20px] h-[20px] text-white" fill="currentColor" strokeWidth={1} /></div><span className="text-[12px] font-medium text-[#1c1c1e]">预算</span></button>
          <button onClick={() => openBills('已进入账单页并查看转账记录')} className="flex flex-col items-center space-y-[8px] active:scale-95 transition-transform"><div className="w-[46px] h-[46px] bg-[#8b5cf6] rounded-full flex items-center justify-center shadow-[0_6px_16px_rgba(139,92,246,0.25)]"><ArrowRightLeft className="w-[20px] h-[20px] text-white" strokeWidth={2} /></div><span className="text-[12px] font-medium text-[#1c1c1e]">转账</span></button>
          <button onClick={() => { setActiveTab('stats'); notify('已打开统计报表'); }} className="flex flex-col items-center space-y-[8px] active:scale-95 transition-transform"><div className="w-[46px] h-[46px] bg-[#f59e0b] rounded-full flex items-center justify-center shadow-[0_6px_16px_rgba(245,158,11,0.25)]"><BarChart2 className="w-[20px] h-[20px] text-white" strokeWidth={2.5} /></div><span className="text-[12px] font-medium text-[#1c1c1e]">报表</span></button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-[14px]">
          <div className="bg-white rounded-[20px] p-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col h-[150px]">
            <div className="flex justify-between items-center mb-[8px]"><span className="text-[14px] font-semibold text-[#1c1c1e]">预算进度</span><div className="flex items-center text-[11px] text-[#8e8e93]">本月 <ChevronDown className="w-[12px] h-[12px] ml-[2px]" /></div></div>
            <div className="text-[11px] text-[#8e8e93] mb-[12px]">总预算 <span className="font-semibold text-[#1c1c1e]">20,000.00</span> CNY</div>
            <div className="flex items-center space-x-[10px] mb-auto"><div className="flex-1 h-[6px] bg-[#f0f0f0] rounded-full overflow-hidden"><div className="h-full bg-[#1677ff] rounded-full" style={{ width: '53%' }}></div></div><span className="text-[13px] font-bold text-[#1677ff]">53%</span></div>
            <div className="space-y-[6px]">
              <div className="flex justify-between items-center text-[11px]"><div className="flex items-center text-[#3a3a3c]"><div className="w-[5px] h-[5px] rounded-full bg-[#1677ff] mr-[6px]"></div>已支出</div><span className="font-semibold text-[#1c1c1e]">10,653.28</span></div>
              <div className="flex justify-between items-center text-[11px]"><div className="flex items-center text-[#8e8e93]"><div className="w-[5px] h-[5px] rounded-full bg-[#e5e5ea] mr-[6px]"></div>剩余额度</div><span className="font-semibold text-[#3a3a3c]">9,346.72</span></div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] p-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col h-[150px]">
             <div className="flex justify-between items-center mb-[4px]"><span className="text-[14px] font-semibold text-[#1c1c1e]">支出分类概览</span><div className="flex items-center text-[11px] text-[#8e8e93]">本月 <ChevronDown className="w-[12px] h-[12px] ml-[2px]" /></div></div>
            <div className="flex items-center justify-between flex-1">
              <div className="w-[72px] h-[72px] relative ml-[-4px]"><HomeDonutChart /></div>
              <div className="flex flex-col justify-center space-y-[4px] w-[55%]">
                {[{ label: '餐饮', value: '31.8%', color: 'bg-[#1677ff]' },{ label: '交通', value: '20.4%', color: 'bg-[#8b5cf6]' },{ label: '购物', value: '16.7%', color: 'bg-[#10b981]' },{ label: '娱乐', value: '13.5%', color: 'bg-[#fbbf24]' },{ label: '理财', value: '9.6%', color: 'bg-[#f59e0b]' },{ label: '其他', value: '8.0%', color: 'bg-[#e5e7eb]' }].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] leading-tight"><div className="flex items-center text-[#3a3a3c]"><div className={`w-[5px] h-[5px] rounded-full mr-[6px] ${item.color}`}></div>{item.label}</div><span className="text-[#8e8e93]">{item.value}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Recent Transactions from Supabase */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="flex justify-between items-baseline p-[20px] pb-[8px]"><h3 className="text-[15px] font-bold text-[#1c1c1e]">最近交易</h3><button onClick={() => openBills('已查看全部交易')} className="flex items-center text-[12px] text-[#8e8e93] active:opacity-60 transition-opacity">查看全部 <ChevronRight className="w-[14px] h-[14px] ml-[2px]" strokeWidth={2.5} /></button></div>
          <div className="flex flex-col">
            {transactions.slice(0, 4).map((tx, idx) => (
              <button key={tx.id || idx} onClick={() => openBills(`已打开 ${tx.title}`)} className="w-full flex items-center px-[20px] py-[14px] border-b border-[#f4f5f8] active:bg-[#f9f9f9] transition-colors text-left">
                <div className="w-[38px] h-[38px] flex items-center justify-center shrink-0">{getIconByString(tx.iconType)}</div>
                <div className="flex-1 ml-[12px] flex justify-between items-center">
                   <div className="flex flex-col justify-center space-y-[2px]"><span className="text-[14px] font-bold text-[#1c1c1e]">{tx.title}</span><div className="flex items-center space-x-[6px]"><span className={`text-[10px] px-[4px] py-[1px] rounded-[4px] ${tx.isIncome ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#e6f4ff] text-[#1677ff]'}`}>{tx.isIncome ? '收入' : '支出'}</span><span className="text-[11px] font-medium text-[#8e8e93]">{tx.tag}</span></div></div>
                   <div className="flex flex-col items-end justify-center space-y-[2px]"><span className={`text-[15px] font-bold ${tx.isIncome ? 'text-[#10b981]' : 'text-[#ff3b30]'}`}>{tx.amount}</span><span className="text-[11px] font-medium text-[#8e8e93]">{tx.time}</span></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsPage = ({ setIsMessageCenterOpen, notify }) => {
  const [activeTab, setActiveTab] = useState('月');
  const [insightTab, setInsightTab] = useState('支出分析');
  const [detailTab, setDetailTab] = useState('本月');
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTrendRangeOpen, setIsTrendRangeOpen] = useState(false);
  const [trendRange, setTrendRange] = useState({ start: 1, end: 4 });
  const switchStatsTab = (tab) => {
    setActiveTab(tab);
    notify(`统计已切换为${tab}视图`);
  };
  const trendRangeLabel = trendRange.start === trendRange.end ? `${trendRange.start}月` : `${trendRange.start}月-${trendRange.end}月`;
  const monthRangeOptions = Array.from({ length: 12 }, (_, index) => index + 1);

  return (
    <div className="bg-[#f7f8fa] font-sans text-gray-900 pb-[24px] relative overflow-x-hidden animate-in fade-in duration-300">
      <div className="px-[16px] pt-[env(safe-area-inset-top,52px)] pb-[10px] flex items-center justify-between sticky top-0 z-[15] bg-[#f7f8fa]/95 backdrop-blur-md">
        <div className="flex items-center space-x-[6px]"><LogoIcon /><span className="text-[20px] font-bold text-[#1c1c1e] italic tracking-tight" style={{fontFamily: 'Helvetica Neue, Arial, sans-serif'}}>BitLedger <span className="text-[#1677ff]">Pro</span></span></div>
        <div className="flex items-center space-x-[16px]">
          <button aria-label="搜索" onClick={() => notify('已打开统计搜索')} className="active:opacity-60 transition-opacity"><Search className="w-[20px] h-[20px] text-[#1c1c1e]" strokeWidth={2} /></button>
          <button aria-label="消息中心" onClick={() => setIsMessageCenterOpen(true)} className="relative active:opacity-60 transition-opacity"><Bell className="w-[20px] h-[20px] text-[#1c1c1e]" strokeWidth={2} /><div className="absolute -top-[1px] right-[1px] w-[7px] h-[7px] bg-[#ff3b30] rounded-full border-[1.5px] border-[#f7f8fa]"></div></button>
          <ProfileAvatarButton onClick={() => notify('已打开个人中心')} />
        </div>
      </div>

      <div className="px-[16px] mt-[8px] flex items-center justify-between">
        <button onClick={() => notify('已选择 2026年4月')} className="flex items-center space-x-[6px] bg-white border border-[#f0f0f0] h-[36px] px-[12px] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-95 transition-all">
          <Calendar className="w-[16px] h-[16px] text-[#8e8e93]" strokeWidth={2} /><span className="text-[14px] font-medium text-[#1c1c1e]">2026年4月</span><ChevronDown className="w-[14px] h-[14px] text-[#8e8e93]" strokeWidth={2.5} />
        </button>
        <div className="flex bg-[#f4f5f8] rounded-[10px] p-[3px]">
          {['月', '年', '自定义'].map((tab) => (
            <button key={tab} onClick={() => switchStatsTab(tab)} className={`px-[16px] py-[5px] text-[13px] rounded-[8px] transition-all ${activeTab === tab ? 'bg-white text-[#1677ff] font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-[#e5e5ea]' : 'text-[#8e8e93] font-medium active:bg-gray-200'}`}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="px-[16px] mt-[16px] flex space-x-[10px]">
        <div className="flex-1 bg-white rounded-[16px] p-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative">
          <div className="text-[11px] text-[#8e8e93] mb-[4px] font-medium">本月支出 <span className="text-[9px] text-[#c7c7cc] ml-[2px] font-normal">(CNY)</span></div>
          <div className="text-[18px] font-bold text-[#ff4d4f] mb-[8px] leading-none">7,109.71</div>
          <div className="text-[10px] text-[#8e8e93] mb-[2px]">较上月</div>
          <div className="flex items-center text-[10px]"><span className="text-[#ff4d4f] flex items-center font-medium bg-[#fff1f0] px-[4px] py-[1px] rounded-[4px]"><ArrowUpRight className="w-[9px] h-[9px] mr-[2px]" strokeWidth={2.5} /> 13.2%</span></div>
          <div className="absolute bottom-[12px] right-[12px] w-[28px] h-[28px] bg-[#fff1f0] rounded-[8px] flex items-center justify-center"><ArrowDownRight className="w-[16px] h-[16px] text-[#ff4d4f]" strokeWidth={2.5} /></div>
        </div>
        <div className="flex-1 bg-white rounded-[16px] p-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative">
          <div className="text-[11px] text-[#8e8e93] mb-[4px] font-medium">本月收入 <span className="text-[9px] text-[#c7c7cc] ml-[2px] font-normal">(CNY)</span></div>
          <div className="text-[18px] font-bold text-[#34d399] mb-[8px] leading-none">47,556.16</div>
          <div className="text-[10px] text-[#8e8e93] mb-[2px]">较上月</div>
          <div className="flex items-center text-[10px]"><span className="text-[#34d399] flex items-center font-medium bg-[#ecfdf5] px-[4px] py-[1px] rounded-[4px]"><ArrowUpRight className="w-[9px] h-[9px] mr-[2px]" strokeWidth={2.5} /> 18.7%</span></div>
          <div className="absolute bottom-[12px] right-[12px] w-[28px] h-[28px] bg-[#ecfdf5] rounded-[8px] flex items-center justify-center"><ArrowUpRight className="w-[16px] h-[16px] text-[#34d399]" strokeWidth={2.5} /></div>
        </div>
        <div className="flex-1 bg-white rounded-[16px] p-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative">
          <div className="text-[11px] text-[#8e8e93] mb-[4px] font-medium">本月结余 <span className="text-[9px] text-[#c7c7cc] ml-[2px] font-normal">(CNY)</span></div>
          <div className="text-[18px] font-bold text-[#1677ff] mb-[8px] leading-none">40,446.45</div>
          <div className="text-[10px] text-[#8e8e93] mb-[2px]">较上月</div>
          <div className="flex items-center text-[10px]"><span className="text-[#1677ff] flex items-center font-medium bg-[#e6f4ff] px-[4px] py-[1px] rounded-[4px]"><ArrowUpRight className="w-[9px] h-[9px] mr-[2px]" strokeWidth={2.5} /> 20.1%</span></div>
          <div className="absolute bottom-[12px] right-[12px] w-[28px] h-[28px] bg-[#e6f4ff] rounded-[8px] flex items-center justify-center"><Wallet className="w-[14px] h-[14px] text-[#1677ff]" strokeWidth={2.5} /></div>
        </div>
      </div>

      <div className="mx-[16px] mt-[16px] bg-white rounded-[20px] p-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-[20px]">
          <h2 className="text-[16px] font-bold text-[#1c1c1e]">收支趋势</h2>
          <div className="relative">
            <button onClick={() => setIsTrendRangeOpen((prev) => !prev)} className="flex items-center text-[12px] text-[#8e8e93] bg-[#f7f8fa] px-[8px] py-[4px] rounded-[6px] active:scale-95 transition-transform">
              {trendRangeLabel} <ChevronDown className="w-[12px] h-[12px] ml-[2px]" strokeWidth={2} />
            </button>
            {isTrendRangeOpen && (
              <>
                <div className="fixed inset-0 z-[40]" onClick={() => setIsTrendRangeOpen(false)}></div>
                <div className="absolute right-0 top-[34px] z-[50] w-[220px] rounded-[16px] bg-white p-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                  <div className="mb-[10px] text-[12px] font-semibold text-[#1c1c1e]">选择月份区间</div>
                  <div className="mb-[10px]">
                    <div className="mb-[6px] text-[11px] text-[#8e8e93]">开始月份</div>
                    <div className="grid grid-cols-4 gap-[6px]">
                      {monthRangeOptions.map((month) => (
                        <button
                          key={`start-${month}`}
                          onClick={() => setTrendRange((prev) => ({ start: month, end: Math.max(month, prev.end) }))}
                          className={`h-[32px] rounded-[8px] text-[12px] transition-all ${trendRange.start === month ? 'bg-[#1677ff] text-white font-semibold' : 'bg-[#f7f8fa] text-[#5c5c5e] font-medium'}`}
                        >
                          {month}月
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-[6px] text-[11px] text-[#8e8e93]">结束月份</div>
                    <div className="grid grid-cols-4 gap-[6px]">
                      {monthRangeOptions.map((month) => {
                        const disabled = month < trendRange.start;
                        return (
                          <button
                            key={`end-${month}`}
                            disabled={disabled}
                            onClick={() => setTrendRange((prev) => ({ ...prev, end: month }))}
                            className={`h-[32px] rounded-[8px] text-[12px] transition-all ${trendRange.end === month ? 'bg-[#1677ff] text-white font-semibold' : disabled ? 'bg-[#f7f8fa] text-[#d1d5db]' : 'bg-[#f7f8fa] text-[#5c5c5e] font-medium'}`}
                          >
                            {month}月
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-[12px] flex justify-between">
                    <button onClick={() => setTrendRange({ start: 1, end: 12 })} className="text-[12px] font-medium text-[#1677ff]">全年</button>
                    <button onClick={() => { setIsTrendRangeOpen(false); notify(`趋势范围已切换为${trendRangeLabel}`); }} className="rounded-[8px] bg-[#1677ff] px-[14px] py-[6px] text-[12px] font-semibold text-white">确定</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-[16px] mb-[20px]">
          <div className="flex items-center text-[11px] text-[#8e8e93]"><div className="w-[6px] h-[6px] rounded-full bg-[#65d4a9] mr-[6px]"></div>收入 <span className="text-[9px] text-[#c7c7cc] ml-[2px]">(CNY)</span></div>
          <div className="flex items-center text-[11px] text-[#8e8e93]"><div className="w-[6px] h-[6px] rounded-full bg-[#fa757e] mr-[6px]"></div>支出 <span className="text-[9px] text-[#c7c7cc] ml-[2px]">(CNY)</span></div>
        </div>
        <div className="relative h-[180px] w-full">
          {[80, 60, 40, 20, 0].map((val) => (
            <div key={val} className="absolute w-full flex items-center" style={{ bottom: `${(val / 80) * 100}%` }}>
              <span className="text-[10px] text-[#c7c7cc] w-[28px] -mt-[6px]">{val === 0 ? '0' : `${val}K`}</span>
              <div className="flex-1 border-t border-dashed border-[#f0f0f0] ml-[4px]"></div>
            </div>
          ))}
          <div className="absolute inset-0 ml-[32px] flex justify-between px-[10px] items-end pb-[1px]">
            {STATS_BAR_CHART_DATA.map((item) => (
              <div key={item.month} className="flex flex-col items-center flex-1 h-full relative z-10">
                <div className="absolute bottom-0 flex justify-between items-end h-full w-[32px]">
                  <div className="relative w-[10px]" style={{ height: `${(item.in / 80) * 100}%` }}>
                    <div className={`w-full h-full rounded-t-[3px] transition-all duration-500 ${item.isCurrent ? 'bg-[#4080ff]' : 'bg-[#65d4a9]'}`}></div>
                    <div className={`absolute -top-[16px] left-1/2 transform -translate-x-1/2 text-[8px] font-semibold px-[3px] py-[1.5px] rounded-[3px] border whitespace-nowrap bg-white leading-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-20 flex items-center justify-center ${item.isCurrent ? 'border-[#4080ff] text-[#4080ff]' : 'border-[#65d4a9] text-[#65d4a9]'}`}>{item.in}K</div>
                  </div>
                  <div className="relative w-[10px]" style={{ height: `${(item.out / 80) * 100}%` }}>
                    <div className="w-full h-full bg-[#fa757e] rounded-t-[3px] transition-all duration-500"></div>
                    <div className="absolute -top-[16px] left-1/2 transform -translate-x-1/2 text-[8px] font-semibold px-[3px] py-[1.5px] rounded-[3px] border border-[#fa757e] text-[#fa757e] whitespace-nowrap bg-white leading-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-20 flex items-center justify-center">{item.out}K</div>
                  </div>
                </div>
                <div className={`absolute -bottom-[24px] text-[11px] font-medium ${item.isCurrent ? 'text-[#1677ff]' : 'text-[#8e8e93]'}`}>{item.month}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-[24px]"></div>
      </div>

      <div className="mx-[16px] mt-[16px] grid grid-cols-[175px_1fr] gap-[12px]">
        <div className="bg-white rounded-[20px] p-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col">
          <h2 className="text-[14px] font-bold text-[#1c1c1e] mb-[20px]">支出分类占比</h2>
          <div className="flex flex-col items-center flex-1 justify-center">
            <div className="relative w-[116px] h-[116px] mb-[20px]">
              <div className="w-full h-full transform rotate-[-15deg]" style={{background: 'conic-gradient(from -20deg, #4c78fe 0% 31.8%, #8862fe 31.8% 52.2%, #a78dfe 52.2% 68.9%, #c5cbe1 68.9% 76.9%, #ffd24d 76.9% 86.5%, #f5ad41 86.5% 100%)', borderRadius: '50%', mask: 'radial-gradient(transparent 58%, black 59%)', WebkitMask: 'radial-gradient(transparent 58%, black 59%)'}}></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[14px] font-bold text-[#1c1c1e] leading-none mb-[4px]">7,109.71</span><span className="text-[10px] text-[#8e8e93]">总支出</span>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-y-[10px] gap-x-[8px] px-[2px]">
              {STATS_PIE_CHART_DATA.map((item) => (
                <div key={item.name} className="flex items-center text-[11px]"><div className="w-[6px] h-[6px] rounded-full mr-[6px] shrink-0" style={{ backgroundColor: item.color }}></div><span className="text-[#8e8e93] shrink-0 mr-auto">{item.name}</span><span className="text-[#3a3a3c] font-medium shrink-0 ml-[2px]">{item.percent}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="flex items-center justify-between mb-[16px]">
            <h2 className="text-[14px] font-bold text-[#1c1c1e]">支出分类排行</h2><button onClick={() => { setIsDetailModalOpen(true); notify('已打开支出分类排行详情'); }} className="flex items-center text-[10px] text-[#8e8e93] active:opacity-60">查看全部 <ChevronRight className="w-[12px] h-[12px] ml-[2px]" strokeWidth={2} /></button>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-[14px]">
            {STATS_RANKING_DATA.map((item) => (
              <div key={item.rank} className="flex items-center w-full">
                <div className={`w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${item.badgeBg} ${item.badgeText}`}>{item.rank}</div>
                <div className="w-[20px] h-[20px] rounded-full bg-[#f4f5f8] flex items-center justify-center shrink-0 ml-[6px]">
                  {React.cloneElement(item.icon, { className: `w-[11px] h-[11px] ${item.iconColor}` })}
                </div>
                <span className="text-[11px] text-[#3a3a3c] font-medium ml-[6px] shrink-0">{item.name}</span>
                <div className="flex-1 min-w-[2px]"></div>
                <span className="text-[12px] font-bold text-[#1c1c1e] tabular-nums shrink-0">{item.amount}</span>
                <span className={`text-[10px] font-medium w-[32px] text-right shrink-0 tabular-nums ml-[4px] ${item.isRed ? 'text-[#ff4d4f]' : 'text-[#8e8e93]'}`}>{item.percent}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={() => { setIsInsightModalOpen(true); notify('已打开智能分析'); }} className="w-[calc(100%-32px)] mx-[16px] mt-[16px] bg-gradient-to-r from-[#6b73ff] to-[#404cff] rounded-[20px] p-[16px] flex items-center shadow-[0_8px_20px_rgba(107,115,255,0.2)] cursor-pointer active:scale-[0.98] transition-transform z-10 relative text-left">
        <div className="w-[40px] h-[40px] rounded-full bg-white/20 flex items-center justify-center shrink-0 mr-[12px]"><TrendingUp className="w-[20px] h-[20px] text-white" strokeWidth={2.5} /></div>
        <div className="flex-1">
          <div className="text-[14px] font-bold text-white mb-[4px]">本月支出较上月增加 <span className="text-[#ffb612]">13.2%</span></div>
          <div className="text-[11px] text-white/80">主要增长来自 餐饮 (+18.6%) 和 购物 (+17.3%)</div>
        </div>
        <ChevronRight className="w-[18px] h-[18px] text-white/80 ml-[8px]" strokeWidth={2} />
      </button>

      {isInsightModalOpen && (
        <div className="fixed inset-0 z-[300] flex justify-center items-end px-[12px] pb-[20px]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200" onClick={() => setIsInsightModalOpen(false)}></div>
          <div className="relative w-full max-w-[430px] max-h-[78vh] overflow-hidden bg-white rounded-[24px] shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[18px] flex flex-col">
            <div className="w-[36px] h-[4px] bg-[#e5e5ea] rounded-full mx-auto mt-[10px] mb-[12px]"></div>
            <div className="px-[20px] flex justify-between items-start">
               <div>
                  <h2 className="text-[18px] font-bold text-[#1c1c1e]">本月支出较上月增加 <span className="text-[#ff4d4f]">13.2%</span></h2>
                  <p className="text-[12px] text-[#8e8e93] mt-[4px]">主要增长来自 餐饮 (+18.6%) 和 购物 (+17.3%)</p>
               </div>
               <button onClick={() => setIsInsightModalOpen(false)} className="p-[4px] active:bg-gray-100 rounded-full transition-colors mt-[-4px] mr-[-4px]"><X className="w-[20px] h-[20px] text-[#8e8e93]" strokeWidth={2} /></button>
            </div>
            <div className="flex items-center justify-between px-[20px] mt-[16px] mb-[14px]">
               <div className="flex items-center bg-[#f4f5f8] p-[3px] rounded-[10px] mr-[8px]">
                  {['支出分析', '收入分析', '对比分析', '建议'].map((tab) => (
                    <button key={tab} onClick={() => { setInsightTab(tab); notify(`已切换到${tab}`); }} className={`text-[13px] px-[12px] py-[5px] rounded-[8px] whitespace-nowrap shrink-0 transition-all ${insightTab === tab ? 'font-semibold text-[#1677ff] bg-white border border-[#e5e5ea] shadow-[0_1px_4px_rgba(0,0,0,0.04)]' : 'font-medium text-[#8e8e93] active:bg-gray-200'}`}>{tab}</button>
                  ))}
               </div>
               <button onClick={() => notify('已选择 2026年4月')} className="flex items-center bg-[#f4f5f8] border border-[#e5e5ea] px-[10px] py-[5px] rounded-[8px] shrink-0 active:scale-95 transition-transform"><span className="text-[12px] font-medium text-[#1c1c1e]">2026年4月</span><ChevronDown className="w-[12px] h-[12px] text-[#8e8e93] ml-[4px]" strokeWidth={2.5} /></button>
            </div>
            <div className="flex justify-between items-center px-[20px] mb-[12px]"><span className="text-[13px] font-bold text-[#1c1c1e]">支出增长 Top 5</span><span className="text-[11px] text-[#8e8e93]">较上月</span></div>
            <div className="flex flex-col space-y-[14px] overflow-y-auto hide-scrollbar">
               {STATS_INSIGHT_MODAL_DATA.map((item) => (
                  <div key={item.rank} className="flex items-center px-[20px] w-full">
                     <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${item.badgeBg} ${item.badgeText}`}>{item.rank}</div>
                     <div className="w-[24px] h-[24px] rounded-full bg-[#f4f5f8] flex items-center justify-center shrink-0 ml-[10px]">{React.cloneElement(item.icon, { className: "w-[12px] h-[12px] text-[#3a3a3c]" })}</div>
                     <div className="flex-1 flex flex-col justify-center ml-[10px] mr-[14px]"><span className="text-[14px] text-[#3a3a3c] font-medium leading-none">{item.name}</span><div className="h-[4px] bg-[#ff4d4f] rounded-full mt-[6px]" style={{ width: item.width }}></div></div>
                     <div className="flex items-center shrink-0"><span className="text-[14px] font-bold text-[#1c1c1e] tabular-nums">{item.amount}</span><span className="text-[13px] font-medium text-[#ff4d4f] tabular-nums ml-[12px] w-[58px] text-right flex items-center justify-end">{item.percent} <ArrowUp className="w-[12px] h-[12px] ml-[2px]" strokeWidth={3} /></span></div>
                  </div>
               ))}
            </div>
            <div className="px-[20px] mt-[18px]"><button onClick={() => { setIsDetailModalOpen(true); notify('已打开支出分类详情'); }} className="w-full py-[12px] bg-[#f8faff] text-[#1677ff] text-[14px] font-semibold rounded-[12px] active:bg-[#eef4ff] transition-colors">查看支出分类详情</button></div>
          </div>
        </div>
      )}

      {isDetailModalOpen && (
        <div className="fixed inset-0 z-[400] flex justify-center items-end px-[12px] pb-[20px]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200" onClick={() => setIsDetailModalOpen(false)}></div>
          <div className="relative w-full max-w-[430px] bg-white rounded-[24px] shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[24px] pt-[12px] px-[20px] flex flex-col h-auto">
            <div className="w-[36px] h-[4px] bg-[#e5e5ea] rounded-full mx-auto mb-[20px]"></div>
            <div className="relative">
               <button onClick={() => setIsDetailModalOpen(false)} className="absolute -top-[4px] right-0 p-[4px] active:bg-gray-100 rounded-full transition-colors"><X className="w-[20px] h-[20px] text-[#8e8e93]" strokeWidth={2} /></button>
               <div className="flex justify-between items-end mb-[20px]">
                  <h2 className="text-[20px] font-bold text-[#1c1c1e] leading-none">支出分类详情</h2>
                  <div className="flex items-center text-[12px] text-[#3a3a3c] font-medium mr-[28px] mt-[4px]">2026年4月 <ChevronDown className="w-[12px] h-[12px] ml-[2px] text-[#8e8e93]" strokeWidth={2.5} /></div>
               </div>
            </div>
            <div className="flex bg-[#f4f5f8] p-[3px] rounded-[10px] mb-[20px]">
               {['本月', '较上月变化', '占比', '趋势'].map((tab) => (
                 <button key={tab} onClick={() => { setDetailTab(tab); notify(`详情已切换到${tab}`); }} className={`flex-1 text-[13px] py-[6px] rounded-[8px] transition-all ${detailTab === tab ? 'font-semibold text-[#1677ff] bg-white border border-[#e5e5ea] shadow-[0_1px_4px_rgba(0,0,0,0.04)]' : 'font-medium text-[#8e8e93] active:bg-gray-200'}`}>{tab}</button>
               ))}
            </div>
            <div className="flex items-center">
               <div className="relative w-[110px] h-[110px] shrink-0 self-start mt-[16px]">
                  <DetailedSVGDonut />
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[15px] font-bold text-[#1c1c1e] leading-none mb-[4px]">7,109.71</span><span className="text-[9px] text-[#8e8e93]">总支出 (CNY)</span></div>
               </div>
               <div className="flex-1 ml-[12px] flex flex-col">
                  <div className="flex items-center text-[10px] text-[#8e8e93] mb-[10px] px-[4px]"><div className="w-[54px]">分类</div><div className="flex-1 text-right">金额 (CNY)</div><div className="w-[32px] text-right ml-[8px]">占比</div><div className="w-[45px] text-right ml-[8px]">较上月</div></div>
                  <div className="flex flex-col space-y-[12px]">
                     {STATS_DETAIL_MODAL_DATA.map((row, i) => (
                        <div key={i} className="flex items-center px-[4px]">
                           <div className="w-[54px] flex items-center space-x-[6px]"><div className="w-[18px] h-[18px] rounded-full bg-[#f4f5f8] flex items-center justify-center shrink-0">{React.cloneElement(row.icon, { className: "w-[10px] h-[10px] text-[#3a3a3c]" })}</div><span className="text-[12px] font-medium text-[#1c1c1e] whitespace-nowrap">{row.name}</span></div>
                           <div className="flex-1 text-right text-[12px] font-medium text-[#1c1c1e] tabular-nums whitespace-nowrap">{row.amount}</div><div className="w-[32px] text-right text-[11px] font-medium text-[#8e8e93] tabular-nums whitespace-nowrap ml-[8px]">{row.percent}</div>
                           <div className="w-[45px] flex items-center justify-end text-[11px] font-medium text-[#ff4d4f] tabular-nums ml-[8px]">{row.trend} <ArrowUp className="w-[9px] h-[9px] ml-[2px]" strokeWidth={3} /></div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
            <div className="mt-[24px] pt-[16px] border-t border-[#f4f5f8] flex items-center text-[#8e8e93] text-[11px]"><Info className="w-[13px] h-[13px] mr-[6px]" strokeWidth={2}/><span>数据已按所选统计周期过滤</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

const BillsPage = ({ setIsMessageCenterOpen, transactions, updateTransaction, notify }) => {
  const [selectedTx, setSelectedTx] = useState(null);
  const [tempNote, setTempNote] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedRange, setSelectedRange] = useState('月');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(23);
  const [calendarView, setCalendarView] = useState('月');
  const [selectedMonth, setSelectedMonth] = useState(4);

  const selectedMonthLabel = `2026年${selectedMonth}月`;
  const handleOpenModal = (tx) => { setSelectedTx(tx); setTempNote(tx.note || tx.title); notify(`已打开 ${tx.title} 详情`); };
  const handleSave = () => {
    if (!selectedTx) return;
    updateTransaction(selectedTx.id, { title: tempNote || selectedTx.title, note: tempNote });
    setSelectedTx(null);
    notify('账单备注已保存');
  };
  const changeCalendarMonth = (delta) => {
    setSelectedMonth((prev) => {
      const next = Math.min(12, Math.max(1, prev + delta));
      notify(`已切换到 2026年${next}月`);
      return next;
    });
  };

  const filteredData = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const baseDate = new Date(2026, selectedMonth - 1, selectedDate);
    const { start: weekStart, end: weekEnd } = getWeekRange(baseDate);
    const validTxs = transactions.filter(tx => {
      const txDate = parseTransactionDate(tx.fullDate);
      const paymentMatched = selectedFilter === 'all' || tx.paymentMethod === selectedFilter;
      const typeMatched =
        selectedType === '全部' ||
        (selectedType === '支出' && !tx.isIncome) ||
        (selectedType === '收入' && tx.isIncome) ||
        (selectedType === '理财' && (tx.tagType === 'investment' || tx.tag === '理财')) ||
        (selectedType === '转账' && (tx.tagType === 'transfer' || tx.tag === '转账'));
      const rangeMatched = !txDate || (
        selectedRange === '月'
          ? txDate.getFullYear() === baseDate.getFullYear() && txDate.getMonth() === baseDate.getMonth()
          : selectedRange === '周'
            ? txDate >= weekStart && txDate <= weekEnd
            : isSameDay(txDate, baseDate)
      );
      const queryMatched = !keyword || [tx.title, tx.subtitle, tx.tag, tx.paymentMethod, tx.note]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
      return paymentMatched && typeMatched && rangeMatched && queryMatched;
    });
    const groupsMap = {};
    validTxs.forEach(tx => {
      if (!groupsMap[tx.dateLabel]) groupsMap[tx.dateLabel] = { dateLabel: tx.dateLabel, transactions: [], currency: 'AED' };
      groupsMap[tx.dateLabel].transactions.push(tx);
    });
    return Object.values(groupsMap).map(group => {
      const expense = group.transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/[^\d.]/g, '')), 0);
      const income = group.transactions.filter(t => t.isIncome).reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/[^\d.]/g, '')), 0);
      return {
        ...group,
        totalExpense: expense.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
        totalIncome: income.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
      };
    });
  }, [transactions, selectedFilter, selectedType, selectedRange, searchQuery, selectedMonth, selectedDate]);

  return (
    <div className="bg-[#f4f5f8] font-sans text-gray-900 pb-[24px] relative overflow-x-hidden animate-in fade-in duration-300">
      <div className="px-[16px] pt-[env(safe-area-inset-top,52px)] pb-[10px] flex items-center justify-between sticky top-0 z-[15] bg-[#f4f5f8]/95 backdrop-blur-sm">
        <div className="flex items-center space-x-[6px]"><LogoIcon /><span className="text-[20px] font-bold text-[#1c1c1e] italic tracking-tight" style={{fontFamily: 'Helvetica Neue, Arial, sans-serif'}}>BitLedger <span className="text-[#1677ff]">Pro</span></span></div>
        <div className="flex items-center space-x-[16px]">
          <button aria-label="搜索" onClick={() => notify(searchQuery ? `已搜索 ${searchQuery}` : '可在搜索框输入关键词')} className="active:opacity-60 transition-opacity"><Search className="w-[20px] h-[20px] text-[#1c1c1e]" strokeWidth={2} /></button>
          <button aria-label="消息中心" onClick={() => setIsMessageCenterOpen(true)} className="relative active:opacity-60 transition-opacity"><Bell className="w-[20px] h-[20px] text-[#1c1c1e]" strokeWidth={2} /><div className="absolute -top-[1px] right-[1px] w-[7px] h-[7px] bg-[#ff3b30] rounded-full border-[1.5px] border-[#f4f5f8]"></div></button>
          <ProfileAvatarButton onClick={() => notify('已打开个人中心')} />
        </div>
      </div>

      <div className="px-[16px] flex items-center justify-between space-x-[8px] mt-[4px] relative z-30">
        <div className="relative">
          <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`flex items-center space-x-[4px] h-[34px] px-[10px] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.02)] whitespace-nowrap active:scale-95 transition-all ${isCalendarOpen ? 'bg-[#f4f8ff] border border-[#1677ff] text-[#1677ff]' : 'bg-white border border-transparent text-[#1c1c1e]'}`}>
            <Calendar className={`w-[15px] h-[15px] ${isCalendarOpen ? 'text-[#1677ff]' : 'text-[#8e8e93]'}`} strokeWidth={2} /><span className="text-[13px] font-medium">{selectedMonthLabel}</span><ChevronDown className={`w-[13px] h-[13px] ${isCalendarOpen ? 'text-[#1677ff]' : 'text-[#8e8e93]'}`} strokeWidth={2.5} />
          </button>
          {isCalendarOpen && (
            <>
              <div className="fixed inset-0 z-[40]" onClick={() => setIsCalendarOpen(false)}></div>
              <div className="absolute top-[42px] left-0 w-[310px] bg-white rounded-[20px] p-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-[50] animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                <div className="absolute -top-[5px] left-[45px] w-[12px] h-[12px] bg-white transform rotate-45 border-t border-l border-[#f0f0f0] rounded-sm"></div>
                <div className="flex bg-[#f4f5f8] p-[3px] rounded-[10px] mb-[16px]">{['月', '年'].map((view) => <button key={view} onClick={() => { setCalendarView(view); notify(`日历已切换为${view}视图`); }} className={`flex-1 rounded-[8px] py-[6px] text-[14px] transition-all ${calendarView === view ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#1677ff] font-semibold' : 'text-[#8e8e93] font-medium active:bg-gray-200'}`}>{view}</button>)}</div>
                <div className="flex items-center justify-between mb-[14px] px-[8px]"><button aria-label="上个月" onClick={() => changeCalendarMonth(-1)} className="p-1 active:opacity-50"><ChevronLeft className="w-[18px] h-[18px] text-[#1677ff]" strokeWidth={2.5} /></button><span className="text-[15px] font-medium text-[#1c1c1e]">{selectedMonthLabel}</span><button aria-label="下个月" onClick={() => changeCalendarMonth(1)} className="p-1 active:opacity-50"><ChevronRight className="w-[18px] h-[18px] text-[#1677ff]" strokeWidth={2.5} /></button></div>
                <div className="grid grid-cols-7 text-center mb-[8px]">{['一', '二', '三', '四', '五', '六', '日'].map(d => (<div key={d} className="text-[12px] text-[#8e8e93] font-medium py-[4px]">{d}</div>))}</div>
                <div className="grid grid-cols-7 gap-y-[6px] text-center">
                    {BILLS_CALENDAR_DAYS.map((dayObj, i) => {
                      const isSelected = dayObj.type === 'curr' && dayObj.val === selectedDate;
                      return (<button key={i} onClick={() => { if(dayObj.type === 'curr') { setSelectedDate(dayObj.val); notify(`已选择 ${selectedMonthLabel}${dayObj.val}日`); } }} className="w-[32px] h-[32px] mx-auto flex items-center justify-center relative"><div className={`w-full h-full flex items-center justify-center rounded-full text-[15px] transition-all ${isSelected ? 'bg-[#1677ff] text-white font-semibold shadow-[0_2px_8px_rgba(22,119,255,0.4)]' : dayObj.type === 'curr' ? 'text-[#1c1c1e] hover:bg-[#f4f5f8] font-normal' : 'text-[#d1d1d6] font-normal'}`}>{dayObj.val}</div></button>);
                    })}
                </div>
                <div className="flex items-center justify-between mt-[16px] px-[4px]"><button onClick={() => { setSelectedDate(23); setSelectedMonth(4); notify('已回到今天'); }} className="text-[14px] text-[#1677ff] font-medium px-[8px] py-[4px] active:opacity-60">今天</button><button onClick={() => { setIsCalendarOpen(false); notify(`已选择 ${selectedMonthLabel}${selectedDate}日`); }} className="bg-[#1677ff] text-white px-[20px] py-[8px] rounded-[10px] text-[13px] font-semibold active:bg-[#1565d8] shadow-[0_2px_10px_rgba(22,119,255,0.2)]">确定</button></div>
              </div>
            </>
          )}
        </div>
        
        <div className="flex-1 flex items-center bg-white h-[34px] px-[10px] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.02)] cursor-text">
          <Search className="w-[15px] h-[15px] text-[#c7c7cc] mr-[6px]" strokeWidth={2} /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索账单、商家、备注" className="bg-transparent border-none outline-none text-[13px] text-[#1c1c1e] w-full placeholder-[#c7c7cc]"/>
        </div>

        <div className="relative">
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center space-x-[2px] h-[34px] px-[10px] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.02)] whitespace-nowrap active:scale-95 transition-all ${isFilterOpen || selectedFilter !== 'all' ? 'bg-[#f4f8ff] border border-[#1677ff] text-[#1677ff]' : 'bg-white border border-transparent text-[#1c1c1e]'}`}>
            <span className="text-[13px] font-medium">筛选</span><Filter className={`w-[13px] h-[13px] ${isFilterOpen || selectedFilter !== 'all' ? 'text-[#1677ff]' : 'text-[#1c1c1e]'}`} strokeWidth={2} />
          </button>
          {isFilterOpen && (
            <>
              <div className="fixed inset-0 z-[40]" onClick={() => setIsFilterOpen(false)}></div>
              <div className="absolute top-[42px] right-0 w-[210px] bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-[50] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                <div className="absolute -top-[5px] right-[18px] w-[12px] h-[12px] bg-white transform rotate-45 border-t border-l border-[#f0f0f0] rounded-sm"></div>
                <div className="relative bg-white rounded-[16px] overflow-hidden py-[8px]">
                  {BILLS_FILTER_OPTIONS.map((opt) => {
                    const isSelected = selectedFilter === opt.id;
                    return (
                      <button key={opt.id} onClick={() => { setSelectedFilter(opt.id); setIsFilterOpen(false); notify(`已筛选：${opt.name}`); }} className="w-full flex items-center justify-between px-[16px] py-[10px] hover:bg-[#f9f9f9] active:bg-[#f4f5f8] transition-colors text-left">
                        <div className="flex items-center space-x-[12px]">{opt.icon}<span className={`text-[14px] ${isSelected && opt.id === 'all' ? 'text-[#1c1c1e] font-semibold' : 'text-[#3a3a3c] font-medium'}`}>{opt.name}</span></div>
                        {isSelected && <Check className="w-[18px] h-[18px] text-[#1677ff]" strokeWidth={2.5} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-[16px] mt-[12px] flex items-center justify-between relative z-10">
        <div className="flex space-x-[6px]">
          {['全部', '支出', '收入', '理财', '转账'].map((item) => (<button key={item} onClick={() => { setSelectedType(item); notify(`已筛选${item}账单`); }} className={`whitespace-nowrap px-[12px] py-[5px] rounded-[8px] text-[13px] font-medium transition-all active:scale-95 ${selectedType === item ? 'bg-[#1677ff] text-white shadow-[0_2px_8px_rgba(22,119,255,0.2)]' : 'bg-white text-[#5c5c5e] shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:bg-gray-50'}`}>{item}</button>))}
        </div>
        <div className="flex bg-white rounded-[8px] p-[2px] shadow-[0_1px_4px_rgba(0,0,0,0.02)] shrink-0">
          {['日', '周', '月'].map((range) => (
            <button key={range} onClick={() => { setSelectedRange(range); notify(`账单周期已切换为${range}`); }} className={`w-[30px] py-[3px] text-[12px] transition-all rounded-[6px] ${selectedRange === range ? 'font-semibold text-[#1677ff] bg-[#f0f6ff]' : 'font-medium text-[#8e8e93] active:opacity-60 hover:text-gray-600'}`}>{range}</button>
          ))}
        </div>
      </div>

      <div className="px-[16px] mt-[16px] relative z-10">
        <div className="bg-white rounded-[20px] p-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex relative">
          <div className="flex-1 pr-[16px] relative">
            <div className="text-[11px] text-[#8e8e93] mb-[4px]">本月支出 (AED)</div><div className="text-[20px] font-bold text-[#ff3b30] mb-[6px] leading-none">7,109.71</div>
            <div className="flex items-center text-[10px]"><span className="text-[#8e8e93] mr-[4px]">较上月</span><span className="text-[#ff3b30] flex items-center font-medium"><ArrowUpRight className="w-[9px] h-[9px] mr-[1px]" strokeWidth={3} /> 13.2%</span></div>
            <button aria-label="查看支出账单" onClick={() => { setSelectedType('支出'); notify('已筛选支出账单'); }} className="absolute bottom-[2px] right-[12px] w-[24px] h-[24px] bg-[#fff0f0] rounded-[6px] flex items-center justify-center active:bg-red-100 transition-colors"><ArrowUpRight className="w-[16px] h-[16px] text-[#ff3b30] transform rotate-90" strokeWidth={2.5} /></button>
          </div>
          <div className="w-[1px] bg-[#f0f0f0] my-[2px]"></div>
          <div className="flex-1 pl-[20px] relative">
            <div className="text-[11px] text-[#8e8e93] mb-[4px]">本月收入 (AED)</div><div className="text-[20px] font-bold text-[#10b981] mb-[6px] leading-none">47,556.16</div>
            <div className="flex items-center text-[10px]"><span className="text-[#8e8e93] mr-[4px]">较上月</span><span className="text-[#10b981] flex items-center font-medium"><ArrowUpRight className="w-[9px] h-[9px] mr-[1px]" strokeWidth={3} /> 18.7%</span></div>
            <button aria-label="查看收入账单" onClick={() => { setSelectedType('收入'); notify('已筛选收入账单'); }} className="absolute bottom-[2px] right-[4px] w-[24px] h-[24px] bg-[#ecfdf5] rounded-[6px] flex items-center justify-center active:bg-emerald-100 transition-colors"><ArrowUpRight className="w-[16px] h-[16px] text-[#10b981]" strokeWidth={2.5} /></button>
          </div>
        </div>
      </div>

      <div className="px-[16px] mt-[16px] space-y-[16px] relative z-0">
        {filteredData.length === 0 ? (
           <div className="py-[40px] text-center text-[#8e8e93] text-[13px] bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">没有找到相关交易记录</div>
        ) : (
          filteredData.map((group, gIdx) => (
            <div key={gIdx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-end mb-[8px] px-[4px]">
                <div className="text-[13px] font-semibold text-[#3a3a3c]">{group.dateLabel}</div>
                <div className="flex space-x-[8px] text-[11px] text-[#8e8e93]"><span>支出 <span className="text-[#ff3b30] font-medium">{group.totalExpense}</span> <span className="text-[10px]">{group.currency}</span></span><span>收入 <span className="text-[#10b981] font-medium">{group.totalIncome}</span> <span className="text-[10px]">{group.currency}</span></span></div>
              </div>
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
                {group.transactions.map((tx, tIdx) => (
                  <button key={tx.id} onClick={() => handleOpenModal(tx)} className={`w-full grid grid-cols-[36px_1fr_40px_105px] gap-[10px] items-center px-[16px] py-[12px] bg-white active:bg-[#f9f9f9] transition-colors text-left ${tIdx !== group.transactions.length - 1 ? 'border-b border-[#f4f5f8]' : ''}`}>
                    <div className="w-[36px] h-[36px] flex items-center justify-center shrink-0">{getIconByString(tx.iconType)}</div>
                    <div className="flex flex-col min-w-0 pr-[4px]"><div className="text-[13px] font-medium text-[#1c1c1e] mb-[1px] truncate">{tx.title}</div><div className="text-[11px] text-[#8e8e93] truncate">{tx.subtitle}</div></div>
                    <div className="flex justify-center shrink-0"><Tag type={tx.tagType} text={tx.tag} /></div>
                    <div className="flex items-center justify-end space-x-[4px] min-w-0">
                      <div className="flex flex-col items-end min-w-0"><div className={`text-[13px] font-semibold mb-[1px] whitespace-nowrap ${tx.isIncome ? 'text-[#10b981]' : 'text-[#ff3b30]'}`}>{tx.amount} <span className="text-[10px] font-medium ml-[1px]">{tx.currency}</span></div><div className="text-[10px] text-[#8e8e93]">{tx.time}</div></div>
                      <ChevronRight className="w-[14px] h-[14px] text-[#c7c7cc] shrink-0" strokeWidth={2.5} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[4px] transition-opacity">
          <div className="w-full max-w-[430px] h-full relative flex items-center justify-center px-[24px]">
             <div className="bg-white w-full rounded-[24px] px-[20px] pb-[20px] pt-[16px] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <div className="absolute top-[10px] left-1/2 transform -translate-x-1/2 w-[36px] h-[4px] bg-[#e5e5ea] rounded-full"></div>
                <h3 className="text-[16px] font-bold text-[#1c1c1e] mt-[4px]">账单详情</h3>
                <button onClick={() => setSelectedTx(null)} className="absolute top-[18px] right-[16px] active:scale-90 transition-transform"><X className="w-[22px] h-[22px] text-[#3a3a3c]" strokeWidth={2} /></button>
                <div className="flex items-center mt-[24px] mb-[20px]"><div className="w-[48px] h-[48px] flex items-center justify-center shrink-0 overflow-hidden rounded-full">{getIconByString(selectedTx.iconType, 'large')}</div><div className="flex-1 ml-[12px] text-[15px] font-semibold text-[#1c1c1e] truncate">{selectedTx.title}</div><div className={`text-[16px] font-bold shrink-0 ml-[8px] ${selectedTx.isIncome ? 'text-[#10b981]' : 'text-[#ff3b30]'}`}>{selectedTx.amount} <span className="text-[12px] font-medium">{selectedTx.currency}</span></div></div>
                <div className="flex flex-col">
                   <div className="flex justify-between items-center py-[14px] border-b border-[#f4f5f8] border-dashed"><div className="flex items-center text-[#8e8e93]"><CreditCard className="w-[18px] h-[18px] mr-[8px]" strokeWidth={2} /><span className="text-[14px] font-medium text-[#5c5c5e]">账户</span></div><span className="text-[13px] font-medium text-[#1c1c1e]">{selectedTx.subtitle}</span></div>
                   <div className="flex justify-between items-center py-[14px] border-b border-[#f4f5f8] border-dashed"><div className="flex items-center text-[#8e8e93]"><TagIcon className="w-[18px] h-[18px] mr-[8px]" strokeWidth={2} /><span className="text-[14px] font-medium text-[#5c5c5e]">分类</span></div><Tag type={selectedTx.tagType} text={selectedTx.tag} /></div>
                   <div className="flex justify-between items-center py-[14px] border-b border-[#f4f5f8] border-dashed"><div className="flex items-center text-[#8e8e93]"><CalendarDays className="w-[18px] h-[18px] mr-[8px]" strokeWidth={2} /><span className="text-[14px] font-medium text-[#5c5c5e]">时间</span></div><span className="text-[13px] font-medium text-[#1c1c1e]">{selectedTx.fullDate}</span></div>
                </div>
                <div className="mt-[20px]">
                   <div className="text-[14px] font-bold text-[#1c1c1e] mb-[10px]">备注</div>
                   <div className="border-[1.5px] border-[#1677ff] rounded-[10px] px-[12px] py-[10px] flex items-center bg-white shadow-[0_0_0_4px_rgba(22,119,255,0.1)] transition-shadow">
                      <input type="text" value={tempNote} onChange={(e) => setTempNote(e.target.value)} className="flex-1 text-[14px] font-medium text-[#1c1c1e] outline-none bg-transparent placeholder-[#c7c7cc]" placeholder="添加备注..."/><Pen className="w-[16px] h-[16px] text-[#8e8e93] shrink-0 ml-[8px]" strokeWidth={2} />
                   </div>
                </div>
                <div className="flex space-x-[12px] mt-[24px]">
                   <button onClick={() => setSelectedTx(null)} className="flex-1 py-[12px] rounded-[12px] border border-[#e5e5ea] text-[#3a3a3c] text-[15px] font-semibold active:bg-[#f4f5f8] transition-colors">取消</button>
                   <button onClick={handleSave} className="flex-1 py-[12px] rounded-[12px] bg-[#1677ff] text-white text-[15px] font-semibold active:bg-[#1565d8] transition-colors shadow-[0_4px_12px_rgba(22,119,255,0.25)]">保存</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AssetsPage = ({ setIsMessageCenterOpen, accounts, notify, createAccount, updateAccount }) => {
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddExchangeModalOpen, setIsAddExchangeModalOpen] = useState(false);
  const [isAccountDetailModalOpen, setIsAccountDetailModalOpen] = useState(false);
  
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [assetRange, setAssetRange] = useState('30天');
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [accountBalance, setAccountBalance] = useState('');
  const [isAdjustOnly, setIsAdjustOnly] = useState(true);
  const [exchangeSelected, setExchangeSelected] = useState('OKX');
  const [apiConnected, setApiConnected] = useState(false);
  const [aprConfigEnabled, setAprConfigEnabled] = useState(true);
  const [aprValues, setAprValues] = useState({ limit: '0', baseRate: '0', overflowRate: '0' });
  const [exchangeAccountName, setExchangeAccountName] = useState('');

  const currenciesList = [
    { id: 'USDT', icon: <TetherIcon />, label: 'USDT' }, { id: 'BTC', icon: <BitcoinIcon />, label: 'BTC' },
    { id: 'ETH', icon: <EthereumIcon />, label: 'ETH' }, { id: 'CNY', icon: <CNYIcon />, label: 'CNY' },
  ];

  const handleOpenAccountDetail = (accountData) => { setSelectedAccount(accountData); setAccountBalance(accountData.balance.replace(/,/g, '')); setSelectedCurrency(accountData.currency || 'USDT'); setAprValues({ limit: accountData.apy_limit || '0', baseRate: accountData.apy_base_rate || '0', overflowRate: accountData.apy_overflow_rate || '0' }); setIsAccountDetailModalOpen(true); notify(`已打开 ${accountData.name}`); };
  const handleOpenAddExchange = (defaultExchange = 'OKX') => { setExchangeSelected(defaultExchange); setExchangeAccountName(`${defaultExchange} 现货账户`); setAccountBalance('0.00'); setSelectedCurrency('USDT'); setAprValues({ limit: '0', baseRate: '0', overflowRate: '0' }); setIsAddAccountModalOpen(false); setIsAddExchangeModalOpen(true); notify(`已选择 ${defaultExchange} 交易所账户`); };
  const handleOpenCustomAccount = (name, icon, currency = 'AED') => {
    const inferredType = name.includes('银行') ? 'bank' : name.includes('钱包') ? 'wallet' : name.includes('现金') ? 'cash' : name.includes('信用卡') ? 'bank' : 'other';
    const inferredIcon = name.includes('银行') ? 'landmark' : name.includes('钱包') ? 'wechat' : name.includes('现金') ? 'cash' : name.includes('信用卡') ? 'mastercard' : 'cash';
    setIsAddAccountModalOpen(false);
    setSelectedAccount({ name, sub: '新账户', balance: '0.00', currency, icon, type: inferredType, iconType: inferredIcon });
    setAccountBalance('0.00');
    setSelectedCurrency(currency);
    setAprValues({ limit: '0', baseRate: '0', overflowRate: '0' });
    setIsAccountDetailModalOpen(true);
    notify(`已创建${name}`);
  };

  const saveAccountDetail = async () => {
    if (!selectedAccount) return;
    const payload = {
      balance: Number(accountBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      currency: selectedCurrency,
      apy_limit: aprValues.limit || '0',
      apy_base_rate: aprValues.baseRate || '0',
      apy_overflow_rate: aprValues.overflowRate || '0'
    };
    if (selectedAccount.id) {
      await updateAccount(selectedAccount.id, payload);
    } else {
      await createAccount({
        name: selectedAccount.name,
        sub: selectedAccount.sub,
        type: selectedAccount.type || 'other',
        icon: selectedAccount.iconType || 'cash',
        ...payload
      });
    }
    setIsAccountDetailModalOpen(false);
  };

  const saveExchangeAccount = async () => {
    await createAccount({
      name: exchangeAccountName || `${exchangeSelected} 现货账户`,
      sub: "交易所账户",
      type: "exchange",
      balance: Number(accountBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      currency: selectedCurrency || 'USDT',
      icon: exchangeSelected.toLowerCase(),
      apy_limit: aprValues.limit || '0',
      apy_base_rate: aprValues.baseRate || '0',
      apy_overflow_rate: aprValues.overflowRate || '0'
    });
    setIsAddExchangeModalOpen(false);
  };

  // Calculate dynamic percentages
  const totalAssets = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance.replace(/,/g, '')), 0);
  const getPct = (type) => totalAssets === 0 ? '0.0' : ((accounts.filter(a => a.type === type).reduce((s, acc) => s + parseFloat(acc.balance.replace(/,/g, '')), 0) / totalAssets) * 100).toFixed(1);
  const getVal = (type) => accounts.filter(a => a.type === type).reduce((s, acc) => s + parseFloat(acc.balance.replace(/,/g, '')), 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const assetDistribution = [
    { name: '银行账户', pct: getPct('bank'), val: getVal('bank'), color: 'bg-[#1677ff]', stroke: '#1677ff' },
    { name: '交易所资产', pct: getPct('exchange'), val: getVal('exchange'), color: 'bg-[#7dd3fc]', stroke: '#7dd3fc' },
    { name: '电子钱包', pct: getPct('wallet'), val: getVal('wallet'), color: 'bg-[#a78bfa]', stroke: '#a78bfa' },
    { name: '现金', pct: getPct('cash'), val: getVal('cash'), color: 'bg-[#fcd34d]', stroke: '#fcd34d' },
    { name: '其他', pct: getPct('other'), val: getVal('other'), color: 'bg-[#d1d5db]', stroke: '#d1d5db' }
  ];

  const renderAccountSection = (title, icon, type, itemsPerSlide, spaceY) => {
    const filtered = accounts.filter(a => a.type === type);
    if(filtered.length === 0) return null;
    const total = filtered.reduce((sum, acc) => sum + parseFloat(acc.balance.replace(/,/g, '')), 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const chunks = chunkArray(filtered, itemsPerSlide);
    return (
      <div className="bg-white rounded-[16px] p-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col h-[145px] overflow-hidden">
         <div className="flex items-center justify-between border-b border-[#f4f5f8] pb-[8px] mb-[12px] shrink-0">
           <div className="flex items-center space-x-[4px]">{icon}<span className="text-[13px] font-bold text-[#3a3a3c]">{title}</span></div>
           <span className="text-[12px] font-semibold text-[#1677ff]">{total}</span>
         </div>
         <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar flex-1 w-full pb-[2px]">
            {chunks.map((chunk, chunkIdx) => (
              <div key={chunkIdx} className={`w-full flex-shrink-0 snap-center flex flex-col ${spaceY} ${chunkIdx > 0 ? 'pl-[8px]' : ''}`}>
                {chunk.map(acc => (
                  <AccountRow key={acc.id || acc.name} icon={getIconByString(acc.icon)} name={acc.name} balance={acc.balance} onClick={() => handleOpenAccountDetail({...acc, icon: getIconByString(acc.icon, 'large')})} />
                ))}
              </div>
            ))}
         </div>
      </div>
    );
  };

  return (
    <div className="bg-[#f4f5f8] font-sans text-gray-900 pb-[24px] relative overflow-x-hidden animate-in fade-in duration-300">
      <div className="px-[16px] pt-[env(safe-area-inset-top,52px)] pb-[10px] flex items-center justify-between sticky top-0 z-[15] bg-[#f4f5f8]/95 backdrop-blur-sm">
        <div className="flex items-center space-x-[6px]"><LogoIcon /><span className="text-[20px] font-bold text-[#1c1c1e] italic tracking-tight" style={{fontFamily: 'Helvetica Neue, Arial, sans-serif'}}>BitLedger <span className="text-[#1677ff]">Pro</span></span></div>
        <div className="flex items-center space-x-[16px]">
          <button aria-label="搜索" onClick={() => notify('已打开资产搜索')} className="active:opacity-60 transition-opacity"><Search className="w-[20px] h-[20px] text-[#1c1c1e]" strokeWidth={2} /></button>
          <button aria-label="消息中心" onClick={() => setIsMessageCenterOpen(true)} className="relative active:opacity-60 transition-opacity"><Bell className="w-[20px] h-[20px] text-[#1c1c1e]" strokeWidth={2} /><div className="absolute -top-[1px] right-[1px] w-[7px] h-[7px] bg-[#ff3b30] rounded-full border-[1.5px] border-[#f4f5f8]"></div></button>
          <ProfileAvatarButton onClick={() => notify('已打开个人中心')} />
        </div>
      </div>

      <div className="px-[16px] flex items-center justify-between mt-[6px]">
        <div className="flex items-center space-x-[6px]"><h1 className="text-[22px] font-bold text-[#1c1c1e]">资产</h1><Eye className="w-[18px] h-[18px] text-[#8e8e93]" strokeWidth={2} /></div>
        <button onClick={() => { setIsAddAccountModalOpen(true); notify('请选择账户类型'); }} className="flex items-center space-x-[4px] bg-[#1677ff] px-[12px] py-[6px] rounded-full active:scale-95 transition-transform shadow-[0_4px_10px_rgba(22,119,255,0.25)]"><Plus className="w-[14px] h-[14px] text-white" strokeWidth={2.5} /><span className="text-[13px] font-bold text-white">添加账户</span></button>
      </div>

      <div className="px-[16px] mt-[14px] space-y-[14px]">
        <div className="bg-white rounded-[20px] p-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div className="flex justify-between items-start mb-[2px]">
            <div className="flex items-center space-x-[4px] text-[#8e8e93]"><span className="text-[12px]">总资产 (估值)</span><Info className="w-[12px] h-[12px]" strokeWidth={2} /></div>
            <div className="flex bg-[#f4f5f8] rounded-[6px] p-[2px]">
              {['1天', '7天', '30天', '自定义'].map((range) => (
                <button key={range} onClick={() => { setAssetRange(range); notify(`资产周期已切换为${range}`); }} className={`px-[8px] py-[3px] text-[11px] rounded-[4px] transition-all ${assetRange === range ? 'font-semibold text-[#1677ff] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]' : 'font-medium text-[#8e8e93] active:opacity-60'}`}>{range}</button>
              ))}
            </div>
          </div>
          <div className="text-[32px] font-bold text-[#1c1c1e] tracking-tight leading-none mb-[8px]" style={{fontFamily: 'Helvetica Neue, Arial, sans-serif'}}>{totalAssets.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-[14px] font-semibold text-[#3a3a3c] ml-[2px]">AED</span></div>
          <div className="flex flex-col mb-[30px]"><div className="flex items-center space-x-[4px] text-[#8e8e93] mb-[2px]"><span className="text-[11px]">今日变化</span><Info className="w-[11px] h-[11px]" strokeWidth={2} /></div><div className="text-[13px] font-semibold text-[#10b981]">+7,718.23 AED (+6.34%)</div></div>
          <div className="absolute bottom-0 right-0 w-[65%] h-[85px] pointer-events-none">
            <svg viewBox="0 0 200 85" className="w-full h-full" preserveAspectRatio="none">
              <defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1677ff" stopOpacity="0.15" /><stop offset="100%" stopColor="#1677ff" stopOpacity="0" /></linearGradient></defs>
              <path d="M-10,75 C10,65 30,55 50,65 C70,75 90,45 110,55 C130,65 150,20 170,30 C185,38 195,15 210,5 L210,85 L-10,85 Z" fill="url(#chartGrad)" /><path d="M-10,75 C10,65 30,55 50,65 C70,75 90,45 110,55 C130,65 150,20 170,30 C185,38 195,15 210,5" fill="none" stroke="#1677ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-[16px]"><span className="text-[14px] font-bold text-[#1c1c1e]">资产分布 <span className="text-[11px] font-normal text-[#8e8e93]">(占比)</span></span><button onClick={() => accounts[0] ? handleOpenAccountDetail({...accounts[0], icon: getIconByString(accounts[0].icon, 'large')}) : notify('暂无账户详情')} className="flex items-center text-[12px] text-[#8e8e93] active:opacity-60 transition-opacity">查看详情 <ChevronRight className="w-[14px] h-[14px] ml-[2px]" strokeWidth={2.5}/></button></div>
          <div className="flex items-center justify-between">
            <div className="w-[110px] h-[110px] relative shrink-0"><AssetsDonutChart percentages={assetDistribution} /><div className="absolute inset-0 flex flex-col items-center justify-center pt-[2px]"><span className="text-[11px] font-bold text-[#1c1c1e] tracking-tight">{totalAssets.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span><span className="text-[9px] font-semibold text-[#8e8e93]">AED</span></div></div>
            <div className="flex-1 ml-[16px] flex flex-col space-y-[8px]">
               {assetDistribution.filter(a => a.val !== "0.00 AED").map((item, i) => (
                 <div key={i} className="grid grid-cols-[10px_64px_34px_1fr] items-center gap-[4px]"><div className={`w-[6px] h-[6px] rounded-full ${item.color}`}></div><span className="text-[11px] text-[#5c5c5e] whitespace-nowrap">{item.name}</span><span className="text-[11px] text-[#8e8e93] text-right">{item.pct}%</span><span className="text-[11px] font-medium text-[#3a3a3c] text-right whitespace-nowrap">{item.val}</span></div>
               ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[12px]">
          {renderAccountSection('银行账户', <Landmark className="w-[14px] h-[14px] text-[#1677ff]" strokeWidth={2.5} />, 'bank', 2, 'space-y-[14px]')}
          {renderAccountSection('电子钱包', <Wallet className="w-[14px] h-[14px] text-[#1677ff]" strokeWidth={2.5} />, 'wallet', 2, 'space-y-[14px]')}
          {renderAccountSection('交易所资产', <ArrowRightLeft className="w-[14px] h-[14px] text-[#1677ff]" strokeWidth={2.5} />, 'exchange', 3, 'space-y-[10px]')}
          {renderAccountSection('现金', <Banknote className="w-[14px] h-[14px] text-[#1677ff]" strokeWidth={2.5} />, 'cash', 2, 'space-y-[14px]')}
        </div>

        <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden mt-[16px]">
          <div className="flex justify-between items-center p-[16px] pb-[8px]"><span className="text-[14px] font-bold text-[#1c1c1e]">最近变动</span><button onClick={() => notify('已查看全部资产变动')} className="flex items-center text-[12px] text-[#8e8e93] active:opacity-60 transition-opacity">查看全部 <ChevronRight className="w-[14px] h-[14px] ml-[2px]" strokeWidth={2.5} /></button></div>
          <div className="flex flex-col">
            <button onClick={() => notify('已打开 Mashreq Bank 变动')} className="w-full flex items-center px-[16px] py-[12px] border-b border-[#f4f5f8] bg-white cursor-pointer active:bg-[#f9f9f9] transition-colors text-left">
              <div className="w-[36px] h-[36px] flex items-center justify-center shrink-0"><BrandLogo type="mashreq" size={36} /></div>
              <div className="flex-1 flex flex-col justify-center ml-[12px] py-[2px]">
                 <div className="flex justify-between items-center"><span className="text-[14px] font-bold text-[#1c1c1e] truncate">Mashreq Bank</span><div className="grid grid-cols-[70px_40px_60px] gap-0 items-center shrink-0"><span className="text-[14px] font-bold text-[#10b981] text-right tracking-tight">+5,000.00</span><span className="text-[11px] font-medium text-[#8e8e93] text-center">AED</span><span className="text-[11px] font-medium text-[#8e8e93] text-right">今天 09:23</span></div></div>
                 <div className="text-[11px] font-medium text-[#8e8e93] mt-[1px]">存款</div>
              </div>
            </button>
            <button onClick={() => notify('已打开微信到支付宝变动')} className="w-full flex items-center px-[16px] py-[12px] border-b border-[#f4f5f8] bg-white cursor-pointer active:bg-[#f9f9f9] transition-colors text-left">
              <div className="w-[36px] h-[36px] flex items-center justify-center shrink-0"><BrandLogo type="wechat" size={36} /></div>
              <div className="flex-1 flex flex-col justify-center ml-[12px] py-[2px]">
                 <div className="flex justify-between items-center"><span className="text-[14px] font-bold text-[#1c1c1e] truncate">微信 → 支付宝</span><div className="grid grid-cols-[70px_40px_60px] gap-0 items-center shrink-0"><span className="text-[14px] font-bold text-[#ff3b30] text-right tracking-tight">-200.00</span><span className="text-[11px] font-medium text-[#8e8e93] text-center">CNY</span><span className="text-[11px] font-medium text-[#8e8e93] text-right">今天 08:45</span></div></div>
                 <div className="text-[11px] font-medium text-[#8e8e93] mt-[1px]">转入支付宝</div>
              </div>
            </button>
            <button onClick={() => notify('已打开 OKX 变动')} className="w-full flex items-center px-[16px] py-[12px] border-b border-[#f4f5f8] bg-white cursor-pointer active:bg-[#f9f9f9] transition-colors text-left">
              <div className="w-[36px] h-[36px] flex items-center justify-center shrink-0"><BrandLogo type="okx" size={36} /></div>
              <div className="flex-1 flex flex-col justify-center ml-[12px] py-[2px]">
                 <div className="flex justify-between items-center"><span className="text-[14px] font-bold text-[#1c1c1e] truncate">OKX</span><div className="grid grid-cols-[70px_40px_60px] gap-0 items-center shrink-0"><span className="text-[14px] font-bold text-[#10b981] text-right tracking-tight">+28.74</span><span className="text-[11px] font-medium text-[#8e8e93] text-center">USDT</span><span className="text-[11px] font-medium text-[#8e8e93] text-right">昨天 22:16</span></div></div>
                 <div className="text-[11px] font-medium text-[#8e8e93] mt-[1px]">现货交易收益</div>
              </div>
            </button>
            <button onClick={() => notify('已打开币安变动')} className="w-full flex items-center px-[16px] py-[12px] bg-white cursor-pointer active:bg-[#f9f9f9] transition-colors text-left">
              <div className="w-[36px] h-[36px] flex items-center justify-center shrink-0"><BrandLogo type="binance" size={36} /></div>
              <div className="flex-1 flex flex-col justify-center ml-[12px] py-[2px]">
                 <div className="flex justify-between items-center"><span className="text-[14px] font-bold text-[#1c1c1e] truncate">币安</span><div className="grid grid-cols-[70px_40px_60px] gap-0 items-center shrink-0"><span className="text-[14px] font-bold text-[#10b981] text-right tracking-tight">+500.00</span><span className="text-[11px] font-medium text-[#8e8e93] text-center">USDT</span><span className="text-[11px] font-medium text-[#8e8e93] text-right">昨天 20:35</span></div></div>
                 <div className="text-[11px] font-medium text-[#8e8e93] mt-[1px]">充值</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-[120] flex justify-center items-center px-[20px]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity" onClick={() => setIsAddAccountModalOpen(false)}></div>
          <div className="relative w-full max-w-[390px] bg-white rounded-[24px] p-[20px] shadow-2xl animate-in zoom-in-95 fade-in duration-200 ease-out">
            <div className="flex justify-between items-center mb-[20px]"><h2 className="text-[18px] font-bold text-[#1c1c1e]">添加账户</h2><button onClick={() => setIsAddAccountModalOpen(false)} className="w-[28px] h-[28px] flex items-center justify-center rounded-full active:bg-[#f0f0f0] transition-colors"><X className="w-[20px] h-[20px] text-[#5c5c5e]" strokeWidth={2} /></button></div>
            <div className="mb-[24px]">
              <h3 className="text-[14px] font-bold text-[#5c5c5e] mb-[12px]">选择账户类型</h3>
              <div className="grid grid-cols-2 gap-[10px]">
                <button onClick={() => handleOpenCustomAccount('银行账户', <Landmark className="w-[24px] h-[24px] text-[#1677ff]" strokeWidth={2.5} />)} className="border border-[#f0f0f0] rounded-[12px] py-[12px] flex items-center justify-center space-x-[6px] active:bg-[#f9f9f9] transition-colors cursor-pointer"><Landmark className="w-[16px] h-[16px] text-[#1677ff]" strokeWidth={2.5}/><span className="text-[13px] font-medium text-[#1c1c1e]">银行账户</span></button>
                <button onClick={() => handleOpenAddExchange()} className="border border-[#f0f0f0] rounded-[12px] py-[12px] flex items-center justify-center space-x-[6px] active:bg-[#f9f9f9] transition-colors cursor-pointer"><BrandLogo type="okx" size={16} /><span className="text-[13px] font-medium text-[#1c1c1e]">交易所账户</span></button>
                <button onClick={() => handleOpenCustomAccount('电子钱包', <Wallet className="w-[24px] h-[24px] text-[#10b981]" strokeWidth={2.5} />)} className="border border-[#f0f0f0] rounded-[12px] py-[12px] flex items-center justify-center space-x-[6px] active:bg-[#f9f9f9] transition-colors cursor-pointer"><Wallet className="w-[16px] h-[16px] text-[#10b981]" strokeWidth={2.5}/><span className="text-[13px] font-medium text-[#1c1c1e]">电子钱包</span></button>
                <button onClick={() => handleOpenCustomAccount('现金账户', <Banknote className="w-[24px] h-[24px] text-[#22c55e]" strokeWidth={2.5} />)} className="border border-[#f0f0f0] rounded-[12px] py-[12px] flex items-center justify-center space-x-[6px] active:bg-[#f9f9f9] transition-colors cursor-pointer"><Banknote className="w-[16px] h-[16px] text-[#22c55e]" strokeWidth={2.5}/><span className="text-[13px] font-medium text-[#1c1c1e]">现金账户</span></button>
                <button onClick={() => handleOpenCustomAccount('信用卡', <CreditCard className="w-[24px] h-[24px] text-[#8b5cf6]" strokeWidth={2.5} />)} className="border border-[#f0f0f0] rounded-[12px] py-[12px] flex items-center justify-center space-x-[6px] active:bg-[#f9f9f9] transition-colors cursor-pointer"><CreditCard className="w-[16px] h-[16px] text-[#8b5cf6]" strokeWidth={2.5}/><span className="text-[13px] font-medium text-[#1c1c1e]">信用卡</span></button>
                <button onClick={() => handleOpenCustomAccount('其他账户', <div className="w-[24px] h-[24px] bg-[#c7c7cc] rounded-full flex items-center justify-center"><MoreHorizontal className="w-[16px] h-[16px] text-white" strokeWidth={3}/></div>)} className="border border-[#f0f0f0] rounded-[12px] py-[12px] flex items-center justify-center space-x-[6px] active:bg-[#f9f9f9] transition-colors cursor-pointer"><div className="w-[16px] h-[16px] bg-[#c7c7cc] rounded-full flex items-center justify-center"><MoreHorizontal className="w-[12px] h-[12px] text-white" strokeWidth={3}/></div><span className="text-[13px] font-medium text-[#1c1c1e]">其他账户</span></button>
              </div>
            </div>
            <div className="mb-[20px]">
              <h3 className="text-[14px] font-bold text-[#5c5c5e] mb-[8px]">快速添加</h3>
              <div className="flex flex-col">
                <QuickAddRow icon={<BrandLogo type="okx" size={24} />} name="OKX" type="交易所账户" onClick={() => handleOpenAddExchange('OKX')} />
                <QuickAddRow icon={<BrandLogo type="binance" size={24} />} name="币安 Binance" type="交易所账户" onClick={() => handleOpenAddExchange('Binance')} />
                <QuickAddRow icon={<BrandLogo type="bybit" size={24} />} name="Bybit" type="交易所账户" onClick={() => handleOpenAddExchange('Bybit')} />
                <QuickAddRow icon={<BrandLogo type="alipay" size={24} />} name="支付宝" type="电子钱包" onClick={() => handleOpenCustomAccount('支付宝', <BrandLogo type="alipay" size={24} />, 'CNY')} />
                <QuickAddRow icon={<BrandLogo type="wechat" size={24} />} name="微信钱包" type="电子钱包" onClick={() => handleOpenCustomAccount('微信钱包', <BrandLogo type="wechat" size={24} />, 'CNY')} />
              </div>
            </div>
            <button onClick={() => handleOpenCustomAccount('自定义账户', <MoreHorizontal className="w-[24px] h-[24px] text-[#8e8e93]" strokeWidth={2.5} />)} className="w-full py-[14px] bg-[#f0f6ff] rounded-[14px] text-[15px] font-bold text-[#1677ff] active:bg-[#e6f0ff] transition-colors mt-[4px]">自定义账户</button>
          </div>
        </div>
      )}

      {isAddExchangeModalOpen && (
        <div className="fixed inset-0 z-[130] flex justify-center items-center px-[20px]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity" onClick={() => setIsAddExchangeModalOpen(false)}></div>
          <div className="relative w-full max-w-[390px] max-h-[90vh] bg-white rounded-[24px] flex flex-col shadow-2xl animate-in zoom-in-95 fade-in duration-200 ease-out">
            <div className="px-[20px] pt-[20px] pb-[16px] flex justify-between items-center shrink-0 border-b border-transparent"><div className="w-[28px]"></div><h2 className="text-[17px] font-bold text-[#1c1c1e]">添加交易所账户</h2><button onClick={() => setIsAddExchangeModalOpen(false)} className="w-[28px] h-[28px] flex items-center justify-center rounded-full active:bg-[#f0f0f0] transition-colors"><X className="w-[20px] h-[20px] text-[#5c5c5e]" strokeWidth={2} /></button></div>
            <div className="px-[20px] overflow-y-auto hide-scrollbar flex-1 pb-[10px]">
              <div className="mb-[24px]">
                <h3 className="text-[13px] font-bold text-[#5c5c5e] mb-[10px]">选择交易所</h3>
                <div className="grid grid-cols-3 gap-[8px]">
                   {[{ id: 'OKX', icon: <BrandLogo type="okx" size={20} />, name: 'OKX' },{ id: 'Binance', icon: <BrandLogo type="binance" size={20} />, name: '币安 Binance' },{ id: 'Bybit', icon: <BrandLogo type="bybit" size={20} />, name: 'Bybit' },{ id: 'Bitget', icon: <BrandLogo type="bitget" size={20} />, name: 'Bitget' },{ id: 'Gateio', icon: <BrandLogo type="gateio" size={20} />, name: 'Gate.io' },{ id: 'KuCoin', icon: <BrandLogo type="kucoin" size={20} />, name: 'KuCoin' },{ id: 'MEXC', icon: <BrandLogo type="mexc" size={20} />, name: 'MEXC' },{ id: 'HTX', icon: <BrandLogo type="huobi" size={20} />, name: 'HTX 火币' },{ id: 'Other', icon: <div className="w-[20px] h-[20px] bg-[#e5e5ea] rounded-full flex items-center justify-center shrink-0"><MoreHorizontal className="w-[12px] h-[12px] text-[#8e8e93]" strokeWidth={3}/></div>, name: '其他交易所' },].map(ex => {
                     const isSelected = exchangeSelected === ex.id;
                     return (<button key={ex.id} onClick={() => { setExchangeSelected(ex.id); notify(`已选择 ${ex.name}`); }} className={`relative rounded-[10px] py-[10px] px-[8px] flex flex-row items-center space-x-[6px] cursor-pointer transition-colors border text-left ${isSelected ? 'border-[#1677ff] bg-[#f0f6ff]' : 'border-[#f0f0f0] active:bg-[#f9f9f9]'}`}>{ex.icon}<span className={`text-[12px] whitespace-nowrap overflow-hidden text-ellipsis ${isSelected ? 'font-bold text-[#1c1c1e]' : 'font-medium text-[#5c5c5e]'}`}>{ex.name}</span>{isSelected && (<div className="absolute -top-[1.5px] -right-[1.5px] w-[18px] h-[18px] bg-[#1677ff] rounded-bl-[8px] rounded-tr-[8px] flex items-center justify-center shadow-sm"><Check className="w-[12px] h-[12px] text-white" strokeWidth={3.5} /></div>)}</button>)
                   })}
                </div>
              </div>
              <div className="mb-[24px]">
                <h3 className="text-[13px] font-bold text-[#5c5c5e] mb-[10px]">账户信息</h3>
                <div className="mb-[14px]"><label className="text-[12px] text-[#8e8e93] block mb-[6px] ml-[2px]">账户名称</label><input type="text" value={exchangeAccountName} onChange={(e) => setExchangeAccountName(e.target.value)} placeholder="例如：OKX 现货账户" className="w-full border border-[#f0f0f0] rounded-[12px] px-[14px] py-[12px] text-[15px] font-medium text-[#1c1c1e] outline-none placeholder:text-[#c7c7cc] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 transition-all"/></div>
                <div><label className="text-[12px] text-[#8e8e93] block mb-[6px] ml-[2px]">账户类型</label><button onClick={() => notify('已选择现货账户')} className="w-full border border-[#f0f0f0] rounded-[12px] px-[14px] py-[12px] flex justify-between items-center bg-white cursor-pointer active:bg-[#f9f9f9] transition-colors"><span className="text-[15px] font-medium text-[#1c1c1e]">现货账户</span><ChevronDown className="w-[16px] h-[16px] text-[#c7c7cc]" strokeWidth={2} /></button></div>
              </div>
              <div className="mb-[24px] flex items-center justify-between border-b border-[#f4f5f8] pb-[20px]"><div className="flex flex-col pr-[16px]"><h3 className="text-[13px] font-bold text-[#5c5c5e] mb-[4px]">API 连接 <span className="text-[#8e8e93] font-normal">(可选)</span></h3><span className="text-[11px] text-[#8e8e93]">连接 API 后可自动同步余额与交易记录</span></div><ToggleSwitch checked={apiConnected} onChange={() => setApiConnected(!apiConnected)} /></div>
              <div className="mb-[24px]">
                <h3 className="text-[13px] font-bold text-[#5c5c5e] mb-[10px]">选择货币</h3>
                <div><label className="text-[12px] text-[#8e8e93] block mb-[6px] ml-[2px]">计价货币</label><button onClick={() => notify('已选择 AED 计价货币')} className="w-full border border-[#f0f0f0] rounded-[12px] px-[14px] py-[12px] flex justify-between items-center bg-white cursor-pointer active:bg-[#f9f9f9] transition-colors"><span className="text-[15px] font-medium text-[#1c1c1e]">AED - 阿联酋迪拉姆</span><ChevronDown className="w-[16px] h-[16px] text-[#c7c7cc]" strokeWidth={2} /></button></div>
              </div>
              <div className="mb-[8px]">
                <div className="flex items-center justify-between mb-[16px]"><div className="flex flex-col"><h3 className="text-[13px] font-bold text-[#5c5c5e] mb-[4px]">APR 配置 <span className="text-[#8e8e93] font-normal">(可选)</span></h3><span className="text-[11px] text-[#8e8e93]">配置后将用于收益计算与统计</span></div><ToggleSwitch checked={aprConfigEnabled} onChange={() => setAprConfigEnabled(!aprConfigEnabled)} /></div>
                <div className={`space-y-[14px] overflow-hidden transition-all duration-300 ${aprConfigEnabled ? 'opacity-100 max-h-[400px]' : 'opacity-0 max-h-0'}`}>
                  <div><div className="flex items-center space-x-[4px] mb-[6px] ml-[2px]"><label className="text-[12px] font-medium text-[#5c5c5e]">高息限额</label><Info className="w-[12px] h-[12px] text-[#c7c7cc]" strokeWidth={2} /></div><div className="relative"><input type="text" value={aprValues.limit} onChange={(e) => setAprValues((prev) => ({ ...prev, limit: e.target.value }))} placeholder="0" className="w-full border border-[#f0f0f0] rounded-[12px] pl-[14px] pr-[40px] py-[12px] text-[15px] font-medium text-[#1c1c1e] outline-none placeholder:text-[#c7c7cc] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 transition-all"/><span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#8e8e93]">{selectedCurrency}</span></div><span className="text-[11px] text-[#8e8e93] block mt-[6px] ml-[2px]">超过该金额后按超出利率计算</span></div>
                  <div><label className="text-[12px] font-medium text-[#5c5c5e] block mb-[6px] ml-[2px]">基础利率 (APR)</label><div className="relative"><input type="text" value={aprValues.baseRate} onChange={(e) => setAprValues((prev) => ({ ...prev, baseRate: e.target.value }))} placeholder="0" className="w-full border border-[#f0f0f0] rounded-[12px] pl-[14px] pr-[30px] py-[12px] text-[15px] font-medium text-[#1c1c1e] outline-none placeholder:text-[#c7c7cc] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 transition-all"/><span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#8e8e93]">%</span></div></div>
                  <div><label className="text-[12px] font-medium text-[#5c5c5e] block mb-[6px] ml-[2px]">超出利率 (APR)</label><div className="relative"><input type="text" value={aprValues.overflowRate} onChange={(e) => setAprValues((prev) => ({ ...prev, overflowRate: e.target.value }))} placeholder="0" className="w-full border border-[#f0f0f0] rounded-[12px] pl-[14px] pr-[30px] py-[12px] text-[15px] font-medium text-[#1c1c1e] outline-none placeholder:text-[#c7c7cc] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 transition-all"/><span className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#8e8e93]">%</span></div></div>
                </div>
              </div>
            </div>
            <div className="px-[20px] pb-[20px] pt-[12px] bg-white rounded-b-[24px] shrink-0 border-t border-[#f4f5f8]"><button onClick={saveExchangeAccount} className="w-full py-[14px] rounded-[14px] text-[16px] font-bold text-white bg-[#1677ff] active:bg-[#0f60d6] transition-colors shadow-[0_4px_12px_rgba(22,119,255,0.25)]">添加账户</button></div>
          </div>
        </div>
      )}

      {isAccountDetailModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity" onClick={() => setIsAccountDetailModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-[430px] rounded-t-[24px] pb-[32px] pt-[8px] px-[20px] shadow-2xl animate-in slide-in-from-bottom-8 duration-300 ease-out">
            <div className="w-full flex justify-center mb-[16px]"><div className="w-[32px] h-[4px] bg-[#e5e5ea] rounded-full"></div></div>
            <div className="flex items-start justify-between mb-[24px]">
               <div className="flex items-center space-x-[14px]"><div className="w-[48px] h-[48px] flex items-center justify-center bg-[#f4f5f8] rounded-full overflow-hidden shrink-0">{selectedAccount.icon}</div><div className="flex flex-col justify-center"><h2 className="text-[18px] font-bold text-[#1c1c1e] leading-tight mb-[4px]">{selectedAccount.name}</h2><span className="text-[13px] text-[#8e8e93] font-medium">{selectedAccount.sub}</span></div></div>
               <button onClick={() => setIsAccountDetailModalOpen(false)} className="w-[30px] h-[30px] bg-[#f4f5f8] rounded-full flex items-center justify-center hover:bg-[#e5e5ea] transition-colors shrink-0"><X className="w-[16px] h-[16px] text-[#5c5c5e]" strokeWidth={2.5} /></button>
            </div>
            <div className="mb-[24px]">
               <h3 className="text-[15px] font-bold text-[#1c1c1e] mb-[12px]">1. 币种</h3>
               <div className="flex overflow-x-auto hide-scrollbar space-x-[12px] pb-[4px]">
                  {currenciesList.map((currency) => {
                    const isSelected = selectedCurrency === currency.id;
                    return (<button key={currency.id} onClick={() => { setSelectedCurrency(currency.id); notify(`币种已切换为 ${currency.label}`); }} className={`relative rounded-[10px] px-[16px] py-[10px] flex items-center space-x-[8px] cursor-pointer shrink-0 transition-colors ${isSelected ? 'border-2 border-[#1677ff] bg-[#f0f6ff]' : 'border border-[#e5e5ea] hover:bg-[#f9f9f9]'}`}>{currency.icon}<span className={`text-[15px] ${isSelected ? 'font-bold text-[#1c1c1e]' : 'font-medium text-[#5c5c5e]'}`}>{currency.label}</span>{isSelected && (<div className="absolute -top-[1.5px] -right-[1.5px] w-[22px] h-[22px] bg-[#1677ff] rounded-bl-[10px] rounded-tr-[8px] flex items-center justify-center shadow-sm"><Check className="w-[14px] h-[14px] text-white" strokeWidth={3} /></div>)}</button>);
                  })}
               </div>
            </div>
            <div className="mb-[24px]">
               <h3 className="text-[15px] font-bold text-[#1c1c1e] mb-[12px]">2. 余额</h3>
               <div className="border border-[#e5e5ea] rounded-[14px] p-[12px] flex flex-col relative focus-within:border-[#1677ff] focus-within:ring-1 focus-within:ring-[#1677ff]/20 transition-all">
                  <span className="text-[12px] text-[#8e8e93] mb-[2px]">余额 ({selectedCurrency})</span>
                  <div className="flex items-center justify-between"><input type="text" value={accountBalance} onChange={(e) => setAccountBalance(e.target.value)} className="text-[22px] font-bold text-[#1c1c1e] w-full outline-none bg-transparent"/>{accountBalance && <button onClick={() => setAccountBalance('')} className="p-[4px]"><ClearInputIcon /></button>}</div>
               </div>
               <p className="text-[12px] text-[#8e8e93] mt-[8px] ml-[2px]">当前可用余额，请输入数字，最多 8 位小数</p>
               <div className="flex items-center justify-between mt-[16px]"><span className="text-[14px] font-medium text-[#1c1c1e]">仅调整余额，不计入收支</span><ToggleSwitch checked={isAdjustOnly} onChange={() => setIsAdjustOnly(!isAdjustOnly)} /></div>
            </div>
            <div className="mb-[32px]">
               <div className="flex items-center space-x-[6px] mb-[12px]"><h3 className="text-[15px] font-bold text-[#1c1c1e]">3. APY 配置</h3><Info className="w-[14px] h-[14px] text-[#c7c7cc]" strokeWidth={2} /></div>
               <div className="grid grid-cols-3 gap-[8px]">
                  <div className="border border-[#f0f0f0] rounded-[12px] p-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]"><div className="text-[12px] font-medium text-[#5c5c5e] mb-[8px]">高息限额</div><div className="relative mb-[8px]"><input type="text" value={aprValues.limit} onChange={(e) => setAprValues((prev) => ({ ...prev, limit: e.target.value }))} className="w-full bg-transparent text-[17px] font-bold text-[#1c1c1e] outline-none pr-[34px]" placeholder="0" /><span className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#8e8e93]">{selectedCurrency}</span></div><div className="text-[10px] text-[#8e8e93] leading-tight transform scale-95 origin-left">享受高息的上限额度</div></div>
                  <div className="border border-[#f0f0f0] rounded-[12px] p-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]"><div className="text-[12px] font-medium text-[#5c5c5e] mb-[8px]">基础利率</div><div className="relative mb-[8px]"><input type="text" value={aprValues.baseRate} onChange={(e) => setAprValues((prev) => ({ ...prev, baseRate: e.target.value }))} className="w-full bg-transparent text-[17px] font-bold text-[#1c1c1e] outline-none pr-[20px]" placeholder="0" /><span className="absolute right-0 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#8e8e93]">%</span></div><div className="text-[10px] text-[#8e8e93] leading-tight transform scale-95 origin-left">限额内的年化利率</div></div>
                  <div className="border border-[#f0f0f0] rounded-[12px] p-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]"><div className="text-[12px] font-medium text-[#5c5c5e] mb-[8px]">超出利率</div><div className="relative mb-[8px]"><input type="text" value={aprValues.overflowRate} onChange={(e) => setAprValues((prev) => ({ ...prev, overflowRate: e.target.value }))} className="w-full bg-transparent text-[17px] font-bold text-[#1c1c1e] outline-none pr-[20px]" placeholder="0" /><span className="absolute right-0 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#8e8e93]">%</span></div><div className="text-[10px] text-[#8e8e93] leading-tight transform scale-95 origin-left">超出部分的年化利率</div></div>
               </div>
            </div>
            <div className="flex space-x-[12px] pb-[8px]">
               <button onClick={() => setIsAccountDetailModalOpen(false)} className="w-[120px] py-[14px] border border-[#e5e5ea] rounded-[14px] text-[16px] font-bold text-[#5c5c5e] bg-white active:bg-gray-50 transition-colors">取消</button>
               <button onClick={saveAccountDetail} className="flex-1 py-[14px] rounded-[14px] text-[16px] font-bold text-white bg-[#1677ff] active:bg-[#0f60d6] transition-colors shadow-[0_4px_12px_rgba(22,119,255,0.25)]">保存修改</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. MAIN APP CONTAINER
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
  const { accounts, transactions, loading, updateTransaction, createTransaction, createAccount, updateAccount } = useSupabaseData();

  const notify = () => {};

  useEffect(() => {
    const metas = [
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
    ];
    metas.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        html, body, #root { 
          width: 100vw; height: 100%; min-height: 100dvh; min-height: -webkit-fill-available; overflow: hidden; 
          overscroll-behavior: none; 
          background-color: #fdfdfd;
          -webkit-font-smoothing: antialiased;
        }
        .app-container {
          background-color: #f4f5f8;
          width: 100%; max-width: 430px; height: 100dvh; min-height: 100dvh; min-height: -webkit-fill-available; max-height: 100%; margin: 0 auto;
          position: relative; overflow: hidden; display: flex; flex-direction: column;
          overscroll-behavior: none;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .scroll-area { 
          overflow-y: auto; overflow-x: hidden; touch-action: pan-y; -webkit-overflow-scrolling: touch; 
          flex: 1 1 auto; min-height: 0; position: relative; z-index: 10;
          overscroll-behavior-y: none; overscroll-behavior-x: none;
        }
        @media (min-width: 431px) {
          html, body, #root { background-color: #000; }
        }
        @media all and (display-mode: standalone) {
          html, body, #root, .app-container {
            height: 100vh;
            min-height: 100vh;
          }
        }
      `}} />

      <div className="app-container shadow-2xl">
        <div className="scroll-area hide-scrollbar">
            {loading ? (
              <div className="flex w-full h-full items-center justify-center text-[#8e8e93] text-[14px]">正在同步数据...</div>
            ) : (
              <>
                {activeTab === 'home' && <RebuiltHomePage setIsMessageCenterOpen={setIsMessageCenterOpen} transactions={transactions} createTransaction={createTransaction} onOpenBills={() => setActiveTab('bills')} />}
                {activeTab === 'bills' && <BillsPage setIsMessageCenterOpen={setIsMessageCenterOpen} transactions={transactions} updateTransaction={updateTransaction} notify={notify} />}
                {activeTab === 'stats' && <StatsPage setIsMessageCenterOpen={setIsMessageCenterOpen} transactions={transactions} notify={notify} />}
                {activeTab === 'assets' && <AssetsPage setIsMessageCenterOpen={setIsMessageCenterOpen} accounts={accounts} notify={notify} createAccount={createAccount} updateAccount={updateAccount} />}
              </>
            )}
        </div>
        
        <MessageCenterModal isOpen={isMessageCenterOpen} onClose={() => setIsMessageCenterOpen(false)} notify={notify} />
        <GlobalTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </>
  );
}
