import React from 'react';
import { Home, Droplet, Calendar, Settings } from 'lucide-react';
import { useHealth } from '../context/HealthContext';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, todayRecord, settings } = useHealth();

  const isWaterDone =
    todayRecord.waterGoal ||
    todayRecord.waterConsumed >= (todayRecord.waterTarget || settings.waterTarget || 3000);

  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home },
    {
      id: 'water' as const,
      label: 'Water',
      icon: Droplet,
      badge: !isWaterDone ? `${((todayRecord.waterConsumed || 0) / 1000).toFixed(1)}L` : '✓',
    },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      id="bottom-navigation"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 transition-colors shadow-lg max-w-lg mx-auto md:max-w-2xl lg:max-w-4xl"
    >
      <div className="flex items-center justify-around h-16 px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold scale-105'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'stroke-[2.5px]' : 'stroke-2'
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-3.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none ${
                      isWaterDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-sky-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
