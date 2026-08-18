import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppSettings, DailyRecord, TaskKey, WaterEntry } from '../types';
import { dbManager, DEFAULT_SETTINGS, createEmptyDailyRecord } from '../db/indexedDB';
import { notificationService, TASK_DEFINITIONS } from '../services/notificationService';
import { getTodayDateString, isToday } from '../utils/dateUtils';
import { getCompletedTaskCount } from '../utils/statsUtils';
import { triggerCompletionConfetti, triggerWaterCelebration } from '../utils/confetti';

interface ToastNotification {
  id: string;
  title: string;
  body: string;
  taskKey?: TaskKey;
}

interface HealthContextValue {
  // State
  currentDate: string;
  todayRecord: DailyRecord;
  todayWaterEntries: WaterEntry[];
  allRecords: DailyRecord[];
  settings: AppSettings;
  activeTab: 'home' | 'water' | 'calendar' | 'settings';
  isLoading: boolean;
  notificationPermission: NotificationPermission;
  selectedTaskDetail: TaskKey | null;
  toastMessage: ToastNotification | null;
  canInstallPWA: boolean;

  // Actions
  setActiveTab: (tab: 'home' | 'water' | 'calendar' | 'settings') => void;
  setCurrentDate: (date: string) => void;
  toggleTask: (taskKey: TaskKey) => Promise<void>;
  addWater: (amountMl: number) => Promise<void>;
  deleteWater: (entryId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetTodayProgress: () => Promise<void>;
  clearAllLocalData: () => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  sendTestNotification: (taskKey?: TaskKey) => Promise<boolean>;
  setSelectedTaskDetail: (taskKey: TaskKey | null) => void;
  dismissToast: () => void;
  triggerPWAInstall: () => Promise<boolean>;
  exportBackup: () => Promise<void>;
  importBackup: (jsonStr: string) => Promise<boolean>;
}

const HealthContext = createContext<HealthContextValue | undefined>(undefined);

// BeforeInstallPromptEvent type declaration
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [todayRecord, setTodayRecord] = useState<DailyRecord>(
    createEmptyDailyRecord(getTodayDateString(), DEFAULT_SETTINGS.waterTarget)
  );
  const [todayWaterEntries, setTodayWaterEntries] = useState<WaterEntry[]>([]);
  const [allRecords, setAllRecords] = useState<DailyRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'water' | 'calendar' | 'settings'>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationService.getPermissionStatus()
  );
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskKey | null>(null);
  const [toastMessage, setToastMessage] = useState<ToastNotification | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstallPWA, setCanInstallPWA] = useState<boolean>(false);

  // Apply theme to document
  const applyTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  // Refresh records for the selected date
  const loadDateData = useCallback(async (dateStr: string, currentSettings: AppSettings) => {
    try {
      const record = await dbManager.getDailyRecord(dateStr, currentSettings.waterTarget);
      const waterEntries = await dbManager.getWaterEntriesForDate(dateStr);
      const all = await dbManager.getAllDailyRecords();
      setTodayRecord(record);
      setTodayWaterEntries(waterEntries);
      setAllRecords(all);
    } catch (err) {
      console.error('Failed to load date records:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const loadedSettings = await dbManager.getSettings();
        setSettings(loadedSettings);
        applyTheme(loadedSettings.theme);

        const todayStr = getTodayDateString();
        setCurrentDate(todayStr);
        await loadDateData(todayStr, loadedSettings);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, [applyTheme, loadDateData]);

  // Handle midnight day reset / date check
  useEffect(() => {
    const checkDateInterval = setInterval(() => {
      const actualToday = getTodayDateString();
      if (isToday(currentDate) && currentDate !== actualToday) {
        // Day rolled over at midnight
        setCurrentDate(actualToday);
        loadDateData(actualToday, settings);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkDateInterval);
  }, [currentDate, loadDateData, settings]);

  // PWA install prompt handler
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstallPWA(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstallPWA(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Deep-link / notification click handler
  useEffect(() => {
    notificationService.setTaskSelectCallback((taskKey: TaskKey) => {
      if (taskKey === 'waterGoal') {
        setActiveTab('water');
      } else {
        setSelectedTaskDetail(taskKey);
        setActiveTab('home');
      }
    });

    // Start in-app notification scheduler
    notificationService.startScheduler(
      () => settings,
      () => todayRecord,
      (title, body, taskKey) => {
        setToastMessage({
          id: `${taskKey}-${Date.now()}`,
          title,
          body,
          taskKey,
        });
      }
    );

    return () => {
      notificationService.stopScheduler();
    };
  }, [settings, todayRecord]);

  // Actions
  const toggleTask = async (taskKey: TaskKey) => {
    const isCurrentlyDone = todayRecord[taskKey];
    const newStatus = !isCurrentlyDone;

    const updatedCompletedAt = { ...(todayRecord.completedAt || {}) };
    if (newStatus) {
      const now = new Date();
      updatedCompletedAt[taskKey] = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      delete updatedCompletedAt[taskKey];
    }

    const updatedRecord: DailyRecord = {
      ...todayRecord,
      [taskKey]: newStatus,
      completedAt: updatedCompletedAt,
      lastUpdated: Date.now(),
    };

    // If task is waterGoal manually toggled
    if (taskKey === 'waterGoal' && newStatus && updatedRecord.waterConsumed < updatedRecord.waterTarget) {
      // Set to waterTarget when manually checked
      updatedRecord.waterConsumed = updatedRecord.waterTarget;
    }

    // Save to IndexedDB
    await dbManager.saveDailyRecord(updatedRecord);
    setTodayRecord(updatedRecord);

    // Refresh all records list
    const all = await dbManager.getAllDailyRecords();
    setAllRecords(all);

    // If all 7 tasks are completed, celebrate!
    const newCount = getCompletedTaskCount(updatedRecord);
    if (newCount === 7) {
      triggerCompletionConfetti();
    }
  };

  const addWater = async (amountMl: number) => {
    if (amountMl <= 0) return;

    const newEntry: WaterEntry = {
      id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: currentDate,
      amount: amountMl,
      timestamp: Date.now(),
    };

    await dbManager.addWaterEntry(newEntry);
    const updatedEntries = await dbManager.getWaterEntriesForDate(currentDate);
    const totalConsumed = updatedEntries.reduce((sum, item) => sum + item.amount, 0);

    const prevConsumed = todayRecord.waterConsumed || 0;
    const target = todayRecord.waterTarget || settings.waterTarget || 3000;
    const wasGoalReached = prevConsumed >= target;
    const isNowGoalReached = totalConsumed >= target;

    const updatedRecord: DailyRecord = {
      ...todayRecord,
      waterConsumed: totalConsumed,
      waterGoal: isNowGoalReached,
      lastUpdated: Date.now(),
    };

    if (isNowGoalReached && !wasGoalReached) {
      triggerWaterCelebration();
    }

    await dbManager.saveDailyRecord(updatedRecord);
    setTodayWaterEntries(updatedEntries);
    setTodayRecord(updatedRecord);

    const all = await dbManager.getAllDailyRecords();
    setAllRecords(all);

    if (getCompletedTaskCount(updatedRecord) === 7 && !wasGoalReached && isNowGoalReached) {
      triggerCompletionConfetti();
    }
  };

  const deleteWater = async (entryId: string) => {
    await dbManager.deleteWaterEntry(entryId);
    const updatedEntries = await dbManager.getWaterEntriesForDate(currentDate);
    const totalConsumed = updatedEntries.reduce((sum, item) => sum + item.amount, 0);
    const target = todayRecord.waterTarget || settings.waterTarget || 3000;

    const updatedRecord: DailyRecord = {
      ...todayRecord,
      waterConsumed: totalConsumed,
      waterGoal: totalConsumed >= target,
      lastUpdated: Date.now(),
    };

    await dbManager.saveDailyRecord(updatedRecord);
    setTodayWaterEntries(updatedEntries);
    setTodayRecord(updatedRecord);

    const all = await dbManager.getAllDailyRecords();
    setAllRecords(all);
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const merged: AppSettings = {
      ...settings,
      ...newSettings,
      taskNotifications: {
        ...settings.taskNotifications,
        ...(newSettings.taskNotifications || {}),
      },
    };

    await dbManager.saveSettings(merged);
    setSettings(merged);

    if (newSettings.theme) {
      applyTheme(newSettings.theme);
    }

    // If water target changed, update today's record waterTarget
    if (newSettings.waterTarget && newSettings.waterTarget !== todayRecord.waterTarget) {
      const updatedRecord: DailyRecord = {
        ...todayRecord,
        waterTarget: newSettings.waterTarget,
        waterGoal: (todayRecord.waterConsumed || 0) >= newSettings.waterTarget,
      };
      await dbManager.saveDailyRecord(updatedRecord);
      setTodayRecord(updatedRecord);
    }
  };

  const resetTodayProgress = async () => {
    const target = settings.waterTarget || 3000;
    const reset = await dbManager.resetDay(currentDate, target);
    setTodayRecord(reset);
    setTodayWaterEntries([]);

    const all = await dbManager.getAllDailyRecords();
    setAllRecords(all);
  };

  const clearAllLocalData = async () => {
    await dbManager.clearAllData();
    const todayStr = getTodayDateString();
    setCurrentDate(todayStr);
    setSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.theme);
    const newRecord = createEmptyDailyRecord(todayStr, DEFAULT_SETTINGS.waterTarget);
    setTodayRecord(newRecord);
    setTodayWaterEntries([]);
    setAllRecords([]);
  };

  const requestNotificationPermission = async () => {
    const status = await notificationService.requestPermission();
    setNotificationPermission(status);
    if (status === 'granted') {
      await notificationService.sendTestReminder('breakfast');
    }
    return status;
  };

  const sendTestNotification = async (taskKey: TaskKey = 'breakfast') => {
    const success = await notificationService.sendTestReminder(taskKey);
    setNotificationPermission(notificationService.getPermissionStatus());
    const def = TASK_DEFINITIONS[taskKey];
    setToastMessage({
      id: `test-${Date.now()}`,
      title: def.notificationTitle,
      body: def.notificationBody,
      taskKey,
    });
    return success;
  };

  const triggerPWAInstall = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstallPWA(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const exportBackup = async () => {
    const backup = await dbManager.exportData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `health_tracker_backup_${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importBackup = async (jsonStr: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonStr);
      const success = await dbManager.importData(data);
      if (success) {
        const loadedSettings = await dbManager.getSettings();
        setSettings(loadedSettings);
        applyTheme(loadedSettings.theme);
        await loadDateData(currentDate, loadedSettings);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  };

  const dismissToast = () => {
    setToastMessage(null);
  };

  const handleSetCurrentDate = (dateStr: string) => {
    setCurrentDate(dateStr);
    loadDateData(dateStr, settings);
  };

  return (
    <HealthContext.Provider
      value={{
        currentDate,
        todayRecord,
        todayWaterEntries,
        allRecords,
        settings,
        activeTab,
        isLoading,
        notificationPermission,
        selectedTaskDetail,
        toastMessage,
        canInstallPWA,
        setActiveTab,
        setCurrentDate: handleSetCurrentDate,
        toggleTask,
        addWater,
        deleteWater,
        updateSettings,
        resetTodayProgress,
        clearAllLocalData,
        requestNotificationPermission,
        sendTestNotification,
        setSelectedTaskDetail,
        dismissToast,
        triggerPWAInstall,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};
