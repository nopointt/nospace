const PHASES = [
  {
    id: 1,
    title: 'Unit-экономика',
    status: 'active' as const,
    period: 'Апрель 2026',
    description: 'Финмодель аптечной сети. P&L по каждой аптеке, анализ маржи, каналов, наценок.',
    deliverables: ['Dashboard с ключевыми метриками', 'P&L отчёт по 5 аптекам', 'Анализ каналов продаж', 'Контроль наценок КЗ'],
  },
  {
    id: 2,
    title: 'Telegram-бот MVP',
    status: 'next' as const,
    period: 'Май 2026',
    description: 'Бот вместо звонков и WhatsApp. Знает цены, наличие, весь ассортимент 6-7K позиций.',
    deliverables: ['Ассортимент + цены + наличие', 'Conversational UX', 'Интеграция с 1С'],
  },
  {
    id: 3,
    title: '1С интеграция',
    status: 'planned' as const,
    period: 'Июнь 2026',
    description: 'Автоматическая синхронизация данных из 1С: остатки, продажи, закупки.',
    deliverables: ['OData/HTTP sync каждый час', 'Мультитенант (5 аптек)', 'Импорт исторических данных'],
  },
  {
    id: 4,
    title: 'Аналитика ассортимента',
    status: 'planned' as const,
    period: 'Июль 2026',
    description: 'Что покупать, сколько хранить, что списывать. ABC/XYZ классификация.',
    deliverables: ['Дефектура — что закупить', 'Оборачиваемость по SKU', 'Контроль сроков годности', 'Упущенная прибыль'],
  },
  {
    id: 5,
    title: 'Ценообразование',
    status: 'planned' as const,
    period: 'Август 2026',
    description: 'Автоматический мониторинг цен конкурентов + оптимальная цена.',
    deliverables: ['Парсинг iTeka/конкурентов', 'Госреестры предельных цен', 'Рекомендация оптимальной цены'],
  },
  {
    id: 6,
    title: 'SaaS для аптек',
    status: 'planned' as const,
    period: 'Q4 2026',
    description: 'Готовый продукт для других аптечных сетей. Подписочная модель.',
    deliverables: ['Мультитенант онбординг', 'Подписка (ежемесячная)', 'Документация + поддержка'],
  },
];

const STATUS_STYLES = {
  active: { bg: 'bg-accent/20', text: 'text-accent', dot: 'bg-accent', label: 'Сейчас' },
  next: { bg: 'bg-warning/20', text: 'text-warning', dot: 'bg-warning', label: 'Следующий' },
  planned: { bg: 'bg-navy-lighter/50', text: 'text-text-muted', dot: 'bg-text-muted', label: 'Запланирован' },
};

export function RoadmapPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-1">
      <p className="text-sm text-text-muted mb-6">
        Путь от финмодели к полноценной SaaS-платформе для аптечных сетей.
      </p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        {PHASES.map((phase, i) => {
          const style = STATUS_STYLES[phase.status];
          return (
            <div key={phase.id} className="relative pl-16 pb-8">
              {/* Timeline dot */}
              <div className={`absolute left-[18px] top-1.5 w-5 h-5 rounded-full border-2 border-navy ${style.dot} flex items-center justify-center z-10`}>
                {phase.status === 'active' && (
                  <div className="w-2 h-2 rounded-full bg-navy" />
                )}
              </div>

              {/* Card */}
              <div className={`bg-card rounded-xl border ${phase.status === 'active' ? 'border-accent/30' : 'border-border'} p-5`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <span className="text-xs text-text-muted">{phase.period}</span>
                </div>

                <h3 className={`text-base font-semibold mb-1 ${phase.status === 'active' ? 'text-text' : 'text-text-secondary'}`}>
                  Фаза {phase.id}: {phase.title}
                </h3>
                <p className="text-sm text-text-muted mb-3">{phase.description}</p>

                <ul className="space-y-1.5">
                  {phase.deliverables.map((d, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-text-secondary">
                      <svg className={`w-4 h-4 shrink-0 ${phase.status === 'active' ? 'text-accent' : 'text-text-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {phase.status === 'active'
                          ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                          : <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        }
                      </svg>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connector arrow for last items */}
              {i < PHASES.length - 1 && (
                <div className="absolute left-[22px] bottom-0 w-0.5 h-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
