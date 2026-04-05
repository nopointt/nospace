// Provizor — Comprehensive Roadmap Page
// Data sourced from 11 research files (6,600+ lines), 5 voice transcripts, competitive audit

// ─── Domain Cards ────────────────────────────────────────────

const DOMAINS = [
  {
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    title: 'Care as a Service',
    subtitle: 'Telegram-бот',
    description: 'Личный фармацевт-терапевт. Ассортимент, цены, наличие, консультация. RAG без галлюцинаций. STT на казахском для пенсионеров.',
    color: '#38bdf8',
  },
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    title: 'Аналитика ассортимента',
    subtitle: 'Дефектура + Оборачиваемость',
    description: 'Что покупать, сколько хранить, что списывать. ABC/XYZ матрица, сроки годности, упущенная прибыль.',
    color: '#22c55e',
  },
  {
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Ценообразование',
    subtitle: 'Мониторинг + Автоценообразование',
    description: 'Парсинг конкурентов (iTeka), госреестры предельных цен, оптимальная цена по формуле.',
    color: '#eab308',
  },
  {
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    title: 'Unit-экономика',
    subtitle: 'P&L + CIS Profitability',
    description: 'Финмодель по каждой аптеке. Рентабельность, каналы продаж, наценки КЗ, кассовые разрывы.',
    color: '#a78bfa',
  },
];

// ─── Progress Stats ──────────────────────────────────────────

const PROGRESS_STATS = [
  { value: '40', label: 'формул', detail: 'F-01 — F-39' },
  { value: '12', label: 'таблиц PG', detail: 'PostgreSQL v1.0' },
  { value: '8', label: 'страниц', detail: 'dashboard V2' },
  { value: '11', label: 'исследований', detail: '6,600+ строк' },
  { value: '7', label: 'конкурентов', detail: 'полный аудит' },
];

// ─── Phases ──────────────────────────────────────────────────

interface Phase {
  id: number;
  title: string;
  status: 'done' | 'active' | 'next' | 'planned';
  period: string;
  description: string;
  deliverables: readonly { text: string; done: boolean }[];
  kpi?: string;
}

