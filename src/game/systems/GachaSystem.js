import gachaPoolsData from '../../../assets/data/json/gachaPools.json';
import portraitSetsData from '../../../assets/data/json/portraitSets.json';
import portraitFragmentsData from '../../../assets/data/json/portraitFragments.json';
import FusionGirlManager from './FusionGirlManager.js';
import { getFusionGirlById } from '../data/FusionGirlData.js';
import EventBus, { GameEvents } from '../EventBus.js';

const QUALITY_ORDER = ['R', 'SR', 'SSR', 'UR'];

const QUALITY_COLORS = {
  R: '#4dabf7',
  SR: '#9775fa',
  SSR: '#f59f00',
  UR: '#ff6b6b'
};

const QUALITY_NAMES = {
  R: '稀有',
  SR: '精良',
  SSR: '史诗',
  UR: '传说'
};

export default class GachaSystem {
  constructor(baseSystem) {
    this.baseSystem = baseSystem;
    this.pools = gachaPoolsData;
    this.currentPool = this.pools[0];
    this.pityCounter = this.loadPityCounter();
    this.history = this.loadHistory();
  }

  loadPityCounter() {
    return window.gameData?.gacha?.pityCounter || { count: 0, srCount: 0, ssrCount: 0, urCount: 0 };
  }

  savePityCounter() {
    if (!window.gameData) return;
    if (!window.gameData.gacha) {
      window.gameData.gacha = { pityCounter: { count: 0, srCount: 0, ssrCount: 0, urCount: 0 }, history: [] };
    }
    window.gameData.gacha.pityCounter = { ...this.pityCounter };
    EventBus.emit(GameEvents.SAVE_REQUESTED);
  }

  loadHistory() {
    return window.gameData?.gacha?.history || [];
  }

  saveHistory() {
    if (!window.gameData) return;
    if (!window.gameData.gacha) {
      window.gameData.gacha = { pityCounter: { count: 0, srCount: 0, ssrCount: 0, urCount: 0 }, history: [] };
    }
    window.gameData.gacha.history = [...this.history];
    EventBus.emit(GameEvents.SAVE_REQUESTED);
  }

