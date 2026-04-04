import { useState, useRef, useEffect } from 'react';
import type { PharmacyData } from '../lib/mock-data';
import { ActionMenu } from './ActionMenu';
import { DATE_RANGES, type DateRangePreset } from '../lib/date-range';
import type { ReactNode } from 'react';

interface HeaderProps {
  pharmacies: PharmacyData[];
  selectedId: number;
  onSelect: (id: number) => void;
  pageTitle: string;
  actions?: ReactNode;
  dateRange: DateRangePreset;
  onDateRangeChange: (preset: DateRangePreset) => void;
}

export { ActionMenu };

export function Header({ pharmacies, selectedId, onSelect, pageTitle, actions, dateRange, onDateRangeChange }: HeaderProps) {
  const [storeOpen, setStoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const storeRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) setStoreOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedName = selectedId === 0
    ? 'Вся сеть (5 аптек)'
    : pharmacies.find(p => p.id === selectedId)?.name ?? '';

  return (
    <header className="h-14 bg-navy-light border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-text">{pageTitle}</h1>
        {actions}
      </div>

      <div className="flex items-center gap-3">
        {/* Pharmacy switcher */}
        <div ref={storeRef} className="relative">
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className="flex items-center gap-2 bg-navy rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text border border-border transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-[10px] text-accent font-bold">
                {selectedId === 0 ? '5' : selectedId}
              </span>
            </div>
            <span className="max-w-[160px] truncate">{selectedName}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {storeOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-navy-light border border-border rounded-lg shadow-xl z-50 py-1">
              <button
                onClick={() => { onSelect(0); setStoreOpen(false); }}
                className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 transition-colors ${
                  selectedId === 0 ? 'text-accent bg-navy' : 'text-text-secondary hover:bg-navy hover:text-text'
                }`}
              >
                <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center">
                  <span className="text-[10px] text-accent font-bold">All</span>
                </div>
                Вся сеть (5 аптек)
              </button>
              <div className="border-t border-border my-1" />
              {pharmacies.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p.id); setStoreOpen(false); }}
                  className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 transition-colors ${
                    selectedId === p.id ? 'text-accent bg-navy' : 'text-text-secondary hover:bg-navy hover:text-text'
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center">
                    <span className="text-[10px] text-accent font-bold">{p.id}</span>
                  </div>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date range picker */}
        <div ref={dateRef} className="relative">
          <button
            onClick={() => setDateOpen(!dateOpen)}
            className="flex items-center gap-2 bg-navy rounded-lg px-3 py-2 text-xs text-text-secondary hover:text-text border border-border transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {DATE_RANGES[dateRange].label}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dateOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-navy-light border border-border rounded-lg shadow-xl z-50 py-1">
              {(Object.keys(DATE_RANGES) as DateRangePreset[]).map(preset => (
                <button
                  key={preset}
                  onClick={() => { onDateRangeChange(preset); setDateOpen(false); }}
                  className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                    dateRange === preset ? 'text-accent bg-navy' : 'text-text-secondary hover:bg-navy hover:text-text'
                  }`}
                >
                  {DATE_RANGES[preset].label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification bell */}
        <button className="relative p-2 text-text-muted hover:text-text transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>

        {/* User profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-8 h-8 rounded-full bg-navy-lighter flex items-center justify-center text-text-secondary hover:text-text transition-colors border border-border"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-navy-light border border-border rounded-lg shadow-xl z-50 py-1">
              <div className="px-4 py-2.5 border-b border-border">
                <div className="text-sm text-text font-medium">Алимхан</div>
                <div className="text-xs text-text-muted">admin@provizor.kz</div>
              </div>
              <div className="py-1">
                <MenuLink icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" label="Настройки" />
                <MenuLink icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" label="Управление аптеками" />
              </div>
              <div className="border-t border-border py-1">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-text-secondary">Dark Mode</span>
                  <div className="w-8 h-4 bg-accent rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-navy rounded-full" />
                  </div>
                </div>
              </div>
              <div className="border-t border-border py-1">
                <MenuLink icon="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Помощь" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-navy flex items-center gap-3 transition-colors">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      {label}
    </button>
  );
}
