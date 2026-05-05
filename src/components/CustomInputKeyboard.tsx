import { createPortal } from 'react-dom';

type KeyboardMode = 'number' | 'text';

type CustomInputKeyboardProps = {
  open: boolean;
  label: string;
  value: string;
  onClose: () => void;
  onChange: (nextValue: string) => void;
  mode?: KeyboardMode;
  suffix?: string;
  placeholder?: string;
  quickActions?: Array<string | number>;
};

const NUMBER_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];
const TEXT_KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export default function CustomInputKeyboard({
  open,
  label,
  value,
  onClose,
  onChange,
  mode = 'number',
  suffix = '',
  placeholder = '',
  quickActions = [],
}: CustomInputKeyboardProps) {
  if (!open) return null;

  const displayValue = value || (mode === 'number' ? '0' : placeholder || '点击输入');

  const appendText = (nextChunk: string) => {
    onChange(`${value || ''}${nextChunk}`);
  };

  const applyNumberKey = (key: string) => {
    const currentValue = String(value || '');
    if (key === 'delete') {
      onChange(currentValue.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (currentValue.includes('.')) return;
      onChange(currentValue ? `${currentValue}.` : '0.');
      return;
    }
    if (currentValue === '0' && !currentValue.includes('.')) {
      onChange(key);
      return;
    }
    onChange(`${currentValue}${key}`);
  };

  const overlay = (
    <div className="fixed inset-0 z-[260] flex items-end justify-center" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" onClick={onClose} style={{ touchAction: 'none' }}></div>
      <div className="relative w-full max-w-[430px] rounded-t-[24px] bg-white px-[16px] pt-[10px] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
        <div className="mx-auto mb-[12px] h-[4px] w-[36px] rounded-full bg-[#e5e5ea]"></div>
        <div className="mb-[14px] flex items-start justify-between space-x-[12px]">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium text-[#8e8e93]">{label}</div>
            <div className="mt-[2px] flex items-baseline space-x-[4px] min-w-0">
              <span className="truncate text-[24px] font-bold text-[#1c1c1e]">{displayValue}</span>
              {suffix ? <span className="text-[12px] font-semibold text-[#8e8e93]">{suffix}</span> : null}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full bg-[#f4f5f8] px-[12px] py-[8px] text-[13px] font-semibold text-[#5c5c5e] active:bg-[#e9e9ee] transition-colors">
            完成
          </button>
        </div>

        {mode === 'number' ? (
          <div className="space-y-[10px]">
            {quickActions.length > 0 ? (
              <div className="grid grid-cols-4 gap-[8px]">
                {quickActions.map((item) => (
                  <button
                    key={String(item)}
                    onClick={() => {
                      const current = parseFloat(String(value || '0')) || 0;
                      const next = current + Number(item);
                      onChange(Number.isInteger(next) ? String(next) : next.toFixed(2));
                    }}
                    className="h-[40px] rounded-[12px] border border-[#e5e5ea] bg-white text-[14px] font-medium text-[#1c1c1e] active:bg-[#f4f8ff] transition-colors"
                  >
                    +{item}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-[10px]">
              {NUMBER_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => applyNumberKey(key)}
                  className="h-[52px] rounded-[14px] bg-[#f4f5f8] text-[22px] font-bold text-[#1c1c1e] active:bg-[#e6edf9] transition-colors"
                >
                  {key}
                </button>
              ))}
              <button
                onClick={() => applyNumberKey('delete')}
                className="h-[52px] rounded-[14px] bg-[#f4f5f8] text-[15px] font-semibold text-[#1c1c1e] active:bg-[#e6edf9] transition-colors flex items-center justify-center"
              >
                删除
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-[10px]">
            {quickActions.length > 0 ? (
              <div className="flex flex-wrap gap-[8px]">
                {quickActions.map((item) => (
                  <button
                    key={String(item)}
                    onClick={() => appendText(String(item))}
                    className="rounded-full bg-[#f4f5f8] px-[12px] py-[8px] text-[13px] font-medium text-[#1c1c1e] active:bg-[#e6edf9] transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}

            {TEXT_KEY_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="grid gap-[8px]" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => appendText(key)}
                    className="h-[44px] rounded-[12px] bg-[#f4f5f8] text-[16px] font-semibold text-[#1c1c1e] active:bg-[#e6edf9] transition-colors"
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}

            <div className="grid grid-cols-[80px_minmax(0,1fr)_80px] gap-[8px]">
              <button
                onClick={() => onChange('')}
                className="h-[46px] rounded-[12px] bg-[#f4f5f8] text-[14px] font-semibold text-[#8e8e93] active:bg-[#e6edf9] transition-colors"
              >
                清空
              </button>
              <button
                onClick={() => appendText(' ')}
                className="h-[46px] rounded-[12px] bg-[#f4f5f8] text-[14px] font-semibold text-[#1c1c1e] active:bg-[#e6edf9] transition-colors"
              >
                空格
              </button>
              <button
                onClick={() => onChange(String(value || '').slice(0, -1))}
                className="h-[46px] rounded-[12px] bg-[#f4f5f8] text-[14px] font-semibold text-[#1c1c1e] active:bg-[#e6edf9] transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return overlay;
  return createPortal(overlay, document.body);
}
