import React, { useState, useRef } from 'react';
import {
  Bell,
  Clock,
  Droplet,
  Moon,
  Sun,
  Laptop,
  Trash2,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldAlert,
  Download,
  Upload,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { TASK_DEFINITIONS, ORDERED_TASK_KEYS } from '../services/notificationService';
import { TaskKey } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { mlToLiters } from '../utils/dateUtils';

export const SettingsSection: React.FC = () => {
  const {
    settings,
    updateSettings,
    notificationPermission,
    requestNotificationPermission,
    sendTestNotification,
    resetTodayProgress,
    clearAllLocalData,
    exportBackup,
    importBackup,
  } = useHealth();

  // Confirmation modal states
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTimeChange = (taskKey: TaskKey, newTime: string) => {
    if (taskKey === 'breakfast') updateSettings({ breakfastTime: newTime });
    if (taskKey === 'lunch') updateSettings({ lunchTime: newTime });
    if (taskKey === 'dinner') updateSettings({ dinnerTime: newTime });
    if (taskKey === 'faceWash') updateSettings({ faceWashTime: newTime });
    if (taskKey === 'brushing') updateSettings({ brushingTime: newTime });
    if (taskKey === 'sleep') updateSettings({ sleepTime: newTime });
  };

  const handleTaskNotificationToggle = (taskKey: TaskKey) => {
    const current = settings.taskNotifications[taskKey] !== false;
    updateSettings({
      taskNotifications: {
        ...settings.taskNotifications,
        [taskKey]: !current,
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importBackup(text);
      if (success) {
        setImportStatus('Backup data successfully imported!');
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus('Failed to import: Invalid backup format.');
      }
    } catch {
      setImportStatus('Error reading backup file.');
    }
  };

  return (
    <div id="settings-section" className="space-y-5 pb-8">
      {/* Profile & Name Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">User Profile</h2>
            <p className="text-xs text-zinc-400">Personalize your greeting and dashboard</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Your Name
          </label>
          <input
            type="text"
            id="input-user-name"
            value={settings.userName || 'Ashish'}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            placeholder="Ashish"
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Routine Task Reminder Times Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Routine Reminder Times</h2>
            <p className="text-xs text-zinc-400">Customize default scheduled reminder times</p>
          </div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {ORDERED_TASK_KEYS.filter((k) => k !== 'waterGoal').map((key) => {
            const def = TASK_DEFINITIONS[key];
            const currentTime =
              key === 'breakfast'
                ? settings.breakfastTime
                : key === 'lunch'
                ? settings.lunchTime
                : key === 'dinner'
                ? settings.dinnerTime
                : key === 'faceWash'
                ? settings.faceWashTime
                : key === 'brushing'
                ? settings.brushingTime
                : settings.sleepTime;

            const isNotificationOn = settings.taskNotifications[key] !== false;

            return (
              <div
                key={key}
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">{def.emoji}</span>
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                      {def.label}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Default: {def.defaultTime === '08:00' ? '8:00 AM' : def.defaultTime === '12:00' ? '12:00 PM' : def.defaultTime === '20:00' ? '8:00 PM' : def.defaultTime === '21:30' ? '9:30 PM' : def.defaultTime === '22:00' ? '10:00 PM' : '10:30 PM'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    id={`time-input-${key}`}
                    value={currentTime}
                    onChange={(e) => handleTimeChange(key, e.target.value)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <button
                    type="button"
                    onClick={() => handleTaskNotificationToggle(key)}
                    title={`Toggle notifications for ${def.label}`}
                    className={`p-2 rounded-xl transition-colors ${
                      isNotificationOn
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Water Tracking Settings Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Droplet className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Water Settings</h2>
            <p className="text-xs text-zinc-400">Target volume and reminder frequency</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Target volume */}
          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-2">
              Daily Target (Default 3.0 L)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3000, 3500].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateSettings({ waterTarget: t })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    settings.waterTarget === t
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {mlToLiters(t)} Liters
                </button>
              ))}
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  min="1000"
                  max="8000"
                  value={settings.waterTarget}
                  onChange={(e) => updateSettings({ waterTarget: parseInt(e.target.value, 10) || 3000 })}
                  className="w-full py-2 px-2 text-xs font-bold rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-center"
                />
                <span className="absolute right-2 top-2 text-[10px] text-zinc-400 font-bold">ml</span>
              </div>
            </div>
          </div>

          {/* Reminder Interval */}
          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-2">
              Water Reminder Interval
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Every 1 hr', min: 60 },
                { label: 'Every 1.5 hrs', min: 90 },
                { label: 'Every 2 hrs', min: 120 },
              ].map((interval) => (
                <button
                  key={interval.min}
                  type="button"
                  onClick={() => updateSettings({ waterReminderInterval: interval.min })}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                    settings.waterReminderInterval === interval.min
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {interval.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications & System Permissions Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Notification Preferences</h2>
            <p className="text-xs text-zinc-400">Configure Web Notifications and Sound</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Permission Status Row */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Browser Permission:
                </span>
                <span
                  className={`text-xs font-extrabold capitalize ${
                    notificationPermission === 'granted'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : notificationPermission === 'denied'
                      ? 'text-red-500'
                      : 'text-amber-500'
                  }`}
                >
                  {notificationPermission}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {notificationPermission === 'granted'
                  ? 'Notifications active on this device'
                  : 'Enable notifications to receive your daily health reminders.'}
              </p>
            </div>

            {notificationPermission !== 'granted' && (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all"
              >
                Enable
              </button>
            )}
          </div>

          {/* Test Reminder Trigger */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">
                Test Reminder Alert
              </span>
              <span className="text-xs text-zinc-400">Trigger an immediate preview alert</span>
            </div>
            <button
              type="button"
              id="btn-test-notification"
              onClick={() => sendTestNotification('breakfast')}
              className="px-3.5 py-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl transition-colors"
            >
              Send Test Reminder
            </button>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              {settings.soundEnabled !== false ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              )}
              <div>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 block">
                  Chime Sound
                </span>
                <span className="text-xs text-zinc-400">Play harmonic bell upon alerts</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                settings.soundEnabled !== false ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  settings.soundEnabled !== false ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Honest Technical Limitation Notice as specified in Section 17 */}
          <div className="p-3.5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
              <span>Platform Notification Capability Note</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              In-app reminders fire reliably while the application is active in the browser or foreground. For the highest reliability on mobile, install this app as a PWA on your home screen. When the device OS deeply suspends background processes, reminder timers resume when the app is reopened.
            </p>
          </div>
        </div>
      </div>

      {/* Theme Settings Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Appearance Theme</h2>
            <p className="text-xs text-zinc-400">Choose your visual color style</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light' as const, label: 'Light', icon: Sun },
            { id: 'dark' as const, label: 'Dark', icon: Moon },
            { id: 'system' as const, label: 'System', icon: Laptop },
          ].map((themeOpt) => {
            const Icon = themeOpt.icon;
            const isSelected = settings.theme === themeOpt.id;

            return (
              <button
                key={themeOpt.id}
                type="button"
                id={`btn-theme-${themeOpt.id}`}
                onClick={() => updateSettings({ theme: themeOpt.id })}
                className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold border transition-all ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{themeOpt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup & Export / Import Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Local Data Backup</h2>
            <p className="text-xs text-zinc-400">Export or restore your personal records locally</p>
          </div>
        </div>

        {importStatus && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            id="btn-export-backup"
            onClick={exportBackup}
            className="py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            id="btn-import-backup"
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Danger Zone / Data Management Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-red-200/80 dark:border-red-950/80 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Data Management</h2>
            <p className="text-xs text-zinc-400">Reset daily progress or wipe local database</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* Reset Today's Progress */}
          <button
            type="button"
            id="btn-reset-today"
            onClick={() => setShowResetModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              <span>Reset Today's Progress</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-normal">Today only</span>
          </button>

          {/* Clear All Local Data */}
          <button
            type="button"
            id="btn-clear-all-data"
            onClick={() => setShowClearModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 text-xs font-bold flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Clear All Local Data</span>
            </span>
            <span className="text-[11px] text-red-500 font-semibold">Irreversible</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset Today's Progress?"
        message="This will reset today's 7 task checkboxes and today's logged water entries back to 0. Historical days in your calendar will remain untouched."
        confirmLabel="Reset Today"
        onConfirm={async () => {
          await resetTodayProgress();
          setShowResetModal(false);
        }}
        onCancel={() => setShowResetModal(false)}
      />

      <ConfirmModal
        isOpen={showClearModal}
        isDestructive
        title="Clear All Local Data?"
        message="Are you sure? This will permanently delete all locally stored health tracking data, routine settings, calendar history, and water logs from IndexedDB."
        confirmLabel="Delete Everything"
        onConfirm={async () => {
          await clearAllLocalData();
          setShowClearModal(false);
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
};
