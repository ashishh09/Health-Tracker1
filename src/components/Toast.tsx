import React from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { TASK_DEFINITIONS } from '../services/notificationService';

export const Toast: React.FC = () => {
  const { toastMessage, dismissToast, setSelectedTaskDetail, setActiveTab } = useHealth();

  if (!toastMessage) return null;

  const def = toastMessage.taskKey ? TASK_DEFINITIONS[toastMessage.taskKey] : null;

  const handleClick = () => {
    if (toastMessage.taskKey) {
      if (toastMessage.taskKey === 'waterGoal') {
        setActiveTab('water');
      } else {
        setSelectedTaskDetail(toastMessage.taskKey);
      }
    }
    dismissToast();
  };

  return (
    <div
      id="in-app-toast"
      className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto animate-in slide-in-from-top-4 fade-in duration-300"
    >
      <div
        onClick={handleClick}
        className="bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-zinc-700/80 cursor-pointer flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xl font-bold">
            {def ? def.emoji : <Bell className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-zinc-100 truncate">{toastMessage.title}</h4>
            <p className="text-xs text-zinc-300 line-clamp-1">{toastMessage.body}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast();
            }}
            className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
