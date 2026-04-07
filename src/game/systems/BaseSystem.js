import Character from '../entities/Character.js';
import { CharacterClass } from '../data/CharacterClass.js';
import Const from '../data/Const.js';

export const CurrencyType = {
  SOURCE_CORE: 'sourceCore',
  MYCELIUM: 'mycelium',
  STAR_COIN: 'starCoin',
  R_FRAGMENT: 'r_fragment',
  SR_FRAGMENT: 'sr_fragment',
  SSR_FRAGMENT: 'ssr_fragment',
  UR_FRAGMENT: 'ur_fragment'
};

export default class BaseSystem {
  constructor(gameData = {}) {
    this.mycelium = gameData.mycelium || 5000;     // 菌丝
    this.sourceCore = gameData.sourceCore || 100;  // 源核
    this.starCoin = gameData.starCoin || 0;        // 星币
    this.facilities = gameData.facilities || this.initFacilities();
    this.energyDrinks = gameData.energyDrinks || [];
    this.characters = (gameData.characters || []).map(c => Character.fromJSON(c));
    this.team = gameData.team || [];
    this.availableRecruits = (gameData.availableRecruits || []).map(c => Character.fromJSON(c));
    this.lastRefreshTime = gameData.lastRefreshTime || Date.now();
    
    this.currencies = gameData.currencies || {
      sourceCore: 100,
      mycelium: 10000,
      starCoin: 0,
      r_fragment: 0,
      sr_fragment: 0,
      ssr_fragment: 0,
      ur_fragment: 0
    };
    
    this.inventory = gameData.inventory || {};
    this.dailyPurchaseRecords = gameData.dailyPurchaseRecords || {};
    this.lastDailyReset = gameData.lastDailyReset || this.getTodayString();
  }
  
  // [C30 FIX] 已删除重复的第一套货币方法（getCurrency/setCurrency/addCurrency/spendCurrency/canAffordCurrency/getAllCurrencies）
  // 统一使用文件底部的第二套方法（操作 mycelium/sourceCore/starCoin 字段）

  addItem(itemId, count = 1) {
    if (!this.inventory[itemId]) {
      this.inventory[itemId] = 0;
    }
    this.inventory[itemId] += count;
    return this.inventory[itemId];
  }
  
  removeItem(itemId, count = 1) {
    if (!this.inventory[itemId] || this.inventory[itemId] < count) {
      return { success: false, reason: 'not_enough_items' };
    }
    this.inventory[itemId] -= count;
    if (this.inventory[itemId] <= 0) {
      delete this.inventory[itemId];
    }
    return { success: true, remaining: this.inventory[itemId] || 0 };
  }
  
  getItemCount(itemId) {
    return this.inventory[itemId] || 0;
  }
  
  hasItem(itemId, count = 1) {
    return this.getItemCount(itemId) >= count;
  }
  
  getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  
  checkDailyReset() {
    const today = this.getTodayString();
    if (today !== this.lastDailyReset) {
      this.dailyPurchaseRecords = {};
      this.lastDailyReset = today;
      return true;
    }
    return false;
  }
  
  getDailyPurchaseCount(shopId) {
    return this.dailyPurchaseRecords[shopId] || 0;
  }
  
  recordDailyPurchase(shopId) {
    if (!this.dailyPurchaseRecords[shopId]) {
      this.dailyPurchaseRecords[shopId] = 0;
    }
    this.dailyPurchaseRecords[shopId]++;
  }
  
  initFacilities() {
    return {
      charger: { level: 1, name: '充电桩', baseCost: 100, costMultiplier: 1.5, effect: '+1招募位/级' },
      workbench: { level: 1, name: '工作台', baseCost: 100, costMultiplier: 1.5, effect: '+1招募位/级' },
      dorm: { level: 1, name: '休眠舱', baseCost: 150, costMultiplier: 1.5, effect: '+10%恢复速度/级' },
      synthesizer: { level: 1, name: '合成台', baseCost: 200, costMultiplier: 1.5, effect: '+5%饮料效果/级' },
      training: { level: 1, name: '训练场', baseCost: 250, costMultiplier: 1.5, effect: '+5%经验/级' },
      hacker: { level: 0, name: '黑客终端', baseCost: 500, costMultiplier: 1, effect: '解锁传送功能', maxLevel: 1 }
    };
  }
  
  getRecruitmentSlots() {
    const baseSlots = 2;
    const chargerBonus = (this.facilities.charger.level - 1);
    const workbenchBonus = (this.facilities.workbench.level - 1);
    return baseSlots + chargerBonus + workbenchBonus;
  }
  
