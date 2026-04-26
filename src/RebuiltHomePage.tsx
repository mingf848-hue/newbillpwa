// @ts-nocheck
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Search, Bell, Calendar as CalendarIcon, ChevronDown, Eye, ArrowUpRight,
  PenLine, PieChart as PieChartIcon, ArrowRightLeft, Mic, Home, FileText,
  PieChart, Wallet, ChevronRight, X, Camera, Utensils, Clock, Tag,
  XCircle, Delete, Briefcase, CreditCard, Info, Check, Sparkles, ShoppingBag, Gamepad2, MoreHorizontal, ChevronLeft, TrendingUp, GraduationCap, Heart, Car
} from 'lucide-react';

// ==========================================
// 基础 UI 图标组件
// ==========================================
const LogoIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[26px] h-[26px]">
    <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z" fill="#1677FF"/>
    <path d="M12.5 10H17.5C19.433 10 21 11.567 21 13.5C21 14.88 20.2 16.07 19.048 16.653C20.553 17.152 21.5 18.6 21.5 20.5C21.5 22.433 19.933 24 18 24H12.5V10Z" fill="white"/>
    <path d="M15 12.5V15.5H17.5C18.328 15.5 19 14.828 19 14C19 13.172 18.328 12.5 17.5 12.5H15Z" fill="#1677FF"/>
    <path d="M15 18V21.5H18C18.966 21.5 19.75 20.716 19.75 19.75C19.75 18.784 18.966 18 18 18H15Z" fill="#1677FF"/>
  </svg>
);

const HOME_BRAND_LOGOS = {
  apple:   { url: 'https://cdn.simpleicons.org/apple/ffffff',     bg: '#000000' },
  openai:  { url: 'https://cdn.simpleicons.org/openai/ffffff',    bg: '#10a37f' },
  alipay:  { url: 'https://cdn.simpleicons.org/alipay/ffffff',    bg: '#1677ff' },
  okx:     { url: 'https://cdn.simpleicons.org/okx/ffffff',       bg: '#000000' },
  bitget:  { url: 'https://cdn.simpleicons.org/bitget/000000',    bg: '#00e5c0', fallbackText: 'BG', textColor: '#000' },
  huobi:   { url: 'https://cdn.simpleicons.org/huobi/ffffff',     bg: '#1853db', fallbackText: 'HTX' },
  usdt:    { url: 'https://cdn.simpleicons.org/tether/ffffff',    bg: '#26A17B' },
};

const HomeBrandLogo = ({ type, size = 28 }) => {
  const [error, setError] = useState(false);
  const config = HOME_BRAND_LOGOS[type];
  const imgSize = Math.round(size * 0.6);
  if (!config) return (
    <div className="rounded-full flex items-center justify-center shrink-0 bg-[#5c8af0]" style={{ width: size, height: size }}>
      <ArrowRightLeft style={{ width: imgSize, height: imgSize }} className="text-white" strokeWidth={2.5} />
    </div>
  );
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ width: size, height: size, backgroundColor: config.bg }}>
      {error
        ? config.fallbackText
          ? <span style={{ fontSize: Math.round(size * 0.32), fontWeight: 800, color: config.textColor || '#ffffff', letterSpacing: '-0.5px', lineHeight: 1 }}>{config.fallbackText}</span>
          : <ShoppingBag style={{ width: imgSize, height: imgSize }} className="text-white" />
        : <img src={config.url} alt={type} style={{ width: imgSize, height: imgSize, objectFit: 'contain' }} onError={() => setError(true)} />
      }
    </div>
  );
};
const ProfileAvatarButton = ({ onClick }: { onClick?: () => void }) => (
  <button onClick={onClick} aria-label="个人中心" className="w-[28px] h-[28px] rounded-full bg-blue-100 overflow-hidden flex items-center justify-center active:scale-95 transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
  </button>
);

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

// --- 支出概览环形图 ---
const DonutChart = () => (
  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#e5e7eb" strokeWidth="6" strokeDasharray="8 92" strokeDashoffset="-92" />
    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f59e0b" strokeWidth="6" strokeDasharray="9.6 90.4" strokeDashoffset="-82.4" />
    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#fbbf24" strokeWidth="6" strokeDasharray="13.5 86.5" strokeDashoffset="-68.9" />
    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray="16.7 83.3" strokeDashoffset="-52.2" />
    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#8b5cf6" strokeWidth="6" strokeDasharray="20.4 79.6" strokeDashoffset="-31.8" />
    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#1677ff" strokeWidth="6" strokeDasharray="31.8 68.2" strokeDashoffset="0" />
    <circle cx="18" cy="18" r="11" fill="white" />
  </svg>
);

// --- 首页极其紧凑的交易项 ---
const TransactionItem = ({ iconBg, Icon, title, tagText, tagType, category, time, amount, amountType }) => {
  const isIncome = amountType === 'income';
  return (
    <div className="flex items-center justify-between py-[10px]">
      <div className="flex items-center space-x-[10px] flex-1 min-w-0">
        <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">{Icon}</div>
        <div className="flex flex-col justify-center min-w-0">
          <div className="text-[13px] font-medium text-[#1c1c1e] truncate mb-[1px]">{title}</div>
          <div className="flex items-center space-x-[6px]">
            <span className={`text-[9px] px-[4px] py-[0.5px] rounded-[3px] font-medium ${tagType === 'expense' ? 'bg-[#f0f5ff] text-[#1677ff]' : 'bg-[#ecfdf5] text-[#10b981]'}`}>{tagText}</span>
            <span className="text-[10px] text-[#8e8e93] truncate">{category}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-[10px] shrink-0 ml-[8px]">
        <span className="text-[11px] text-[#8e8e93]">{time}</span>
        <span className={`text-[14px] font-bold tracking-tight text-right min-w-[50px] ${isIncome ? 'text-[#10b981]' : 'text-[#ff3b30]'}`}>{amount}</span>
      </div>
    </div>
  );
};

// --- 表单行组件 ---
const FormRow = ({ iconBg, iconColor, iconShape = 'rounded-full', Icon: IconComp, label, value, valueColor = 'text-[#1c1c1e]', showChevron = true, extra, border = true, onClick }) => (
  <div onClick={onClick} className={`flex items-center justify-between py-[12px] ${border ? 'border-b border-[#f0f0f0]' : ''} active:bg-gray-50 transition-colors cursor-pointer`}>
    <div className="flex items-center space-x-[12px]">
      <div className={`w-[24px] h-[24px] flex items-center justify-center ${iconShape} ${iconBg}`}>
        {IconComp && <IconComp className={`w-[13px] h-[13px] ${iconColor}`} strokeWidth={2.5} />}
      </div>
      <span className="text-[13px] text-[#1c1c1e]">{label}</span>
    </div>
    <div className="flex items-center space-x-[4px]">
      <span className={`text-[13px] ${valueColor}`}>{value}</span>
      {extra && <span className="text-[11px] text-[#c7c7cc] ml-[4px]">{extra}</span>}
      {showChevron && <ChevronDown className="w-[14px] h-[14px] text-[#c7c7cc] ml-[2px]" strokeWidth={2} />}
    </div>
  </div>
);

const AiConfirmRow = ({ iconBg, iconColor, IconElement, label, value, valueColor = 'text-[#1c1c1e]', border = true, extra }) => (
  <div className={`flex items-center justify-between py-[12px] ${border ? 'border-b border-[#f0f0f0]' : ''}`}>
    <div className="flex items-center space-x-[10px]">
      <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        {IconElement}
      </div>
      <span className="text-[13px] text-[#8e8e93]">{label}</span>
    </div>
    <div className="flex items-center justify-end flex-1 pl-[20px] space-x-[4px]">
      <span className={`text-[14px] font-medium ${valueColor} truncate`}>{value}</span>
      {extra && <span className="text-[10px] text-[#c7c7cc]">{extra}</span>}
      <ChevronRight className="w-[14px] h-[14px] text-[#c7c7cc]" strokeWidth={2} />
    </div>
  </div>
);

const SettingRow = ({ iconBg, IconElement, label, subLabel, value, border = true, onClick }) => (
  <div onClick={onClick} className={`flex items-center justify-between py-[10px] ${border ? 'border-b border-[#f0f0f0]' : ''} active:bg-[#f9f9f9] cursor-pointer transition-colors -mx-[12px] px-[12px]`}>
    <div className="flex items-center space-x-[10px]">
      <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>{IconElement}</div>
      <div className="flex flex-col">
        <span className="text-[13px] text-[#1c1c1e]">{label}</span>
        {subLabel && <span className="text-[10px] text-[#8e8e93] mt-[2px]">{subLabel}</span>}
      </div>
    </div>
    <div className="flex items-center space-x-[4px] shrink-0 pl-[12px]">
      <span className="text-[13px] text-[#1c1c1e] font-medium">{value}</span>
      <ChevronRight className="w-[14px] h-[14px] text-[#c7c7cc]" strokeWidth={2} />
    </div>
  </div>
);

