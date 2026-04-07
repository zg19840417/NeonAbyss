import BaseSystem from './BaseSystem.js';
import DungeonSystem from './DungeonSystem.js';
import Character from '../entities/Character.js';
import { CharacterClass } from '../data/CharacterClass.js';

export default class SaveSystem {
  constructor() {
    this.SAVE_KEY = 'wasteland_year_save';
    this.AUTO_SAVE_INTERVAL = 30000;
    this.autoSaveTimer = null;
  }
  
  createNewGame() {
    const saveData = {
      version: '2.0.0',
      timestamp: Date.now(),
      player: {
        name: '拾荒者',
        level: 1,
        exp: 0,
        reputation: { level: 1, exp: 0 }
      },
      base: new BaseSystem().toJSON(),
      dungeon: new DungeonSystem().toJSON(),
      team: [],
      inventory: [],
      chipCardManager: null,
      settings: {
        musicVolume: 0.7,
        sfxVolume: 0.8,
        battleSpeed: 1,
        autoBattle: false,
        autoChip: false
      },
      statistics: {
        totalPlayTime: 0,
        totalBattles: 0,
        totalVictories: 0,
        totalDefeats: 0,
        maxFloorReached: 0,
        totalMyceliumEarned: 0,
        totalCharactersRecruited: 0
      },
      achievements: {
        unlocked: [],
        progress: {}
      },
      quests: {
        daily: [],
        weekly: [],
        completed: []
      }
    };

    return saveData;
  }
  
  save(saveData) {
    try {
      saveData.timestamp = Date.now();
      const jsonString = JSON.stringify(saveData);
      localStorage.setItem(this.SAVE_KEY, jsonString);
      
      const backupKey = this.SAVE_KEY + '_backup';
      localStorage.setItem(backupKey, jsonString);
      
      return { success: true, timestamp: saveData.timestamp };
    } catch (error) {
      console.error('存档失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  load() {
    try {
      const jsonString = localStorage.getItem(this.SAVE_KEY);
      
      if (!jsonString) {
        return null;
      }
      
      const saveData = JSON.parse(jsonString);
      
      if (this.validateSaveData(saveData)) {
        return saveData;
      } else {
        console.warn('存档数据验证失败，尝试加载备份...');
        return this.loadBackup();
      }
    } catch (error) {
      console.error('读档失败:', error);
      return this.loadBackup();
    }
  }
  
  loadBackup() {
    try {
      const backupKey = this.SAVE_KEY + '_backup';
      const jsonString = localStorage.getItem(backupKey);
      
      if (jsonString) {
        const saveData = JSON.parse(jsonString);
        if (this.validateSaveData(saveData)) {
          return saveData;
        }
      }
    } catch (error) {
      console.error('读取备份失败:', error);
    }
    
    return null;
  }
  
  validateSaveData(saveData) {
    if (!saveData) return false;
    if (!saveData.version) return false;
    if (saveData.version !== '2.0.0') return false;
    if (!saveData.base) return false;
    if (!saveData.dungeon) return false;
    return true;
  }
  
  hasSaveData() {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }
  
  deleteSave() {
    localStorage.removeItem(this.SAVE_KEY);
    localStorage.removeItem(this.SAVE_KEY + '_backup');
  }
  
  startAutoSave(getSaveDataCallback) {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      const saveData = getSaveDataCallback();
      if (saveData) {
        this.save(saveData);
        console.log('自动存档完成');
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
    const saveData = this.load();
    if (saveData) {
      const jsonString = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `wasteland_year_save_${Date.now()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      return { success: true };
    }
    return { success: false, error: '没有存档数据' };
  }
  
  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target.result);
          
          if (this.validateSaveData(saveData)) {
            saveData.timestamp = Date.now();
            const result = this.save(saveData);
            resolve(result);
          } else {
            reject(new Error('无效的存档文件'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      
      reader.readAsText(file);
    });
  }
  
  getSaveInfo() {
    const saveData = this.load();
    if (saveData) {
      return {
        exists: true,
        version: saveData.version,
        timestamp: saveData.timestamp,
        floor: saveData.dungeon?.currentFloor || 1,
        maxFloor: saveData.dungeon?.maxReachedFloor || 1,
        mycelium: saveData.base?.mycelium || 0,
        teamSize: saveData.team?.length || 0,
        playTime: saveData.statistics?.totalPlayTime || 0
      };
    }
    return { exists: false };
  }
  
  createQuickSave() {
    const saveData = this.load();
    if (saveData) {
      const quickSaveKey = this.SAVE_KEY + '_quick';
      saveData.timestamp = Date.now();
      localStorage.setItem(quickSaveKey, JSON.stringify(saveData));
      return { success: true };
    }
    return { success: false, error: '没有存档数据' };
  }
  
  loadQuickSave() {
    const quickSaveKey = this.SAVE_KEY + '_quick';
    const jsonString = localStorage.getItem(quickSaveKey);
    
    if (jsonString) {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.error('读取快速存档失败:', error);
      }
    }
    return null;
  }
  
  hasQuickSave() {
    return localStorage.getItem(this.SAVE_KEY + '_quick') !== null;
  }
}
