import React, { useState } from 'react';
import {
  Droplet,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Bell,
  Sliders,
  History,
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { formatDisplayDate, formatTimestamp, mlToLiters } from '../utils/dateUtils';

export const WaterSection: React.FC = () => {
  const {
    currentDate,
    todayRecord,
    todayWaterEntries,
    settings,
    addWater,
    deleteWater,
    updateSettings,
    setActiveTab,
    sendTestNotification,
  } = useHealth();

  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomTargetInput, setShowCustomTargetInput] = useState<boolean>(false);
  const [customTargetInput, setCustomTargetInput] = useState<string>('');

  const waterConsumed = todayRecord.waterConsumed || 0;
  const waterTarget = todayRecord.waterTarget || settings.waterTarget || 3000;
  const isGoalReached = waterConsumed >= waterTarget;

  const percentage = Math.min(Math.round((waterConsumed / waterTarget) * 100), 100);
  const overflowPercentage = Math.round((waterConsumed / waterTarget) * 100);

  const quickAmounts = [
    { label: '+250 ml', amount: 250, icon: '🥛' },
    { label: '+500 ml', amount: 500, icon: '🥤' },
    { label: '+750 ml', amount: 750, icon: '🍶' },
    { label: '+1 L', amount: 1000, icon: '🧊' },
  ];

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customAmount, 10);
    if (!isNaN(parsed) && parsed > 0) {
      addWater(parsed);
      setCustomAmount('');
    }
  };

  const handleTargetChange = (newTargetMl: number) => {
    updateSettings({ waterTarget: newTargetMl });
    setShowCustomTargetInput(false);
  };

  const handleCustomTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customTargetInput);
    if (!isNaN(val) && val > 0) {
      const targetMl = Math.round(val * 1000);
      handleTargetChange(targetMl);
      setCustomTargetInput('');
    }
  };

  return (
    <div id="water-section" className="space-y-5">
      {/* Hydration Main Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Hydration Tracker
              </span>
              {isGoalReached && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  Goal Reached!
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1 tracking-tight">
              Today's Water
            </h2>
            <p className="text-xs text-zinc-400 font-medium">{formatDisplayDate(currentDate)}</p>
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            title="Edit reminder intervals in Settings"
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Big Water Indicator Display */}
        <div className="mt-6 flex flex-col items-center justify-center text-center">
          {/* Animated Water Level Bottle Graphic */}
          <div className="relative w-28 h-44 rounded-3xl border-4 border-sky-300 dark:border-sky-600 bg-sky-50/50 dark:bg-sky-950/30 overflow-hidden shadow-inner flex flex-col justify-end p-1">
            {/* Water liquid filler */}
            <div
              className={`w-full rounded-2xl transition-all duration-700 ease-out ${
                isGoalReached
                  ? 'bg-linear-to-t from-emerald-500 to-sky-400'
                  : 'bg-linear-to-t from-sky-600 to-sky-400'
              }`}
              style={{ height: `${Math.min(percentage, 100)}%` }}
            />
            {/* Liquid overlay percent */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Droplet
                className={`w-8 h-8 ${
                  percentage > 50
                    ? 'text-white/80 fill-white/80'
                    : 'text-sky-500/80 fill-sky-500/80'
                } transition-colors`}
              />
              <span
                className={`text-sm font-black mt-1 ${
                  percentage > 50 ? 'text-white' : 'text-zinc-800 dark:text-zinc-100'
                }`}
              >
                {overflowPercentage}%
              </span>
            </div>
          </div>

          {/* Numerical Water Readout */}
          <div className="mt-4">
            <div className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              <span className="text-sky-600 dark:text-sky-400">{mlToLiters(waterConsumed)}</span>
              <span className="text-zinc-400 dark:text-zinc-600 font-light mx-1">/</span>
              <span>{mlToLiters(waterTarget)} L</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {waterConsumed} ml of {waterTarget} ml consumed today
            </p>
          </div>
        </div>

        {/* Quick-Add Buttons */}
        <div className="mt-6">
          <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
            Quick Add Intake
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickAmounts.map((q) => (
              <button
                key={q.amount}
                id={`btn-quick-add-${q.amount}`}
                type="button"
                onClick={() => addWater(q.amount)}
                className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/80 text-sky-800 dark:text-sky-200 font-bold text-sm transition-all duration-150 active:scale-95 shadow-xs"
              >
                <span className="text-base">{q.icon}</span>
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Intake Input */}
        <form onSubmit={handleCustomAdd} className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              min="10"
              max="5000"
              step="10"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Custom amount (e.g. 350)"
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-zinc-400"
            />
            <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-400">ml</span>
          </div>
          <button
            type="submit"
            id="btn-add-custom-water"
            disabled={!customAmount || parseInt(customAmount, 10) <= 0}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-1 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Daily Target Preset Selector */}
        <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Daily Target Goal
            </label>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
              Active: {mlToLiters(waterTarget)} L
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-target-3000"
              onClick={() => handleTargetChange(3000)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                waterTarget === 3000
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
              }`}
            >
              3.0 L (Default)
            </button>
            <button
              type="button"
              id="btn-target-3500"
              onClick={() => handleTargetChange(3500)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                waterTarget === 3500
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
              }`}
            >
              3.5 L
            </button>
            <button
              type="button"
              id="btn-target-custom"
              onClick={() => setShowCustomTargetInput(!showCustomTargetInput)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                waterTarget !== 3000 && waterTarget !== 3500
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Custom Target
            </button>
          </div>

          {showCustomTargetInput && (
            <form onSubmit={handleCustomTargetSubmit} className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="1.0"
                max="10.0"
                step="0.1"
                value={customTargetInput}
                onChange={(e) => setCustomTargetInput(e.target.value)}
                placeholder="Target in Liters (e.g. 3.2)"
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700"
              >
                Save Target
              </button>
            </form>
          )}
        </div>

        {/* Reminder Interval Info Box */}
        <div className="mt-5 p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                Reminder Interval: Every {settings.waterReminderInterval / 60} hours
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                "💧 Time to drink water — Keep working toward your daily goal."
              </p>
            </div>
          </div>
          <button
            onClick={() => sendTestNotification('waterGoal')}
            className="px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 hover:bg-sky-200 rounded-lg transition-colors"
          >
            Test
          </button>
        </div>
      </div>

      {/* Water Entries History Log Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <History className="w-4 h-4 text-sky-600" />
            <span>Today's Water Entries ({todayWaterEntries.length})</span>
          </h3>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            Total: {waterConsumed} ml
          </span>
        </div>

        {todayWaterEntries.length === 0 ? (
          <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs">
            No water logged yet today. Tap any quick-add button above to start!
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-60 overflow-y-auto">
            {todayWaterEntries.map((entry) => (
              <div
                key={entry.id}
                className="py-2.5 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    💧
                  </div>
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      +{entry.amount} ml
                    </span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id={`btn-delete-water-${entry.id}`}
                  onClick={() => deleteWater(entry.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