const PHASES: Phase[] = [
  {
    id: 1,
    title: 'Unit-экономика + Дефектура + Оборачиваемость',
    status: 'active',
    period: 'Апрель 2026',
    description: 'Финмодель аптечной сети на mock-данных. Dashboard с P&L, SKU-аналитикой, каналами, дефектурой, оборачиваемостью.',
    deliverables: [
      { text: 'Dashboard — 9 метрик + графики', done: true },
      { text: 'P&L по 5 аптекам (expandable)', done: true },
      { text: 'Аналитика SKU — пагинация, фильтры, CSV', done: true },
      { text: 'Каналы — offline vs Halyk vs Wolt vs iTeka', done: true },
      { text: 'Наценки КЗ — регрессивная шкала 11 тиров', done: true },
      { text: 'Дефектура — журнал, рецидивисты, тренд', done: true },
      { text: 'Оборачиваемость — DOI, ITR, ABC/XYZ, expiry risk', done: true },
      { text: 'Deploy на Hetzner', done: false },
    ],
    kpi: 'Build < 500ms, 0 TS ошибок',
  },
  {
    id: 2,
    title: 'Telegram-бот MVP — Care as a Service',
    status: 'next',
    period: 'Май 2026',
    description: 'Бот вместо звонков и WhatsApp. Ассортимент 6-7K позиций, цены, наличие в реальном времени.',
    deliverables: [
      { text: 'Поиск по ассортименту (МНН + торговое)', done: false },
      { text: 'Наличие + цена по аптекам', done: false },
      { text: 'Conversational UX — выявление потребностей', done: false },
      { text: 'Маршрутизация к терапевту (критичные случаи)', done: false },
      { text: 'Фиксация дефектуры из чата', done: false },
    ],
    kpi: '< 3 сек ответ, 80% запросов без фармацевта',
  },
  {
    id: 3,
    title: '1С интеграция — реальные данные',
    status: 'planned',
    period: 'Июнь 2026',
    description: 'OData/HTTP sync из 1С. Мультитенант на 5 аптек. Замена mock-данных на реальные продажи, остатки, закупки.',
    deliverables: [
      { text: 'OData sync каждый час (продажи + остатки)', done: false },
      { text: 'SKU master — 6-7K позиций из 1С', done: false },
      { text: 'Мультитенант — 5 аптек, 1 dashboard', done: false },
      { text: 'Импорт исторических данных (12 мес)', done: false },
      { text: 'Автоматическая ABC/XYZ классификация', done: false },
    ],
    kpi: 'Расхождение данных < 0.1%',
  },
  {
    id: 4,
    title: 'Аналитика ассортимента + Ценообразование',
    status: 'planned',
    period: 'Июль — Август 2026',
    description: 'Автоматический заказ, мониторинг конкурентов, госреестр предельных цен. Персональный ассортимент по каждой точке.',
    deliverables: [
      { text: 'Автоматические точки заказа (ROP)', done: false },
      { text: 'Парсинг iTeka — цены конкурентов', done: false },
      { text: 'Госреестр NDDA — 5,408 регулируемых SKU', done: false },
      { text: 'Compliance monitor — превышение потолков', done: false },
      { text: 'Сезонное прогнозирование (Holt-Winters)', done: false },
      { text: 'Межаптечная видимость остатков', done: false },
    ],
    kpi: 'DOI сети: 60 дн → 35 дн',
  },
  {
    id: 5,
    title: 'Commerce — заказы, оплата, доставка',
    status: 'planned',
    period: 'Q3 2026',
    description: 'Полный цикл покупки через бота. Kaspi Pay, заказ из ассортимента, доставка курьером.',
    deliverables: [
      { text: 'Каталог в боте с корзиной', done: false },
      { text: 'Kaspi Pay — оплата в боте', done: false },
      { text: 'Вызов курьера (ручной → авто)', done: false },
      { text: 'Подписка на курсовые препараты', done: false },
      { text: 'RAG-система — консультация с источниками', done: false },
      { text: 'STT на казахском (Groq Whisper)', done: false },
    ],
    kpi: 'Конверсия бот → покупка > 15%',
  },
  {
    id: 6,
    title: 'SaaS — продукт для других аптечных сетей',
    status: 'planned',
    period: 'Q4 2026',
    description: 'Мультитенант-онбординг, подписочная модель. Отработано на данных Алимхана → продаём другим аптекам КЗ.',
    deliverables: [
      { text: 'Мультитенант онбординг (self-service)', done: false },
      { text: 'Подписка $50-150/мес/аптека', done: false },
      { text: 'Документация + база знаний', done: false },
      { text: 'Бальная система лояльности', done: false },
    ],
    kpi: '3+ платящих сети',
  },
];

const STATUS_STYLES = {
  done: { bg: 'bg-success/20', text: 'text-success', dot: 'bg-success', label: 'Готово' },
  active: { bg: 'bg-accent/20', text: 'text-accent', dot: 'bg-accent', label: 'Сейчас' },
  next: { bg: 'bg-warning/20', text: 'text-warning', dot: 'bg-warning', label: 'Следующий' },
  planned: { bg: 'bg-navy-lighter/50', text: 'text-text-muted', dot: 'bg-text-muted', label: 'Запланирован' },
};

// ─── Competitive Positioning ─────────────────────────────────

const COMPETITORS = ['Provizor', 'InfoApteka', 'SmartApteka', 'MedElement', 'Heado'];

interface PositioningRow {
  feature: string;
  values: readonly (boolean | string)[];
  highlight?: boolean;
}

const POSITIONING: PositioningRow[] = [
  { feature: 'Per-location P&L', values: [true, false, false, false, false] },
  { feature: 'Мультиканальная маржа', values: [true, false, false, false, false], highlight: true },
  { feature: 'CIS Profitability %', values: [true, false, false, false, false], highlight: true },
  { feature: 'КЗ регуляция наценок', values: [true, true, false, false, false] },
  { feature: 'Дефектура + Fill Rate', values: [true, 'Частично', true, false, false] },
  { feature: 'ABC/XYZ анализ', values: [true, true, true, false, false] },
  { feature: 'Web-native (не Windows)', values: [true, false, false, true, true] },
  { feature: 'Modern UI (React/Web)', values: [true, false, false, true, true] },
  { feature: 'Рынок', values: ['КЗ', 'РФ + КЗ', 'РФ', 'КЗ', 'РФ'] },
  { feature: 'Цена', values: ['$50-150', 'По запросу', '~$100', '~$8', '~$50'] },
];

// ─── Market Facts ────────────────────────────────────────────

