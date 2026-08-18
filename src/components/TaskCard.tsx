import React from 'react';
import { Check, Clock, Droplet, ArrowRight, Undo2 } from 'lucide-react';
import { TaskKey } from '../types';
import { useHealth } from '../context/HealthContext';
import { TASK_DEFINITIONS } from '../services/notificationService';
import { formatTimeAMPM, mlToLiters } from '../utils/dateUtils';

interface TaskCardProps {
  taskKey: TaskKey;
}

export const TaskCard: React.FC<TaskCardProps> = ({ taskKey }) => {
  const {
    todayRecord,
    settings,
    toggleTask,
    setActiveTab,
    setSelectedTaskDetail,
  } = useHealth();

  const def = TASK_DEFINITIONS[taskKey];
  const isWater = def.isWater;

  // Determine scheduled time
  const scheduledTime =
    taskKey === 'breakfast'
      ? settings.breakfastTime
      : taskKey === 'lunch'
      ? settings.lunchTime
      : taskKey === 'dinner'
      ? settings.dinnerTime
      : taskKey === 'faceWash'
      ? settings.faceWashTime
      : taskKey === 'brushing'
      ? settings.brushingTime
      : taskKey === 'sleep'
      ? settings.sleepTime
      : 'periodic';

  // Completion status
  const isDone = isWater
    ? todayRecord.waterGoal ||
      todayRecord.waterConsumed >= (todayRecord.waterTarget || settings.waterTarget || 3000)
    : !!todayRecord[taskKey];

  const completedAtTime = todayRecord.completedAt?.[taskKey];

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWater) {
      setActiveTab('water');
    } else {
      toggleTask(taskKey);
    }
  };

  const handleCardClick = () => {
    if (isWater) {
      setActiveTab('water');
    } else {
      setSelectedTaskDetail(taskKey);
    }
  };

  return (
    <div
      id={`task-card-${taskKey}`}
      onClick={handleCardClick}
      className={`group relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer ${
        isDone
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60 shadow-xs'
          : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Emoji and Details */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Emoji Avatar */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105 ${
              isDone
                ? 'bg-emerald-100 dark:bg-emerald-900/50'
                : 'bg-zinc-100 dark:bg-zinc-800'
            }`}
          >
            <span>{def.emoji}</span>
          </div>

          {/* Text Labels */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3
                className={`text-base font-bold truncate transition-colors ${
                  isDone
                    ? 'text-emerald-900 dark:text-emerald-200 line-through decoration-emerald-500/50'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {def.label}
              </h3>

              {isDone ? (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> Done
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
                  ○ Pending
                </span>
              )}
            </div>

            {/* Time / Water subtitle */}
            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {isWater ? (
                <div className="flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
                  <Droplet className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {mlToLiters(todayRecord.waterConsumed || 0)} / {mlToLiters(todayRecord.waterTarget || settings.waterTarget || 3000)} L
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{formatTimeAMPM(scheduledTime)}</span>
                </div>
              )}

              {completedAtTime && (
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  • Done at {completedAtTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Toggle Button */}
        <div className="shrink-0">
          {isWater ? (
            <button
              type="button"
              id={`btn-water-quick-jump`}
              onClick={handleCheckboxClick}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isDone
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                  : 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
              }`}
            >
              <span>{isDone ? 'Hydrated ✓' : 'Log Water'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              id={`btn-toggle-task-${taskKey}`}
              onClick={handleCheckboxClick}
              aria-label={isDone ? `Undo ${def.label}` : `Mark ${def.label} Done`}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                isDone
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs active:scale-90'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 border border-zinc-200 dark:border-zinc-700 active:scale-95'
              }`}
              title={isDone ? 'Click to undo completion' : 'Click to mark as done'}
            >
              {isDone ? (
                <Check className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <div className="w-5 h-5 rounded-lg border-2 border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 transition-colors" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
