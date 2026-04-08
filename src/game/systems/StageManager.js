import StageData from '../data/StageData.js';
import EnemyData from '../data/EnemyData.js';
import RewardManager from './RewardManager.js';
import { ensureGlobalGameData, saveGameData as persistGameData } from '../data/GameData.js';

/**
 * 野外关卡管理系统
 * 管理关卡解锁、通关记录、奖励领取
 */
export default class StageManager {
  constructor() {
    this.clearedStages = {};   // { stageId: { firstClear: true } }
    this.rewardManager = new RewardManager();
    this.load();
  }

  load() {
    const gameData = ensureGlobalGameData();
    const clearedStageIds = Array.isArray(gameData?.progress?.clearedStages)
      ? gameData.progress.clearedStages
      : [];

    this.clearedStages = {};
    clearedStageIds.forEach((stageId) => {
      this.clearedStages[stageId] = { firstClear: true };
    });
  }

  save() {
    ensureGlobalGameData();
    if (!window.gameData.progress) {
      window.gameData.progress = { clearedStages: [] };
    }
    window.gameData.progress.clearedStages = this.getClearedStageIds();
    persistGameData(window.gameData);
  }

  getClearedStageIds() {
    return Object.keys(this.clearedStages);
  }

  canEnterStage(stageId) {
    const playerLevel = window.gameData?.reputation?.level || 1;
    return StageData.checkRequirements(stageId, playerLevel, this.getClearedStageIds());
  }

  clearStage(stageId) {
    const isFirst = !this.clearedStages[stageId];
    this.clearedStages[stageId] = { firstClear: true };
    this.save();

    const stage = StageData.getStageById(stageId);
    if (!stage) return { isFirst: false, rewards: [] };

    let rewards = [];
    if (isFirst) {
      rewards = [...(stage.firstClearRewards || []), ...(stage.normalRewards || [])];
    } else {
      rewards = stage.normalRewards || [];
    }

    const result = this.rewardManager.distributeRewards(rewards);
    return { isFirst, rewards: result, unlockZoneId: stage.unlockZoneId || null };
  }

  getUnlockedZones() {
    const cleared = this.getClearedStageIds();
    const zones = [];
    cleared.forEach(stageId => {
      const stage = StageData.getStageById(stageId);
      if (stage?.unlockZoneId) {
        zones.push({ zoneId: stage.unlockZoneId, unlockedByStage: stageId });
      }
    });
    return zones;
  }

  getStageEnemies(stageId) {
    const stage = StageData.getStageById(stageId);
    if (!stage) return [];
    return (stage.enemies || []).map(e =>
      EnemyData.resolveEnemyRef(e.enemyId, e.level)
    ).filter(Boolean);
  }

  toJSON() {
    return { clearedStages: this.clearedStages };
  }
}
