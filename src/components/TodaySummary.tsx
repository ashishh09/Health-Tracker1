import React from 'react';
import { useHealth } from '../context/HealthContext';
import { getCompletedTaskCount, getCompletionPercentage } from '../utils/statsUtils';
import { ORDERED_TASK_KEYS, TASK_DEFINITIONS } from '../services/notificationService';
import { formatDisplayDate, mlToLiters } from '../utils/dateUtils';
import { Moon, CheckCircle2, Circle } from 'lucide-react';

export const TodaySummary: React.FC = () => {
  const { currentDate, todayRecord, settings, toggleTask, setSelectedTaskDetail, setActiveTab } = useHealth();

  const completedCount = getCompletedTaskCount(todayRecord);
  const percentage = getCompletionPercentage(todayRecord);

  const waterConsumedL = mlToLiters(todayRecord.waterConsumed || 0);
  const waterTargetL = mlToLiters(todayRecord.waterTarget || settings.waterTarget || 3000);

  return (
    <div
      id="today-summary-section"
      className="bg-zinc-900 text-white dark:bg-zinc-950 rounded-3xl p-5 border border-zinc-800 shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-white">Today's Summary</h3>
            <p className="text-xs text-zinc-400 font-medium">{formatDisplayDate(currentDate)}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-extrabold text-emerald-400">{percentage}% Daily Completion</div>
          <div className="text-xs text-zinc-400">{completedCount} / 7 Tasks Completed</div>
        </div>
      </div>

      {/* Task Checklist in Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {ORDERED_TASK_KEYS.map((key) => {
          const def = TASK_DEFINITIONS[key];
          const isDone =
            key === 'waterGoal'
              ? todayRecord.waterGoal ||
                todayRecord.waterConsumed >= (todayRecord.waterTarget || 3000)
              : !!todayRecord[key];

          return (
            <div
              key={key}
              onClick={() => {
                if (key === 'waterGoal') {
                  setActiveTab('water');
                } else {
                  setSelectedTaskDetail(key);
                }
              }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                isDone
                  ? 'bg-zinc-800/80 text-zinc-100 hover:bg-zinc-800'
                  : 'bg-zinc-800/30 text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{def.emoji}</span>
                <span className={`font-medium ${isDone ? 'text-zinc-100' : 'text-zinc-400'}`}>
                  {def.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-bold">
                {isDone ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-400/20" />
                    <span>Done</span>
                  </span>
                ) : (
                  <span className="text-zinc-500 flex items-center gap-1 text-[11px]">
                    <Circle className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Water intake line */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <span className="text-zinc-400 font-medium">Water Hydration</span>
        <span className="font-bold text-sky-400">
          Water: {waterConsumedL} L / {waterTargetL} L
        </span>
      </div>
    </div>
  );
};
