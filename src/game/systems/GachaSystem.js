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

    // 构建卡池索引：按数组索引映射gachaItems -> minionCards
    // gachaItems的FM编号对应minionCards数组的顺序索引（FM001=index 0）
    this.minionCardsList = minionCardsData;

    // 按poolId+quality分组gachaItems，用于按品质抽卡
    this.poolItemsByQuality = {};
    for (let i = 0; i < gachaItemsData.length; i++) {
      const item = gachaItemsData[i];
      // FM001 -> index 0, FM002 -> index 1, ...
      const cardIndex = parseInt(item.cardId.replace('FM', '')) - 1;
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
    const saved = localStorage.getItem('gachaPity');
    return saved ? JSON.parse(saved) : { count: 0, srCount: 0, ssrCount: 0, urCount: 0 };
  }

  savePityCounter() {
    localStorage.setItem('gachaPity', JSON.stringify(this.pityCounter));
  }

  loadHistory() {
    const saved = localStorage.getItem('gachaHistory');
    return saved ? JSON.parse(saved) : [];
  }

  saveHistory() {
    localStorage.setItem('gachaHistory', JSON.stringify(this.history));
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

    for (let i = 0; i < count; i++) {
      this.pityCounter.count++;
      this.pityCounter.srCount++;
      this.pityCounter.ssrCount++;
      this.pityCounter.urCount++;

      const quality = this.calculateQuality();
      const character = this.createCharacter(quality);

      results.push(character);
      this.addToHistory(character);

      // 重置保底计数
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

    // UR(LE)保底
    if (this.pityCounter.urCount >= pool.pityUR) {
      return 'LE';
    }

    // SSR保底
    if (this.pityCounter.ssrCount >= pool.pitySSR) {
      return 'SSR';
    }

    // SR十连保底
    if (this.pityCounter.srCount >= pool.pitySR) {
      return 'SR';
    }

    // 硬保底（pityLimit）
    if (this.pityCounter.count >= pool.pityLimit) {
      return this.getRandomQuality(['SR', 'SSR', 'UR', 'LE']);
    }

    // SSR软保底
    if (this.pityCounter.ssrCount >= (pool.softPitySSRStart || 35) && this.pityCounter.ssrCount < pool.pitySSR) {
      const softPityChance = (this.pityCounter.ssrCount - (pool.softPitySSRStart || 35)) / (pool.pitySSR - (pool.softPitySSRStart || 35));
      const boostedChance = softPityChance * 50;
      if (roll < boostedChance) {
        return this.getRandomQuality(['SR', 'SSR']);
      }
    }

    // SR软保底
    if (this.pityCounter.srCount >= (pool.softPitySRStart || 8) && this.pityCounter.srCount < pool.pitySR) {
      const softPityChance = (this.pityCounter.srCount - (pool.softPitySRStart || 8)) / (pool.pitySR - (pool.softPitySRStart || 8));
      const boostedChance = softPityChance * 30;
      if (roll < boostedChance) {
        return 'SR';
      }
    }

    // 基础概率
    if (roll < 0.5) return 'LE';
    if (roll < 2.5) return 'UR';
    if (roll < 10) return 'SSR';
    if (roll < 30) return 'SR';
    if (roll < 60) return 'R';
    return 'N';
  }

  getRandomQuality(qualities) {
    const weights = {
      N: 10, R: 20, SR: 30, SSR: 25, UR: 12, LE: 3
    };

    const filteredQualities = qualities.filter(q => weights[q] !== undefined);
    const totalWeight = filteredQualities.reduce((sum, q) => sum + weights[q], 0);
    let random = Math.random() * totalWeight;

    for (const quality of filteredQualities) {
      random -= weights[quality];
      if (random <= 0) return quality;
    }

    return filteredQualities[filteredQualities.length - 1];
  }

  /**
   * 从gachaItems.json按品质加权随机选取一个cardId，
   * 再从minionCards.json查找完整数据创建MinionCard实例
   */
  createCharacter(quality = 'N') {
    const poolId = this.currentPool.poolId;
    const poolItems = this.poolItemsByQuality[poolId];

    if (!poolItems || !poolItems[quality] || poolItems[quality].length === 0) {
      // 回退：如果该品质在卡池中没有配置项，尝试从minionCards中按品质随机选
      console.warn(`[GachaSystem] 卡池 ${poolId} 中没有品质 ${quality} 的卡，从minionCards随机选取`);
      return this._fallbackCreate(quality);
    }

    // 按weight加权随机
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

    // 从minionCards查找完整数据（通过数组索引）
    const cardData = this.minionCardsList[selectedItem.cardIndex];
    if (!cardData) {
      console.warn(`[GachaSystem] 找不到cardIndex=${selectedItem.cardIndex}的minionCard数据`);
      return this._fallbackCreate(quality);
    }

    return this._createMinionCardFromData(cardData);
  }

  /**
   * 从minionCards.json数据创建MinionCard实例
   */
  _createMinionCardFromData(cardData) {
    // 将minionCards.json的quality映射到MinionCard的rarity
    const qualityToRarity = {
      N: 'common', R: 'rare', SR: 'epic', SSR: 'legendary', UR: 'legendary', LE: 'legendary'
    };

    const data = {
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
      star: 1
    };

    return new MinionCard(data);
  }

  /**
   * 回退方案：直接从minionCards按品质随机选
   */
  _fallbackCreate(quality) {
    const matching = minionCardsData.filter(c => c.quality === quality);
    if (matching.length === 0) {
      // 最终回退：随机选一个
      const randomCard = minionCardsData[Math.floor(Math.random() * minionCardsData.length)];
      return this._createMinionCardFromData(randomCard);
    }
    const cardData = matching[Math.floor(Math.random() * matching.length)];
    return this._createMinionCardFromData(cardData);
  }

  grantCharacter(character) {
    this.baseSystem.characters.push(character);
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
