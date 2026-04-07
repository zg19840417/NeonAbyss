import wildStagesData from '../../../assets/data/json/wildStages.json';

class StageData {
  constructor() {
    this._stages = {};
    this._byMap = {};
    this._load();
  }

  _load() {
    if (!Array.isArray(wildStagesData)) return;
    wildStagesData.forEach(s => {
      this._stages[s.stageId] = s;
      if (!this._byMap[s.mapId]) this._byMap[s.mapId] = [];
      this._byMap[s.mapId].push(s);
    });
    // 每个地图内按stageIndex排序
    Object.values(this._byMap).forEach(stages => stages.sort((a, b) => a.stageIndex - b.stageIndex));
  }

  getStageById(stageId) {
    return this._stages[stageId] || null;
  }

  getStagesByMap(mapId) {
    return this._byMap[mapId] || [];
  }

  getAllMaps() {
    const maps = {};
    Object.values(this._stages).forEach(s => {
      if (!maps[s.mapId]) {
        maps[s.mapId] = { mapId: s.mapId, mapName: s.mapName, totalStages: 0, unlockZoneId: null };
      }
      maps[s.mapId].totalStages++;
      if (s.unlockZoneId) maps[s.mapId].unlockZoneId = s.unlockZoneId;
    });
    return Object.values(maps).sort((a, b) => a.mapId - b.mapId);
  }

  getUnlockedStages(playerLevel, clearedStageIds) {
    const cleared = new Set(clearedStageIds || []);
    return Object.values(this._stages).filter(s => {
      if (s.requiredLevel && s.requiredLevel > playerLevel) return false;
      if (s.requiredStageId && !cleared.has(s.requiredStageId)) return false;
      return true;
    });
  }

  checkRequirements(stageId, playerLevel, clearedStageIds) {
    const stage = this._stages[stageId];
    if (!stage) return { canEnter: false, reason: 'not_found' };
    if (stage.requiredLevel && stage.requiredLevel > playerLevel) {
      return { canEnter: false, reason: 'level_required', requiredLevel: stage.requiredLevel };
    }
    if (stage.requiredStageId && !(clearedStageIds || []).includes(stage.requiredStageId)) {
      return { canEnter: false, reason: 'stage_required', requiredStageId: stage.requiredStageId };
    }
    return { canEnter: true };
  }

  getNextStage(stageId) {
    const stage = this._stages[stageId];
    if (!stage) return null;
    const mapStages = this._byMap[stage.mapId] || [];
    const idx = mapStages.findIndex(s => s.stageId === stageId);
    if (idx < 0 || idx >= mapStages.length - 1) return null;
    return mapStages[idx + 1];
  }
}

export default new StageData();
