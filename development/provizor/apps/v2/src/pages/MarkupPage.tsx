import { useState, useMemo } from 'react';
import { KZ_MARKUP_SCALE, maxRegulatedMarkup, maxRegulatedPrice, blendedMarginPct } from '../lib/formulas';
import { formatTenge, formatPct } from '../lib/format';

export function MarkupPage() {
  const [costPrice, setCostPrice] = useState(2500);
  const [regulatedShare, setRegulatedShare] = useState(30);
  const [freeMarkup, setFreeMarkup] = useState(30);

  const check = useMemo(() => {
    const maxMarkup = maxRegulatedMarkup(costPrice);
    const maxPrice = maxRegulatedPrice(costPrice);
    const tier = KZ_MARKUP_SCALE.find(t => costPrice <= t.maxCost);
    return { maxMarkup, maxPrice, tierMax: tier?.maxCost ?? Infinity };
  }, [costPrice]);

  const avgRegMarkup = useMemo(() => {
    // weighted average across typical product mix
    const weights = [
      { cost: 300, weight: 20 },
      { cost: 800, weight: 25 },
      { cost: 2000, weight: 20 },
      { cost: 4000, weight: 15 },
      { cost: 8000, weight: 10 },
      { cost: 15000, weight: 7 },
      { cost: 50000, weight: 3 },
    ];
    const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
    return weights.reduce((s, w) => s + maxRegulatedMarkup(w.cost) * (w.weight / totalWeight), 0);
  }, []);

  const blended = useMemo(() =>
    blendedMarginPct(regulatedShare, avgRegMarkup, freeMarkup),
    [regulatedShare, avgRegMarkup, freeMarkup],
  );

  return (
    <div className="space-y-6">
      {/* Scale Table */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text mb-1">Регрессивная шкала наценок КЗ</h3>
        <p className="text-xs text-text-muted mb-4">Приказ МЗ РК, февраль 2025. Действует с марта 2025.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wide">
                <th className="text-left py-2 px-3">Себестоимость до</th>
                <th className="text-right py-2 px-3">Макс. наценка</th>
                <th className="text-right py-2 px-3">Пример: себест. → цена</th>
              </tr>
            </thead>
            <tbody>
              {KZ_MARKUP_SCALE.map((tier, i) => {
                const isActive = costPrice <= tier.maxCost && (i === 0 || costPrice > KZ_MARKUP_SCALE[i - 1].maxCost);
                const exampleCost = tier.maxCost === Infinity ? 150_000 : Math.round(tier.maxCost * 0.7);
                return (
                  <tr
                    key={i}
                    className={`border-t border-border ${isActive ? 'bg-accent/10' : 'hover:bg-navy/30'}`}
                  >
                    <td className={`py-2.5 px-3 ${isActive ? 'text-accent font-medium' : 'text-text-secondary'}`}>
                      {tier.maxCost === Infinity ? '> 100 000 ₸' : `≤ ${formatTenge(tier.maxCost)}`}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-medium ${isActive ? 'text-accent' : 'text-text'}`}>
                      {tier.markupPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-text-muted text-xs">
                      {formatTenge(exampleCost)} → {formatTenge(exampleCost * (1 + tier.markupPct / 100))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checker + Blended Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Checker */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Проверка наценки</h3>

          <label className="block text-xs text-text-muted mb-1">Себестоимость препарата (₸)</label>
          <input
            type="number"
            value={costPrice}
            onChange={e => setCostPrice(Number(e.target.value) || 0)}
            className="w-full bg-navy border border-border rounded-lg px-4 py-2.5 text-text text-lg font-mono focus:outline-none focus:border-accent mb-4"
          />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Макс. наценка:</span>
              <span className="text-lg font-bold text-accent">{formatPct(check.maxMarkup)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Макс. цена продажи:</span>
              <span className="text-lg font-bold text-text">{formatTenge(check.maxPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Валовая маржа при макс.:</span>
              <span className="text-sm text-text-muted">
                {formatPct(check.maxMarkup / (100 + check.maxMarkup) * 100)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Ступень до:</span>
              <span className="text-sm text-text-muted">
                {check.tierMax === Infinity ? '> 100 000 ₸' : formatTenge(check.tierMax)}
              </span>
            </div>
          </div>
        </div>

        {/* Blended Margin Calculator */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text mb-4">Блендированная маржа</h3>

          <label className="block text-xs text-text-muted mb-1">
            Доля регулируемых в выручке: {regulatedShare}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={regulatedShare}
            onChange={e => setRegulatedShare(Number(e.target.value))}
            className="w-full mb-4 accent-accent"
          />

          <label className="block text-xs text-text-muted mb-1">
            Наценка на свободные препараты: {freeMarkup}%
          </label>
          <input
            type="range"
            min={10}
            max={60}
            value={freeMarkup}
            onChange={e => setFreeMarkup(Number(e.target.value))}
            className="w-full mb-4 accent-accent"
          />

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Ср. наценка регул.:</span>
              <span className="text-sm text-warning font-medium">{formatPct(avgRegMarkup)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Наценка свободных:</span>
              <span className="text-sm text-success font-medium">{formatPct(freeMarkup)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-semibold text-text">Блендированная маржа:</span>
              <span className="text-2xl font-bold text-accent">{formatPct(blended)}</span>
            </div>
          </div>

          <p className="text-xs text-text-muted mt-4">
            При {regulatedShare}% регулируемых и {100 - regulatedShare}% свободных
            с наценкой {freeMarkup}%, итоговая валовая маржа составит {formatPct(blended)}.
          </p>
        </div>
      </div>
    </div>
  );
}
