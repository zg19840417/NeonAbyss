import zoneStagesData from '../../../assets/data/json/zoneStages.json';

class ZoneData {
  constructor() {
    this._stages = {};
    this._byZone = {};
    this._load();
  }

  _load() {
    if (!Array.isArray(zoneStagesData)) return;
    zoneStagesData.forEach(s => {
      this._stages[s.stageId] = s;
      if (!this._byZone[s.zoneId]) this._byZone[s.zoneId] = [];
      this._byZone[s.zoneId].push(s);
    });
    Object.values(this._byZone).forEach(stages => stages.sort((a, b) => a.stageIndex - b.stageIndex));
  }

  getStageById(stageId) {
    return this._stages[stageId] || null;
  }

  getStagesByZone(zoneId) {
    return this._byZone[zoneId] || [];
  }

  getBossStage(zoneId) {
    const stages = this._byZone[zoneId] || [];
    return stages.find(s => s.isBoss) || null;
  }

  getZoneInfo(zoneId) {
    const stages = this._byZone[zoneId] || [];
    if (stages.length === 0) return null;
    const first = stages[0];
    const boss = stages.find(s => s.isBoss);
    return {
      zoneId: first.zoneId,
      zoneName: first.zoneName,
      totalLayers: first.totalLayers || stages.length,
      branches: first.branches || 2,
      eventPoolId: first.eventPoolId,
      bossId: boss ? boss.bossId : null,
      bossName: boss ? (boss.eventId || '') : null
    };
  }

  getAllZones() {
    const zones = {};
    Object.values(this._stages).forEach(s => {
      if (!zones[s.zoneId]) {
        zones[s.zoneId] = this.getZoneInfo(s.zoneId);
      }
    });
    return Object.values(zones);
  }
}

export default new ZoneData();
