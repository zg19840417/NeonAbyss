import ZoneData from '../data/ZoneData.js';
import EventData from '../data/EventData.js';
import EnemyData from '../data/EnemyData.js';
import RewardManager from './RewardManager.js';

const SAVE_KEY = 'zoneManager';

/**
 * 禁区探索管理系统
 * 管理禁区层数推进、事件处理、分支选择
 */
export default class ZoneManager {
  constructor() {
    this.currentZone = null;       // 当前禁区ID
    this.currentLayer = 0;         // 当前层数
    this.completedZones = {};      // { zoneId: true }
    this.rewardManager = new RewardManager();
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.completedZones = data.completedZones || {};
      }
    } catch (e) {
      console.warn('Failed to load ZoneManager:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ completedZones: this.completedZones }));
    } catch (e) {
      console.warn('Failed to save ZoneManager:', e);
    }
  }

  enterZone(zoneId) {
    this.currentZone = zoneId;
    this.currentLayer = 1;
    this.rewardManager.clearLog();
  }

  getCurrentLayerData() {
    if (!this.currentZone) return null;
    const stages = ZoneData.getStagesByZone(this.currentZone);
    return stages[this.currentLayer - 1] || null;
  }

  advanceLayer() {
    this.currentLayer++;
  }

  isZoneComplete() {
    const layerData = this.getCurrentLayerData();
    return layerData?.isBoss === true;
  }

  completeZone() {
    if (this.currentZone) {
      this.completedZones[this.currentZone] = true;
      this.save();
    }
  }

  resetZone() {
    this.currentZone = null;
    this.currentLayer = 0;
  }

  getCurrentEvent() {
    const layerData = this.getCurrentLayerData();
    if (!layerData) return null;

    // Boss层
    if (layerData.isBoss && layerData.eventId) {
      const boss = EnemyData.resolveBossRef(layerData.eventId);
      return {
        type: 'boss',
        result: { enemies: boss ? [boss] : [], bossId: layerData.eventId }
      };
    }

    // 普通层 - 从事件池抽取
    if (layerData.eventPoolId) {
      const event = EventData.rollEventFromPool(layerData.eventPoolId);
      if (event) {
        return { type: event.eventType, event, result: null };
      }
    }

    return null;
  }

  getBranches() {
    const layerData = this.getCurrentLayerData();
    return layerData ? (layerData.branches || 1) : 1;
  }

  getZoneInfo() {
    return this.currentZone ? ZoneData.getZoneInfo(this.currentZone) : null;
  }

  isZoneCompleted(zoneId) {
    return !!this.completedZones[zoneId];
  }

  toJSON() {
    return { completedZones: this.completedZones };
  }
}
