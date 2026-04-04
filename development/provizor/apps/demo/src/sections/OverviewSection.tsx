import { useMemo } from 'react';
import {
  cogsFromMarkup, grossProfit, grossMarginPct,
  opexTotal, ebitda, netProfit, netMarginPct,
  cisProfitability, channelNetMarginPct, realizedMarkupPct,
} from '../lib/formulas';
import { getRAGLevel, RAG_COLORS, ALMATY_DEFAULTS } from '../lib/benchmarks';
import { formatTenge, formatPct, formatCompact } from '../lib/format';

export function OverviewSection() {
  const d = ALMATY_DEFAULTS;

  const calc = useMemo(() => {
    const rev = d.revenuePerPharmacy;
    const cogsVal = cogsFromMarkup(rev, d.markupPct);
    const gpVal = grossProfit(rev, cogsVal);
    const gmPct = grossMarginPct(rev, cogsVal);
    const opex = opexTotal(d.payrollPerPharmacy, d.rentPerPharmacy, d.utilitiesPerPharmacy, d.adminPerPharmacy, d.softwarePerPharmacy, d.marketingPerPharmacy);
    const ebitdaVal = ebitda(gpVal, opex);
    const npVal = netProfit(ebitdaVal, d.depreciation, d.interest, d.taxRate);
    const nmPct = netMarginPct(npVal, rev);
    const cisProf = cisProfitability(d.markupPct, d.daysOfInventory, d.creditorDays, d.debtorDays);
    const markupReal = realizedMarkupPct(rev, cogsVal);

    // Channel analysis
    const channels = [
      { name: 'Оффлайн', ...d.channels.offline },
      { name: 'Halyk Market', ...d.channels.halykMarket },
      { name: 'Wolt Apteka', ...d.channels.wolt },
      { name: 'iTeka', ...d.channels.iteka },
    ];
    const worstChannel = channels.reduce((worst, ch) => {
      const nm = channelNetMarginPct(gmPct, ch.commission, ch.fulfillment);
      return nm < worst.margin ? { name: ch.name, margin: nm } : worst;
    }, { name: '', margin: 100 });

    return {
      rev, gpVal, gmPct, opex, ebitdaVal, npVal, nmPct,
      cisProf, markupReal, worstChannel,
      revChain: rev * 5,
      npChain: npVal * 5,
    };
  }, [d]);

  const cards: CardData[] = [
    {
      title: 'Выручка / мес',
      value: formatCompact(calc.rev),
      subtitle: `Сеть (5 аптек): ${formatCompact(calc.revChain)}`,
      color: '#3b82f6',
      bg: '#eff6ff',
    },
    {
      title: 'Валовая маржа',
      value: formatPct(calc.gmPct),
      subtitle: formatTenge(calc.gpVal),
      benchmarkKey: 'grossMargin',
      numericValue: calc.gmPct,
    },
    {
      title: 'Чистая прибыль',
      value: formatCompact(calc.npVal),
      subtitle: `${formatPct(calc.nmPct)} от выручки · сеть: ${formatCompact(calc.npChain)}/мес`,
      benchmarkKey: 'netMargin',
      numericValue: calc.nmPct,
    },
    {
      title: 'Рентабельность (CIS)',
      value: formatPct(calc.cisProf),
      subtitle: `Наценка ${d.markupPct}% × оборачиваемость ${d.daysOfInventory} дн.`,
      benchmarkKey: 'cisProfitability',
      numericValue: calc.cisProf,
    },
    {
      title: 'Худший канал',
      value: calc.worstChannel.name,
      subtitle: `Чистая маржа: ${formatPct(calc.worstChannel.margin)}`,
      color: calc.worstChannel.margin < 0 ? '#dc2626' : '#ca8a04',
      bg: calc.worstChannel.margin < 0 ? '#fef2f2' : '#fefce8',
    },
    {
      title: 'Наценка vs предел',
      value: 'Норма',
      subtitle: `Наценка ${d.markupPct}%, регулируемых ~${d.regulatedSharePct}%`,
      color: '#16a34a',
      bg: '#f0fdf4',
    },
  ];

  // Insights
  const insights: string[] = [];

  if (calc.worstChannel.margin < 0) {
    insights.push(`Канал ${calc.worstChannel.name} убыточен (${formatPct(calc.worstChannel.margin)}). Комиссии маркетплейса превышают валовую маржу — пересмотрите ассортимент на этом канале.`);
  }

  if (calc.cisProf < 25) {
    insights.push(`Рентабельность ${formatPct(calc.cisProf)} ниже целевой (25%). Ускорение оборачиваемости с ${d.daysOfInventory} до 20 дней даст ${formatPct(cisProfitability(d.markupPct, 20, d.creditorDays, d.debtorDays))}.`);
  } else {
    insights.push(`Рентабельность ${formatPct(calc.cisProf)} — в зелёной зоне. При сокращении DOI с ${d.daysOfInventory} до 20 дней вырастет до ${formatPct(cisProfitability(d.markupPct, 20, d.creditorDays, d.debtorDays))}.`);
  }

  if (calc.nmPct < 4) {
    insights.push(`Чистая маржа ${formatPct(calc.nmPct)} — ниже целевых 4%. Основные рычаги: снижение OPEX (сейчас ${formatCompact(calc.opex)}) или рост наценки на свободные препараты.`);
  }

  insights.push(`Скидки могут незаметно снижать реальную наценку с 30% до 26%. Отслеживание фактической УТН — критично.`);

  return (
    <section className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-800">Ваша аптека сегодня</h2>
        <p className="text-sm text-slate-400 mt-1">1 аптека / месяц · бенчмарки Алматы · наценка {d.markupPct}%</p>
      </div>

      {/* 6 metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <OverviewCard key={i} {...card} />
        ))}
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Рекомендации</h3>
        <div className="space-y-3">
          {insights.map((text, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <p className="text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Context line */}
      <p className="text-xs text-slate-400 text-center">
        Данные предзаполнены бенчмарками аптечного рынка Алматы. Перейдите в другие разделы для детального анализа и настройки.
      </p>
    </section>
  );
}

interface CardData {
  title: string;
  value: string;
  subtitle?: string;
  benchmarkKey?: string;
  numericValue?: number;
  color?: string;
  bg?: string;
}

function OverviewCard({ title, value, subtitle, benchmarkKey, numericValue, color, bg }: CardData) {
  const rag = benchmarkKey && numericValue !== undefined ? getRAGLevel(benchmarkKey, numericValue) : undefined;
  const cardColor = color ?? (rag ? RAG_COLORS[rag] : '#0f172a');
  const cardBg = bg ?? (rag === 'red' ? '#fef2f2' : rag === 'yellow' ? '#fefce8' : rag === 'green' ? '#f0fdf4' : '#ffffff');

  return (
    <div
      className="rounded-xl border p-5 shadow-sm transition-all hover:shadow-md"
      style={{ backgroundColor: cardBg, borderColor: `${cardColor}20` }}
    >
      <div className="text-sm text-slate-500 mb-1">{title}</div>
      <div className="text-3xl font-bold" style={{ color: cardColor }}>{value}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-2">{subtitle}</div>}
    </div>
  );
}