const MARKET_FACTS = [
  { value: '667.4', unit: 'млрд ₸', label: 'Рынок розничных аптек КЗ 2024', source: 'PharmReviews.kz', trend: '+17% YoY' },
  { value: '9,324', unit: '', label: 'Аптеки в Казахстане', source: 'pharmnewskz.com', detail: '76% — сети' },
  { value: '43%', unit: '', label: 'Покупателей уходят к конкуренту при дефектуре', source: 'AMRA & ELMA', confidence: 'HIGH' },
  { value: '5,936', unit: '', label: 'Регулируемых SKU в госреестре', source: 'NDDA.kz', detail: 'Наценка 5-15%' },
  { value: '90-95%', unit: '', label: 'Аптечных сетей без category management', source: 'mosapteki.ru', detail: 'Конкурентный gap' },
  { value: '+50%', unit: '', label: 'Рост рентабельности при снижении DOI с 36 до 24 дней', source: 'FarmBazis', confidence: 'HIGH' },
  { value: '0', unit: '', label: 'Конкурентов в КЗ считают мультиканальную маржу', source: 'DEEP-3 аудит 7 продуктов', highlight: true },
];

// ─── Component ───────────────────────────────────────────────

export function RoadmapPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── 1. Hero — Mission ──────────────────────────────── */}
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-text mb-2">
          От финмодели к SaaS-платформе для аптечных сетей
        </h2>
        <p className="text-sm text-text-muted max-w-2xl mx-auto">
          Provizor — единственный аптечный сервис в Казахстане, который считает реальную рентабельность
          по каждому каналу продаж. Мультиканальная маржа — то, что не делает ни один конкурент в СНГ.
        </p>
      </div>

      {/* 4 Domains */}
      <div className="grid grid-cols-4 gap-3">
        {DOMAINS.map(domain => (
          <div
            key={domain.title}
            className="bg-card rounded-xl border border-border p-4 hover:border-opacity-60 transition-colors"
            style={{ borderColor: `${domain.color}30` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${domain.color}20` }}
              >
                <svg className="w-4 h-4" style={{ color: domain.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={domain.icon} />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-text leading-tight">{domain.title}</div>
                <div className="text-[10px] text-text-muted">{domain.subtitle}</div>
              </div>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">{domain.description}</p>
          </div>
        ))}
      </div>

      {/* ── 2. Progress Stats ──────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text uppercase tracking-wide mb-4">Что уже сделано</h3>
        <div className="grid grid-cols-5 gap-4">
          {PROGRESS_STATS.map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-accent">{stat.value}</div>
              <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
              <div className="text-[10px] text-text-muted mt-0.5">{stat.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Phases (Timeline) ───────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-text uppercase tracking-wide mb-4">Дорожная карта</h3>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {PHASES.map(phase => {
            const style = STATUS_STYLES[phase.status];
            const doneCount = phase.deliverables.filter(d => d.done).length;
            const totalCount = phase.deliverables.length;
            const progressPct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

            return (
              <div key={phase.id} className="relative pl-16 pb-6">
                {/* Timeline dot */}
                <div className={`absolute left-[18px] top-1.5 w-5 h-5 rounded-full border-2 border-navy ${style.dot} flex items-center justify-center z-10`}>
                  {phase.status === 'active' && (
                    <div className="w-2 h-2 rounded-full bg-navy" />
                  )}
                  {phase.status === 'done' && (
                    <svg className="w-3 h-3 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Card */}
                <div className={`bg-card rounded-xl border ${
                  phase.status === 'active' ? 'border-accent/30' : 'border-border'
                } p-5`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      <span className="text-xs text-text-muted">{phase.period}</span>
                      <span className="text-[10px] text-text-muted">Фаза {phase.id}</span>
                    </div>
                    {phase.status === 'active' && totalCount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-navy rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-accent font-medium">{doneCount}/{totalCount}</span>
                      </div>
                    )}
                  </div>

                  <h4 className={`text-base font-semibold mb-1 ${
                    phase.status === 'active' ? 'text-text' : 'text-text-secondary'
                  }`}>
                    {phase.title}
                  </h4>
                  <p className="text-xs text-text-muted mb-3">{phase.description}</p>

                  <ul className="space-y-1.5">
                    {phase.deliverables.map((d, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-text-secondary">
                        {d.done ? (
                          <svg className="w-4 h-4 shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className={`w-4 h-4 shrink-0 ${
                            phase.status === 'active' ? 'text-text-muted' : 'text-text-muted/50'
                          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                        )}
                        <span className={d.done ? 'text-text-secondary' : ''}>{d.text}</span>
                      </li>
                    ))}
                  </ul>

                  {phase.kpi && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <span className="text-[10px] text-text-muted uppercase tracking-wide">KPI: </span>
                      <span className="text-[10px] text-accent">{phase.kpi}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Competitive Positioning ─────────────────────── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Конкурентное преимущество</h3>
          <p className="text-xs text-text-muted mt-1">
            Аудит 7 CIS-продуктов + 10 глобальных сервисов · DEEP-3 + DEEP-5
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-navy text-text-secondary uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Функция</th>
                {COMPETITORS.map(c => (
                  <th key={c} className={`px-4 py-3 text-center font-medium ${c === 'Provizor' ? 'text-accent' : ''}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {POSITIONING.map((row, idx) => (
                <tr key={idx} className={`border-t border-border ${row.highlight ? 'bg-accent/5' : 'hover:bg-navy/30'} transition-colors`}>
                  <td className={`px-4 py-2.5 font-medium ${row.highlight ? 'text-text' : 'text-text-secondary'}`}>
                    {row.feature}
                  </td>
                  {row.values.map((val, i) => (
                    <td key={i} className="px-4 py-2.5 text-center">
                      {val === true ? (
                        <span className={`${i === 0 ? 'text-accent' : 'text-success'}`}>&#10003;</span>
                      ) : val === false ? (
                        <span className="text-text-muted">—</span>
                      ) : (
                        <span className={`${i === 0 ? 'text-accent font-medium' : 'text-text-secondary'}`}>{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Market Facts ────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-text uppercase tracking-wide mb-4">Рынок в числах</h3>
        <div className="grid grid-cols-2 gap-3">
          {MARKET_FACTS.map((fact, idx) => (
            <div
              key={idx}
              className={`bg-card rounded-xl border p-4 ${
                fact.highlight ? 'border-accent/30 bg-accent/5' : 'border-border'
              }`}
            >
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className={`text-2xl font-bold ${fact.highlight ? 'text-accent' : 'text-text'}`}>
                  {fact.value}
                </span>
                {fact.unit && <span className="text-sm text-text-secondary">{fact.unit}</span>}
                {fact.trend && (
                  <span className="text-xs text-success font-medium ml-1">{fact.trend}</span>
                )}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{fact.label}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-text-muted">{fact.source}</span>
                {fact.confidence && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    fact.confidence === 'HIGH' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    {fact.confidence}
                  </span>
                )}
                {fact.detail && (
                  <span className="text-[10px] text-text-muted">· {fact.detail}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Pricing Reference ───────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text uppercase tracking-wide mb-4">Ценовой ориентир</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-navy">
            <div className="text-lg font-bold text-text-secondary">$400+</div>
            <div className="text-xs text-text-muted mt-1">GrowthFactor</div>
            <div className="text-[10px] text-text-muted">US, per-location P&L</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-navy">
            <div className="text-lg font-bold text-text-secondary">~$100</div>
            <div className="text-xs text-text-muted mt-1">SmartApteka</div>
            <div className="text-[10px] text-text-muted">РФ, OLAP-аналитика</div>
          </div>
          <div className="text-center p-3 rounded-lg border border-accent/30">
            <div className="text-lg font-bold text-accent">$50–150</div>
            <div className="text-xs text-accent mt-1">Provizor</div>
            <div className="text-[10px] text-text-muted">КЗ, /мес /аптека</div>
          </div>
        </div>
        <p className="text-[10px] text-text-muted mt-3 text-center">
          При 5 аптеках: $250–750/мес · Конкурентно vs GrowthFactor, premium vs SmartApteka
        </p>
      </div>

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-[10px] text-text-muted">
          Данные: 11 DEEP/SEED исследований (6,600+ строк) · 7 конкурентов · 10 глобальных сервисов · 12 отзывов пользователей
        </p>
        <p className="text-[10px] text-text-muted">
          Источники: NCPA 2024, PharmReviews.kz, NDDA.kz, FarmBazis, AMRA & ELMA, McKinsey, ECR, ASHP
        </p>
      </div>
    </div>
  );
}