const TransferRow = ({ label, value, valueColor = 'text-[#1c1c1e]', IconElement, showChevron = true, border = true, onClick }) => (
  <div onClick={onClick} className={`flex items-center justify-between py-[14px] ${border ? 'border-b border-[#f0f0f0]' : ''} active:bg-[#f9f9f9] cursor-pointer transition-colors`}>
    <span className="text-[14px] text-[#1c1c1e] shrink-0 w-[70px]">{label}</span>
    <div className="flex items-center justify-end flex-1 space-x-[6px]">
      {IconElement && <div className="flex items-center justify-center">{IconElement}</div>}
      <span className={`text-[14px] ${valueColor}`}>{value}</span>
      {showChevron && <ChevronDown className="w-[16px] h-[16px] text-[#c7c7cc] ml-[2px]" strokeWidth={2} />}
    </div>
  </div>
);

const formatMoney = (val) => {
  if (!val) return '0.00';
  const num = parseFloat(val);
  return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseMoneyNumber = (value) => {
  const num = parseFloat(String(value ?? '').replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(num) ? num : 0;
};

const parseTransactionDate = (fullDate) => {
  const match = String(fullDate || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const convertAmountToCny = (amount, currency, exchangeRates) => {
  const rate = exchangeRates?.[String(currency || 'CNY').toUpperCase()] ?? 0;
  return parseMoneyNumber(amount) * (String(currency || 'CNY').toUpperCase() === 'CNY' ? 1 : rate);
};

const isTransferTransaction = (tx) => tx?.tagType === 'transfer' || tx?.tag === '转账';

const isAdjustmentTransaction = (tx) => {
  const title = String(tx?.title || '');
  return tx?.tagType === 'adjustment' || tx?.tag === '调整' || title.includes('调整记录');
};

const isInternalAccountTransferTransaction = (tx) => {
  const title = String(tx?.title || '');
  const note = String(tx?.note || '');
  const tag = String(tx?.tag || '');
  return (
    title.includes('转入') ||
    title.includes('转出') ||
    title.includes('划转') ||
    note.includes('账户转账') ||
    note.includes('划转') ||
    tag.includes('划转')
  );
};

const isManualBalanceAdjustmentTransaction = (tx) => {
  const note = String(tx?.note || '').trim();
  return note === '余额人工修正' || note === '余额人工修正（不计入统计）';
};

const shouldCountInCashflow = (tx) => (
  !isTransferTransaction(tx) &&
  !isAdjustmentTransaction(tx) &&
  !isInternalAccountTransferTransaction(tx) &&
  !isManualBalanceAdjustmentTransaction(tx)
);

const getDeltaPct = (current, previous) => (previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0));

// ==========================================
// 主应用页面 (App)
// ==========================================
const getHomeTransactionIcon = (tx) => {
  if (tx.iconType === 'landmark') return (
    <div className="rounded-full flex items-center justify-center shrink-0 bg-[#5c8af0]" style={{ width: 28, height: 28 }}>
      <ArrowRightLeft className="w-[14px] h-[14px] text-white" strokeWidth={2.5} />
    </div>
  );
  if (tx.iconType === 'cash') return (
    <div className="rounded-full flex items-center justify-center shrink-0 bg-[#e6f4ff] border-2 border-[#52c41a]" style={{ width: 28, height: 28 }}>
      <Wallet className="w-[14px] h-[14px] text-[#52c41a]" />
    </div>
  );
  return <HomeBrandLogo type={tx.iconType} size={28} />;
};

const formatTransactionDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return {
    dateLabel: `今天 ${month}月${day}日`,
    fullDate: `${year}年${month}月${day}日 ${hours}:${minutes}`,
    time: `${hours}:${minutes}`
  };
};

const EXPENSE_CATEGORIES = [
  { name: '餐饮', icon: Utensils, color: '#ff6b6b' },
  { name: '交通', icon: Car, color: '#4c78fe' },
  { name: '购物', icon: ShoppingBag, color: '#fbbf24' },
  { name: '娱乐', icon: Gamepad2, color: '#a78bfa' },
  { name: '住房', icon: Briefcase, color: '#10b981' },
  { name: '医疗', icon: Heart, color: '#f97316' },
  { name: '教育', icon: GraduationCap, color: '#06b6d4' },
  { name: '理财', icon: TrendingUp, color: '#8b5cf6' },
  { name: '其他', icon: MoreHorizontal, color: '#8e8e93' },
];
const HOME_EXPENSE_OVERVIEW_COLORS = ['#1677ff', '#8b5cf6', '#10b981', '#fbbf24', '#f59e0b', '#e5e7eb'];
const RECORD_KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];
const INCOME_CATEGORIES = [
  { name: '工资', icon: Briefcase, color: '#10b981' },
  { name: '理财', icon: TrendingUp, color: '#8b5cf6' },
  { name: '奖金', icon: Check, color: '#fbbf24' },
  { name: '兼职', icon: PenLine, color: '#4c78fe' },
  { name: '其他', icon: MoreHorizontal, color: '#8e8e93' },
];

export default function RebuiltHomePage({ setIsMessageCenterOpen, transactions = [], accounts = [], budget = 20000, exchangeRates, updateBudget, transferFunds, createTransaction, onOpenBills, onOpenProfile, onOpenSearch }) {
  const [activeModal, setActiveModal] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordActiveTab, setRecordActiveTab] = useState('支出');
  const [showInlineKeyboard, setShowInlineKeyboard] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('月');
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [selectedYear, setSelectedYear] = useState(2026);
  const pressTimer = useRef(null);

  // Record form state
  const [recordCategory, setRecordCategory] = useState('餐饮');
  const [recordCategoryIncome, setRecordCategoryIncome] = useState('工资');
  const [recordAccount, setRecordAccount] = useState(null);
  const [recordDate, setRecordDate] = useState(new Date(2026, 3, 25, 9, 41));
  const [recordNote, setRecordNote] = useState('');
  const [recordTag, setRecordTag] = useState('');
  const [activePicker, setActivePicker] = useState(null);

  // Budget state
  const [budgetAmount, setBudgetAmount] = useState(budget);
  const [budgetInput, setBudgetInput] = useState(String(budget));
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetPeriod, setBudgetPeriod] = useState('每月');
  const [isBudgetPeriodOpen, setIsBudgetPeriodOpen] = useState(false);

  // Sync budget from props (when DB loads)
  useEffect(() => {
    setBudgetAmount(budget);
    setBudgetInput(String(budget));
  }, [budget]);

  // Transfer state
  const [transferAmount, setTransferAmount] = useState('');
  const [transferOutAccount, setTransferOutAccount] = useState(null);
  const [transferInAccount, setTransferInAccount] = useState(null);
  const [transferPickerOpen, setTransferPickerOpen] = useState(null);

  const yearOptions = useMemo(() => Array.from({ length: 9 }, (_, index) => selectedYear - 4 + index), [selectedYear]);
  const selectedMonthLabel = `${selectedYear}年${selectedMonth}月`;

  // 计算本月实际支出（用于预算进度）
  const monthlyExpenses = useMemo(() => {
    return transactions
      .filter(tx => {
        const date = parseTransactionDate(tx.fullDate);
        if (!date) return false;
        return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth && !tx.isIncome && shouldCountInCashflow(tx);
      })
      .reduce((sum, tx) => sum + Math.abs(convertAmountToCny(parseMoneyNumber(tx.amount), tx.currency, exchangeRates)), 0);
  }, [transactions, selectedYear, selectedMonth, exchangeRates]);

  const monthlyIncome = useMemo(() => {
    return transactions
      .filter(tx => {
        const date = parseTransactionDate(tx.fullDate);
        if (!date) return false;
        return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth && tx.isIncome && shouldCountInCashflow(tx);
      })
      .reduce((sum, tx) => sum + convertAmountToCny(parseMoneyNumber(tx.amount), tx.currency, exchangeRates), 0);
  }, [transactions, selectedYear, selectedMonth, exchangeRates]);

  const previousMonthStats = useMemo(() => {
    const prevDate = new Date(selectedYear, selectedMonth - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;
    return transactions.reduce((acc, tx) => {
      const date = parseTransactionDate(tx.fullDate);
      if (!date || date.getFullYear() !== prevYear || date.getMonth() + 1 !== prevMonth || !shouldCountInCashflow(tx)) return acc;
      const amount = convertAmountToCny(parseMoneyNumber(tx.amount), tx.currency, exchangeRates);
      if (tx.isIncome) acc.income += amount;
      else acc.expense += Math.abs(amount);
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions, selectedYear, selectedMonth, exchangeRates]);

  const monthlyExpenseCategoryOverview = useMemo(() => {
    const grouped = transactions.reduce((acc, tx) => {
      const date = parseTransactionDate(tx.fullDate);
      if (!date) return acc;
      if (date.getFullYear() !== selectedYear || date.getMonth() + 1 !== selectedMonth) return acc;
      if (tx.isIncome || !shouldCountInCashflow(tx)) return acc;
      const key = tx.tag || '其他';
      acc[key] = (acc[key] || 0) + Math.abs(convertAmountToCny(parseMoneyNumber(tx.amount), tx.currency, exchangeRates));
      return acc;
    }, {});

    const entries = Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .map((item, index) => ({ ...item, color: HOME_EXPENSE_OVERVIEW_COLORS[index % HOME_EXPENSE_OVERVIEW_COLORS.length] }));
    const total = entries.reduce((sum, item) => sum + item.amount, 0);
    const topItems = entries.slice(0, 4).map((item) => ({
      ...item,
      percent: total > 0 ? (item.amount / total) * 100 : 0,
      percentLabel: `${total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0.0'}%`,
    }));
    let start = 0;
    const gradient = topItems.length > 0
      ? `conic-gradient(${topItems.map((item) => {
          const end = start + item.percent;
          const segment = `${item.color} ${start}% ${end}%`;
          start = end;
          return segment;
        }).join(', ')})`
      : 'conic-gradient(#e5e7eb 0% 100%)';
    return { items: topItems, gradient };
  }, [transactions, selectedYear, selectedMonth, exchangeRates]);

  const monthlyBalanceTrendPath = useMemo(() => {
    const monthTransactions = transactions
      .filter((tx) => {
        const date = parseTransactionDate(tx.fullDate);
        return date && date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth && shouldCountInCashflow(tx);
      })
      .sort((a, b) => new Date(a.fullDate.replace(/年|月/g, '-').replace('日', '')).getTime() - new Date(b.fullDate.replace(/年|月/g, '-').replace('日', '')).getTime());

    if (monthTransactions.length === 0) {
      return 'M-10,65 C20,65 30,75 50,60 C70,45 80,65 100,50 C120,35 140,55 160,25 C175,5 190,15 210,10';
    }

    let running = 0;
    const points = monthTransactions.map((tx, index) => {
      const amount = convertAmountToCny(parseMoneyNumber(tx.amount), tx.currency, exchangeRates);
      running += tx.isIncome ? amount : -Math.abs(amount);
      return { x: index, y: running };
    });

    const values = points.map((point) => point.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 200;
    const height = 80;
    const scaled = points.map((point, index) => ({
      x: points.length === 1 ? width : (index / (points.length - 1)) * width,
      y: 68 - ((point.y - min) / range) * 50,
    }));

    return scaled.reduce((path, point, index) => {
      if (index === 0) return `M${point.x},${point.y}`;
      const prev = scaled[index - 1];
      const controlX = (prev.x + point.x) / 2;
      return `${path} C${controlX},${prev.y} ${controlX},${point.y} ${point.x},${point.y}`;
    }, '');
  }, [transactions, selectedYear, selectedMonth, exchangeRates]);

  const budgetUsed = monthlyExpenses;
  const budgetRemaining = budgetAmount - budgetUsed;
  const budgetProgressPercent = budgetAmount > 0 ? Math.min(100, (budgetUsed / budgetAmount) * 100) : 0;
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  const previousBalance = previousMonthStats.income - previousMonthStats.expense;

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.fullDate.replace(/年|月/g, '-').replace('日', '')).getTime() - new Date(a.fullDate.replace(/年|月/g, '-').replace('日', '')).getTime()).slice(0, 5),
    [transactions]
  );

  // Init account selections when accounts load
  useEffect(() => {
    if (accounts.length > 0) {
      if (!recordAccount) setRecordAccount(accounts[0]);
      if (!transferOutAccount) setTransferOutAccount(accounts[0]);
      if (!transferInAccount && accounts.length > 1) setTransferInAccount(accounts[1]);
      else if (!transferInAccount) setTransferInAccount(accounts[0]);
    }
  }, [accounts]);

  const formatDateForDisplay = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const handleAiStart = (e) => {
    e.preventDefault();
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setIsRecording(true);
    }, 150);
  };

  const handleAiEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (isRecording) {
      setIsRecording(false);
      setActiveModal('ai');
    }
  };

  const closeModals = () => {
    setActiveModal(null);
    setShowInlineKeyboard(false);
    setInputValue('');
    setActivePicker(null);
    setTransferPickerOpen(null);
  };

  const appendRecordKey = (key) => {
    setInputValue((prev) => {
      const current = String(prev || '');
      if (key === '.') {
        if (current.includes('.')) return current;
        return current ? `${current}.` : '0.';
      }
      if (current === '0' && !current.includes('.')) return key;
      return `${current}${key}`;
    });
  };

  const deleteRecordKey = () => {
    setInputValue((prev) => String(prev || '').slice(0, -1));
  };

  const addQuickAmount = (amount) => {
    setInputValue((prev) => {
      const next = (parseFloat(String(prev || '0')) || 0) + amount;
      return Number.isInteger(next) ? String(next) : next.toFixed(2);
    });
  };

  const saveTransaction = async (payload) => {
    if (!createTransaction) return;
    await createTransaction(payload);
    closeModals();
  };

  const handleSaveRecord = async () => {
    const amount = Number(inputValue || 0);
    if (!amount) return;
    const isIncome = recordActiveTab === '收入';
    const category = isIncome ? recordCategoryIncome : recordCategory;
    const account = recordAccount;
    const { dateLabel, fullDate, time } = formatTransactionDate(recordDate);
    const TAG_TYPE_MAP = { '餐饮': 'shopping', '交通': 'transport', '购物': 'shopping', '娱乐': 'shopping', '住房': 'shopping', '医疗': 'shopping', '教育': 'shopping', '理财': 'investment', '工资': 'investment', '奖金': 'investment', '兼职': 'investment', '其他': 'shopping', '转账': 'transfer' };
    await saveTransaction({
      dateLabel,
      iconBg: account ? `bg-[#1677ff]` : (isIncome ? 'bg-[#10b981]' : 'bg-[#1677ff]'),
      iconType: account ? (account.icon || 'landmark') : (isIncome ? 'landmark' : 'alipay'),
      title: category + (recordNote ? `（${recordNote}）` : ''),
      subtitle: account ? account.name : (isIncome ? '收入账户' : '支出账户'),
      tag: category,
      tagType: TAG_TYPE_MAP[category] || (isIncome ? 'investment' : 'shopping'),
      amount: `${isIncome ? '+' : '-'}${formatMoney(amount)}`,
      isIncome,
      time,
      fullDate,
      currency: account ? (account.currency || 'CNY') : 'CNY',
      paymentMethod: account ? account.name : '默认账户',
      note: recordNote
    });
  };

  const handleSaveAiRecord = async () => {
    const now = new Date();
    const { dateLabel, fullDate, time } = formatTransactionDate(now);
    await saveTransaction({
      dateLabel,
      iconBg: 'bg-[#10a37f]',
      iconType: 'openai',
      title: 'AI 语音记账',
      subtitle: '默认账户',
      tag: '订阅',
      tagType: 'subscription',
      amount: '-20.00',
      isIncome: false,
      time,
      fullDate,
      currency: 'CNY',
      paymentMethod: '默认账户',
      note: '外卖'
    });
  };

  const handleSaveTransfer = async () => {
    const amount = Number(transferAmount || 0);
    if (!amount) return;
    const outAcc = transferOutAccount || accounts[0];
    const inAcc = transferInAccount || accounts[1] || accounts[0];
    const outName = outAcc ? outAcc.name : '转出账户';
    const inName = inAcc ? inAcc.name : '转入账户';
    const outIcon = outAcc ? (outAcc.icon || 'landmark') : 'landmark';
    const now = new Date();
    const { dateLabel, fullDate, time } = formatTransactionDate(now);

    // Update both account balances in database
    if (transferFunds && outAcc && inAcc) {
      await transferFunds(outAcc, inAcc, amount);
    }

    // Record the transfer as a transaction
    await saveTransaction({
      dateLabel,
      iconBg: 'bg-[#8b5cf6]',
      iconType: outIcon,
      title: `${outName} 转入 ${inName}`,
      subtitle: outName,
      tag: '转账',
      tagType: 'transfer',
      amount: `-${formatMoney(amount)}`,
      isIncome: false,
      time,
      fullDate,
      currency: outAcc ? (outAcc.currency || 'CNY') : 'CNY',
      paymentMethod: outName,
      note: '账户转账'
    });
    setTransferAmount('');
  };

  const changeCalendarYear = (delta) => setSelectedYear((prev) => prev + delta);

  const renderFormList = () => {
    const accLabel = recordAccount ? recordAccount.name : '选择账户';
    const dateLabel = formatDateForDisplay(recordDate);
    if (recordActiveTab === '支出') {
      return (
        <>
          <FormRow Icon={Utensils} iconBg="bg-[#f0f5ff]" iconColor="text-[#1677ff]" label="分类" value={recordCategory} onClick={() => setActivePicker('category')} />
          <FormRow Icon={Wallet} iconBg="bg-[#ecfdf5]" iconColor="text-[#10b981]" label="账户" value={accLabel} onClick={() => setActivePicker('account')} />
          <FormRow Icon={Clock} iconBg="bg-[#f5f3ff]" iconColor="text-[#8b5cf6]" label="时间" value={dateLabel} onClick={() => setActivePicker('datetime')} />
          <FormRow Icon={FileText} iconBg="bg-[#fff7e6]" iconColor="text-[#fa8c16]" label="备注" value={recordNote || '点击输入'} valueColor={recordNote ? 'text-[#1c1c1e]' : 'text-gray-300'} onClick={() => setActivePicker('note')} />
          <FormRow Icon={Tag} iconBg="bg-[#f4f5f8]" iconColor="text-[#8e8e93]" label="标签" value={recordTag || '+ 添加标签'} valueColor={recordTag ? 'text-[#1c1c1e]' : 'text-[#1677ff]'} border={false} onClick={() => setActivePicker('tag')} />
        </>
      );
    } else {
      return (
        <>
          <FormRow Icon={Briefcase} iconBg="bg-[#fff7e6]" iconColor="text-[#fa8c16]" label="分类" value={recordCategoryIncome} onClick={() => setActivePicker('category')} />
          <FormRow Icon={CreditCard} iconBg="bg-[#f0f5ff]" iconColor="text-[#1677ff]" label="账户" value={accLabel} onClick={() => setActivePicker('account')} />
          <FormRow Icon={Clock} iconBg="bg-[#f5f3ff]" iconColor="text-[#8b5cf6]" label="时间" value={dateLabel} onClick={() => setActivePicker('datetime')} />
          <FormRow Icon={FileText} iconBg="bg-[#ecfdf5]" iconColor="text-[#10b981]" label="备注" value={recordNote || '点击输入'} valueColor={recordNote ? 'text-[#1c1c1e]' : 'text-gray-300'} border={false} onClick={() => setActivePicker('note')} />
        </>
      );
    }
  };

  return (
    <div className="bg-[#f4f5f8] w-full h-full mx-auto relative overflow-hidden flex flex-col font-sans text-gray-900 select-none">
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .ai-ripple { animation: aiRipple 2.4s ease-out infinite; }
        .ai-ripple-delay { animation-delay: .8s; }
        .soundwave-anim { animation: soundwave 1.1s cubic-bezier(.4,0,.2,1) infinite; transform-origin: center bottom; }
        @keyframes aiRipple {
          0% { transform: scale(0.72); opacity: 0; }
          20% { opacity: 0.22; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes soundwave {
          0%, 100% { transform: scaleY(0.28); opacity: 0.35; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}} />

      {/* 头部 */}
      <header className="shrink-0 px-[16px] pt-[env(safe-area-inset-top,52px)] pb-[10px] flex items-center justify-between sticky top-0 z-[15] bg-[#f4f5f8]/95 backdrop-blur-sm">
        <div className="flex items-center space-x-[6px]"><LogoIcon /><span className="text-[20px] font-bold text-[#1c1c1e] italic tracking-tight" style={{fontFamily: 'Helvetica Neue, Arial, sans-serif'}}>BitLedger <span className="text-[#1677ff]">Pro</span></span></div>
        <div className="flex items-center space-x-[16px]">
          <button aria-label="搜索" onClick={onOpenSearch} className="active:opacity-60 transition-opacity"><Search className="w-[20px] h-[20px] text-[#1c1c1e]" strokeWidth={2} /></button>
          <button aria-label="消息中心" onClick={() => setIsMessageCenterOpen?.(true)} className="relative active:opacity-60 transition-opacity"><Bell className="w-[20px] h-[20px] text-[#1c1c1e]" strokeWidth={2} /><div className="absolute -top-[1px] right-[1px] w-[7px] h-[7px] bg-[#ff3b30] rounded-full border-[1.5px] border-[#f4f5f8]"></div></button>
          <ProfileAvatarButton onClick={onOpenProfile} />
        </div>
      </header>

      {/* 主信息流 */}
      <main className="flex-1 overflow-y-auto hide-scrollbar px-[16px] space-y-[14px] pb-[20px]">
        <div className="flex items-center justify-between pt-1 relative z-20">
          <div className="relative">
            <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`flex items-center space-x-[4px] h-[34px] px-[10px] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.02)] whitespace-nowrap active:scale-95 transition-all ${isCalendarOpen ? 'bg-[#f4f8ff] border border-[#1677ff] text-[#1677ff]' : 'bg-white border border-transparent text-[#1c1c1e]'}`}>
              <CalendarIcon className={`w-[15px] h-[15px] ${isCalendarOpen ? 'text-[#1677ff]' : 'text-[#8e8e93]'}`} strokeWidth={2} /><span className="text-[13px] font-medium">{selectedMonthLabel}</span><ChevronDown className={`w-[13px] h-[13px] ${isCalendarOpen ? 'text-[#1677ff]' : 'text-[#8e8e93]'}`} strokeWidth={2.5} />
            </button>
            {isCalendarOpen && (
              <>
                <div className="fixed inset-0 z-[40]" onClick={() => setIsCalendarOpen(false)}></div>
                <div className="absolute top-[42px] left-0 w-[310px] bg-white rounded-[20px] p-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-[50] animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                <div className="absolute -top-[5px] left-[45px] w-[12px] h-[12px] bg-white transform rotate-45 border-t border-l border-[#f0f0f0] rounded-sm"></div>
                  <div className="flex bg-[#f4f5f8] p-[3px] rounded-[10px] mb-[16px]">{['月', '年'].map((view) => <button key={view} onClick={() => setCalendarView(view)} className={`flex-1 rounded-[8px] py-[6px] text-[14px] transition-all ${calendarView === view ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#1677ff] font-semibold' : 'text-[#8e8e93] font-medium active:bg-gray-200'}`}>{view}</button>)}</div>
                  <div className="flex items-center justify-between mb-[14px] px-[8px]">
                    <button aria-label="上一年" onClick={() => changeCalendarYear(-1)} className="p-1 active:opacity-50"><ChevronLeft className="w-[18px] h-[18px] text-[#1677ff]" strokeWidth={2.5} /></button>
                    <span className="text-[15px] font-medium text-[#1c1c1e]">{calendarView === '月' ? `${selectedYear}年` : '选择年份'}</span>
                    <button aria-label="下一年" onClick={() => changeCalendarYear(1)} className="p-1 active:opacity-50"><ChevronRight className="w-[18px] h-[18px] text-[#1677ff]" strokeWidth={2.5} /></button>
                  </div>
                  {calendarView === '月' ? (
                    <div className="grid grid-cols-3 gap-[8px]">
                      {MONTH_OPTIONS.map((month) => (
                        <button
                          key={month}
                          onClick={() => setSelectedMonth(month)}
                          className={`h-[42px] rounded-[12px] text-[14px] transition-all ${selectedMonth === month ? 'bg-[#1677ff] text-white font-semibold shadow-[0_6px_16px_rgba(22,119,255,0.24)]' : 'bg-[#f7f8fa] text-[#3a3a3c] font-medium active:bg-[#eef2f7]'}`}
                        >
                          {month}月
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-[8px]">
                      {yearOptions.map((year) => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          className={`h-[42px] rounded-[12px] text-[14px] transition-all ${selectedYear === year ? 'bg-[#1677ff] text-white font-semibold shadow-[0_6px_16px_rgba(22,119,255,0.24)]' : 'bg-[#f7f8fa] text-[#3a3a3c] font-medium active:bg-[#eef2f7]'}`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-[16px] px-[4px]">
                    <button onClick={() => { setSelectedMonth(4); setSelectedYear(2026); }} className="text-[14px] text-[#1677ff] font-medium px-[8px] py-[4px] active:opacity-60">本月</button>
                    <button onClick={() => setIsCalendarOpen(false)} className="bg-[#1677ff] text-white px-[20px] py-[8px] rounded-[10px] text-[13px] font-semibold active:bg-[#1565d8] shadow-[0_2px_10px_rgba(22,119,255,0.2)]">确定</button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex bg-white rounded-[6px] p-[2.5px] shadow-sm"><span className="px-[12px] py-[2px] text-[12px] font-semibold text-[#1677ff] bg-[#f0f5ff] rounded-[4px]">月</span><span className="px-[12px] py-[2px] text-[12px] font-medium text-[#8e8e93]">年</span></div>
        </div>

        {/* 余额卡片 */}
        <div className="bg-white rounded-[24px] p-[20px] shadow-sm relative overflow-hidden">
          <div className="flex items-center space-x-[6px] text-[#8e8e93] mb-[8px]"><span className="text-[12px]">本月结余 (人民币)</span><Eye className="w-[14px] h-[14px]" /></div>
          <div className="text-[38px] font-bold text-[#1677ff] tracking-tight leading-none mb-[12px]">{formatMoney(monthlyBalance)}</div>
          <div className="flex items-center text-[11px]"><span className="text-[#8e8e93] mr-[6px]">较上月</span><span className="text-[#1677ff] flex items-center font-medium"><ArrowUpRight className="w-[12px] h-[12px] mr-[1px]" /> {getDeltaPct(monthlyBalance, previousBalance).toFixed(1)}%</span></div>
          <div className="absolute bottom-0 right-0 w-[60%] h-[80px] pointer-events-none opacity-80">
            <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="none"><path d={monthlyBalanceTrendPath} fill="none" stroke="#1677ff" strokeWidth="2.5" strokeLinecap="round" /></svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[12px]">
          <div className="bg-white rounded-[20px] p-[14px] shadow-sm"><div className="text-[11px] text-[#8e8e93] mb-[4px]">本月收入</div><div className="text-[20px] font-bold text-[#10b981] mb-[6px]">{formatMoney(monthlyIncome)}</div><div className="flex items-center text-[10px] text-[#10b981] font-medium"><ArrowUpRight className="w-[10px] h-[10px]" /> {getDeltaPct(monthlyIncome, previousMonthStats.income).toFixed(1)}%</div></div>
          <div className="bg-white rounded-[20px] p-[14px] shadow-sm"><div className="text-[11px] text-[#8e8e93] mb-[4px]">本月支出</div><div className="text-[20px] font-bold text-[#ff3b30] mb-[6px]">{formatMoney(monthlyExpenses)}</div><div className="flex items-center text-[10px] text-[#ff3b30] font-medium"><ArrowUpRight className="w-[10px] h-[10px]" /> {getDeltaPct(monthlyExpenses, previousMonthStats.expense).toFixed(1)}%</div></div>
        </div>

        <div className="flex justify-between items-center px-[12px] py-[6px]">
          <div onClick={() => { setActiveModal('record'); setShowInlineKeyboard(true); }} className="flex flex-col items-center space-y-[6px] cursor-pointer active:scale-90 transition-transform"><div className="w-[44px] h-[44px] bg-[#1677ff] rounded-full flex items-center justify-center shadow-md shadow-blue-100/50"><PenLine className="w-[20px] h-[20px] text-white" /></div><span className="text-[11px] font-medium text-[#1c1c1e]">记一笔</span></div>
          <div onClick={() => setActiveModal('budget')} className="flex flex-col items-center space-y-[6px] cursor-pointer active:scale-90 transition-transform"><div className="w-[44px] h-[44px] bg-[#10b981] rounded-full flex items-center justify-center shadow-md shadow-green-100/50"><PieChartIcon className="w-[20px] h-[20px] text-white" /></div><span className="text-[11px] font-medium text-[#1c1c1e]">预算</span></div>
          <div onClick={() => setActiveModal('transfer')} className="flex flex-col items-center space-y-[6px] cursor-pointer active:scale-90 transition-transform"><div className="w-[44px] h-[44px] bg-[#8b5cf6] rounded-full flex items-center justify-center shadow-md shadow-purple-100/50"><ArrowRightLeft className="w-[20px] h-[20px] text-white" /></div><span className="text-[11px] font-medium text-[#1c1c1e]">转账</span></div>
          <div onPointerDown={handleAiStart} onPointerUp={handleAiEnd} onPointerCancel={handleAiEnd} className="flex flex-col items-center space-y-[6px] relative active:scale-95 transition-transform cursor-pointer touch-none"><div className="w-[44px] h-[44px] bg-[#1677ff] rounded-full flex items-center justify-center shadow-md shadow-blue-100/50"><Mic className="w-[20px] h-[20px] text-white" strokeWidth={2} /><div className="absolute -top-[2px] -right-[4px] bg-gradient-to-r from-[#ff6b8b] to-[#ff8787] text-white text-[7px] font-extrabold px-[3px] py-[1.5px] rounded-full border border-white leading-none">AI</div></div><span className="text-[11px] font-medium text-[#1c1c1e]">智记</span></div>
        </div>

        {/* 【复原】统计卡片细节 */}
        <div className="grid grid-cols-2 gap-[12px]">
          {/* 预算进度 */}
          <div className="bg-white rounded-[20px] p-[14px] shadow-sm h-[136px] flex flex-col">
            <div className="flex justify-between items-center mb-[4px]">
              <span className="text-[12px] font-bold text-[#1c1c1e]">预算进度</span>
              <div className="flex items-center text-[10px] text-[#8e8e93]">本月 <ChevronDown className="w-[10px] h-[10px] ml-[2px]" /></div>
            </div>
            <div className="text-[10px] text-[#8e8e93] mb-[12px]">
              总预算 <span className="font-semibold text-[#1c1c1e]">{budgetAmount.toLocaleString()}.00</span> 元
            </div>
            <div className="flex-1 mb-[10px]">
              <div className="h-[4px] bg-[#f0f0f0] rounded-full overflow-hidden mb-[4px]">
                <div className="h-full bg-[#1677ff] rounded-full" style={{ width: `${Math.min(100, budgetProgressPercent)}%` }}></div>
              </div>
              <div className="text-right text-[11px] font-bold text-[#1677ff]">{Math.round(budgetProgressPercent)}%</div>
            </div>
            <div className="space-y-[3px]">
              <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center text-[#3a3a3c]"><div className="w-[4px] h-[4px] rounded-full bg-[#1677ff] mr-[6px]"></div>已支出</div>
                <span className="font-semibold text-[#1c1c1e]">{budgetUsed.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center text-[#8e8e93]"><div className="w-[4px] h-[4px] rounded-full bg-[#e5e5ea] mr-[6px]"></div>剩余额度</div>
                <span className="font-semibold text-[#3a3a3c]">{Math.max(0, budgetRemaining).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
          {/* 支出分类概览 */}
          <div className="bg-white rounded-[20px] p-[14px] shadow-sm h-[136px] flex flex-col">
            <div className="flex justify-between items-center mb-[6px]">
              <span className="text-[12px] font-bold text-[#1c1c1e]">支出分类概览</span>
              <div className="flex items-center text-[10px] text-[#8e8e93]">本月 <ChevronDown className="w-[10px] h-[10px] ml-[2px]" /></div>
            </div>
            <div className="flex items-center justify-between flex-1">
              <div className="w-[58px] h-[58px] shrink-0 relative">
                <div className="w-full h-full rounded-full" style={{ background: monthlyExpenseCategoryOverview.gradient, mask: 'radial-gradient(transparent 58%, black 59%)', WebkitMask: 'radial-gradient(transparent 58%, black 59%)' }}></div>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-[3px] ml-[10px] overflow-hidden">
                {monthlyExpenseCategoryOverview.items.map((x, i) => (
                  <div key={i} className="flex justify-between items-center text-[9px]">
                    <div className="flex items-center truncate pr-1">
                      <div className="w-[3px] h-[3px] rounded-full mr-[4px] shrink-0" style={{ backgroundColor: x.color }}></div>
                      <span className="truncate">{x.name}</span>
                    </div>
                    <span className="text-[#8e8e93] shrink-0">{x.percentLabel}</span>
                  </div>
                ))}
                {monthlyExpenseCategoryOverview.items.length === 0 && (
                  <div className="text-[10px] text-[#8e8e93]">暂无支出数据</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 最近交易列表 */}
        <div className="bg-white rounded-[20px] shadow-sm overflow-hidden mt-[14px]">
          <div className="flex justify-between items-baseline px-[16px] py-[12px] pb-[4px]">
            <h3 className="text-[14px] font-bold text-[#1c1c1e]">最近交易</h3>
            <button onClick={() => onOpenBills?.()} className="text-[11px] text-[#8e8e93] flex items-center">查看全部 <ChevronRight className="w-[12px] h-[12px] ml-[1px]" strokeWidth={2.5} /></button>
          </div>
          <div className="flex flex-col px-[16px] divide-y divide-[#f8f8f8]">
            {recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id || `${tx.title}-${tx.fullDate}`}
                iconBg={tx.iconBg}
                Icon={getHomeTransactionIcon(tx)}
                title={tx.title}
                tagText={tx.isIncome ? '收入' : '支出'}
                tagType={tx.isIncome ? 'income' : 'expense'}
                category={tx.tag}
                time={tx.time}
                amount={tx.amount}
                amountType={tx.isIncome ? 'income' : 'expense'}
              />
            ))}
          </div>
        </div>
      </main>

      {/* ==========================================
          功能面板 (Modals)
      ========================================== */}

      {/* AI 录音特效 */}
      <div className={`absolute inset-0 bg-white/70 backdrop-blur-md z-[100] flex flex-col items-center justify-end pb-[120px] transition-all duration-300 pointer-events-none ${isRecording ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="flex flex-col items-center space-y-[28px]">
          <div className="relative flex items-center justify-center w-[176px] h-[176px]">
            <div className="absolute inset-[18px] rounded-full border border-[#1677ff]/15 ai-ripple"></div>
            <div className="absolute inset-[6px] rounded-full border border-[#1677ff]/10 ai-ripple ai-ripple-delay"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(22,119,255,0.14)_0%,rgba(22,119,255,0.03)_46%,rgba(22,119,255,0)_72%)] rounded-full"></div>
            <div className="relative w-[84px] h-[84px] bg-[linear-gradient(180deg,#3b93ff_0%,#1677ff_100%)] rounded-full flex items-center justify-center shadow-[0_16px_40px_rgba(22,119,255,0.32)] z-10">
              <Mic className="w-[34px] h-[34px] text-white" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-[7px]">
              {[20, 34, 48, 62, 72, 62, 48, 34, 20].map((height, i) => (
                <div
                  key={i}
                  className="soundwave-anim w-[4px] rounded-full bg-[linear-gradient(180deg,rgba(22,119,255,0.1)_0%,rgba(22,119,255,0.92)_52%,rgba(22,119,255,0.18)_100%)] shadow-[0_0_18px_rgba(22,119,255,0.2)]"
                  style={{ height: `${height}px`, animationDelay: `${i * 0.08}s` }}
                ></div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center space-y-[6px]">
            <span className="text-[15px] font-semibold text-[#1677ff] animate-pulse">松开手指，完成录音</span>
            <span className="text-[12px] text-[#7aaaf9]">正在聆听并准备生成记账信息</span>
          </div>
        </div>
      </div>

      {/* AI 识别确认页 */}
      <div className={`absolute inset-0 bg-black/40 z-[110] transition-opacity duration-300 ${activeModal === 'ai' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeModals} />
      <div className={`absolute bottom-0 left-0 right-0 bg-[#f4f5f8] rounded-t-[24px] z-[120] transition-transform duration-300 ease-out shadow-2xl flex flex-col pb-[24px] ${activeModal === 'ai' ? 'translate-y-0' : 'translate-y-full opacity-0'}`}>
        <div className="bg-white rounded-t-[24px] flex flex-col items-center pt-[10px] pb-[10px] border-b border-[#f0f0f0]"><div className="w-[32px] h-[4px] bg-[#e5e5ea] rounded-full mb-[8px]"></div><span className="text-[15px] font-bold text-[#1c1c1e]">确认记账</span></div>
        <div className="p-[16px] space-y-[12px]">
          <div className="flex items-center justify-center space-x-[6px] py-[4px] text-[#1677ff]"><Sparkles className="w-[14px] h-[14px]" /><span className="text-[12px] text-[#8e8e93]">AI 已识别，以下是为你生成的记账信息</span></div>
          <div className="bg-white rounded-[16px] px-[16px] shadow-sm">
            <AiConfirmRow iconBg="bg-[#fff0f0]" iconColor="text-[#ff3b30]" IconElement={<Utensils className="w-[12px] h-[12px] text-[#ff3b30]"/>} label="分类" value="餐饮 > 午餐" />
            <AiConfirmRow iconBg="bg-[#fff0f0]" iconColor="text-[#ff3b30]" IconElement={<span className="text-[12px] font-bold text-[#ff3b30]">¥</span>} label="金额" value="20.00" extra="CNY" />
            <AiConfirmRow iconBg="bg-[#f0f5ff]" iconColor="text-[#1677ff]" IconElement={<FileText className="w-[12px] h-[12px] text-[#1677ff]"/>} label="备注" value="外卖" />
            <AiConfirmRow iconBg="bg-[#ecfdf5]" iconColor="text-[#10b981]" IconElement={<CalendarIcon className="w-[12px] h-[12px] text-[#10b981]"/>} label="日期" value="2026年4月30日" />
            <AiConfirmRow iconBg="bg-[#f5f3ff]" iconColor="text-[#8b5cf6]" IconElement={<Wallet className="w-[12px] h-[12px] text-[#8b5cf6]"/>} label="账户" value="默认账户" border={false} />
          </div>
          <div className="flex space-x-[12px] pt-[8px]"><button onClick={closeModals} className="flex-1 h-[44px] rounded-[10px] border border-[#e5e5ea] font-medium text-[15px] active:bg-gray-50 transition-colors">取消</button><button onClick={handleSaveAiRecord} className="flex-1 h-[44px] rounded-[10px] bg-[#1677ff] text-white font-medium text-[15px] shadow-lg shadow-blue-200 active:bg-blue-700 transition-colors">确认记账</button></div>
        </div>
      </div>

      {/* 记一笔面板 */}
      <div className={`absolute inset-0 bg-black/40 z-[90] transition-opacity duration-300 ${activeModal === 'record' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeModals} />
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[100] transition-transform duration-300 ease-out shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${activeModal === 'record' ? 'translate-y-0' : 'translate-y-full opacity-0'}`}>
        <div className="flex flex-col items-center pt-[10px] pb-[8px] border-b border-[#f0f0f0] shrink-0"><div className="w-[32px] h-[4px] bg-[#e5e5ea] rounded-full mb-[8px]"></div><span className="text-[15px] font-bold">记一笔</span><button onClick={closeModals} className="absolute right-[16px] top-[10px] p-[4px] text-[#c7c7cc]"><X className="w-[20px] h-[20px]" /></button></div>
        <div className="flex-1 overflow-y-auto hide-scrollbar p-[16px] space-y-[16px]">
          <div className="flex space-x-[20px] border-b border-gray-50 pb-[8px]">{['支出','收入'].map(tab=>(<button key={tab} onClick={()=>{setRecordActiveTab(tab);setRecordCategory('餐饮');setRecordCategoryIncome('工资');setActivePicker(null);}} className={`text-[15px] font-medium relative ${recordActiveTab===tab?'text-[#1677ff]':'text-gray-400'}`}>{tab}{recordActiveTab===tab && <div className="absolute -bottom-[10px] left-0 right-0 h-[2px] bg-[#1677ff]"></div>}</button>))}</div>
          <div className="flex items-center justify-between border-b border-gray-50 py-[10px]">
            <span className="text-[20px] font-bold text-[#1c1c1e]">¥</span>
            <input value={inputValue} readOnly inputMode="none" onFocus={() => setShowInlineKeyboard(true)} onClick={() => setShowInlineKeyboard(true)} placeholder="请输入金额" className="flex-1 ml-[10px] bg-transparent text-[20px] font-bold text-[#1c1c1e] outline-none placeholder:text-gray-300 cursor-pointer" />
            <Camera className="w-[20px] h-[20px] text-gray-400" />
          </div>
          {showInlineKeyboard && (
            <div className="space-y-[12px]">
              <div className="grid grid-cols-4 gap-[8px]">
                {[10, 50, 100, 200].map((amount) => (
                  <button key={amount} onClick={() => addQuickAmount(amount)} className="h-[40px] rounded-[12px] border border-[#e5e5ea] bg-white text-[14px] font-medium text-[#1c1c1e] active:bg-[#f4f8ff] transition-colors">
                    +{amount}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_88px] gap-[8px]">
                {RECORD_KEYPAD_KEYS.slice(0, 9).map((key) => (
                  <button key={key} onClick={() => appendRecordKey(key)} className="h-[56px] rounded-[14px] bg-[#f8f8fa] text-[28px] font-medium text-[#1c1c1e] active:bg-[#eaf1ff] transition-colors">
                    {key}
                  </button>
                ))}
                <button onClick={() => setInputValue('')} className="row-span-2 rounded-[14px] bg-[#eef4ff] text-[24px] font-medium text-[#1677ff] active:bg-[#dfeaff] transition-colors">
                  C
                </button>
                <button onClick={() => appendRecordKey('.')} className="h-[56px] rounded-[14px] bg-[#f8f8fa] text-[28px] font-medium text-[#1c1c1e] active:bg-[#eaf1ff] transition-colors">
                  .
                </button>
                <button onClick={() => appendRecordKey('0')} className="h-[56px] rounded-[14px] bg-[#f8f8fa] text-[28px] font-medium text-[#1c1c1e] active:bg-[#eaf1ff] transition-colors">
                  0
                </button>
                <button onClick={deleteRecordKey} className="h-[56px] rounded-[14px] bg-[#f8f8fa] text-[22px] font-medium text-[#1c1c1e] active:bg-[#eaf1ff] transition-colors">
                  删除
                </button>
              </div>
            </div>
          )}
          <div className="space-y-[2px]">{renderFormList()}</div>

          {/* 分类选择器 */}
          {activePicker === 'category' && (
            <div className="bg-[#f4f5f8] rounded-[16px] p-[12px]">
              <div className="flex items-center justify-between mb-[10px]">
                <span className="text-[13px] font-bold text-[#1c1c1e]">选择分类</span>
                <button onClick={() => setActivePicker(null)} className="p-[2px]"><X className="w-[16px] h-[16px] text-[#8e8e93]" /></button>
              </div>
              <div className="grid grid-cols-4 gap-[8px]">
                {(recordActiveTab === '支出' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => {
                  const isSelected = (recordActiveTab === '支出' ? recordCategory : recordCategoryIncome) === cat.name;
                  return (
                    <button key={cat.name} onClick={() => { if (recordActiveTab === '支出') setRecordCategory(cat.name); else setRecordCategoryIncome(cat.name); setActivePicker(null); }} className={`flex flex-col items-center py-[10px] rounded-[12px] transition-all ${isSelected ? 'bg-[#1677ff]' : 'bg-white active:bg-[#f0f5ff]'}`}>
                      <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center mb-[4px]" style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : `${cat.color}22` }}>
                        {React.createElement(cat.icon, { className: `w-[14px] h-[14px]`, style: { color: isSelected ? '#fff' : cat.color } })}
                      </div>
                      <span className={`text-[11px] font-medium ${isSelected ? 'text-white' : 'text-[#3a3a3c]'}`}>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 账户选择器 */}
          {activePicker === 'account' && (
            <div className="bg-[#f4f5f8] rounded-[16px] p-[12px]">
              <div className="flex items-center justify-between mb-[10px]">
                <span className="text-[13px] font-bold text-[#1c1c1e]">选择账户</span>
                <button onClick={() => setActivePicker(null)} className="p-[2px]"><X className="w-[16px] h-[16px] text-[#8e8e93]" /></button>
              </div>
              {accounts.length === 0 ? (
                <div className="py-[12px] text-center text-[#8e8e93] text-[13px]">暂无账户，请先添加</div>
              ) : (
                <div className="space-y-[6px] max-h-[180px] overflow-y-auto hide-scrollbar">
                  {accounts.map((acc) => {
                    const isSelected = recordAccount && (recordAccount.id === acc.id || recordAccount.name === acc.name);
                    return (
                      <button key={acc.id || acc.name} onClick={() => { setRecordAccount(acc); setActivePicker(null); }} className={`w-full flex items-center px-[12px] py-[10px] rounded-[12px] transition-all ${isSelected ? 'bg-[#1677ff]' : 'bg-white active:bg-[#f0f5ff]'}`}>
                        <div className="w-[28px] h-[28px] rounded-full bg-[#f4f5f8] flex items-center justify-center mr-[10px] overflow-hidden shrink-0">
                          <HomeBrandLogo type={acc.icon} size={28} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`text-[13px] font-semibold ${isSelected ? 'text-white' : 'text-[#1c1c1e]'}`}>{acc.name}</div>
                          <div className={`text-[11px] ${isSelected ? 'text-white/70' : 'text-[#8e8e93]'}`}>{acc.balance} {acc.currency}</div>
                        </div>
                        {isSelected && <Check className="w-[16px] h-[16px] text-white shrink-0" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 时间选择器 */}
          {activePicker === 'datetime' && (
            <div className="bg-[#f4f5f8] rounded-[16px] p-[12px]">
              <div className="flex items-center justify-between mb-[10px]">
                <span className="text-[13px] font-bold text-[#1c1c1e]">选择时间</span>
                <button onClick={() => setActivePicker(null)} className="p-[2px]"><X className="w-[16px] h-[16px] text-[#8e8e93]" /></button>
              </div>
              <input type="datetime-local" defaultValue={`${recordDate.getFullYear()}-${String(recordDate.getMonth()+1).padStart(2,'0')}-${String(recordDate.getDate()).padStart(2,'0')}T${String(recordDate.getHours()).padStart(2,'0')}:${String(recordDate.getMinutes()).padStart(2,'0')}`} onChange={(e) => { if (e.target.value) setRecordDate(new Date(e.target.value)); }} className="w-full border border-[#e5e5ea] rounded-[12px] px-[14px] py-[12px] text-[15px] font-medium text-[#1c1c1e] outline-none bg-white focus:border-[#1677ff]" />
              <div className="flex space-x-[8px] mt-[10px]">
                {['今天', '昨天', '本周'].map((label) => {
                  const d = new Date();
                  if (label === '昨天') d.setDate(d.getDate() - 1);
                  else if (label === '本周') d.setDate(d.getDate() - d.getDay() + 1);
                  return <button key={label} onClick={() => { setRecordDate(d); setActivePicker(null); }} className="flex-1 py-[8px] bg-white rounded-[10px] text-[13px] font-medium text-[#1677ff] active:bg-[#f0f5ff] transition-colors">{label}</button>;
                })}
              </div>
            </div>
          )}

          {/* 备注输入 */}
          {activePicker === 'note' && (
            <div className="bg-[#f4f5f8] rounded-[16px] p-[12px]">
              <div className="flex items-center justify-between mb-[10px]">
                <span className="text-[13px] font-bold text-[#1c1c1e]">添加备注</span>
                <button onClick={() => setActivePicker(null)} className="p-[2px]"><X className="w-[16px] h-[16px] text-[#8e8e93]" /></button>
              </div>
              <textarea autoFocus value={recordNote} onChange={(e) => setRecordNote(e.target.value)} placeholder="输入备注内容..." className="w-full border border-[#e5e5ea] rounded-[12px] px-[14px] py-[12px] text-[14px] text-[#1c1c1e] outline-none bg-white resize-none h-[80px] focus:border-[#1677ff]" />
              <button onClick={() => setActivePicker(null)} className="w-full mt-[8px] h-[40px] bg-[#1677ff] text-white rounded-[10px] text-[14px] font-medium active:bg-blue-700 transition-colors">完成</button>
            </div>
          )}

          {/* 标签选择 */}
          {activePicker === 'tag' && (
            <div className="bg-[#f4f5f8] rounded-[16px] p-[12px]">
              <div className="flex items-center justify-between mb-[10px]">
                <span className="text-[13px] font-bold text-[#1c1c1e]">添加标签</span>
                <button onClick={() => setActivePicker(null)} className="p-[2px]"><X className="w-[16px] h-[16px] text-[#8e8e93]" /></button>
              </div>
              <div className="flex flex-wrap gap-[8px]">
                {['日常', '工作', '家庭', '旅行', '朋友', '医疗', '学习', '娱乐'].map((t) => (
                  <button key={t} onClick={() => { setRecordTag(recordTag === t ? '' : t); }} className={`px-[14px] py-[7px] rounded-full text-[13px] font-medium transition-all ${recordTag === t ? 'bg-[#1677ff] text-white' : 'bg-white text-[#3a3a3c] border border-[#e5e5ea] active:bg-[#f0f5ff]'}`}>{t}</button>
                ))}
              </div>
              <button onClick={() => setActivePicker(null)} className="w-full mt-[10px] h-[40px] bg-[#1677ff] text-white rounded-[10px] text-[14px] font-medium active:bg-blue-700 transition-colors">完成</button>
            </div>
          )}

          <div className="flex space-x-[12px] pt-[8px]"><button onClick={closeModals} className="flex-1 h-[44px] rounded-[10px] border border-gray-200 font-medium active:bg-gray-50 transition-colors">取消</button><button onClick={handleSaveRecord} className="flex-1 h-[44px] bg-[#1677ff] text-white rounded-[10px] font-medium active:bg-blue-700 transition-colors">保存</button></div>
        </div>
      </div>

      {/* 预算管理面板 */}
      {activeModal === 'budget' && (
        <>
          <div className="absolute inset-0 bg-black/40 z-[90]" onClick={closeModals} />
          <div className="absolute bottom-[12px] left-0 right-0 bg-[#f4f5f8] rounded-t-[24px] z-[100] shadow-2xl flex flex-col pb-[24px] max-h-[88vh] animate-in slide-in-from-bottom duration-300">
            <div className="bg-white rounded-t-[24px] flex flex-col items-center pt-[10px] pb-[10px] border-b border-[#f0f0f0] shrink-0"><div className="w-[32px] h-[4px] bg-[#e5e5ea] rounded-full mb-[10px]"></div><span className="text-[15px] font-bold">预算管理</span><button onClick={closeModals} className="absolute right-[16px] top-[10px] p-[4px] text-[#c7c7cc]"><X className="w-[20px] h-[20px]" /></button></div>
            <div className="overflow-y-auto hide-scrollbar flex-1 p-[16px] space-y-[14px]">
              <div className="bg-white rounded-[16px] p-[16px] shadow-sm">
                <div className="flex justify-between items-center text-[11px] text-gray-400 mb-[4px]">
                  <span>{selectedMonthLabel} · 总预算 <PenLine className="w-[10px] h-[10px] inline" /></span>
                  <span>本月剩余 <span className={`font-bold ${budgetRemaining >= 0 ? 'text-[#10b981]' : 'text-[#ff3b30]'}`}>{budgetRemaining.toFixed(2)}</span></span>
                </div>
                <div className="text-[24px] font-bold mb-[12px]">{budgetAmount.toLocaleString()}.00 <span className="text-[10px] text-gray-400 ml-[4px]">元</span></div>
                <div className="h-[4px] bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1677ff] transition-all" style={{width: `${Math.min(100, (budgetUsed / budgetAmount) * 100).toFixed(0)}%`}}></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#8e8e93] mt-[6px]">
                  <span>已支出 <span className="text-[#1c1c1e] font-semibold">{budgetUsed.toLocaleString()}</span></span>
                  <span>{((budgetUsed / budgetAmount) * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="bg-white rounded-[12px] px-[12px] overflow-hidden">
                <SettingRow iconBg="bg-[#f0f5ff]" IconElement={<div className="text-[12px] font-bold text-[#1677ff]">¥</div>} label="每月预算金额" value={`${budgetAmount.toLocaleString()}.00`} onClick={() => setIsEditingBudget(!isEditingBudget)} />
                <SettingRow iconBg="bg-[#ecfdf5]" IconElement={<CalendarIcon className="w-[12px] h-[12px] text-[#10b981]" />} label="周期" value={budgetPeriod} onClick={() => setIsBudgetPeriodOpen(!isBudgetPeriodOpen)} />
                <SettingRow iconBg="bg-[#f5f3ff]" IconElement={<Clock className="w-[12px] h-[12px] text-[#8b5cf6]" />} label="生效时间" value={`${selectedYear}年${selectedMonth}月1日`} border={false} />
              </div>

              {isEditingBudget && (
                <div className="bg-white rounded-[12px] p-[14px] space-y-[10px]">
                  <span className="text-[13px] font-bold text-[#1c1c1e]">调整预算金额</span>
                  <div className="flex items-center border border-[#e5e5ea] rounded-[10px] px-[12px] py-[10px] focus-within:border-[#1677ff]">
                    <span className="text-[16px] font-bold text-[#1c1c1e] mr-[6px]">¥</span>
                    <input autoFocus type="text" inputMode="decimal" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} placeholder="输入预算金额" className="flex-1 text-[16px] font-bold text-[#1c1c1e] outline-none bg-transparent" />
                  </div>
                  <div className="flex space-x-[8px]">
                    <button onClick={() => setIsEditingBudget(false)} className="flex-1 h-[38px] rounded-[10px] border border-[#e5e5ea] text-[14px] font-medium active:bg-gray-50">取消</button>
                    <button onClick={() => { const v = Number(budgetInput.replace(/,/g, '')); if (v > 0) { setBudgetAmount(v); setBudgetInput(v.toString()); if (updateBudget) updateBudget(v); } setIsEditingBudget(false); }} className="flex-1 h-[38px] rounded-[10px] bg-[#1677ff] text-white text-[14px] font-medium active:bg-blue-700">确认</button>
                  </div>
                </div>
              )}

              {isBudgetPeriodOpen && (
                <div className="bg-white rounded-[12px] p-[14px]">
                  <span className="text-[13px] font-bold text-[#1c1c1e] block mb-[10px]">选择周期</span>
                  <div className="grid grid-cols-3 gap-[8px]">
                    {['每日', '每周', '每月', '每季度', '每半年', '每年'].map((p) => (
                      <button key={p} onClick={() => { setBudgetPeriod(p); setIsBudgetPeriodOpen(false); }} className={`py-[10px] rounded-[10px] text-[13px] font-medium transition-all ${budgetPeriod === p ? 'bg-[#1677ff] text-white' : 'bg-[#f4f5f8] text-[#3a3a3c] active:bg-[#e5eeff]'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setIsEditingBudget(true)} className="w-full h-[44px] bg-[#1677ff] text-white rounded-[10px] font-medium shadow-lg active:bg-blue-700 transition-colors">调整预算金额</button>
            </div>
          </div>
        </>
      )}

      {/* 转账管理面板 */}
      {activeModal === 'transfer' && (
        <>
          <div className="absolute inset-0 bg-black/40 z-[90]" onClick={closeModals} />
          <div className="absolute bottom-0 left-0 right-0 bg-[#f4f5f8] rounded-t-[24px] z-[100] shadow-2xl flex flex-col pb-[24px] max-h-[90vh] animate-in slide-in-from-bottom duration-300">
            <div className="bg-white rounded-t-[24px] flex flex-col items-center pt-[10px] pb-[10px] border-b border-[#f0f0f0] shrink-0"><div className="w-[32px] h-[4px] bg-[#e5e5ea] rounded-full mb-[10px]"></div><span className="text-[15px] font-bold">转账</span><button onClick={closeModals} className="absolute right-[16px] top-[10px] p-[4px] text-[#c7c7cc]"><X className="w-[20px] h-[20px]" /></button></div>
            <div className="overflow-y-auto hide-scrollbar flex-1 p-[16px] space-y-[12px]">
              <div className="flex items-center justify-center space-x-[4px] text-[#1677ff] py-[4px]"><Info className="w-[12px] h-[12px]" /><span className="text-[11px]">记录资金从一个账户转移到另一个账户</span></div>
              <div className="bg-white rounded-[16px] px-[16px] overflow-hidden">
                <TransferRow label="转出账户" value={transferOutAccount ? transferOutAccount.name : '选择账户'} IconElement={<Wallet className="w-[14px] h-[14px] text-[#10b981]" />} onClick={() => setTransferPickerOpen(transferPickerOpen === 'out' ? null : 'out')} />
                <TransferRow label="转入账户" value={transferInAccount ? transferInAccount.name : '选择账户'} IconElement={<CreditCard className="w-[14px] h-[14px] text-[#8b5cf6]" />} onClick={() => setTransferPickerOpen(transferPickerOpen === 'in' ? null : 'in')} />
                <div className="flex items-center justify-between py-[14px]">
                  <span className="text-[14px] text-[#1c1c1e] shrink-0 w-[70px]">转账金额</span>
                  <input value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="请输入金额" inputMode="decimal" className="flex-1 text-right text-[14px] text-[#1c1c1e] outline-none bg-transparent placeholder:text-[#c7c7cc]" />
                </div>
              </div>

              {/* 转账账户选择器 */}
              {transferPickerOpen && (
                <div className="bg-white rounded-[16px] p-[14px]">
                  <div className="flex items-center justify-between mb-[10px]">
                    <span className="text-[13px] font-bold text-[#1c1c1e]">{transferPickerOpen === 'out' ? '选择转出账户' : '选择转入账户'}</span>
                    <button onClick={() => setTransferPickerOpen(null)} className="p-[2px]"><X className="w-[16px] h-[16px] text-[#8e8e93]" /></button>
                  </div>
                  {accounts.length === 0 ? (
                    <div className="py-[12px] text-center text-[#8e8e93] text-[13px]">暂无账户，请先在资产页面添加</div>
                  ) : (
                    <div className="space-y-[6px] max-h-[200px] overflow-y-auto hide-scrollbar">
                      {accounts.map((acc) => {
                        const selected = transferPickerOpen === 'out' ? transferOutAccount : transferInAccount;
                        const isSelected = selected && (selected.id === acc.id || selected.name === acc.name);
                        return (
                          <button key={acc.id || acc.name} onClick={() => { if (transferPickerOpen === 'out') setTransferOutAccount(acc); else setTransferInAccount(acc); setTransferPickerOpen(null); }} className={`w-full flex items-center px-[12px] py-[10px] rounded-[12px] transition-all ${isSelected ? 'bg-[#1677ff]' : 'bg-[#f4f5f8] active:bg-[#e5eeff]'}`}>
                            <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center mr-[10px] shrink-0 overflow-hidden">
                              <HomeBrandLogo type={acc.icon} size={28} />
                            </div>
                            <div className="flex-1 text-left">
                              <div className={`text-[13px] font-semibold ${isSelected ? 'text-white' : 'text-[#1c1c1e]'}`}>{acc.name}</div>
                              <div className={`text-[11px] ${isSelected ? 'text-white/70' : 'text-[#8e8e93]'}`}>{acc.balance} {acc.currency}</div>
                            </div>
                            {isSelected && <Check className="w-[16px] h-[16px] text-white shrink-0" strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleSaveTransfer} className="w-full h-[44px] bg-[#1677ff] text-white rounded-[10px] font-medium active:bg-blue-700 transition-colors shadow-lg">保存转账</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