  addToHistory(fragment) {
    this.history.unshift({
      id: fragment.id,
      fusionGirlId: fragment.fusionGirlId,
      fusionGirlName: fragment.fusionGirlName,
      portraitSetId: fragment.portraitSetId,
      portraitSetName: fragment.portraitSetName,
      fragmentQuality: fragment.fragmentQuality,
      fragmentSlot: fragment.fragmentSlot,
      time: Date.now()
    });
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
    this.saveHistory();
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  getFusionGirlManager() {
    return FusionGirlManager.fromJSON(window.gameData?.fusionGirlManager || {});
  }

  getAvailableGirlIds() {
    const manager = this.getFusionGirlManager();
    return manager.getSummonUnlockedGirlIds();
  }

  getAvailableFragmentsByQuality(quality) {
    const unlockedGirlIds = this.getAvailableGirlIds();
    if (!Array.isArray(unlockedGirlIds) || unlockedGirlIds.length === 0) {
      return [];
    }

    return portraitFragmentsData.filter((fragment) => {
      if (fragment.fragmentQuality !== quality) return false;
      if (!unlockedGirlIds.includes(fragment.fusionGirlId)) return false;
      return portraitSetsData.some((set) => set.id === fragment.portraitSetId && set.fusionGirlId === fragment.fusionGirlId);
    });
  }

  hasAvailableFragments() {
    return QUALITY_ORDER.some((quality) => this.getAvailableFragmentsByQuality(quality).length > 0);
  }

  rollGacha(count = 1) {
    if (!this.hasAvailableFragments()) {
      return { success: false, reason: 'no_unlocked_fragments', results: [] };
    }

    const results = [];

    for (let index = 0; index < count; index += 1) {
      this.pityCounter.count += 1;
      this.pityCounter.srCount += 1;
      this.pityCounter.ssrCount += 1;
      this.pityCounter.urCount += 1;

      const quality = this.calculateQuality();
      const fragment = this.createFragmentReward(quality);
      if (!fragment) {
        continue;
      }

      results.push(fragment);
      this.addToHistory(fragment);

      if (QUALITY_ORDER.indexOf(quality) >= QUALITY_ORDER.indexOf('SR')) {
        this.pityCounter.srCount = 0;
      }
      if (QUALITY_ORDER.indexOf(quality) >= QUALITY_ORDER.indexOf('SSR')) {
        this.pityCounter.ssrCount = 0;
      }
      if (quality === 'UR') {
        this.pityCounter.urCount = 0;
      }
    }

    this.savePityCounter();
    return { success: results.length > 0, results };
  }

  calculateQuality() {
    const pool = this.currentPool;
    const roll = Math.random() * 100;

    if (this.pityCounter.urCount >= pool.pityUR) return 'UR';
    if (this.pityCounter.ssrCount >= pool.pitySSR) return 'SSR';
    if (this.pityCounter.srCount >= pool.pitySR) return 'SR';

    if (this.pityCounter.ssrCount >= (pool.softPitySSRStart || 35) && this.pityCounter.ssrCount < pool.pitySSR) {
      const softPityChance = (this.pityCounter.ssrCount - (pool.softPitySSRStart || 35)) / (pool.pitySSR - (pool.softPitySSRStart || 35));
      if (roll < softPityChance * 50) {
        return this.getRandomQuality(['SR', 'SSR']);
      }
    }

    if (this.pityCounter.srCount >= (pool.softPitySRStart || 8) && this.pityCounter.srCount < pool.pitySR) {
      const softPityChance = (this.pityCounter.srCount - (pool.softPitySRStart || 8)) / (pool.pitySR - (pool.softPitySRStart || 8));
      if (roll < softPityChance * 30) {
        return 'SR';
      }
    }

    if (roll < 5) return 'UR';
    if (roll < 15) return 'SSR';
    if (roll < 40) return 'SR';
    return 'R';
  }

  getRandomQuality(qualities) {
    const weights = { R: 60, SR: 25, SSR: 10, UR: 5 };
    const filteredQualities = qualities.filter((quality) => weights[quality] !== undefined);
    const totalWeight = filteredQualities.reduce((sum, quality) => sum + weights[quality], 0);
    let random = Math.random() * totalWeight;

    for (const quality of filteredQualities) {
      random -= weights[quality];
      if (random <= 0) {
        return quality;
      }
    }

    return filteredQualities[filteredQualities.length - 1] || 'R';
  }

  createFragmentReward(quality = 'R') {
    let available = this.getAvailableFragmentsByQuality(quality);
    if (available.length === 0) {
      available = QUALITY_ORDER.flatMap((q) => this.getAvailableFragmentsByQuality(q));
    }
    if (available.length === 0) {
      return null;
    }

    const selected = available[Math.floor(Math.random() * available.length)];
    const fusionGirl = getFusionGirlById(selected.fusionGirlId);
    const portraitSet = portraitSetsData.find((item) => item.id === selected.portraitSetId);

    return {
      id: selected.id,
      type: 'portraitFragment',
      fusionGirlId: selected.fusionGirlId,
      fusionGirlName: fusionGirl?.name || selected.fusionGirlId,
      portraitSetId: selected.portraitSetId,
      portraitSetName: portraitSet?.setName || selected.portraitSetId,
      fragmentQuality: selected.fragmentQuality,
      fragmentSlot: selected.fragmentSlot,
      requiredCount: selected.requiredCount,
      bonusType: selected.bonusType,
      bonusValue: selected.bonusValue,
      overflowElement: selected.overflowElement,
      icon: selected.icon,
      description: selected.description,
      amount: 1
    };
  }

  applyResults(fragmentResults) {
    const manager = this.getFusionGirlManager();
    const grants = [];
    const elementPoints = { ...(window.gameData?.elementPoints || { water: 0, fire: 0, wind: 0 }) };

    fragmentResults.forEach((fragment) => {
      const result = manager.addFragment(fragment, fragment.amount || 1);
      if (result.success && result.overflowCount > 0) {
        const element = result.overflowElement || 'water';
        elementPoints[element] = (elementPoints[element] || 0) + result.overflowCount;
      }
      grants.push({ ...fragment, progressResult: result });
    });

    if (!window.gameData) {
      window.gameData = {};
    }
    window.gameData.fusionGirlManager = manager.toJSON();
    window.gameData.elementPoints = elementPoints;
    EventBus.emit(GameEvents.SAVE_REQUESTED);

    return grants;
  }

  getPityInfo() {
    return {
      currentCount: this.pityCounter.count,
      srPity: this.currentPool.pitySR - this.pityCounter.srCount,
      ssrPity: this.currentPool.pitySSR - this.pityCounter.ssrCount,
      urPity: this.currentPool.pityUR - this.pityCounter.urCount
    };
  }

  getQualityColor(quality) {
    return QUALITY_COLORS[quality] || QUALITY_COLORS.R;
  }

  getQualityName(quality) {
    return QUALITY_NAMES[quality] || quality;
  }

  static getQualityColor(quality) {
    return QUALITY_COLORS[quality] || QUALITY_COLORS.R;
  }

  static getQualityName(quality) {
    return QUALITY_NAMES[quality] || quality;
  }

  toJSON() {
    return {
      pityCounter: this.pityCounter,
      history: this.history
    };
  }
}
