import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  WifiOff,
  Calendar as CalendarIcon,
  RotateCcw,
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import {
  formatDisplayDate,
  getGreeting,
  getTodayDateString,
  isToday,
} from '../utils/dateUtils';

export const Header: React.FC = () => {
  const {
    currentDate,
    setCurrentDate,
    settings,
    canInstallPWA,
    triggerPWAInstall,
    setActiveTab,
  } = useHealth();

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const changeDay = (offset: number) => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + offset);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    setCurrentDate(`${year}-${month}-${day}`);
  };

  const jumpToToday = () => {
    setCurrentDate(getTodayDateString());
  };

  const isCurrentDateToday = isToday(currentDate);

  return (
    <header
      id="app-header"
      className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors"
    >
      <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3">
        {/* Top bar with Greeting & Badges */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
              {getGreeting(settings.userName || 'Ashish')}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Daily Routine & Health Tracker
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                title="Running in offline mode (IndexedDB storage active)"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline Mode</span>
              </span>
            )}

            {canInstallPWA && (
              <button
                id="btn-install-pwa"
                onClick={triggerPWAInstall}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
                title="Install PWA on your device"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="mt-3 flex items-center justify-between bg-zinc-100/90 dark:bg-zinc-800/70 p-1.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
          <button
            id="btn-prev-day"
            onClick={() => changeDay(-1)}
            aria-label="Previous day"
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors shadow-xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('calendar')}
              className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{formatDisplayDate(currentDate)}</span>
            </button>

            {!isCurrentDateToday && (
              <button
                id="btn-today-pill"
                onClick={jumpToToday}
                className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Today</span>
              </button>
            )}
          </div>

          <button
            id="btn-next-day"
            onClick={() => changeDay(1)}
            aria-label="Next day"
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors shadow-xs"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
