/**
 * @deprecated
 * 此文件已废弃，请使用 src/game/entities/EquipmentCard.js 和 src/game/systems/EquipmentCardManager.js
 * 旧装备系统（每角色3部位装备）已被装备卡系统（3随从+1装备卡）替代
 */

export default class Equipment {
  constructor(data) {
    this.id = data.equipId || data.id || this.generateId();
    this.name = data.name;
    this.type = data.type;
    this.quality = data.quality || 'common';
    this.rarity = data.rarity || 1;
    
    this.atkBonus = data.atkBonus || 0;
    this.hpBonus = data.hpBonus || 0;
    this.critRateBonus = data.critRateBonus || 0;
    this.dodgeRateBonus = data.dodgeRateBonus || 0;
    this.damageReductionBonus = data.damageReductionBonus || 0;
    
    this.enhanceLevel = data.enhanceLevel || 0;
    this.statMultiplier = this.calculateStatMultiplier();
    
    this.description = data.description || '';
    this.setId = data.setId || null;
  }
  
  generateId() {
    return 'equip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  calculateStatMultiplier() {
    const multipliers = {
      0: 1.00,
      1: 1.05,
      2: 1.10,
      3: 1.15,
      4: 1.20,
      5: 1.25,
      6: 1.30,
      7: 1.35,
      8: 1.40,
      9: 1.45,
      10: 1.50
    };
    return multipliers[this.enhanceLevel] || 1.0;
  }
  
  getEnhanceCost() {
    const costs = {
      0: 0,
      1: 100,
      2: 200,
      3: 400,
      4: 800,
      5: 1500,
      6: 3000,
      7: 5000,
      8: 8000,
      9: 12000,
      10: 20000
    };
    return costs[this.enhanceLevel] || 0;
  }
  
  getEnhanceSuccessRate() {
    const rates = {
      0: 100,
      1: 100,
      2: 95,
      3: 90,
      4: 85,
      5: 80,
      6: 75,
      7: 70,
      8: 65,
      9: 60,
      10: 55
    };
    return rates[this.enhanceLevel] || 100;
  }
  
  canEnhance() {
    return this.enhanceLevel < 10;
  }
  
  enhance() {
    if (!this.canEnhance()) {
      return { success: false, reason: 'max_level' };
    }
    
    const successRate = this.getEnhanceSuccessRate();
    const success = Math.random() * 100 < successRate;
    
    if (success) {
      this.enhanceLevel++;
      this.statMultiplier = this.calculateStatMultiplier();
      
      return {
        success: true,
        newLevel: this.enhanceLevel,
        newMultiplier: this.statMultiplier
      };
    } else {
      return {
        success: false,
        reason: 'failed',
        level: this.enhanceLevel
      };
    }
  }
  
  getEnhancedStat(statName) {
    let baseStat = 0;
    
    switch (statName) {
      case 'atk': baseStat = this.atkBonus; break;
      case 'hp': baseStat = this.hpBonus; break;
      case 'critRate': baseStat = this.critRateBonus; break;
      case 'dodgeRate': baseStat = this.dodgeRateBonus; break;
      case 'damageReduction': baseStat = this.damageReductionBonus; break;
    }
    
    return Math.floor(baseStat * this.statMultiplier);
  }
  
  getQualityColor() {
    const colors = {
      common: '#888888',
      rare: '#4a90d9',
      epic: '#9b59b6',
      legendary: '#f39c12',
      mythic: '#e74c3c'
    };
    return colors[this.quality] || colors.common;
  }
  
  getQualityName() {
    const names = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说',
      mythic: '神话'
    };
    return names[this.quality] || names.common;
  }
  
  getTypeName() {
    const names = {
      weapon: '武器',
      armor: '护甲',
      accessory: '饰品'
    };
    return names[this.type] || '未知';
  }
  
  getStatsSummary() {
    let stats = [];
    
    if (this.atkBonus > 0) {
      stats.push(`攻击+${this.getEnhancedStat('atk')}`);
    }
    if (this.hpBonus > 0) {
      stats.push(`生命+${this.getEnhancedStat('hp')}`);
    }
    if (this.critRateBonus > 0) {
      stats.push(`暴击+${(this.getEnhancedStat('critRate') * 100).toFixed(0)}%`);
    }
    if (this.dodgeRateBonus > 0) {
      stats.push(`闪避+${(this.getEnhancedStat('dodgeRate') * 100).toFixed(0)}%`);
    }
    if (this.damageReductionBonus > 0) {
      stats.push(`减伤+${(this.getEnhancedStat('damageReduction') * 100).toFixed(0)}%`);
    }
    
    return stats.join(' | ');
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      quality: this.quality,
      rarity: this.rarity,
      atkBonus: this.atkBonus,
      hpBonus: this.hpBonus,
      critRateBonus: this.critRateBonus,
      dodgeRateBonus: this.dodgeRateBonus,
      damageReductionBonus: this.damageReductionBonus,
      enhanceLevel: this.enhanceLevel,
      description: this.description,
      setId: this.setId
    };
  }
  
  static fromJSON(json) {
    return new Equipment(json);
  }
}

export class EquipmentSet {
  constructor(data) {
    this.id = data.setId;
    this.name = data.name;
    this.pieceCount = data.pieceCount;
    this.bonus2Piece = data.bonus2Piece;
    this.bonus3Piece = data.bonus3Piece;
    this.requiredQuality = data.requiredQuality;
  }
  
  getEquippedCount(equipment) {
    let count = 0;
    const qualities = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    const qualityIndex = qualities.indexOf(this.requiredQuality);
    
    for (let equip of equipment) {
      if (equip && equip.quality && 
          qualities.indexOf(equip.quality) >= qualityIndex) {
        count++;
      }
    }
    
    return count;
  }
  
  getActiveBonus(equipment) {
    const count = this.getEquippedCount(equipment);
    let bonuses = [];
    
    if (count >= 2 && this.bonus2Piece) {
      bonuses.push(this.bonus2Piece);
    }
    if (count >= 3 && this.bonus3Piece) {
      bonuses.push(this.bonus3Piece);
    }
    
    return bonuses;
  }
  
  isActive(equipment) {
    return this.getEquippedCount(equipment) >= 2;
  }
}
