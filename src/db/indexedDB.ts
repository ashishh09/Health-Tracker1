import { AppSettings, DailyRecord, WaterEntry } from '../types';

const DB_NAME = 'PersonalHealthTrackerDB';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Ashish',
  breakfastTime: '08:00',
  lunchTime: '12:00',
  dinnerTime: '20:00',
  faceWashTime: '21:30',
  brushingTime: '22:00',
  sleepTime: '22:30',
  waterTarget: 3000, // 3.0 Liters
  waterReminderInterval: 120, // Every 2 hours (120 min)
  notificationsEnabled: true,
  taskNotifications: {
    breakfast: true,
    lunch: true,
    waterGoal: true,
    dinner: true,
    faceWash: true,
    brushing: true,
    sleep: true,
  },
  theme: 'system',
  soundEnabled: true,
};

export const createEmptyDailyRecord = (date: string, waterTarget = 3000): DailyRecord => ({
  date,
  breakfast: false,
  lunch: false,
  waterGoal: false,
  dinner: false,
  faceWash: false,
  brushing: false,
  sleep: false,
  waterConsumed: 0,
  waterTarget,
  completedAt: {},
  lastUpdated: Date.now(),
});

class IndexedDBManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported on this device/environment.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Daily task records
        if (!db.objectStoreNames.contains('dailyData')) {
          db.createObjectStore('dailyData', { keyPath: 'date' });
        }

        // Individual water consumption logs
        if (!db.objectStoreNames.contains('waterEntries')) {
          const waterStore = db.createObjectStore('waterEntries', { keyPath: 'id' });
          waterStore.createIndex('by_date', 'date', { unique: false });
          waterStore.createIndex('by_timestamp', 'timestamp', { unique: false });
        }

        // Settings key-value store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    });

    return this.dbPromise;
  }

  // ---- Settings ----
  async getSettings(): Promise<AppSettings> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const request = store.get('app_settings');

        request.onsuccess = () => {
          if (request.result && request.result.value) {
            resolve({
              ...DEFAULT_SETTINGS,
              ...request.result.value,
              taskNotifications: {
                ...DEFAULT_SETTINGS.taskNotifications,
                ...(request.result.value.taskNotifications || {}),
              },
            });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        };

        request.onerror = () => {
          resolve(DEFAULT_SETTINGS);
        };
      });
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const request = store.put({ key: 'app_settings', value: settings });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ---- Daily Records ----
  async getDailyRecord(date: string, defaultWaterTarget = 3000): Promise<DailyRecord> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('dailyData', 'readonly');
      const store = tx.objectStore('dailyData');
      const request = store.get(date);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Return default initial record for the day
          const newRecord = createEmptyDailyRecord(date, defaultWaterTarget);
          resolve(newRecord);
        }
      };

      request.onerror = () => {
        resolve(createEmptyDailyRecord(date, defaultWaterTarget));
      };
    });
  }

  async saveDailyRecord(record: DailyRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('dailyData', 'readwrite');
      const store = tx.objectStore('dailyData');
      // Ensure waterGoal is in sync with water consumed
      const validated: DailyRecord = {
        ...record,
        waterGoal: (record.waterConsumed || 0) >= (record.waterTarget || 3000),
        lastUpdated: Date.now(),
      };
      const request = store.put(validated);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDailyRecords(): Promise<DailyRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('dailyData', 'readonly');
      const store = tx.objectStore('dailyData');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  }

  // ---- Water Entries ----
  async getWaterEntriesForDate(date: string): Promise<WaterEntry[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('waterEntries', 'readonly');
      const store = tx.objectStore('waterEntries');
      const index = store.index('by_date');
      const request = index.getAll(IDBKeyRange.only(date));

      request.onsuccess = () => {
        const entries = (request.result || []) as WaterEntry[];
        entries.sort((a, b) => b.timestamp - a.timestamp);
        resolve(entries);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  }

  async addWaterEntry(entry: WaterEntry): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('waterEntries', 'readwrite');
      const store = tx.objectStore('waterEntries');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteWaterEntry(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('waterEntries', 'readwrite');
      const store = tx.objectStore('waterEntries');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteWaterEntriesForDate(date: string): Promise<void> {
    const db = await this.getDB();
    const entries = await this.getWaterEntriesForDate(date);
    if (!entries.length) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('waterEntries', 'readwrite');
      const store = tx.objectStore('waterEntries');
      let completed = 0;
      for (const entry of entries) {
        const req = store.delete(entry.id);
        req.onsuccess = () => {
          completed++;
          if (completed === entries.length) resolve();
        };
        req.onerror = () => reject(req.error);
      }
    });
  }

  // ---- Reset & Clear ----
  async resetDay(date: string, waterTarget = 3000): Promise<DailyRecord> {
    const resetRecord = createEmptyDailyRecord(date, waterTarget);
    await this.saveDailyRecord(resetRecord);
    await this.deleteWaterEntriesForDate(date);
    return resetRecord;
  }

  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['dailyData', 'waterEntries', 'settings'], 'readwrite');
      
      tx.objectStore('dailyData').clear();
      tx.objectStore('waterEntries').clear();
      tx.objectStore('settings').clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ---- Backup & Export / Import ----
  async exportData(): Promise<{
    version: number;
    exportedAt: string;
    dailyData: DailyRecord[];
    waterEntries: WaterEntry[];
    settings: AppSettings;
  }> {
    const db = await this.getDB();
    const dailyData = await this.getAllDailyRecords();
    const settings = await this.getSettings();

    const waterEntries: WaterEntry[] = await new Promise((resolve) => {
      const tx = db.transaction('waterEntries', 'readonly');
      const store = tx.objectStore('waterEntries');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    return {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      dailyData,
      waterEntries,
      settings,
    };
  }

  async importData(data: {
    dailyData?: DailyRecord[];
    waterEntries?: WaterEntry[];
    settings?: AppSettings;
  }): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['dailyData', 'waterEntries', 'settings'], 'readwrite');

      if (data.dailyData && Array.isArray(data.dailyData)) {
        const store = tx.objectStore('dailyData');
        for (const item of data.dailyData) {
          store.put(item);
        }
      }

      if (data.waterEntries && Array.isArray(data.waterEntries)) {
        const store = tx.objectStore('waterEntries');
        for (const item of data.waterEntries) {
          store.put(item);
        }
      }

      if (data.settings) {
        const store = tx.objectStore('settings');
        store.put({ key: 'app_settings', value: data.settings });
      }

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbManager = new IndexedDBManager();
