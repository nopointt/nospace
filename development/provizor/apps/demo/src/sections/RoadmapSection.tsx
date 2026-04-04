const phases = [
  {
    id: 1,
    title: 'Unit-экономика',
    status: 'active' as const,
    timeline: 'Апрель 2026',
    description: 'Финансовая модель аптечной сети',
    deliverables: [
      'P&L калькулятор — выручка, себестоимость, маржа, чистая прибыль',
      'Проверка наценок по госреестру (регрессивная шкала КЗ)',
      'Анализ маржи по каналам продаж (оффлайн, Halyk, Wolt, iTeka)',
      'Рентабельность вложенных средств (CIS Profitability)',
    ],
    value: 'Видеть реальную прибыль каждой аптеки и каждого канала. Принимать решения на цифрах.',
  },
  {
    id: 2,
    title: 'Telegram-бот MVP',
    status: 'next' as const,
    timeline: 'Май 2026',
    description: 'Личный фармацевт для клиентов',
    deliverables: [
      'Бот знает ассортимент, цены, наличие — по всем 5 аптекам',
      'Conversational UX — клиент описывает проблему, бот подбирает препарат',
      'Замена WhatsApp-канала (сейчас ~30 обращений/день)',
      'Интеграция с 1С — актуальные данные',
    ],
    value: 'Забрать нагрузку с фармацевтов. Не терять клиентов из-за неответа в WhatsApp.',
  },
  {
    id: 3,
    title: 'Аналитика ассортимента',
    status: 'planned' as const,
    timeline: 'Июнь–Июль 2026',
    description: 'Не покупать лишнее, не упускать нужное',
    deliverables: [
      'ABC/XYZ классификация — какие товары делают деньги, а какие лежат',
      'Дефектура — упущенные продажи из-за отсутствия товара',
      'Контроль сроков годности — алерты за 30/60/90 дней до истечения',
      'Автоматическая дефектурная ведомость',
    ],
    value: 'Оборачиваемость с 35 до 20 дней = +30–50% прибыли при том же объёме.',
  },
  {
    id: 4,
    title: 'Ценообразование',
    status: 'planned' as const,
    timeline: 'Август 2026',
    description: 'Всегда правильная цена',
    deliverables: [
      'Мониторинг цен конкурентов (iTeka, Halyk Market)',
      'Автоматическое ценообразование: конкуренты + себестоимость + маржа + госреестр',
      'Алерты при нарушении предельных цен (штраф до 3.9M ₸)',
    ],
    value: 'Конкурентная, но прибыльная цена. Без ручного мониторинга.',
  },
  {
    id: 5,
    title: 'Dashboard и заказы',
    status: 'planned' as const,
    timeline: 'Сентябрь–Октябрь 2026',
    description: 'Бэк-офис для сети',
    deliverables: [
      'Единый дашборд на все 5 аптек',
      'Заказ через Telegram-бот → Kaspi Pay',
      'Курьерская доставка',
      'Система лояльности (бонусы)',
    ],
    value: 'Полный цикл: от клиента до доставки, всё в одном месте.',
  },
  {
    id: 6,
    title: 'SaaS для других аптек',
    status: 'future' as const,
    timeline: '2027',
    description: 'Продажа системы другим аптекам',
    deliverables: [
      'Мультитенант — онбординг новых аптечных сетей',
      'Подписочная модель (SaaS)',
      'Отлажено на данных 5 аптек → продаём проверенный продукт',
    ],
    value: 'Из инструмента для себя — в продукт для рынка. 9,000+ аптек в Казахстане.',
  },
];

const statusStyles = {
  active: { bg: 'bg-blue-50', border: 'border-blue-300', dot: 'bg-blue-500', text: 'text-blue-700', label: 'Сейчас' },
  next: { bg: 'bg-amber-50', border: 'border-amber-300', dot: 'bg-amber-500', text: 'text-amber-700', label: 'Следующий' },
  planned: { bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', text: 'text-slate-600', label: 'Планируется' },
  future: { bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-400', text: 'text-purple-600', label: 'Будущее' },
};

export function RoadmapSection() {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Roadmap проекта</h2>
      <p className="text-sm text-slate-500">
        Поэтапный план развития. Каждый этап решает конкретную бизнес-задачу и приносит измеримый результат.
      </p>

      <div className="space-y-4">
        {phases.map((phase, i) => {
          const style = statusStyles[phase.status];
          return (
            <div key={phase.id} className={`${style.bg} border ${style.border} rounded-xl p-5 relative`}>
              {/* Timeline connector */}
              {i < phases.length - 1 && (
                <div className="absolute left-8 bottom-0 w-0.5 h-4 bg-slate-200 translate-y-full" />
              )}

              <div className="flex items-start gap-4">
                {/* Phase number */}
                <div className={`w-10 h-10 rounded-full ${style.dot} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                  {phase.id}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-lg font-semibold text-slate-800">{phase.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-slate-400">{phase.timeline}</span>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{phase.description}</p>

                  <ul className="space-y-1 mb-3">
                    {phase.deliverables.map((d, j) => (
                      <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-slate-400 mt-1 shrink-0">—</span>
                        {d}
                      </li>
                    ))}
                  </ul>

                  <div className="bg-white/60 rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">Ценность: </span>
                    <span className="text-slate-600">{phase.value}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Ключевые числа</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">5</div>
            <div className="text-xs text-slate-500">аптек в сети</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">87.5M ₸</div>
            <div className="text-xs text-slate-500">совокупная выручка / мес</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">6–7K</div>
            <div className="text-xs text-slate-500">позиций ассортимента</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">9,324</div>
            <div className="text-xs text-slate-500">аптек в Казахстане (TAM)</div>
          </div>
        </div>
      </div>
    </section>
  );
}
