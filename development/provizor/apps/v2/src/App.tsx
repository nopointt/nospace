import { useState, useMemo } from 'react';
import { Sidebar, type Page } from './components/Sidebar';
import { Header, ActionMenu } from './components/Header';
import { PHARMACIES, networkTotal } from './lib/mock-data';
import { DATE_RANGES, type DateRangePreset } from './lib/date-range';
import { DashboardPage } from './pages/DashboardPage';
import { PnLPage } from './pages/PnLPage';
import { SkuAnalyticsPage } from './pages/SkuAnalyticsPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { MarkupPage } from './pages/MarkupPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { DefecturaPage } from './pages/DefecturaPage';
import { TurnoverPage } from './pages/TurnoverPage';
import './index.css';

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  pnl: 'P&L Отчёт',
  sku: 'Аналитика SKU',
  channels: 'Каналы продаж',
  markup: 'Наценки КЗ',
  defectura: 'Дефектура',
  turnover: 'Оборачиваемость',
  roadmap: 'Roadmap',
};

const EXPORT_ICON = 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4';
const FILTER_ICON = 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z';
const CUSTOMIZE_ICON = 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4';

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [selectedPharmacy, setSelectedPharmacy] = useState(0);
  const [dateRange, setDateRange] = useState<DateRangePreset>('month');

  const period = DATE_RANGES[dateRange];

  const activeData = useMemo(() => {
    if (selectedPharmacy === 0) return networkTotal();
    return PHARMACIES.find(p => p.id === selectedPharmacy) ?? networkTotal();
  }, [selectedPharmacy]);

  const pageActions = useMemo(() => {
    const exportAction = {
      label: 'Export CSV',
      icon: EXPORT_ICON,
      onClick: () => { /* handled per-page */ },
    };
    const filterAction = {
      label: 'Фильтры',
      icon: FILTER_ICON,
      onClick: () => { /* placeholder */ },
    };
    const customizeAction = {
      label: 'Настроить',
      icon: CUSTOMIZE_ICON,
      onClick: () => { /* placeholder */ },
    };

    const menuItems = {
      dashboard: [filterAction, customizeAction, exportAction],
      pnl: [exportAction],
      sku: [filterAction, exportAction],
      channels: [exportAction],
      markup: [],
      defectura: [exportAction],
      turnover: [exportAction],
      roadmap: [],
    };

    const items = menuItems[activePage];
    if (items.length === 0) return undefined;

    return <ActionMenu items={items} />;
  }, [activePage]);

  return (
    <div className="min-h-screen bg-navy flex">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <Header
          pharmacies={PHARMACIES}
          selectedId={selectedPharmacy}
          onSelect={setSelectedPharmacy}
          pageTitle={PAGE_TITLES[activePage]}
          actions={pageActions}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <main className="flex-1 p-6 overflow-auto">
          {activePage === 'dashboard' && <DashboardPage data={activeData} allPharmacies={PHARMACIES} period={period} />}
          {activePage === 'pnl' && <PnLPage pharmacies={PHARMACIES} selectedId={selectedPharmacy} period={period} />}
          {activePage === 'sku' && <SkuAnalyticsPage period={period} />}
          {activePage === 'channels' && <ChannelsPage data={activeData} period={period} />}
          {activePage === 'markup' && <MarkupPage />}
          {activePage === 'defectura' && <DefecturaPage data={activeData} allPharmacies={PHARMACIES} period={period} />}
          {activePage === 'turnover' && <TurnoverPage data={activeData} allPharmacies={PHARMACIES} period={period} />}
          {activePage === 'roadmap' && <RoadmapPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
