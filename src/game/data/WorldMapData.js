import worldMapData from '../../../assets/data/json/worldMap.json';
import { getLanguage } from './Lang.js';

class WorldMapData {
  constructor() {
    this._regions = new Map();
    this._load();
  }

  _load() {
    if (!Array.isArray(worldMapData)) return;
    worldMapData.forEach(region => {
      this._regions.set(region.regionId, region);
    });
  }

  getRegionById(regionId) {
    return this._regions.get(regionId) || null;
  }

  getAllRegions() {
    return worldMapData.sort((a, b) => a.order - b.order);
  }

  getRegionName(regionId) {
    const region = this._regions.get(regionId);
    if (!region) return regionId;
    const lang = getLanguage();
    return lang === 'en_us' ? region.regionNameEn : region.regionName;
  }

  getStageName(stage) {
    const lang = getLanguage();
    return lang === 'en_us' ? stage.nameEn : stage.name;
  }

  getDungeonName(dungeon) {
    const lang = getLanguage();
    return lang === 'en_us' ? dungeon.nameEn : dungeon.name;
  }

  getRegionDescription(regionId) {
    const region = this._regions.get(regionId);
    if (!region) return '';
    const lang = getLanguage();
    return lang === 'en_us' ? region.descriptionEn : region.description;
  }

  isRegionUnlocked(regionId) {
    const region = this._regions.get(regionId);
    if (!region) return false;
    if (region.isUnlocked) return true;
    
    const condition = region.unlockCondition;
    if (!condition) return false;

    if (condition.type === 'clearRegion') {
      return window.gameData?.progress?.clearedRegions?.includes(condition.regionId);
    }
    if (condition.type === 'playerLevel') {
      return (window.gameData?.reputationSystem?.level || 1) >= condition.level;
    }
    return false;
  }

  getRegionProgress(regionId) {
    const region = this._regions.get(regionId);
    if (!region) return { cleared: 0, total: 0 };
    
    const clearedStages = window.gameData?.progress?.clearedStages || [];
    let cleared = 0;
    
    region.mainStages.forEach(stage => {
      if (clearedStages.includes(stage.stageId)) {
        cleared++;
      }
    });
    
    return { cleared, total: region.mainStages.length };
  }

  isStageCleared(stageId) {
    return window.gameData?.progress?.clearedStages?.includes(stageId) || false;
  }

  isStageUnlocked(regionId, stageIndex) {
    if (stageIndex === 1) return true;
    
    const region = this._regions.get(regionId);
    if (!region) return false;
    
    const prevStage = region.mainStages[stageIndex - 2];
    if (!prevStage) return true;
    
    return this.isStageCleared(prevStage.stageId);
  }

  getUnlockedDungeon(regionId) {
    const region = this._regions.get(regionId);
    if (!region) return null;
    
    const progress = this.getRegionProgress(regionId);
    if (progress.cleared >= region.mainStages.length) {
      return region.dungeonEntries[0] || null;
    }
    return null;
  }
}

export default new WorldMapData();
