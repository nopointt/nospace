Сделал competitive teardown по твоему промпту и собрал картину по кластерам, топ‑угрозам, белым пятнам и позиционированию Harkly как платформы автоматизации кабинетных исследований.

***

## Кластеры и их роли (Блок 1–2)

### A. AI‑native research tools

Сюда попадают Elicit, Consensus, Perplexity (Deep/Research mode), SciSpace и т.п. Elicit позиционируется как AI‑ассистент для литературных обзоров: семантический поиск по 125M+ статей, автоматизированный скрининг, экстракция данных в таблицы и обновляемые «живые» обзоры. Consensus — AI‑поисковик по 200M+ научных статей, который по запросу находит релевантные работы и строит синтетический ответ с цитатами. Perplexity Deep Research выполняет десятки поисков и итеративный анализ, чтобы за 2–4 минуты собрать мини‑отчёт с заголовками, нарративом и большим числом источников. [academiainsider](https://academiainsider.com/how-to-use-elicit/)

Главный JTBD кластера: «Когда мне нужно быстро понять, что говорит литература по вопросу X, я хочу получить синтез основных выводов и список ключевых статей, не читая всё вручную». Целевой пользователь — академический и прикладной исследователь, продакт/аналитик, студент; фокус именно на **question → answer из научной литературы**, а не на полном процессе систематического обзора. Workflow в лучшем случае покрывает: ввод вопроса → подбор статей → краткие резюме/таблички/ответы; почти нигде нет нормального управления протоколом, трассируемости решений и сложных визуальных артефактов (evidence maps и т.п.). Монетизация: freemium/подписка для Pro/Teams (по источникам это видно для Consensus и Elicit, плюс академические лицензии), enterprise‑лицензии для организаций. Слабые места: отсутствие глубокого workflow‑менеджмента, слабая работа с нестатейными источниками (отчёты, OSINT, внутренняя документация), и низкая контролируемость методологии (сложно соблюсти Cochrane/PRISMA или консалтинговые стандарты). [consensus](https://consensus.app/home/blog/how-consensus-works/)

***

### B. Systematic review / evidence synthesis tools

Rayyan, Covidence, DistillerSR, EPPI‑Reviewer, RevMan и т.д. Rayyan — AI‑поддерживаемая платформа для скрининга и коллаборации в систематических обзорах: импорт ссылок, дедупликация, разметка, ускорение скрининга и мобильный доступ. Covidence — «от bulk search results к чистой, пригодной к экстракции evidence», с поддержкой PRISMA 2020, risk‑of‑bias, extraction и пр.; есть индивидуальные и институциональные подписки, с ощутимой ценой за обзор. DistillerSR позиционируется как AI‑enabled evidence management platform с настраиваемыми workflow, AI на каждом шаге (screening, extraction, reuse), audit‑trail и интеграциями через API. [help.rayyan](https://help.rayyan.ai/hc/en-us/articles/22697630697617-Getting-Started-with-Rayyan-A-Quick-Start-Guide)

JTBD: «Когда я делаю систематический/регуляторный обзор, я хочу отслеживаемый, соответствующий стандартам pipeline от импорта ссылок до финального отчёта и мета‑анализа». Основной пользователь — академические группы, фарма/медицинские компании, регуляторные и health‑policy организации. Workflow: инструменты вносят структуру **после** этапа поиска (то есть работают с уже собранным корпусом ссылок): импорт → дедупликация → скрининг → экстракция → отчёт/экспорт. Модели монетизации — платные подписки на обзор/команду (Rayyan/Covidence) и дорогие enterprise‑лицензии (DistillerSR, EPPI‑Reviewer). Слабые места: ограниченность источников (главным образом библиографические базы, без OSINT/рынка), высокая цена enterprise‑решений, отсутствие удобной интеграции с более «качественными» артефактами (карты эмпатии, customer journeys). [ai.revvresearch](https://ai.revvresearch.com/covidence)

***

### C. Consumer & market intelligence platforms

YouScan, Brandwatch, Meltwater, Brand Analytics, Quantilope, Similarweb, CB Insights и др. YouScan — платформа social listening для анализа потребительских мнений и поведения через текстовый и визуальный анализ миллионов онлайн‑разговоров. Quantilope — Consumer Intelligence Platform с 15 автоматизированными методами (MaxDiff, TURF, conjoint, сегментация, PSM, Better Brand Health Tracking и др.), панелями 300M+ респондентов и AI‑копилотом quinn. Similarweb предоставляет цифровую разведку: Web Intelligence и App Intelligence для анализа трафика, поведения пользователей, ключевых слов, кампаний и цифрового следа конкурентов. [ai-cmo](https://ai-cmo.net/tools/quantilope)

JTBD: «Когда мне нужно понять рынок, бренд или потребительские предпочтения, я хочу непрерывные количественные и качественные сигналы и готовые дашборды для маркетинговых и продуктовых решений». Пользователи — маркетинговые и insights‑команды, category managers, digital‑аналитики, иногда C‑level. Workflow автоматизирует: постановку исследования в терминах анкет/панелей (у Quantilope) или источников digital‑данных (YouScan, Similarweb), сбор и обработку данных, построение стандартных отчётов/дашбордов. Ценообразование: high‑ticket SaaS, часто enterprise‑контракты; CI-платформы позиционируются как альтернатива агентствам. Главные дырки: слабая поддержка строгих академических методологий (PRISMA, Cochrane), ограниченность к открытым кабинетным источникам (white papers, препринты, гос‑данные), отсутствие «единого исследовательского трека» от вопроса до комплексных артефактов за пределами их домена. [thesilab](https://www.thesilab.com/tool/youscan)

***

### D. Knowledge management / research notebook tools

Notion, Obsidian, Roam, Logseq, Heptabase, Mem. Notion — универсальный workspace: заметки, базы, дашборды и таск‑менеджмент; активно используется исследователями для ведения литературы, заметок, трекинга экспериментов и совместной работы. Obsidian ориентирован на персональную базу знаний с графом связей и возможностями вытащить новые идеи через связи между заметками; есть практики «bases» и parent/child/related‑структур для навигации. JTBD: «Когда у меня растёт массив заметок и источников, я хочу гибко их организовывать, связывать и переиспользовать, не теряя контекст». [embednotionpages](https://www.embednotionpages.com/blog/use-notion-for-academic-research-and-study-planning)

Целевой пользователь — академики, knowledge workers, продакты, аналитики; это горизонтальные инструменты, а не специализированные research‑platforms. Workflow: они не автоматизируют поиск/скрининг/экстракцию, а предоставляют контейнер и визуальные способы навигации по уже введённой информации. Монетизация — freemium + подписка (личная/командная). Слабые места с точки зрения Harkly: отсутствие нативной интеграции с основными источниками кабинетных исследований и формализованной методологии; пользователи сами строят процессы поверх них. [effortlessacademic](https://effortlessacademic.com/discovering-new-ideas-hidden-in-your-notes-with-obsidian-bases/)

***

### E. Consulting & analyst workflow tools

AlphaSense, Tegus, Sentieo и др. AlphaSense описывает себя как AI‑платформу для рыночной/инвестиционной разведки, объединяющую более 500M премиум‑документов (отчёты, транскрипты, filings и т.п.) с AI‑агентами, которые «думают как аналитик» и выдают инсайты с синтезом. Tegus — платформа для investment research с крупнейшей библиотекой экспертных транскриптов (100K+ звонков к 35K+ компаний) и доступом к SEC‑филингам и earnings‑транскриптам через BamSEC. JTBD: «Когда я принимаю инвестиционное или стратегическое решение, я хочу за минуты найти ключевую информацию в огромных массивах корпоративных и экспертных материалов». [prnewswire](https://www.prnewswire.com/news-releases/alphasense-ai-search-and-market-intelligence-platform-now-available-in-new-aws-ai-marketplace-agents-and-tools-category-302506998.html)

Пользователь — buy‑side/ sell‑side аналитики, корпоративный стратограмм, PE/VC. Workflow автоматизирует поиск по узкому, но глубоко покрытому универсуму контента и построение «fact base» для инвестиционных/стратегических решений. Монетизация — дорогие enterprise‑лицензии; эти инструменты глубоко укоренены в крупных финансовых и корпоративных организациях. Слабые места: фокус на корпоративном контенте, малый акцент на «качественных» исследовательских артефактах (empathy maps, evidence maps), слабая поддержка академических и OSINT‑источников. [expertnetworkcalls](https://expertnetworkcalls.com/expert-networks/tegus)

***

### F. OSINT & open source intelligence platforms

Maltego и его экосистема, SpiderFoot и др. Maltego Graph — одна из самых используемых OSINT‑платформ для сбора, соединения и анализа публичной онлайн‑информации (включая дарквеб, форумы, Reddit) с мощной графовой визуализацией и коннекторами к сотням источников. JTBD: «Когда я расследую объект/сеть/угрозу, я хочу собрать данные из множества открытых (и коммерческих) источников и увидеть связи в графе». Пользователи — кибербезопасность, forensics, силовые структуры, OSINT‑аналитики. [dataexpert](https://dataexpert.eu/products/osint-platforms-maltego/maltego-graph)

Workflow: настройка графа → запуск трансформов (поиск по доменам, IP, личностям и т.п.) → анализ графа и экспорт результатов; это не general‑purpose кабинетное исследование, а расследование с фокусом на сущности и связи. Монетизация — лицензии (индивидуальные и корпоративные) и платные коннекторы к коммерческим источникам. Слабые места: высокая сложность для «гражданских» исследователей, отсутствие методологических треков под систематические обзоры/маркетинг/продукт, и слабая интеграция с артефактами вроде evidence maps. [dataexpert](https://www.dataexpert.nl/producten/osint-platformen-maltego/maltego-graph)

***

## Топ‑5 наиболее опасных игроков (Блок 3)

### 1. Elicit (AI research assistant)

**Positioning.** Elicit описывает себя как AI research assistant, который «революционизирует литературные обзоры», используя семантический поиск, AI‑скрининг и AI‑экстракцию. [anara](https://anara.com/blog/elicit-literature-reviews)

**Core workflow.** Пользователь формулирует исследовательский вопрос, Elicit находит релевантные статьи (через Semantic Scholar), предлагает уточнения вопроса, автоматически генерирует критерии скрининга, сортирует работы по вероятности соответствия, предлагает шаблоны полей для экстракции и формирует таблицу с данными и поддерживающими цитатами. [academiainsider](https://academiainsider.com/how-to-use-elicit/)

**Источники.** Корпус из 125M+ академических статей Semantic Scholar; фокус на эмпирических исследованиях, PDF‑импорт и интеграции с reference‑менеджерами. [anara](https://anara.com/blog/elicit-literature-reviews)

**Артефакты.** Таблицы с полями (sample, intervention, outcomes и т.п.), CSV/BibTeX‑экспорт, пометки/«звёздочки» для статей, живые обзоры, которые можно обновлять при появлении новых работ. [academiainsider](https://academiainsider.com/how-to-use-elicit/)

**Ценообразование.** Судя по обзору, есть базовая доступность и платные планы для команд/enterprise; точные цифры варьируют по типу доступа и не афишируются публично в деталях. [anara](https://anara.com/blog/elicit-literature-reviews)

**Отзывы / боли.** Обзоры отмечают мощную автоматизацию скрининга и экстракции, но также подчёркивают, что он силён именно для классических академических задач и не покрывает другие типы источников. [anara](https://anara.com/blog/elicit-literature-reviews)

**Граница продукта.** Останавливается на уровне «академический корпус → табличный обзор + синтез»; не даёт сквозного workflow через разные типы источников (рынок, OSINT, внутренние документы) и не строит комплексные артефакты за пределами табличного evidence. [anara](https://anara.com/blog/elicit-literature-reviews)

***

### 2. DistillerSR (AI‑enabled evidence management)

**Positioning.** DistillerSR — AI‑enabled evidence management platform, которая «автоматизирует проведение и управление литература‑основанными исследованиями и surveillance» для ускорения и удешевления синтеза доказательств. [distillersr](https://www.distillersr.com)

**Core workflow.** Платформа предлагает конфигурируемые workflow для всех этапов: импорт и дедупликация ссылок, многоуровневый скрининг с AI‑поддержкой, экстракция через AI‑формы, повторное использование evidence, кастомный репортинг и API‑интеграции. [distillersr](https://www.distillersr.com)

**Источники.** Главное — литература: корпоративные библиотеки, подписные базы и подключаемые источники через API; упор на интеграцию с внутренними evidence‑репозиториями. [distillersr](https://www.distillersr.com)

**Артефакты.** Полностью трассируемая база evidence, формы экстракции, отчёты для мета‑анализа и регуляторов, дашборды, audit‑trail. [distillersr](https://www.distillersr.com)

**Ценообразование.** Enterprise‑SaaS для крупных организаций с управляемыми сервисами (Managed Services) и дополнительными услугами по интеграции, BI, миграции и governance. [newswire](https://www.newswire.com/news/distillersr-launches-the-industrys-first-dedicated-managed-service-22611196)

**Отзывы / боли.** Компания акцентирует снижение времени скрининга и экстракции на 70%, но рынок видит её как тяжёлую, требующую внедрения систему, не подходящую для малых команд. [newswire](https://www.newswire.com/news/distillersr-launches-the-industrys-first-dedicated-managed-service-22611196)

**Граница продукта.** Очень силён в строго регламентированных обзорах и evidence management, но слабо пересекается с дизайн‑исследованиями, customer research и OSINT‑сигналами; не даёт единого desk‑research‑спайна по всем типам источников. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10464882/)

***

### 3. Perplexity Deep Research

**Positioning.** Deep Research — режим «исследования с рассуждением», который «итеративно ищет, читает документы и строит план исследования, чтобы выдать отчёт экспертного уровня». [linkedin](https://www.linkedin.com/pulse/what-perplexity-ais-deep-research-mode-dr-hernani-costa-roive)

**Core workflow.** Пользователь выбирает Research/Deep Research, вводит сложный вопрос, система в течение 2–4 минут проводит десятки поисков, сканирует множество веб‑страниц и документов, итеративно уточняет план и по завершении выдаёт структурированный ответ с заголовками, нарративом и богатым списком ссылок. [perplexity](https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research)

**Источники.** Широкий веб‑корпус: новости, статьи, отчёты, блоги и др.; ориентация на открытый интернет, а не специализированные подписные базы. [linkedin](https://www.linkedin.com/pulse/what-perplexity-ais-deep-research-mode-dr-hernani-costa-roive)

**Артефакты.** Текстовые отчёты с цитатами и возможностью экспорта в PDF/документ, без глубоких специализированных визуальных артефактов для исследований. [linkedin](https://www.linkedin.com/pulse/what-perplexity-ais-deep-research-mode-dr-hernani-costa-roive)

**Ценообразование.** Модель подписки с отдельными лимитами на Deep Research; режим дороже и медленнее стандартного поиска. [perplexity](https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research)

**Отзывы / боли.** Упоминается как быстрый способ получить «мини‑отчёт», но очевидно, что он не обеспечивает методологической трассируемости, требуемой в академической и регуляторной среде. [linkedin](https://www.linkedin.com/pulse/what-perplexity-ais-deep-research-mode-dr-hernani-costa-roive)

**Граница продукта.** Останавливается на уровне «умный поисковый отчёт»; нет управления корпусом источников, полноценного workflow скрининга/экстракции и генерации специализированных research‑артефактов. [perplexity](https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research)

***

### 4. AlphaSense

**Positioning.** AlphaSense — AI‑платформа для рыночной и финансовой разведки, объединяющая 500M+ премиум‑документов (отчёты, транскрипты, filings и др.) с AI‑агентами, которые «думают как аналитик» и помогают извлекать ключевые инсайты и тренды для принятия high‑stakes решений. [prnewswire](https://www.prnewswire.com/news-releases/alphasense-ai-search-and-market-intelligence-platform-now-available-in-new-aws-ai-marketplace-agents-and-tools-category-302506998.html)

**Core workflow.** Пользователь формулирует запрос, дальше AI‑агенты (Generative Search, Generative Grid, Deep Research) ищут по внутренним и внешним корпоративным документам, генерируют структурированные ответы, таблицы и сравнения, а также позволяют задавать уточняющие вопросы. [prnewswire](https://www.prnewswire.com/news-releases/alphasense-ai-search-and-market-intelligence-platform-now-available-in-new-aws-ai-marketplace-agents-and-tools-category-302506998.html)

**Источники.** Премиум‑контент: отчёты, earnings‑calls, filings, исследования аналитиков, плюс внутренние документы клиентов; всё в одном «content universe». [prnewswire](https://www.prnewswire.com/news-releases/alphasense-ai-search-and-market-intelligence-platform-now-available-in-new-aws-ai-marketplace-agents-and-tools-category-302506998.html)

**Артефакты.** Генеративные ответы, таблицы (grids), дашборды по компаниям/сегментам, интеграция в enterprise‑workflow и в агентные сценарии через AWS Marketplace. [prnewswire](https://www.prnewswire.com/news-releases/alphasense-ai-search-and-market-intelligence-platform-now-available-in-new-aws-ai-marketplace-agents-and-tools-category-302506998.html)

**Ценообразование.** Enterprise‑подписка для крупных финансовых и корпоративных клиентов; доступ через AWS Marketplace как часть агентных AI‑workflow. [prnewswire](https://www.prnewswire.com/news-releases/alphasense-ai-search-and-market-intelligence-platform-now-available-in-new-aws-ai-marketplace-agents-and-tools-category-302506998.html)

**Отзывы / боли.** Презентуется как «analyst‑like AI», но его фокус строго на бизнес/финансовом контенте; он не претендует на универсальную платформу кабинетных исследований по всем типам источников. [prnewswire](https://www.prnewswire.com/news-releases/alphasense-ai-search-and-market-intelligence-platform-now-available-in-new-aws-ai-marketplace-agents-and-tools-category-302506998.html)

**Граница продукта.** Концентрируется на корпоративном intelligence; нет акцента на академическую литературу, качественные артефакты HCD, OSINT‑форумы/отзывы и т.п. [prnewswire](https://www.prnewswire.com/news-releases/alphasense-ai-search-and-market-intelligence-platform-now-available-in-new-aws-ai-marketplace-agents-and-tools-category-302506998.html)

***

### 5. Quantilope

**Positioning.** Quantilope — Consumer Intelligence Platform для команд, которые хотят «agency‑quality advanced research in‑house» с 15 автоматизированными методами (conjoint, MaxDiff, TURF, сегментация, brand tracking и др.) и AI‑копилотом quinn. [ai-cmo](https://ai-cmo.net/tools/quantilope)

**Core workflow.** Пользователь формулирует бизнес‑вопрос, выбирает тип исследования (conjoint, MaxDiff, brand tracking и др.), настраивает анкету с шаблонами и подсказками quinn, запускает на панели (300M+ респондентов или собственная база), после чего получает автоматизированные дашборды и отчёты с significance‑тестами. [ai-cmo](https://ai-cmo.net/tools/quantilope)

**Источники.** Панели респондентов и опросные данные; основное — первичный сбор, а не кабинетные данные. [ai-cmo](https://ai-cmo.net/tools/quantilope)

**Артефакты.** Сегментации (3–7 сегментов с профилями и размерами), TURF‑симуляции reach, PSM‑кривые ценовой чувствительности, key driver‑анализ, penalty‑reward‑анализ, дашборды Better Brand Health Tracking. [ai-cmo](https://ai-cmo.net/tools/quantilope)

**Ценообразование.** Enterprise‑SaaS с фокусом на маркетинговые и insights‑команды; платформа позиционируется как альтернатива research‑агентствам. [ai-cmo](https://ai-cmo.net/tools/quantilope)

**Отзывы / боли.** Обзор подчёркивает мощь и скорость платформа, но и то, что она требует готовности инвестировать и ориентирована на регулярные исследования; кабинетный слой (open web, OSINT, академия) практически не покрывается. [ai-cmo](https://ai-cmo.net/tools/quantilope)

**Граница продукта.** Закрывает advanced quant по своим данным, но не решает задачу объединения существующих источников в единый desk‑research‑workflow. [ai-cmo](https://ai-cmo.net/tools/quantilope)

***

## Белые пятна (Блок 4)

**1. JTBD‑атомы, которые никто не закрывает полностью.** Ни один игрок не даёт по‑настоящему сквозного workflow: «от формулировки вопроса в нескольких методологических фреймах (PICO, design challenge, issue tree) → план поиска по разным классам источников (академия, рынок, OSINT, гос‑данные) → автоматизированный triage → экстракция и кодирование → генерация разных артефактов (PRISMA‑треки, evidence maps, empathy maps, fact packs, сигнал‑логи) → единый исследовательский notebook». Elicit/Consensus покрывают только академический корпус; DistillerSR/Rayyan — только evidence‑synthesis; CI‑платформы — только свои каналы/опросы; KM‑инструменты — только хранение и навигацию. [wind4change](https://wind4change.com/design-thinking-d-school-stanford-ideo-approach-methodology/)

**2. Комбинации источников, которые никто не объединяет.** Из документации видно: DistillerSR и Cochrane‑ориентированные инструменты фокусируются на журнальных статьях и корпоративных библиотеках. Maltego и OSINT‑платформы соединяют открытые и коммерческие источники, но именно в формате расследований/графов, не для литературы/рынка. Quantilope/YouScan/Similarweb живут в своём мире опросов и digital‑аналитики. Явной платформы, которая бы в одном workflow сводила **академические статьи + рыночные отчёты + OSINT (отзывы, форумы, соцсети) + вакансные сигналы / патенты** в единый desk‑research‑пайплайн, в текущей выборке нет. [dataexpert](https://www.dataexpert.dk/produkter/osint-platforme-maltego/maltego-graph)

**3. Пользователь, вынужденный держать 4+ инструмента.** Академик/health‑исследователь сейчас типично комбинирует: PubMed/Scopus → Rayyan/Covidence/DistillerSR → Notion/Obsidian для заметок → Perplexity/Elicit/Consensus для быстрых ответов. Продуктовый/маркетинговый исследователь: Similarweb/YouScan/Brandwatch → Quantilope/Survey‑платформа → Notion/Confluence → иногда Perplexity/Elicit для desk‑части. Аналитик/инвестор: AlphaSense/Tegus → Excel/Notion → Perplexity/ChatGPT. У всех этих ролей нет «орга‑надстройки», которая бы явным образом воспринималась как платформа кабинетных исследований. [support.similarweb](https://support.similarweb.com/hc/en-us/articles/360018977477-Web-Intelligence)

**4. Ценовые разрывы.** Systematic‑review‑платформы уровня DistillerSR и EPPI‑Reviewer, а также CI‑платформы типа Quantilope и AlphaSense, очевидно, играют в сегменте дорогих enterprise‑лицензий, где TCO складывается из лицензий, обучения, интеграций и managed‑services. Есть бесплатные/дешёвые Rayyan, Elicit, Notion/Obsidian, но они закрывают фрагменты workflow и требуют существенной ручной обвязки. В промежутке — ниша для инструмента, который покрывает 60–70% «грязной» работы кабинетного исследования за mid‑range цену и при этом интегрируется с существующими heavy‑weight системами. [help.rayyan](https://help.rayyan.ai/hc/en-us/articles/22697630697617-Getting-Started-with-Rayyan-A-Quick-Start-Guide)

***

## Позиционирование Harkly (Блок 5)

### Где Harkly не должен конкурировать в лоб

Harkly не стоит пытаться быть:

- **Ещё одной CI‑панелью**: Quantilope/Нielsen‑класс уже надёжно занимает зону опросов и consumer panels; их moat — панели и статистическая экспертиза, а не desk‑автоматизация. [ai-cmo](https://ai-cmo.net/tools/quantilope)
- **Ещё одной enterprise evidence‑platform для фармы**: DistillerSR/EPPI‑Reviewer слишком глубоко укоренены в регуляторном и фарм‑мире; вход туда как primary‑поставщика evidence‑platform потребует огромных ресурсов. [newswire](https://www.newswire.com/news/distillersr-launches-the-industrys-first-dedicated-managed-service-22611196)
- **Ещё одной цифровой разведкой по трафику**: Similarweb и AlphaSense уже владеют полями digital и corporate intelligence соответственно; их data‑moat трудно пробить. [businesswire](https://www.businesswire.com/news/home/20250312719826/en/Similarweb-Unveils-App-Intelligence-Redefining-Digital-Intelligence-with-Unified-Web-and-App-Insights)

Вместо этого Harkly логичнее позиционировать как **надстройку‑оркестратор**, которая клеит вместе источники и workflows этих игроков, а не подменяет их.

***

### Позиция в 1–2 предложениях

> Harkly — это AI‑оркестратор кабинетных исследований, который связывает академические, рыночные, OSINT‑ и внутренние источники в один воспроизводимый workflow от вопроса до артефактов, вместо того чтобы заставлять исследователя прыгать между пятью разными инструментами.  

> В отличие от AI‑поисковиков и CI‑платформ, Harkly фокусируется не на «ответе здесь и сейчас», а на автоматизации самого ремесла desk research: формулировка вопроса, план поиска, triage, экстракция, синтез и трассируемый notebook.

***

### Вариант tagline

1. **«Harkly — это Notion для кабинетных исследований, но для исследователей и аналитиков, которые хотят пройти весь путь от вопроса до evidence maps и сигнал‑логов, не собирая свой процесс из пяти разрозненных сервисов».**  
2. Альтернатива, чуть суше:  
   **«Harkly — это Rayyan + Elicit + Similarweb + Maltego в одном исследовательском треке для тех, кто хочет автоматизировать desk research, а не только скрининг статей или мониторинг соцсетей».**

Если хочешь, следующим шагом можем сузить это позиционирование под конкретную первую целевую персону (например, «UX/продуктовый исследователь в e‑commerce/финтехе» или «академический PI, ведущий несколько обзоров») и прямо от неё декомпозировать первый продуктовый скелет.