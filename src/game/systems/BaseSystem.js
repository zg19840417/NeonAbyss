import Character from '../entities/Character.js';
import Equipment from './Equipment.js';
import { CharacterClass } from '../data/CharacterClass.js';
import Const from '../data/Const.js';

export default class BaseSystem {
  constructor(gameData = {}) {
    this.coins = gameData.coins || 10000;
    this.facilities = gameData.facilities || this.initFacilities();
    this.energyDrinks = gameData.energyDrinks || [];
    this.characters = (gameData.characters || []).map(c => Character.fromJSON(c));
    this.team = gameData.team || [];
    this.availableRecruits = (gameData.availableRecruits || []).map(c => Character.fromJSON(c));
    this.lastRefreshTime = gameData.lastRefreshTime || Date.now();
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
    
    if (this.coins < cost) {
      return { success: false, reason: 'not_enough_coins', required: cost, current: this.coins };
    }
    
    this.coins -= cost;
    this.facilities[facilityKey].level++;
    
    return {
      success: true,
      facility: facilityKey,
      newLevel: this.facilities[facilityKey].level,
      cost: cost
    };
  }
  
  refreshRecruits() {
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
    if (roll < 0.05 * synthesizerBonus) return 'legendary';
    if (roll < 0.15 * synthesizerBonus) return 'epic';
    if (roll < 0.35 * synthesizerBonus) return 'rare';
    return 'common';
  }
  
  createCharacter(charClass, quality = 'common') {
    const qualityMultipliers = {
      common: 1.0,
      rare: 1.15,
      epic: 1.30,
      legendary: 1.50,
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
    
    if (this.coins < recruitCost) {
      return { success: false, reason: 'not_enough_coins', required: recruitCost };
    }
    
    if (this.characters.length >= 20) {
      return { success: false, reason: 'character_full' };
    }
    
    this.coins -= recruitCost;
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
  
  addCoins(amount) {
    this.coins += amount;
    return this.coins;
  }
  
  spendCoins(amount) {
    if (this.coins < amount) {
      return { success: false, reason: 'not_enough_coins', current: this.coins };
    }
    
    this.coins -= amount;
    return { success: true, remaining: this.coins };
  }
  
  canAfford(amount) {
    return this.coins >= amount;
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
      coins: this.coins,
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
      coins: this.coins,
      facilities: this.facilities,
      characters: this.characters.map(c => c.toJSON()),
      team: this.team,
      availableRecruits: this.availableRecruits.map(c => c.toJSON()),
      lastRefreshTime: this.lastRefreshTime
    };
  }
  
  save() {
    localStorage.setItem('baseSystem', JSON.stringify(this.toJSON()));
  }
  
  load() {
    const saved = localStorage.getItem('baseSystem');
    if (saved) {
      const data = JSON.parse(saved);
      this.coins = data.coins || 10000;
      this.facilities = data.facilities || this.initFacilities();
      this.characters = (data.characters || []).map(c => Character.fromJSON(c));
      this.team = data.team || [];
      this.availableRecruits = (data.availableRecruits || []).map(c => Character.fromJSON(c));
      this.lastRefreshTime = data.lastRefreshTime || Date.now();
    }
  }
}
