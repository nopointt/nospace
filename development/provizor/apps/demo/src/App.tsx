import { useState } from 'react';
import { OverviewSection } from './sections/OverviewSection';
import { HeroSection } from './sections/HeroSection';
import { PnLSection } from './sections/PnLSection';
import { MarkupCheckerSection } from './sections/MarkupCheckerSection';
import { ChannelSection } from './sections/ChannelSection';
import { RoadmapSection } from './sections/RoadmapSection';
import './index.css';

type Tab = 'overview' | 'hero' | 'pnl' | 'markup' | 'channels' | 'roadmap';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'hero', label: 'Рентабельность' },
  { id: 'pnl', label: 'P&L' },
  { id: 'markup', label: 'Наценки КЗ' },
  { id: 'channels', label: 'Каналы' },
  { id: 'roadmap', label: 'Roadmap' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-tight">Provizor</h1>
              <p className="text-xs text-slate-400">Unit-экономика аптечной сети</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">5 аптек · Алматы · Demo</div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewSection />}
        {activeTab === 'hero' && <HeroSection />}
        {activeTab === 'pnl' && <PnLSection />}
        {activeTab === 'markup' && <MarkupCheckerSection />}
        {activeTab === 'channels' && <ChannelSection />}
        {activeTab === 'roadmap' && <RoadmapSection />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-slate-400">
          Provizor · Данные предзаполнены бенчмарками аптечного рынка Алматы · Введите свои данные для точного расчёта
        </div>
      </footer>
    </div>
  );
}

export default App;
