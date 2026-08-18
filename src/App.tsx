import React from 'react';
import { HealthProvider, useHealth } from './context/HealthContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { CompletionScore } from './components/CompletionScore';
import { TaskCard } from './components/TaskCard';
import { TodaySummary } from './components/TodaySummary';
import { WaterSection } from './components/WaterSection';
import { CalendarSection } from './components/CalendarSection';
import { SettingsSection } from './components/SettingsSection';
import { TaskDetailModal } from './components/TaskDetailModal';
import { Toast } from './components/Toast';
import { ORDERED_TASK_KEYS } from './services/notificationService';
import { Loader2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, isLoading } = useHealth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          Loading your personal health records...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors flex flex-col pb-24">
      {/* Toast Notification overlay */}
      <Toast />

      {/* Persistent Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg md:max-w-2xl lg:max-w-4xl w-full mx-auto px-4 py-4 space-y-6">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Daily Completion Score Gauge */}
            <CompletionScore />

            {/* Today's Tasks Section */}
            <div id="todays-tasks-section" className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Today's Tasks
                </h2>
                <span className="text-xs font-semibold text-zinc-400">
                  Tap card or checkmark to toggle
                </span>
              </div>

              {/* 7 Daily Tasks */}
              <div className="space-y-2.5">
                {ORDERED_TASK_KEYS.map((taskKey) => (
                  <TaskCard key={taskKey} taskKey={taskKey} />
                ))}
              </div>
            </div>

            {/* Nightly Today's Summary */}
            <TodaySummary />
          </div>
        )}

        {activeTab === 'water' && (
          <div className="animate-in fade-in duration-200">
            <WaterSection />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="animate-in fade-in duration-200">
            <CalendarSection />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-200">
            <SettingsSection />
          </div>
        )}
      </main>

      {/* Task Detail Modal */}
      <TaskDetailModal />

      {/* Bottom Mobile & Tablet Navigation */}
      <Navigation />
    </div>
  );
};

export default function App() {
  return (
    <HealthProvider>
      <MainContent />
    </HealthProvider>
  );
}
