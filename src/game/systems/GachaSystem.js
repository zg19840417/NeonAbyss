import Character from '../entities/Character.js';
import { CharacterClass } from '../data/CharacterClass.js';
import gachaPoolsData from '../../../assets/data/json/gachaPools.json';

const QUALITY_ORDER = ['N', 'R', 'SR', 'SSR', 'UR', 'mythic'];

const QUALITY_COLORS = {
  N: '#8a7a6a',
  R: '#4dabf7',
  SR: '#9775fa',
  SSR: '#f59f00',
  UR: '#ff6b6b',
  mythic: '#e64980'
};

const QUALITY_NAMES = {
  N: '普通',
  R: '稀有',
  SR: '精良',
  SSR: '史诗',
  UR: '传说',
  mythic: '神话'
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
    const saved = localStorage.getItem('gachaPity');
    return saved ? JSON.parse(saved) : { count: 0, ssrCount: 0, urCount: 0 };
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
      this.pityCounter.ssrCount++;
      this.pityCounter.urCount++;
      
      const quality = this.calculateQuality();
      const character = this.createCharacter(quality);
      
      results.push(character);
      this.addToHistory(character);
      
      if (QUALITY_ORDER.indexOf(quality) >= QUALITY_ORDER.indexOf('SSR')) {
        this.pityCounter.ssrCount = 0;
      }
      if (quality === 'mythic') {
        this.pityCounter.urCount = 0;
      }
    }
    
    this.savePityCounter();
    return results;
  }

  calculateQuality() {
    const pool = this.currentPool;
    const roll = Math.random() * 100;
    
    if (this.pityCounter.urCount >= pool.pityUR) {
      return 'mythic';
    }
    
    if (this.pityCounter.ssrCount >= pool.pitySSR) {
      return 'SSR';
    }
    
    if (this.pityCounter.count >= pool.pityLimit) {
      return this.getRandomQuality(['SR', 'SSR', 'UR', 'mythic']);
    }
    
    if (this.pityCounter.count >= pool.softPityStart && this.pityCounter.count < pool.pityLimit) {
      const softPityChance = (this.pityCounter.count - pool.softPityStart) / (pool.pityLimit - pool.softPityStart);
      const boostedChance = pool.pityGuarantee === 'SSR' ? softPityChance * 50 : softPityChance * 30;
      if (roll < boostedChance) {
        return this.getRandomQuality(['SR', 'SSR']);
      }
    }
    
    if (roll < 0.5) return 'mythic';
    if (roll < 2.5) return 'SSR';
    if (roll < 10) return 'SR';
    if (roll < 30) return 'R';
    return 'N';
  }

  getRandomQuality(qualities) {
    const weights = {
      N: 10, R: 20, SR: 30, SSR: 25, UR: 12, mythic: 3
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

  createCharacter(quality = 'N') {
    const qualityMultipliers = {
      N: 1.0,
      R: 1.15,
      SR: 1.30,
      SSR: 1.50,
      UR: 1.65,
      mythic: 1.80
    };
    
    const multiplier = qualityMultipliers[quality] || 1.0;
    const classes = Object.values(CharacterClass);
    const charClass = classes[Math.floor(Math.random() * classes.length)];
    
    const nameSet = this.getNameSetByClass(charClass);
    const randomName = nameSet[Math.floor(Math.random() * nameSet.length)];
    
    const data = {
      name: randomName,
      charClass: charClass,
      level: 1,
      quality: quality
    };
    
    return new Character(data);
  }

  getNameSetByClass(charClass) {
    const names = {
      plant: ['艾伦', '莉莉', '艾米', '莎拉', '安娜', '珍妮', '凯特', '玛丽', '苏珊', '艾拉', '薇拉', '娜塔莉'],
      animal: ['杰克', '汤姆', '麦克', '大卫', '卢克', '保罗', '马克', '布莱克', '莱恩', '泰勒', '尼克', '马特'],
      mech: ['Nova', 'Pulse', 'Apex', 'Flux', 'Zenith', 'Cipher', 'Vector', 'Matrix', 'Nexus', 'Prism', 'Echo', 'Raven'],
      energy: ['焰', '霜', '雷', '光', '暗', '星', '月', '日', '风', '雨', '雾', '岚'],
      hybrid: ['融合姬-α', '融合姬-β', '融合姬-γ', '融合姬-Ω', '融合姬-Σ', '融合姬-Δ', '融合姬-Ψ', '融合姬-Φ']
    };
    
    return names[charClass] || names.plant;
  }

  grantCharacter(character) {
    this.baseSystem.characters.push(character);
    return character;
  }

  getPityInfo() {
    return {
      currentCount: this.pityCounter.count,
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
