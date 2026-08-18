import { AppSettings, DailyRecord, TaskDefinition, TaskKey } from '../types';

export const TASK_DEFINITIONS: Record<TaskKey, TaskDefinition> = {
  breakfast: {
    key: 'breakfast',
    label: 'Breakfast',
    emoji: '🍳',
    defaultTime: '08:00',
    notificationTitle: '🍳 Breakfast Time',
    notificationBody: "Don't skip your breakfast.",
  },
  lunch: {
    key: 'lunch',
    label: 'Lunch',
    emoji: '🍱',
    defaultTime: '12:00',
    notificationTitle: '🍱 Lunch Time',
    notificationBody: "It's time for lunch.",
  },
  waterGoal: {
    key: 'waterGoal',
    label: 'Water Goal',
    emoji: '💧',
    defaultTime: 'periodic',
    notificationTitle: '💧 Time to drink water',
    notificationBody: 'Keep working toward your daily goal.',
    isWater: true,
  },
  dinner: {
    key: 'dinner',
    label: 'Dinner',
    emoji: '🍽️',
    defaultTime: '20:00',
    notificationTitle: '🍽️ Dinner Time',
    notificationBody: "It's time for dinner.",
  },
  faceWash: {
    key: 'faceWash',
    label: 'Face Wash',
    emoji: '🧴',
    defaultTime: '21:30',
    notificationTitle: '🧴 Face Wash Time',
    notificationBody: 'Take care of your skin.',
  },
  brushing: {
    key: 'brushing',
    label: 'Brushing',
    emoji: '🪥',
    defaultTime: '22:00',
    notificationTitle: '🪥 Brush Time',
    notificationBody: "Don't forget to brush your teeth.",
  },
  sleep: {
    key: 'sleep',
    label: 'Sleep',
    emoji: '😴',
    defaultTime: '22:30',
    notificationTitle: '😴 Sleep Time',
    notificationBody: 'Time to get ready for sleep.',
  },
};

export const ORDERED_TASK_KEYS: TaskKey[] = [
  'breakfast',
  'lunch',
  'waterGoal',
  'dinner',
  'faceWash',
  'brushing',
  'sleep',
];

// Simple gentle chime synthesizer using Web Audio API
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Create a 2-tone melodic harmonic chime
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, duration: number, gainVal: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(gainVal, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, now, 0.4, 0.15); // C5
    playTone(659.25, now + 0.08, 0.4, 0.15); // E5
    playTone(783.99, now + 0.16, 0.6, 0.2); // G5
  } catch {
    // Ignore audio context errors if blocked by browser policy
  }
}

class NotificationService {
  private reminderIntervalId: number | null = null;
  private lastNotifiedMinutes: Record<string, number> = {};
  private onTaskSelectCallback: ((taskKey: TaskKey) => void) | null = null;

  public setTaskSelectCallback(cb: (taskKey: TaskKey) => void) {
    this.onTaskSelectCallback = cb;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public async sendNotification(
    title: string,
    options: {
      body: string;
      tag?: string;
      taskKey?: TaskKey;
      icon?: string;
      data?: Record<string, unknown>;
    }
  ): Promise<boolean> {
    if (!this.isSupported()) return false;

    // Check permission
    if (Notification.permission !== 'granted') {
      const perm = await this.requestPermission();
      if (perm !== 'granted') return false;
    }

    try {
      playNotificationSound();

      // Try Service Worker registration first for better PWA support
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          badge: '/icon-192.png',
          tag: options.tag || 'health-tracker',
          data: {
            taskKey: options.taskKey,
            url: window.location.origin,
            ...options.data,
          },
        });
        return true;
      }

