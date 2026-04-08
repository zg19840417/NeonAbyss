import {
  SAVE_KEY,
  createDefaultGameData,
  loadGameData,
  saveGameData,
  resetGameData
} from '../data/GameData.js';

export default class SaveSystem {
  constructor() {
    this.SAVE_KEY = SAVE_KEY;
    this.AUTO_SAVE_INTERVAL = 30000;
    this.autoSaveTimer = null;
    this.CURRENT_SAVE_VERSION = 2;
  }

  createNewGame() {
    return createDefaultGameData();
  }

  save(saveData) {
    try {
      const normalized = saveGameData(saveData);
      this._createBackup(normalized);
      return { success: true, timestamp: Date.now(), data: normalized };
    } catch (error) {
      console.error('存档失败:', error);
      return { success: false, error: error.message };
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return null;
      let data = JSON.parse(raw);
      // 尝试迁移
      data = this._migrateSaveData(data);
      // 校验
      if (!this._validateData(data)) {
        console.warn('存档数据校验失败，尝试恢复备份');
        const backup = this.loadBackup();
        if (backup) {
          this.save(backup); // 用备份覆盖损坏的存档
          return backup;
        }
        return null;
      }
      // 迁移后重新保存
      this.save(data);
      return data;
    } catch (e) {
      console.error('加载存档失败:', e);
      return null;
    }
  }

  loadBackup() {
    const backups = Object.keys(localStorage)
      .filter(k => k.startsWith(this.SAVE_KEY + '_backup_'))
      .sort()
      .reverse();
    if (backups.length === 0) return null;
    try {
      const data = JSON.parse(localStorage.getItem(backups[0]));
      return this._validateData(data) ? data : null;
    } catch (e) {
      return null;
    }
  }

  validateSaveData(saveData) {
    return Boolean(saveData?.base && saveData?.dungeon && saveData?.settings);
  }

  hasSaveData() {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  deleteSave() {
    resetGameData();
  }

  startAutoSave(getSaveDataCallback) {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      const saveData = getSaveDataCallback?.();
      if (saveData) {
        this.save(saveData);
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  exportSave() {
    try {
      const saveData = this.load();
      const jsonString = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wasteland_year_save_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const saveData = JSON.parse(event.target.result);
          if (!this.validateSaveData(saveData)) {
            reject(new Error('无效的存档文件'));
            return;
          }
          resolve(this.save(saveData));
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }

  getSaveInfo() {
    const saveData = this.load();
    return {
      exists: this.hasSaveData(),
      version: saveData?.version || '3.0.0',
      timestamp: Date.now(),
      floor: saveData?.dungeon?.currentFloor || 1,
      maxFloor: saveData?.dungeon?.maxReachedFloor || 1,
      mycelium: saveData?.base?.mycelium || 0,
      teamSize: saveData?.fusionGirlManager?.deployedGirlIds?.length || 0
    };
  }

  createQuickSave() {
    return this.save(this.load());
  }

  loadQuickSave() {
    return this.load();
  }

  hasQuickSave() {
    return this.hasSaveData();
  }

  _migrateSaveData(data) {
    // v1 → v2: 添加 inventory 字段（如果不存在）
    if (!data.version || data.version < 2) {
      if (!data.base) data.base = {};
      if (!data.base.inventory) data.base.inventory = {};
      data.version = 2;
    }
    // 未来: if (data.version < 3) { ... migrate to v3 ... }
    return data;
  }

  _validateData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || typeof data.version !== 'number') return false;
    if (!data.base || typeof data.base !== 'object') return false;
    if (typeof data.base.mycelium !== 'number') return false;
    if (typeof data.base.sourceCore !== 'number') return false;
    if (!data.dungeon || typeof data.dungeon !== 'object') return false;
    if (!data.settings || typeof data.settings !== 'object') return false;
    return true;
  }

  _createBackup(data) {
    try {
      const backupKey = this.SAVE_KEY + '_backup_' + Date.now();
      localStorage.setItem(backupKey, JSON.stringify(data));
      // 只保留最近3个备份
      this._cleanOldBackups(3);
    } catch (e) {
      console.warn('创建备份失败:', e);
    }
  }

  _cleanOldBackups(maxBackups = 3) {
    const backups = Object.keys(localStorage)
      .filter(k => k.startsWith(this.SAVE_KEY + '_backup_'))
      .sort()
      .reverse();
    for (let i = maxBackups; i < backups.length; i++) {
      localStorage.removeItem(backups[i]);
    }
  }
}
