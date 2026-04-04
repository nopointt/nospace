import { useState } from 'react';
import { cisProfitability } from '../lib/formulas';
import { getRAGLevel, RAG_COLORS, ALMATY_DEFAULTS } from '../lib/benchmarks';
import { formatPct } from '../lib/format';
import { InputField } from '../components/InputField';
import { SettingsPanel } from '../components/SettingsPanel';

export function HeroSection() {
  const [markup, setMarkup] = useState(ALMATY_DEFAULTS.markupPct);
  const [doi, setDoi] = useState(ALMATY_DEFAULTS.daysOfInventory);
  const [credDays, setCredDays] = useState(ALMATY_DEFAULTS.creditorDays);
  const [debDays, setDebDays] = useState(ALMATY_DEFAULTS.debtorDays);

  const profitability = cisProfitability(markup, doi, credDays, debDays);
  const rag = getRAGLevel('cisProfitability', profitability);

  const doiVariants = [15, 20, 25, 30, 35, 40, 45];
  const markupVariants = [20, 25, 30, 35];

  return (
    <section className="space-y-6">
      {/* Hero number — immediately visible */}
      <div className="text-center">
        <h2 className="text-lg font-medium text-slate-500 mb-2">Рентабельность вложенных средств</h2>
        <div
          className="text-7xl font-bold transition-colors"
          style={{ color: RAG_COLORS[rag] }}
        >
          {formatPct(profitability)}
        </div>
        <p className="text-sm text-slate-400 mt-2">
          CIS Profitability — как эффективно работают вложенные в товар деньги
        </p>
      </div>

      {/* Current parameters summary — always visible, compact */}
      <div className="flex justify-center gap-6 text-sm text-slate-500">
        <span>Наценка <strong className="text-slate-700">{markup}%</strong></span>
        <span>Запас <strong className="text-slate-700">{doi} дн.</strong></span>
        <span>Отсрочка <strong className="text-slate-700">{credDays} дн.</strong></span>
        {debDays > 0 && <span>Задержка <strong className="text-slate-700">{debDays} дн.</strong></span>}
      </div>

      {/* Settings — collapsed */}
      <SettingsPanel label="Изменить параметры">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InputField label="Наценка" value={markup} onChange={setMarkup} suffix="%" />
          <InputField label="Дни запаса (DOI)" value={doi} onChange={setDoi} suffix="дн." />
          <InputField label="Отсрочка поставщика" value={credDays} onChange={setCredDays} suffix="дн." />
          <InputField label="Задержка оплаты (маркетплейсы)" value={debDays} onChange={setDebDays} suffix="дн." />
        </div>
      </SettingsPanel>

      {/* Matrix — collapsible */}
      <SettingsPanel label="Матрица: Наценка × Оборачиваемость → Рентабельность">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-slate-500 font-medium">DOI ↓ / Наценка →</th>
              {markupVariants.map(m => (
                <th key={m} className="py-2 px-3 text-center text-slate-500 font-medium">{m}%</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doiVariants.map(d => (
              <tr key={d} className="border-t border-slate-100">
                <td className="py-2 px-3 text-slate-600 font-medium">{d} дн.</td>
                {markupVariants.map(m => {
                  const val = cisProfitability(m, d, credDays, debDays);
                  const level = getRAGLevel('cisProfitability', val);
                  const isActive = d === doi && m === markup;
                  return (
                    <td
                      key={m}
                      className={`py-2 px-3 text-center font-medium rounded ${isActive ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                      style={{ color: RAG_COLORS[level] }}
                    >
                      {formatPct(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-3">
          При наценке {markup}% и оборачиваемости {doi} дней ваша рентабельность: <strong style={{ color: RAG_COLORS[rag] }}>{formatPct(profitability)}</strong>.
          {profitability < 25 && ' Цель: >25% (зелёная зона).'}
        </p>
      </SettingsPanel>
    </section>
  );
}
