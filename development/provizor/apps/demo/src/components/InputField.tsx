interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function InputField({ label, value, onChange, suffix, min = 0, max, step = 1 }: Props) {
  return (
    <div>
      <label className="block text-sm text-slate-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {suffix && <span className="text-sm text-slate-400 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );
}