      // Fallback to standard web notification
      const n = new Notification(title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        tag: options.tag || 'health-tracker',
      });

      n.onclick = () => {
        window.focus();
        if (options.taskKey && this.onTaskSelectCallback) {
          this.onTaskSelectCallback(options.taskKey);
        }
        n.close();
      };

      return true;
    } catch (err) {
      console.warn('Notification display failed:', err);
      return false;
    }
  }

  public sendTestReminder(taskKey: TaskKey = 'breakfast') {
    const task = TASK_DEFINITIONS[taskKey];
    return this.sendNotification(task.notificationTitle, {
      body: task.notificationBody,
      taskKey: task.key,
      tag: `test-${task.key}-${Date.now()}`,
    });
  }

  // Active interval scheduler while the app is open
  public startScheduler(
    getSettings: () => AppSettings,
    getDailyRecord: () => DailyRecord,
    onForegroundToast?: (title: string, body: string, taskKey: TaskKey) => void
  ) {
    if (this.reminderIntervalId) {
      window.clearInterval(this.reminderIntervalId);
    }

    const checkReminders = () => {
      const settings = getSettings();
      if (!settings.notificationsEnabled) return;

      const record = getDailyRecord();
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const todayDateStr = now.toISOString().split('T')[0];

      // Only check if viewing today's record
      if (record.date !== todayDateStr) return;

      // 1. Time-based tasks
      const taskTimeMap: Record<Exclude<TaskKey, 'waterGoal'>, string> = {
        breakfast: settings.breakfastTime,
        lunch: settings.lunchTime,
        dinner: settings.dinnerTime,
        faceWash: settings.faceWashTime,
        brushing: settings.brushingTime,
        sleep: settings.sleepTime,
      };

      for (const [keyStr, timeStr] of Object.entries(taskTimeMap)) {
        const taskKey = keyStr as Exclude<TaskKey, 'waterGoal'>;
        
        // Skip if task already completed
        if (record[taskKey]) continue;

        // Skip if notification disabled for this task
        if (settings.taskNotifications && settings.taskNotifications[taskKey] === false) {
          continue;
        }

        const [tH, tM] = (timeStr || '08:00').split(':').map(Number);
        const taskTotalMinutes = tH * 60 + tM;

        // Trigger if we are on the exact minute and haven't notified in the last 15 minutes
        if (currentTotalMinutes === taskTotalMinutes) {
          const notifyKey = `${todayDateStr}-${taskKey}`;
          const lastNotified = this.lastNotifiedMinutes[notifyKey] || 0;
          if (currentTotalMinutes - lastNotified > 10 || lastNotified === 0) {
            this.lastNotifiedMinutes[notifyKey] = currentTotalMinutes;
            const def = TASK_DEFINITIONS[taskKey];
            this.sendNotification(def.notificationTitle, {
              body: def.notificationBody,
              taskKey: def.key,
              tag: `${taskKey}-${todayDateStr}`,
            });
            if (onForegroundToast) {
              onForegroundToast(def.notificationTitle, def.notificationBody, def.key);
            }
          }
        }
      }

      // 2. Periodic Water reminders during the daytime (e.g. 7 AM to 9 PM)
      if (
        settings.taskNotifications &&
        settings.taskNotifications.waterGoal !== false &&
        currentHours >= 7 &&
        currentHours <= 21
      ) {
        // Only if water target is not reached yet
        if (record.waterConsumed < (record.waterTarget || settings.waterTarget || 3000)) {
          const interval = settings.waterReminderInterval || 120; // in minutes
          // Check if current minute aligns with interval from top of hour or day
          if (currentTotalMinutes % interval === 0) {
            const notifyKey = `${todayDateStr}-water-${currentTotalMinutes}`;
            if (!this.lastNotifiedMinutes[notifyKey]) {
              this.lastNotifiedMinutes[notifyKey] = currentTotalMinutes;
              const def = TASK_DEFINITIONS.waterGoal;
              this.sendNotification(def.notificationTitle, {
                body: def.notificationBody,
                taskKey: 'waterGoal',
                tag: `water-${todayDateStr}-${currentTotalMinutes}`,
              });
              if (onForegroundToast) {
                onForegroundToast(def.notificationTitle, def.notificationBody, 'waterGoal');
              }
            }
          }
        }
      }
    };

    // Run check every 30 seconds
    this.reminderIntervalId = window.setInterval(checkReminders, 30000);
    // Initial check
    checkReminders();
  }

  public stopScheduler() {
    if (this.reminderIntervalId) {
      window.clearInterval(this.reminderIntervalId);
      this.reminderIntervalId = null;
    }
  }
}

export const notificationService = new NotificationService();
