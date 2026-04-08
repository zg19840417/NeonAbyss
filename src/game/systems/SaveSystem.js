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
  }

  createNewGame() {
    return createDefaultGameData();
  }

  save(saveData) {
    try {
      const normalized = saveGameData(saveData);
      return { success: true, timestamp: Date.now(), data: normalized };
    } catch (error) {
      console.error('存档失败:', error);
      return { success: false, error: error.message };
    }
  }

  load() {
    return loadGameData();
  }

  loadBackup() {
    return loadGameData();
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
      teamSize: saveData?.minionCardManager?.deployedCards?.length || 0
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
}