  getUpgradeCost(facilityKey) {
    const facility = this.facilities[facilityKey];
    if (!facility) return 0;
    
    if (facility.maxLevel && facility.level >= facility.maxLevel) {
      return null;
    }
    
    return Math.floor(facility.baseCost * Math.pow(facility.costMultiplier, facility.level - 1));
  }
  
  upgradeFacility(facilityKey) {
    const cost = this.getUpgradeCost(facilityKey);
    if (cost === null) {
      return { success: false, reason: 'max_level' };
    }
    
    if (this.mycelium < cost) {
      return { success: false, reason: 'not_enough_currency', required: cost, current: this.mycelium };
    }

    this.mycelium -= cost;
    this.facilities[facilityKey].level++;
    
    return {
      success: true,
      facility: facilityKey,
      newLevel: this.facilities[facilityKey].level,
      cost: cost
    };
  }
  
  refreshRecruits() {
    if (this.availableRecruits.length === 0) {
      this.availableRecruits = this.generateRecruits();
      this.lastRefreshTime = Date.now();
      return {
        success: true,
        recruits: this.availableRecruits,
        isFirstGenerate: true
      };
    }

    const timeSinceRefresh = Date.now() - this.lastRefreshTime;
    const dormBonus = 1 + (this.facilities.dorm.level - 1) * 0.1;
    const refreshInterval = 8 * 60 * 60 * 1000 / dormBonus;

    if (timeSinceRefresh < refreshInterval) {
      return {
        success: false,
        reason: 'not_ready',
        remainingTime: refreshInterval - timeSinceRefresh,
        nextRefresh: new Date(this.lastRefreshTime + refreshInterval)
      };
    }

    this.availableRecruits = this.generateRecruits();
    this.lastRefreshTime = Date.now();

    return {
      success: true,
      recruits: this.availableRecruits
    };
  }
  
  generateRecruits() {
    const recruits = [];
    const slotCount = this.getRecruitmentSlots();
    const synthesizerBonus = 1 + (this.facilities.synthesizer.level - 1) * 0.05;
    
    for (let i = 0; i < slotCount; i++) {
      const charClass = this.selectRandomClass();
      const quality = this.selectQualityByProbability(synthesizerBonus);
      
      recruits.push(this.createCharacter(charClass, quality));
    }
    
    return recruits;
  }
  
  selectRandomClass() {
    const classes = Object.values(CharacterClass);
    return classes[Math.floor(Math.random() * classes.length)];
  }
  
  selectQualityByProbability(synthesizerBonus = 1) {
    const roll = Math.random();
    
    if (roll < 0.01 * synthesizerBonus) return 'mythic';
    if (roll < 0.05 * synthesizerBonus) return 'SSR';
    if (roll < 0.15 * synthesizerBonus) return 'SR';
    if (roll < 0.35 * synthesizerBonus) return 'R';
    return 'N';
  }
  
