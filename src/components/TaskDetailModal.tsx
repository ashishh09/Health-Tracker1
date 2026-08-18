import React from 'react';
import { X, Clock, Bell, Check, RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { TASK_DEFINITIONS } from '../services/notificationService';
import { formatDisplayDate, formatTimeAMPM } from '../utils/dateUtils';

export const TaskDetailModal: React.FC = () => {
  const {
    selectedTaskDetail,
    setSelectedTaskDetail,
    todayRecord,
    toggleTask,
    settings,
    setActiveTab,
    currentDate,
    sendTestNotification,
  } = useHealth();

  if (!selectedTaskDetail) return null;

  const def = TASK_DEFINITIONS[selectedTaskDetail];
  const isDone = !!todayRecord[selectedTaskDetail];

  const scheduledTime =
    selectedTaskDetail === 'breakfast'
      ? settings.breakfastTime
      : selectedTaskDetail === 'lunch'
      ? settings.lunchTime
      : selectedTaskDetail === 'dinner'
      ? settings.dinnerTime
      : selectedTaskDetail === 'faceWash'
      ? settings.faceWashTime
      : selectedTaskDetail === 'brushing'
      ? settings.brushingTime
      : selectedTaskDetail === 'sleep'
      ? settings.sleepTime
      : 'periodic';

  const completedAt = todayRecord.completedAt?.[selectedTaskDetail];

  return (
    <div
      id="task-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            {formatDisplayDate(currentDate)}
          </span>
          <button
            onClick={() => setSelectedTaskDetail(null)}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Visual Hero */}
        <div className="mt-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl shadow-inner">
            <span>{def.emoji}</span>
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-3 tracking-tight">
            {def.label}
          </h2>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Scheduled: {formatTimeAMPM(scheduledTime)}</span>
          </div>
        </div>

        {/* Notification Quote Box */}
        <div className="mt-5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-left">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Reminder Notification
            </span>
            <button
              onClick={() => sendTestNotification(selectedTaskDetail)}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Test Alert
            </button>
          </div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            "{def.notificationTitle} — {def.notificationBody}"
          </p>
        </div>

        {/* Completion Status Information */}
        <div className="mt-4 text-center">
          {isDone ? (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-sm font-semibold">
              ✓ {def.label} Completed
              {completedAt && <span className="block text-xs font-normal mt-0.5">Recorded at {completedAt}</span>}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium">
              ○ Task is currently pending
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            id="modal-toggle-task-btn"
            onClick={() => {
              toggleTask(selectedTaskDetail);
            }}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 ${
              isDone
                ? 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isDone ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Undo Completion</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Mark {def.label} Done</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTaskDetail(null);
              setActiveTab('settings');
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Edit Reminder Time in Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
