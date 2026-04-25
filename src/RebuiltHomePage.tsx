// @ts-nocheck
import React, { useMemo, useRef, useState } from 'react';
import { 
  Search, Bell, Calendar as CalendarIcon, ChevronDown, Eye, ArrowUpRight, 
  PenLine, PieChart as PieChartIcon, ArrowRightLeft, Mic, Home, FileText, 
  PieChart, Wallet, ChevronRight, X, Camera, Utensils, Clock, Tag, 
  XCircle, Delete, Briefcase, CreditCard, Info, Check, Sparkles, ShoppingBag, Gamepad2, MoreHorizontal, ChevronLeft
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

export default function RebuiltHomePage({ setIsMessageCenterOpen, transactions = [], createTransaction, onOpenBills, onOpenProfile, onOpenSearch }) {
  const [activeModal, setActiveModal] = useState(null); // 'record' | 'budget' | 'transfer' | 'ai'
  const [isRecording, setIsRecording] = useState(false);
  const [recordActiveTab, setRecordActiveTab] = useState('支出');
  const [showInlineKeyboard, setShowInlineKeyboard] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('月');
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [selectedYear, setSelectedYear] = useState(2026);
  const pressTimer = useRef(null);

  const budgetTotal = 20000;
  const budgetUsed = 10653.28;
  const budgetRemaining = budgetTotal - budgetUsed;
  const [transferData, setTransferData] = useState({ out: '招商银行', in: '支付宝', amount: '' });
  const yearOptions = useMemo(() => Array.from({ length: 9 }, (_, index) => selectedYear - 4 + index), [selectedYear]);
  const selectedMonthLabel = `${selectedYear}年${selectedMonth}月`;
  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.fullDate.replace(/年|月/g, '-').replace('日', '')).getTime() - new Date(a.fullDate.replace(/年|月/g, '-').replace('日', '')).getTime()).slice(0, 5),
    [transactions]
  );

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
  };

  const saveTransaction = async (payload) => {
    if (!createTransaction) return;
    await createTransaction(payload);
    closeModals();
  };

  const handleSaveRecord = async () => {
    const amount = Number(inputValue || 0);
    if (!amount) return;
    const now = new Date();
    const { dateLabel, fullDate, time } = formatTransactionDate(now);
    const isIncome = recordActiveTab === '收入';
    await saveTransaction({
      dateLabel,
      iconBg: isIncome ? 'bg-[#fff7e6]' : 'bg-[#1677ff]',
      iconType: isIncome ? 'landmark' : 'alipay',
      title: isIncome ? '工资入账' : '餐饮支出',
      subtitle: isIncome ? '招商银行' : '钱包 (CNY)',
      tag: isIncome ? '理财' : '购物',
      tagType: isIncome ? 'investment' : 'shopping',
      amount: `${isIncome ? '+' : '-'}${formatMoney(amount)}`,
      isIncome,
      time,
      fullDate,
      currency: 'CNY',
      paymentMethod: isIncome ? '招商银行' : '钱包',
      note: isIncome ? '发工资啦！' : '餐饮'
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
    const amount = Number(transferData.amount || 0);
    if (!amount) return;
    const now = new Date();
    const { dateLabel, fullDate, time } = formatTransactionDate(now);
    await saveTransaction({
      dateLabel,
      iconBg: 'bg-[#8b5cf6]',
      iconType: 'landmark',
      title: `${transferData.out} 转入 ${transferData.in}`,
      subtitle: transferData.out,
      tag: '转账',
      tagType: 'transfer',
      amount: `-${formatMoney(amount)}`,
      isIncome: false,
      time,
      fullDate,
      currency: 'CNY',
      paymentMethod: transferData.out,
      note: '账户转账'
    });
  };

  const changeCalendarYear = (delta) => setSelectedYear((prev) => prev + delta);

  const renderFormList = () => {
    if (recordActiveTab === '支出') {
      return (
        <>
          <FormRow Icon={Utensils} iconBg="bg-[#f0f5ff]" iconColor="text-[#1677ff]" label="分类" value="餐饮" />
          <FormRow Icon={Wallet} iconBg="bg-[#ecfdf5]" iconColor="text-[#10b981]" label="账户" value="钱包 (CNY)" />
          <FormRow Icon={Clock} iconBg="bg-[#f5f3ff]" iconColor="text-[#8b5cf6]" label="时间" value="2026年4月30日 09:41" />
          <FormRow Icon={FileText} iconBg="bg-[#fff7e6]" iconColor="text-[#fa8c16]" label="备注" value="点击输入" valueColor="text-gray-300" />
          <FormRow Icon={Tag} iconBg="bg-[#f4f5f8]" iconColor="text-[#8e8e93]" label="标签" value="+ 添加标签" valueColor="text-[#1677ff]" border={false} />
        </>
      );
    } else {
      return (
        <>
          <FormRow Icon={Briefcase} iconBg="bg-[#fff7e6]" iconColor="text-[#fa8c16]" label="分类" value="工资" />
          <FormRow Icon={CreditCard} iconBg="bg-[#f0f5ff]" iconColor="text-[#1677ff]" label="账户" value="招商银行" />
          <FormRow Icon={Clock} iconBg="bg-[#f5f3ff]" iconColor="text-[#8b5cf6]" label="时间" value="2026年4月30日 09:41" />
          <FormRow Icon={FileText} iconBg="bg-[#ecfdf5]" iconColor="text-[#10b981]" label="备注" value="发工资啦！" border={false} />
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
          <div className="flex items-center space-x-[6px] text-[#8e8e93] mb-[8px]"><span className="text-[12px]">本月结余 (CNY)</span><Eye className="w-[14px] h-[14px]" /></div>
          <div className="text-[38px] font-bold text-[#1677ff] tracking-tight leading-none mb-[12px]">40,446.45</div>
          <div className="flex items-center text-[11px]"><span className="text-[#8e8e93] mr-[6px]">较上月</span><span className="text-[#1677ff] flex items-center font-medium"><ArrowUpRight className="w-[12px] h-[12px] mr-[1px]" /> 20.1%</span></div>
          <div className="absolute bottom-0 right-0 w-[60%] h-[80px] pointer-events-none opacity-80">
            <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="none"><path d="M-10,65 C20,65 30,75 50,60 C70,45 80,65 100,50 C120,35 140,55 160,25 C175,5 190,15 210,10" fill="none" stroke="#1677ff" strokeWidth="2.5" strokeLinecap="round" /></svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[12px]">
          <div className="bg-white rounded-[20px] p-[14px] shadow-sm"><div className="text-[11px] text-[#8e8e93] mb-[4px]">本月收入</div><div className="text-[20px] font-bold text-[#10b981] mb-[6px]">47,556.16</div><div className="flex items-center text-[10px] text-[#10b981] font-medium"><ArrowUpRight className="w-[10px] h-[10px]" /> 18.7%</div></div>
          <div className="bg-white rounded-[20px] p-[14px] shadow-sm"><div className="text-[11px] text-[#8e8e93] mb-[4px]">本月支出</div><div className="text-[20px] font-bold text-[#ff3b30] mb-[6px]">7,109.71</div><div className="flex items-center text-[10px] text-[#ff3b30] font-medium"><ArrowUpRight className="w-[10px] h-[10px]" /> 13.2%</div></div>
        </div>

        <div className="flex justify-between items-center px-[12px] py-[6px]">
          <div onClick={() => setActiveModal('record')} className="flex flex-col items-center space-y-[6px] cursor-pointer active:scale-90 transition-transform"><div className="w-[44px] h-[44px] bg-[#1677ff] rounded-full flex items-center justify-center shadow-md shadow-blue-100/50"><PenLine className="w-[20px] h-[20px] text-white" /></div><span className="text-[11px] font-medium text-[#1c1c1e]">记一笔</span></div>
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
              总预算 <span className="font-semibold text-[#1c1c1e]">20,000.00</span> CNY
            </div>
            <div className="flex-1 mb-[10px]">
              <div className="h-[4px] bg-[#f0f0f0] rounded-full overflow-hidden mb-[4px]">
                <div className="h-full bg-[#1677ff] rounded-full" style={{ width: '53%' }}></div>
              </div>
              <div className="text-right text-[11px] font-bold text-[#1677ff]">53%</div>
            </div>
            <div className="space-y-[3px]">
              <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center text-[#3a3a3c]"><div className="w-[4px] h-[4px] rounded-full bg-[#1677ff] mr-[6px]"></div>已支出</div>
                <span className="font-semibold text-[#1c1c1e]">10,653.28</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center text-[#8e8e93]"><div className="w-[4px] h-[4px] rounded-full bg-[#e5e5ea] mr-[6px]"></div>剩余额度</div>
                <span className="font-semibold text-[#3a3a3c]">9,346.72</span>
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
              <div className="w-[58px] h-[58px] shrink-0 relative"><DonutChart /></div>
              <div className="flex-1 flex flex-col justify-center space-y-[3px] ml-[10px] overflow-hidden">
                {[
                  {c:'bg-[#1677ff]',l:'餐饮',v:'31.8%'},
                  {c:'bg-[#8b5cf6]',l:'交通',v:'20.4%'},
                  {c:'bg-[#10b981]',l:'购物',v:'16.7%'},
                  {c:'bg-[#fbbf24]',l:'娱乐',v:'13.5%'},
                  {c:'bg-[#f59e0b]',l:'理财',v:'9.6%'},
                  {c:'bg-[#e5e7eb]',l:'其他',v:'8.0%'}
                ].slice(0, 4).map((x,i)=>(
                  <div key={i} className="flex justify-between items-center text-[9px]">
                    <div className="flex items-center truncate pr-1">
                      <div className={`w-[3px] h-[3px] rounded-full ${x.c} mr-[4px] shrink-0`}></div>
                      <span className="truncate">{x.l}</span>
                    </div>
                    <span className="text-[#8e8e93] shrink-0">{x.v}</span>
                  </div>
                ))}
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
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-[100] transition-transform duration-300 ease-out shadow-2xl flex flex-col ${activeModal === 'record' ? 'translate-y-0' : 'translate-y-full opacity-0'}`}>
        <div className="flex flex-col items-center pt-[10px] pb-[8px] border-b border-[#f0f0f0]"><div className="w-[32px] h-[4px] bg-[#e5e5ea] rounded-full mb-[8px]"></div><span className="text-[15px] font-bold">记一笔</span><button onClick={closeModals} className="absolute right-[16px] top-[10px] p-[4px] text-[#c7c7cc]"><X className="w-[20px] h-[20px]" /></button></div>
        <div className="p-[16px] space-y-[16px]">
          <div className="flex space-x-[20px] border-b border-gray-50 pb-[8px]">{['支出','收入'].map(tab=>(<button key={tab} onClick={()=>setRecordActiveTab(tab)} className={`text-[15px] font-medium relative ${recordActiveTab===tab?'text-[#1677ff]':'text-gray-400'}`}>{tab}{recordActiveTab===tab && <div className="absolute -bottom-[10px] left-0 right-0 h-[2px] bg-[#1677ff]"></div>}</button>))}</div>
          <div className="flex items-center justify-between border-b border-gray-50 py-[10px]">
            <span className="text-[20px] font-bold text-[#1c1c1e]">¥</span>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="请输入金额"
              inputMode="decimal"
              className="flex-1 ml-[10px] bg-transparent text-[20px] font-bold text-[#1c1c1e] outline-none placeholder:text-gray-300"
            />
            <Camera className="w-[20px] h-[20px] text-gray-400" />
          </div>
          <div className="space-y-[2px]">{renderFormList()}</div>
          <div className="flex space-x-[12px] pt-[8px]"><button onClick={closeModals} className="flex-1 h-[44px] rounded-[10px] border border-gray-200 font-medium active:bg-gray-50 transition-colors">取消</button><button onClick={handleSaveRecord} className="flex-1 h-[44px] bg-[#1677ff] text-white rounded-[10px] font-medium active:bg-blue-700 transition-colors">保存</button></div>
        </div>
      </div>

      {/* 预算管理面板 */}
      <div className={`absolute inset-0 bg-black/40 z-[90] transition-opacity duration-300 ${activeModal === 'budget' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeModals} />
      <div className={`absolute bottom-0 left-0 right-0 bg-[#f4f5f8] rounded-t-[24px] z-[100] transition-transform duration-300 ease-out shadow-2xl flex flex-col pb-[24px] ${activeModal === 'budget' ? 'translate-y-0' : 'translate-y-full opacity-0'}`}>
        <div className="bg-white rounded-t-[24px] flex flex-col items-center pt-[10px] pb-[10px] border-b border-[#f0f0f0]"><div className="w-[32px] h-[4px] bg-[#e5e5ea] rounded-full mb-[10px]"></div><span className="text-[15px] font-bold">预算管理</span><button onClick={closeModals} className="absolute right-[16px] top-[10px] p-[4px] text-[#c7c7cc]"><X className="w-[20px] h-[20px]" /></button></div>
        <div className="p-[16px] space-y-[14px]">
          <div className="bg-white rounded-[16px] p-[16px] shadow-sm"><div className="flex justify-between items-center text-[11px] text-gray-400 mb-[4px]"><span>2026年4月 · 总预算 <PenLine className="w-[10px] h-[10px] inline" /></span><span>本月剩余 <span className="text-[#10b981] font-bold">{budgetRemaining.toFixed(2)}</span></span></div><div className="text-[24px] font-bold mb-[12px]">{budgetTotal.toLocaleString()}.00 <span className="text-[10px] text-gray-400 ml-[4px]">CNY</span></div><div className="h-[4px] bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#1677ff]" style={{width:'53%'}}></div></div></div>
          <div className="bg-white rounded-[12px] px-[12px] overflow-hidden"><SettingRow iconBg="bg-[#f0f5ff]" IconElement={<div className="text-[12px] font-bold text-[#1677ff]">¥</div>} label="每月预算金额" value={`${budgetTotal.toLocaleString()}.00`} /><SettingRow iconBg="bg-[#ecfdf5]" IconElement={<CalendarIcon className="w-[12px] h-[12px] text-[#10b981]" />} label="周期" value="每月" /><SettingRow iconBg="bg-[#f5f3ff]" IconElement={<Clock className="w-[12px] h-[12px] text-[#8b5cf6]" />} label="生效时间" value="2026年4月1日" border={false} /></div>
          <button className="w-full h-[44px] bg-[#1677ff] text-white rounded-[10px] font-medium shadow-lg active:bg-blue-700 transition-colors">调整预算金额</button>
        </div>
      </div>

      {/* 转账管理面板 */}
      <div className={`absolute inset-0 bg-black/40 z-[90] transition-opacity duration-300 ${activeModal === 'transfer' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeModals} />
      <div className={`absolute bottom-0 left-0 right-0 bg-[#f4f5f8] rounded-t-[24px] z-[100] transition-transform duration-300 ease-out shadow-2xl flex flex-col pb-[24px] ${activeModal === 'transfer' ? 'translate-y-0' : 'translate-y-full opacity-0'}`}>
        <div className="bg-white rounded-t-[24px] flex flex-col items-center pt-[10px] pb-[10px] border-b border-[#f0f0f0]"><div className="w-[32px] h-[4px] bg-[#e5e5ea] rounded-full mb-[10px]"></div><span className="text-[15px] font-bold">转账</span><button onClick={closeModals} className="absolute right-[16px] top-[10px] p-[4px] text-[#c7c7cc]"><X className="w-[20px] h-[20px]" /></button></div>
        <div className="p-[16px] space-y-[12px]">
          <div className="flex items-center justify-center space-x-[4px] text-[#1677ff] py-[4px]"><Info className="w-[12px] h-[12px]" /><span className="text-[11px]">记录资金从一个账户转移到另一个账户</span></div>
          <div className="bg-white rounded-[16px] px-[16px] overflow-hidden">
            <TransferRow label="转出账户" value={transferData.out} IconElement={<Wallet className="w-[14px] h-[14px] text-[#10b981]" />} />
            <TransferRow label="转入账户" value={transferData.in} IconElement={<CreditCard className="w-[14px] h-[14px] text-[#8b5cf6]" />} />
            <div className="flex items-center justify-between py-[14px]">
              <span className="text-[14px] text-[#1c1c1e] shrink-0 w-[70px]">转账金额</span>
              <input value={transferData.amount} onChange={(e) => setTransferData((prev) => ({ ...prev, amount: e.target.value }))} placeholder="请输入金额" className="flex-1 text-right text-[14px] text-[#1c1c1e] outline-none bg-transparent placeholder:text-[#c7c7cc]" />
            </div>
          </div>
          <button onClick={handleSaveTransfer} className="w-full h-[44px] bg-[#1677ff] text-white rounded-[10px] font-medium active:bg-blue-700 transition-colors shadow-lg">保存转账</button>
        </div>
      </div>
    </div>
  );
}
