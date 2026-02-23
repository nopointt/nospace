import { useState, useEffect } from 'react'
import { Settings, Play, Square, Database, Terminal, FileJson, BookOpen } from 'lucide-react'

function App() {
    const [url, setUrl] = useState('')
    const [isScraping, setIsScraping] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const [stats, setStats] = useState({ reviews: 0 })
    const [activeTab, setActiveTab] = useState('scraper')
    const [maxPages, setMaxPages] = useState(50)

    // DB Selection State
    const [showDbModal, setShowDbModal] = useState(false)
    const [targetDb, setTargetDb] = useState('knowledge_base')
    const [dbList, setDbList] = useState<string[]>([])
    const [isDbDropdownOpen, setIsDbDropdownOpen] = useState(false)

    // Proxy State: Raw multiline string, persists in localStorage
    const [proxy, setProxy] = useState(localStorage.getItem('harkly_proxies') || '')

    // Save proxy to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('harkly_proxies', proxy);
    }, [proxy]);

    // Listen for logs and stats
    useEffect(() => {
        // @ts-ignore
        const cleanupLog = window.electron.onLog((msg) => {
            setLogs(prev => [...prev.slice(-99), msg]) // Keep last 100 logs
        })
        // @ts-ignore
        const cleanupStats = window.electron.onStats((newStats) => {
            setStats(newStats)
        })
        return () => { cleanupLog && cleanupLog(); cleanupStats && cleanupStats(); }
    }, [])

    const handleInitialClick = () => {
        if (!url) return;
        setShowDbModal(true);
    }

    const handleConfirmStart = async () => {
        setShowDbModal(false);
        setIsScraping(true)
        setLogs([])
        // Pass proxy settings (string) and DB name
        // @ts-ignore
        await window.electron.startScrape(url, maxPages, proxy, targetDb)
        setIsScraping(false)
    }

    const handleStop = async () => {
        // @ts-ignore
        await window.electron.stopScrape()
        setIsScraping(false)
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-900/60 text-slate-200 font-sans selection:bg-emerald-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-bronze-900/20 blur-[120px]" />
            </div>

            {/* Main Grid Layout */}
            <div className="relative z-10 grid grid-cols-[280px_1fr] h-full p-6 gap-6">

                {/* Sidebar */}
                <aside className="glass-panel p-4 flex flex-col gap-6">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-bronze-400 to-bronze-600 flex items-center justify-center shadow-bronze-glow">
                            <span className="font-bold text-slate-900">H</span>
                        </div>
                        <h1 className="font-display font-bold text-lg tracking-tight text-white">Harkly <span className="text-bronze-400 text-xs align-top">BETA</span></h1>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <button
                            className={`nav-item ${activeTab === 'scraper' ? 'active' : ''}`}
                            onClick={() => setActiveTab('scraper')}
                        >
                            <Terminal size={18} />
                            <span>Парсер</span>
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'attic' ? 'active' : ''}`}
                            onClick={() => setActiveTab('attic')}
                        >
                            <Database size={18} />
                            <span>База (Attic)</span>
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            <BookOpen size={18} />
                            <span>Инфо</span>
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings size={18} />
                            <span>Настройки</span>
                        </button>
                    </nav>

                    <div className="mt-auto">
                        <div className="text-xs text-slate-500 font-mono">v0.1.0 • Electron</div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex flex-col gap-6 h-full min-h-0 relative">

                    {/* Modal Overlay */}
                    {showDbModal && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl">
                            <div className="glass-panel w-96 p-6 flex flex-col gap-4 shadow-2xl border border-bronze-500/30 bg-black/40">
                                <div className="flex items-center gap-3 text-bronze-400">
                                    <Database size={24} />
                                    <h3 className="font-display font-bold text-lg text-white">Выбор Базы Данных</h3>
                                </div>
                                <p className="text-sm text-slate-400">
                                    Введите имя базы данных. Если её нет, будет создана новая.
                                </p>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-mono text-slate-500 uppercase">Имя Базы</label>
                                    <input
                                        type="text"
                                        value={targetDb}
                                        onChange={(e) => setTargetDb(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono focus:border-bronze-400 focus:outline-none"
                                        placeholder="knowledge_base"
                                    />
                                    <div className="text-[10px] text-slate-600 font-mono text-right">.json добавляется автоматически</div>
                                </div>

                                <div className="flex gap-3 mt-2">
                                    <button
                                        className="flex-1 px-4 py-2 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                                        onClick={() => setShowDbModal(false)}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        className="flex-1 btn-primary text-sm justify-center"
                                        onClick={handleConfirmStart}
                                    >
                                        Начать
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top Bar / Status */}
                    <header className="glass-panel h-16 flex items-center justify-between px-6 shrink-0">
                        <div className="flex items-center gap-4">
                            <span className={`w-2 h-2 rounded-full shadow-emerald-glow ${isScraping ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                            <span className="text-sm font-mono text-slate-400">{isScraping ? 'СИСТЕМА АКТИВНА' : 'СИСТЕМА ОЖИДАЕТ'}</span>
                        </div>
                        <div className="draggble-region flex-1 h-full mx-4" /> {/* Window Drag Area */}
                    </header>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-12 grid-rows-6 gap-6 flex-1 min-h-0">

                        {activeTab === 'scraper' && (
                            <>
                                {/* Input Panel */}
                                <div className={`glass-panel col-span-12 row-span-2 p-6 flex flex-col justify-between group transition-all ${isScraping ? 'opacity-90' : ''}`}>
                                    {/* Top Row: Label & Proxy Shield */}
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-mono text-bronze-400 uppercase tracking-widest">Целевой Ресурс</label>
                                        <div className={`text-[10px] font-mono px-2 py-0.5 rounded border ${proxy.trim().length > 0
                                            ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400'
                                            : 'bg-red-900/30 border-red-500/30 text-red-400'
                                            }`}>
                                            {proxy.trim().length > 0
                                                ? `🛡️ ЩИТ: ${proxy.trim().split('\n').filter(l => l.trim()).length} ПРОКСИ`
                                                : '⚠️ БЕЗ ПРОКСИ (ПРЯМОЕ СОЕДИНЕНИЕ)'}
                                        </div>
                                    </div>

                                    {/* Middle Row: Input */}
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        disabled={isScraping}
                                        placeholder="https://otzovik.com/reviews/..."
                                        className="bg-transparent border-b border-white/10 text-xl font-light text-white w-full py-2 focus:outline-none focus:border-bronze-400 transition-colors placeholder:text-slate-600 mb-4"
                                    />

                                    {/* Bottom Row: Controls */}
                                    <div className="flex items-end justify-between gap-4">

                                        {/* Stats (Moved here) */}
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <div className="text-3xl font-display font-bold text-white leading-none">{stats.reviews}</div>
                                            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Собрано</div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Max Pages Input */}
                                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded px-3 py-2">
                                                <label className="text-[10px] font-mono text-slate-500 uppercase whitespace-nowrap">Макс. Стр</label>
                                                <input
                                                    type="number"
                                                    value={maxPages}
                                                    onChange={(e) => setMaxPages(parseInt(e.target.value) || 1)}
                                                    disabled={isScraping}
                                                    className="bg-transparent text-white font-mono text-right w-12 focus:outline-none"
                                                />
                                            </div>

                                            {/* Action Button */}
                                            {isScraping ? (
                                                <button
                                                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 px-6 py-2 rounded flex items-center gap-2 transition-all"
                                                    onClick={handleStop}
                                                >
                                                    <Square size={16} fill="currentColor" />
                                                    СТОП & СОХР
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        className={`btn-primary flex items-center gap-2 ${!url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        onClick={handleInitialClick}
                                                        disabled={!url}
                                                    >
                                                        <Play size={16} fill="currentColor" />
                                                        СТАРТ
                                                    </button>
                                                    <button
                                                        className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                                                        onClick={async () => {
                                                            setIsScraping(true); // Lock UI
                                                            // @ts-ignore
                                                            await window.electron.buildKnowledgeBase(targetDb);
                                                            setIsScraping(false);
                                                        }}
                                                        title="Собрать базу знаний для AI (Вектора)"
                                                    >
                                                        <FileJson size={16} />
                                                        Build KB
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Logs / Terminal (Expanded to fill space) */}
                                <div className="glass-panel col-span-12 row-span-4 p-0 overflow-hidden flex flex-col">
                                    <div className="px-4 py-2 border-b border-white/5 bg-black/20 flex items-center justify-between">
                                        <span className="text-xs font-mono text-slate-400">Лог Процесса</span>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-y-auto selection:bg-bronze-900/50">
                                        {logs.length === 0 && <div className="text-slate-500 mb-1">$ awaiting command...</div>}
                                        {logs.map((log, i) => (
                                            <div key={i} className="mb-1 border-l-2 border-transparent hover:border-bronze-400/50 pl-2 transition-colors">
                                                <span className="text-slate-600 mr-2">{new Date().toLocaleTimeString()}</span>
                                                {typeof log === 'string' ? log : JSON.stringify(log)}
                                            </div>
                                        ))}
                                        <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'attic' && (
                            <div className="glass-panel col-span-12 row-span-6 p-0 flex flex-col overflow-hidden relative">
                                <div className="absolute top-0 left-0 right-0 h-14 bg-[#0F172A] border-b border-white/5 flex items-center justify-between px-6 z-10">
                                    <div className="flex items-center gap-4">
                                        <Database size={16} className="text-bronze-400" />
                                        <div className="flex items-center gap-2 relative">
                                            <span className="text-xs font-mono text-slate-500 uppercase">Target DB:</span>

                                            {/* Custom Dropdown */}
                                            <div className="relative">
                                                <button
                                                    className="flex items-center gap-2 py-1 px-2 text-sm font-mono text-white border-b border-white/10 hover:border-bronze-400 focus:outline-none min-w-[160px] justify-between transition-colors"
                                                    onClick={async () => {
                                                        try {
                                                            if (!isDbDropdownOpen) {
                                                                // @ts-ignore
                                                                const res = await window.electron.getDatabases();
                                                                if (res.status === 'success') {
                                                                    // @ts-ignore
                                                                    setLogs(prev => [...prev, `[DB] Найдено ${res.files.length} БД`]);
                                                                    setDbList(res.files.map((f: string) => f.replace('.json', '')));
                                                                } else {
                                                                    setLogs(prev => [...prev, `[DB] Ошибка списка: ${res.error}`]);
                                                                }
                                                            }
                                                            setIsDbDropdownOpen(!isDbDropdownOpen);
                                                        } catch (e: any) {
                                                            setLogs(prev => [...prev, `[UI Error] DB Dropdown: ${e.message}`]);
                                                        }
                                                    }}
                                                >
                                                    <span className="truncate">{targetDb} (Current)</span>
                                                    <span className="text-slate-500 text-[10px]">▼</span>
                                                </button>

                                                {isDbDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setIsDbDropdownOpen(false)} />
                                                        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-[#1A1C1E] border border-white/10 rounded-lg shadow-2xl z-50 py-1 max-h-60 overflow-y-auto">
                                                            <div className="px-3 py-2 text-[10px] uppercase font-mono text-slate-500 border-b border-white/5 mb-1">Выбрать базу</div>
                                                            {dbList.filter(d => d !== targetDb).length === 0 && (
                                                                <div className="px-3 py-2 text-xs text-slate-600 italic">Нет других баз</div>
                                                            )}
                                                            {dbList.filter(d => d !== targetDb).map(db => (
                                                                <button
                                                                    key={db}
                                                                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-mono"
                                                                    onClick={() => {
                                                                        setTargetDb(db);
                                                                        setIsDbDropdownOpen(false);
                                                                    }}
                                                                >
                                                                    {db}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="btn-accent text-xs px-3 py-1.5 flex items-center gap-2"
                                            onClick={async () => {
                                                // @ts-ignore
                                                const res = await window.electron.exportDatabase(targetDb);
                                                if (res.status === 'success') {
                                                    setLogs(prev => [...prev, `[Экспорт] Сохранено в ${res.path}`]);
                                                } else if (res.status === 'error') {
                                                    setLogs(prev => [...prev, `[Экспорт] Ошибка: ${res.error}`]);
                                                }
                                            }}
                                        >
                                            <FileJson size={14} />
                                            Экспорт
                                        </button>
                                        <button
                                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-2"
                                            onClick={async () => {
                                                try {
                                                    setLogs(prev => [...prev, `[Просмотр] Загрузка отзывов из ${targetDb}...`]);
                                                    // @ts-ignore
                                                    const res = await window.electron.getReviews(targetDb);
                                                    if (res.status === 'success') {
                                                        console.log('Reviews:', res.reviews);
                                                        // @ts-ignore
                                                        window.collectedReviews = res.reviews;
                                                        setLogs(prev => [...prev, `[Просмотр] Загружено ${res.reviews.length} отзывов из ${targetDb}`]);
                                                        setStats(s => ({ ...s }));
                                                    } else {
                                                        setLogs(prev => [...prev, `[Просмотр] Ошибка: ${res.error}`]);
                                                    }
                                                } catch (e: any) {
                                                    setLogs(prev => [...prev, `[UI Ошибка] Обновление: ${e.message}`]);
                                                }
                                            }}
                                        >
                                            <Database size={14} />
                                            Обновить
                                        </button>
                                    </div>
                                </div>

                                {/* Table Viewer */}
                                <div className="w-full h-full overflow-auto pt-14 pb-0">
                                    {/* @ts-ignore */}
                                    {window.collectedReviews && window.collectedReviews.length > 0 ? (
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 bg-[#0F172A] border-b border-white/10 shadow-lg z-20">
                                                <tr className="text-xs font-mono text-bronze-400 uppercase tracking-widest">
                                                    <th className="py-3 px-4 w-16">ID</th>
                                                    <th className="py-3 px-4 w-16">Rate</th>
                                                    <th className="py-3 px-4 max-w-sm">Review Snippet / Title</th>
                                                    <th className="py-3 px-4 text-right">Author</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* @ts-ignore */}
                                                {window.collectedReviews.map((r: any, i: number) => (
                                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm text-slate-300 group">
                                                        <td className="py-2 px-4 font-mono text-[10px] text-slate-600 group-hover:text-slate-400 align-top pt-3">{r.id}</td>
                                                        <td className="py-2 px-4 text-emerald-400 font-mono align-top pt-3">{r.rating}★</td>
                                                        <td className="py-2 px-4 max-w-sm">
                                                            {/* Snippet as Header, Title as Subheader */}
                                                            <div className="font-medium text-slate-200 mb-1 leading-snug">
                                                                {r.summary || r.full_text?.slice(0, 120) + '...'}
                                                            </div>
                                                            <div className="text-xs text-slate-500 font-mono truncate">
                                                                {r.title}
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-4 text-right font-mono text-slate-500 align-top pt-3">{r.author}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500 mt-20">
                                            <Database size={48} className="mb-4 opacity-50" />
                                            <h2 className="text-xl font-display text-white mb-2">Архив Отзывов</h2>
                                            <p className="max-w-md text-center mb-4">Текущая База: <span className="text-bronze-400 font-mono">{targetDb}</span></p>
                                            <p className="text-xs text-slate-600">Нажмите "Обновить" для загрузки.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="glass-panel col-span-12 row-span-6 p-6 flex flex-col gap-6 overflow-y-auto">
                                <h2 className="text-xl font-display font-bold text-white mb-2">Руководство и FAQ</h2>

                                <div className="space-y-6">
                                    <section>
                                        <h3 className="text-bronze-400 font-bold mb-2 flex items-center gap-2">
                                            <span className="bg-bronze-500/20 text-bronze-300 w-6 h-6 rounded flex items-center justify-center text-xs">1</span>
                                            Как использовать
                                        </h3>
                                        <ul className="list-disc list-inside text-slate-300 text-sm space-y-2 ml-2">
                                            <li>Найдите компанию на <b>Otzovik.com</b> (пример: <code>https://otzovik.com/reviews/company_name/</code>).</li>
                                            <li>Скопируйте полный URL из адресной строки браузера.</li>
                                            <li>Вставьте его в поле <b>Target URL</b> на вкладке <b>Scraper</b>.</li>
                                            <li>Убедитесь, что рабочие прокси добавлены в <b>Settings</b> (1 прокси на строку).</li>
                                            <li>Нажмите <b>START</b>. Парсер автоматически запустит ротацию.</li>
                                        </ul>
                                    </section>

                                    <hr className="border-white/10" />

                                    <section>
                                        <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                                            <span className="bg-emerald-500/20 text-emerald-300 w-6 h-6 rounded flex items-center justify-center text-xs">2</span>
                                            Скорость и Производительность
                                        </h3>
                                        <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                                            <p className="text-slate-300 text-sm mb-2">
                                                Чтобы избежать блокировок, скрапер работает в <b>Stealth-режиме</b>.
                                            </p>
                                            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                                                <span>Обработка 1 страницы (40 отзывов)</span>
                                                <span className="text-white font-bold">~ 6-8 Минут</span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500 italic">
                                                *Включая перезагрузку браузера, ротацию прокси и имитацию чтения.
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                                            <span className="bg-indigo-500/20 text-indigo-300 w-6 h-6 rounded flex items-center justify-center text-xs">3</span>
                                            База Знаний (Attic)
                                        </h3>
                                        <p className="text-slate-300 text-sm mb-2">
                                            После сбора данных перейдите на вкладку <b>Attic</b> для управления.
                                        </p>
                                        <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 ml-2">
                                            <li><b>Database:</b> Выбор активной базы данных (.json).</li>
                                            <li><b>Export:</b> Сохранение в JSON, Markdown или копия БД.</li>
                                            <li><b>Build KB:</b> Сборка векторной базы для AI аналитики.</li>
                                        </ul>
                                    </section>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="glass-panel col-span-12 row-span-6 p-6 flex flex-col gap-6">
                                <h2 className="text-xl font-display font-bold text-white">Network Settings</h2>

                                <div className="flex flex-col gap-4 h-full">
                                    <div className="flex flex-col gap-2 flex-1">
                                        <label className="text-xs font-mono text-bronze-400 uppercase tracking-widest">
                                            Список Прокси (IP:PORT:USER:PASS)
                                        </label>
                                        <div className="text-xs text-slate-500 mb-2">
                                            Один прокси на строку. Система будет переключаться при сбоях.
                                        </div>
                                        <textarea
                                            value={typeof proxy === 'string' ? proxy : ''} // Support string input
                                            onChange={(e) => setProxy(e.target.value)} // Store as raw string
                                            placeholder={`31.59.20.176:6754:user:pass\n23.95.150.145:6114:user:pass`}
                                            className="bg-white/5 border border-white/10 rounded p-4 text-white font-mono text-sm focus:border-bronze-400 focus:outline-none resize-none flex-1 leading-relaxed"
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded text-sm text-emerald-200">
                                    <p className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Прокси сохранены автоматически. Вставьте список и вернитесь к парсеру.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div >
        </div >
    )
}

export default App
