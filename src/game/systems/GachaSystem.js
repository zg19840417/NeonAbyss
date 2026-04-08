import MinionCard from '../entities/MinionCard.js';
import gachaPoolsData from '../../../assets/data/json/gachaPools.json';
import gachaItemsData from '../../../assets/data/json/gachaItems.json';
import minionCardsData from '../../../assets/data/json/minionCards.json';

const QUALITY_ORDER = ['N', 'R', 'SR', 'SSR', 'UR', 'LE'];

const QUALITY_COLORS = {
  N: '#8a7a6a',
  R: '#4dabf7',
  SR: '#9775fa',
  SSR: '#f59f00',
  UR: '#ff6b6b',
  LE: '#e64980'
};

const QUALITY_NAMES = {
  N: '普通',
  R: '稀有',
  SR: '精良',
  SSR: '史诗',
  UR: '传说',
  LE: '神话'
};

export default class GachaSystem {
  constructor(baseSystem) {
    this.baseSystem = baseSystem;
    this.pools = gachaPoolsData;
    this.currentPool = this.pools[0];
    this.pityCounter = this.loadPityCounter();
    this.history = this.loadHistory();
    this.minionCardsList = minionCardsData;

    this.poolItemsByQuality = {};
    for (let index = 0; index < gachaItemsData.length; index += 1) {
      const item = gachaItemsData[index];
      const cardIndex = parseInt(item.cardId.replace('FM', ''), 10) - 1;
      const cardData = this.minionCardsList[cardIndex];
      if (!cardData) continue;
      const quality = cardData.quality;
      const poolId = item.poolId;
      if (!this.poolItemsByQuality[poolId]) {
        this.poolItemsByQuality[poolId] = {};
      }
      if (!this.poolItemsByQuality[poolId][quality]) {
        this.poolItemsByQuality[poolId][quality] = [];
      }
      this.poolItemsByQuality[poolId][quality].push({ ...item, cardIndex, quality });
    }
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
  }

  addToHistory(character) {
    this.history.unshift({
      id: character.id,
      name: character.name,
      quality: character.quality,
      rarity: character.rarity,
      element: character.element,
      race: character.race,
      charClass: character.charClass,
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

  rollGacha(count = 1) {
    const results = [];

    for (let index = 0; index < count; index += 1) {
      this.pityCounter.count += 1;
      this.pityCounter.srCount += 1;
      this.pityCounter.ssrCount += 1;
      this.pityCounter.urCount += 1;

      const quality = this.calculateQuality();
      const character = this.createCharacter(quality);

      results.push(character);
      this.addToHistory(character);

      if (QUALITY_ORDER.indexOf(quality) >= QUALITY_ORDER.indexOf('SR')) {
        this.pityCounter.srCount = 0;
      }
      if (QUALITY_ORDER.indexOf(quality) >= QUALITY_ORDER.indexOf('SSR')) {
        this.pityCounter.ssrCount = 0;
      }
      if (quality === 'LE') {
        this.pityCounter.urCount = 0;
      }
    }

    this.savePityCounter();
    return results;
  }

  calculateQuality() {
    const pool = this.currentPool;
    const roll = Math.random() * 100;

    if (this.pityCounter.urCount >= pool.pityUR) return 'LE';
    if (this.pityCounter.ssrCount >= pool.pitySSR) return 'SSR';
    if (this.pityCounter.srCount >= pool.pitySR) return 'SR';

    if (this.pityCounter.count >= pool.pityLimit) {
      return this.getRandomQuality(['SR', 'SSR', 'UR', 'LE']);
    }

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

    if (roll < 0.5) return 'LE';
    if (roll < 2.5) return 'UR';
    if (roll < 10) return 'SSR';
    if (roll < 30) return 'SR';
    if (roll < 60) return 'R';
    return 'N';
  }

  getRandomQuality(qualities) {
    const weights = { N: 10, R: 20, SR: 30, SSR: 25, UR: 12, LE: 3 };
    const filteredQualities = qualities.filter((quality) => weights[quality] !== undefined);
    const totalWeight = filteredQualities.reduce((sum, quality) => sum + weights[quality], 0);
    let random = Math.random() * totalWeight;

    for (const quality of filteredQualities) {
      random -= weights[quality];
      if (random <= 0) {
        return quality;
      }
    }

    return filteredQualities[filteredQualities.length - 1];
  }

  createCharacter(quality = 'N') {
    const poolId = this.currentPool.poolId;
    const poolItems = this.poolItemsByQuality[poolId];

    if (!poolItems || !poolItems[quality] || poolItems[quality].length === 0) {
      console.warn(`[GachaSystem] 卡池 ${poolId} 中没有品质 ${quality} 的卡，回退到同品质随机卡。`);
      return this._fallbackCreate(quality);
    }

    const items = poolItems[quality];
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;
    let selectedItem = items[items.length - 1];

    for (const item of items) {
      random -= (item.weight || 1);
      if (random <= 0) {
        selectedItem = item;
        break;
      }
    }

    const cardData = this.minionCardsList[selectedItem.cardIndex];
    if (!cardData) {
      console.warn(`[GachaSystem] 未找到 cardIndex=${selectedItem.cardIndex} 的卡牌数据，回退到同品质随机卡。`);
      return this._fallbackCreate(quality);
    }

    return this._createMinionCardFromData(cardData);
  }

  _createMinionCardFromData(cardData) {
    const qualityToRarity = {
      N: 'common',
      R: 'rare',
      SR: 'epic',
      SSR: 'legendary',
      UR: 'legendary',
      LE: 'legendary'
    };

    return new MinionCard({
      id: cardData.cardId,
      minionId: cardData.cardId,
      name: cardData.name,
      charClass: cardData.profession || 'berserker',
      level: 1,
      rarity: qualityToRarity[cardData.quality] || 'common',
      quality: cardData.quality,
      element: cardData.element || null,
      race: cardData.race || 'plant',
      portrait: cardData.portrait || null,
      description: cardData.description || '',
      star: 1,
      hp: cardData.hp || cardData.maxHp || 100,
      maxHp: cardData.maxHp || cardData.hp || 100,
      atk: cardData.atk || 20,
      spd: cardData.spd ?? cardData.baseSpd ?? 10
    });
  }

  _fallbackCreate(quality) {
    const matching = minionCardsData.filter((card) => card.quality === quality);
    const cardData = matching.length > 0
      ? matching[Math.floor(Math.random() * matching.length)]
      : minionCardsData[Math.floor(Math.random() * minionCardsData.length)];
    return this._createMinionCardFromData(cardData);
  }

  grantCharacter(character) {
    return character;
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
    return QUALITY_COLORS[quality] || QUALITY_COLORS.N;
  }

  getQualityName(quality) {
    return QUALITY_NAMES[quality] || quality;
  }

  static getQualityColor(quality) {
    return QUALITY_COLORS[quality] || QUALITY_COLORS.N;
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