  createCharacter(charClass, quality = 'N') {
    const qualityMultipliers = {
      N: 1.0,
      R: 1.15,
      SR: 1.30,
      SSR: 1.50,
      mythic: 1.80
    };
    
    const multiplier = qualityMultipliers[quality] || 1.0;
    
    const names = ['艾伦', '莉莉', '杰克', '艾米', '汤姆', '莎拉', '麦克', '安娜', '大卫', '玛丽', '约翰', '珍妮', '布莱克', '凯特', '卢克'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    const data = {
      name: randomName,
      charClass: charClass,
      level: 1,
      quality: quality
    };
    
    return new Character(data);
  }
  
  recruitCharacter(characterIndex) {
    if (characterIndex < 0 || characterIndex >= this.availableRecruits.length) {
      return { success: false, reason: 'invalid_index' };
    }
    
    const character = this.availableRecruits[characterIndex];
    const recruitCost = 200;
    
    if (this.sourceCore < recruitCost) {
      return { success: false, reason: 'not_enough_currency', required: recruitCost };
    }

    if (this.characters.length >= 20) {
      return { success: false, reason: 'character_full' };
    }

    this.sourceCore -= recruitCost;
    this.characters.push(character);
    this.availableRecruits.splice(characterIndex, 1);
    
    return {
      success: true,
      character: character
    };
  }
  
  dismissCharacter(characterId) {
    const index = this.characters.findIndex(c => c.id === characterId);
    
    if (index === -1) {
      return { success: false, reason: 'not_found' };
    }
    
    this.characters.splice(index, 1);
    
    const teamIndex = this.team.indexOf(characterId);
    if (teamIndex !== -1) {
      this.team.splice(teamIndex, 1);
    }
    
    return { success: true };
  }
  
  addToTeam(characterId) {
    if (this.team.length >= Const.GAME.MAX_TEAM_SIZE) {
      return { success: false, reason: 'team_full' };
    }
    
    if (this.team.includes(characterId)) {
      return { success: false, reason: 'already_in_team' };
    }
    
    const character = this.characters.find(c => c.id === characterId);
    if (!character) {
      return { success: false, reason: 'not_found' };
    }
    
    if (character.isDead) {
      return { success: false, reason: 'character_dead' };
    }
    
    this.team.push(characterId);
    
    return { success: true, team: this.team };
  }
  
  removeFromTeam(characterId) {
    const index = this.team.indexOf(characterId);
    
    if (index === -1) {
      return { success: false, reason: 'not_in_team' };
    }
    
    this.team.splice(index, 1);
    
    return { success: true, team: this.team };
  }
  
  getTeamMembers() {
    return this.team.map(id => this.characters.find(c => c.id === id)).filter(c => c);
  }
  
  getTeamMemberCount() {
    return this.team.length;
  }
  
  // ===== 三级货币系统 =====
  // [C30 FIX] 删除重复的第一套货币方法（第42-73行），统一使用此套（操作 mycelium/sourceCore/starCoin 字段）
  // 原第一套方法操作 this.currencies 对象，与实际存储字段不一致，已删除。
  addCurrency(type, amount) {
    if (type === 'mycelium') this.mycelium += amount;
    else if (type === 'sourceCore') this.sourceCore += amount;
    else if (type === 'starCoin') this.starCoin += amount;
    else return { success: false, reason: 'invalid_currency_type' };
    return { success: true, balance: this.getCurrency(type) };
  }

  spendCurrency(type, amount) {
    if (!this.canAfford(type, amount)) {
      return { success: false, reason: 'not_enough_currency', required: amount, current: this.getCurrency(type) };
    }
    if (type === 'mycelium') this.mycelium -= amount;
    else if (type === 'sourceCore') this.sourceCore -= amount;
    else if (type === 'starCoin') this.starCoin -= amount;
    else return { success: false, reason: 'invalid_currency_type' };
    return { success: true, remaining: this.getCurrency(type) };
  }

  canAfford(type, amount) {
    return this.getCurrency(type) >= amount;
  }

  getCurrency(type) {
    if (type === 'mycelium') return this.mycelium;
    if (type === 'sourceCore') return this.sourceCore;
    if (type === 'starCoin') return this.starCoin;
    return 0;
  }

  // 兼容旧接口
  addCoins(amount) {
    return this.addCurrency('mycelium', amount);
  }

  spendCoins(amount) {
    return this.spendCurrency('mycelium', amount);
  }
  
  getTrainingBonus() {
    return 1 + (this.facilities.training.level - 1) * 0.05;
  }
  
  getSynthesisBonus() {
    return 1 + (this.facilities.synthesizer.level - 1) * 0.05;
  }
  
  hasHacker() {
    return this.facilities.hacker.level >= 1;
  }
  
  getInfo() {
    return {
      mycelium: this.mycelium,
      sourceCore: this.sourceCore,
      starCoin: this.starCoin,
      facilities: this.facilities,
      teamSize: this.team.length,
      maxTeamSize: 5,
      recruitSlots: this.getRecruitmentSlots(),
      availableRecruits: this.availableRecruits.length,
      characters: this.characters.length,
      trainingBonus: this.getTrainingBonus(),
      synthesisBonus: this.getSynthesisBonus(),
      hasHacker: this.hasHacker()
    };
  }
  
  toJSON() {
    return {
      mycelium: this.mycelium,
      sourceCore: this.sourceCore,
      starCoin: this.starCoin,
      facilities: this.facilities,
      characters: this.characters.map(c => c.toJSON()),
      team: this.team,
      availableRecruits: this.availableRecruits.map(c => c.toJSON()),
      lastRefreshTime: this.lastRefreshTime,
      currencies: this.currencies,
      inventory: this.inventory,
      dailyPurchaseRecords: this.dailyPurchaseRecords,
      lastDailyReset: this.lastDailyReset
    };
  }
  
  save() {
    try {
      localStorage.setItem('baseSystem_v2', JSON.stringify(this.toJSON()));
    } catch (e) {
      console.warn('Failed to save base system:', e);
    }
  }

  load() {
    try {
      const saved = localStorage.getItem('baseSystem_v2');
      if (saved) {
        const data = JSON.parse(saved);
        this.mycelium = data.mycelium || 5000;
        this.sourceCore = data.sourceCore || 100;
        this.starCoin = data.starCoin || 0;
        this.facilities = data.facilities || this.initFacilities();
        this.characters = (data.characters || []).map(c => Character.fromJSON(c));
        this.team = data.team || [];
        this.availableRecruits = (data.availableRecruits || []).map(c => Character.fromJSON(c));
        this.lastRefreshTime = data.lastRefreshTime || Date.now();
      }
    } catch (e) {
      console.warn('Failed to load base system:', e);
    }
  }
}
