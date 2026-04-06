import { ClassConfig, getMainRole, getSubRole, isTank, RoleType } from '../data/CharacterClass.js';

export default class Character {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name || '未命名';
    this.charClass = data.charClass;
    
    this.level = data.level || 1;
    this.exp = data.exp || 0;
    this.maxExp = this.calculateMaxExp();
    
    this.equipment = {
      weapon: data.equipment?.weapon || null,
      armor: data.equipment?.armor || null,
      accessory: data.equipment?.accessory || null
    };
    
    this.currentHp = data.currentHp || data.hp || this.getBaseHp();
    this.maxHp = this.getMaxHp();
    
    this.mp = data.mp || 100;
    this.maxMp = data.maxMp || 100;
    
    this.atk = this.getAtk();
    this.critRate = this.getCritRate();
    this.dodgeRate = this.getDodgeRate();
    this.critDamage = data.critDamage || this.getBaseCritDamage();
    this.damageReduction = data.damageReduction || this.getBaseDamageReduction();
    this.lifeSteal = data.lifeSteal || this.getBaseLifeSteal();
    
    this.hatred = 0;
    
    this.skills = data.skills || [];
    
    this.buffs = [];
    this.debuffs = [];
    
    this.status = 'idle';
    this.isDead = false;
  }
  
  generateId() {
    return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  getConfig() {
    if (this.charClass && typeof this.charClass === 'object' && this.charClass.baseHp !== undefined) {
      return this.charClass;
    }
    if (typeof this.charClass === 'string' && ClassConfig[this.charClass]) {
      return ClassConfig[this.charClass];
    }
    const defaultKey = Object.keys(ClassConfig)[0];
    return ClassConfig[defaultKey] || {
      name: '默认职业',
      baseHp: 500,
      baseAtk: 30,
      baseCritRate: 0.1,
      baseDodgeRate: 0.05,
      baseCritDamage: 1.5,
      baseDamageReduction: 0,
      baseLifeSteal: 0
    };
  }
  
  getBaseHp() {
    return this.getConfig().baseHp;
  }
  
  getMaxHp() {
    let baseHp = this.getBaseHp();
    
    let levelBonus = (this.level - 1) * 50;
    
    let equipBonus = 0;
    if (this.equipment.weapon) equipBonus += this.equipment.weapon.hpBonus || 0;
    if (this.equipment.armor) equipBonus += this.equipment.armor.hpBonus || 0;
    if (this.equipment.accessory) equipBonus += this.equipment.accessory.hpBonus || 0;
    
    return Math.floor(baseHp + levelBonus + equipBonus);
  }
  
  getAtk() {
    let baseAtk = this.getConfig().baseAtk;
    let levelBonus = (this.level - 1) * 5;
    
    let equipBonus = 0;
    if (this.equipment.weapon) equipBonus += this.equipment.weapon.atkBonus || 0;
    if (this.equipment.armor) equipBonus += this.equipment.armor.atkBonus || 0;
    if (this.equipment.accessory) equipBonus += this.equipment.accessory.atkBonus || 0;
    
    return Math.floor(baseAtk + levelBonus + equipBonus);
  }
  
  getCritRate() {
    let base = this.getConfig().baseCritRate;
    let equipBonus = 0;
    if (this.equipment.weapon) equipBonus += this.equipment.weapon.critRateBonus || 0;
    if (this.equipment.accessory) equipBonus += this.equipment.accessory.critRateBonus || 0;
    return Math.min(base + equipBonus, 0.90);
  }
  
  getDodgeRate() {
    let base = this.getConfig().baseDodgeRate;
    let equipBonus = 0;
    if (this.equipment.armor) equipBonus += this.equipment.armor.dodgeRateBonus || 0;
    if (this.equipment.accessory) equipBonus += this.equipment.accessory.dodgeRateBonus || 0;
    return Math.min(base + equipBonus, 0.90);
  }
  
  getBaseCritDamage() {
    return this.getConfig().baseCritDamage;
  }
  
  getBaseDamageReduction() {
    let base = this.getConfig().baseDamageReduction;
    if (this.equipment.armor) base += this.equipment.armor.damageReductionBonus || 0;
    return Math.min(base, 0.90);
  }
  
  getBaseLifeSteal() {
    return this.getConfig().baseLifeSteal;
  }
  
  getHatredBonus() {
    let base = this.getConfig().baseHatredBonus;
    if (isTank(this.charClass)) {
      if (getMainRole(this.charClass) === RoleType.TANK) {
        return base + 3;
      }
    }
    return base;
  }
  
  calculateMaxExp() {
    return Math.floor(100 * Math.pow(1.5, this.level - 1));
  }
  
  addExp(amount) {
    if (this.isDead) return false;
    
    this.exp += amount;
    
    while (this.exp >= this.maxExp) {
      this.exp -= this.maxExp;
      this.levelUp();
    }
    
    return true;
  }
  
  levelUp() {
    this.level++;
    this.maxExp = this.calculateMaxExp();
    
    let oldMaxHp = this.maxHp;
    this.maxHp = this.getMaxHp();
    this.currentHp += (this.maxHp - oldMaxHp);
    
    this.atk = this.getAtk();
    
    return { levelUp: true, newLevel: this.level };
  }
  
  takeDamage(damage) {
    if (this.isDead) return 0;
    
    let actualDamage = Math.max(1, Math.floor(damage * (1 - this.getBaseDamageReduction())));
    
    this.currentHp -= actualDamage;
    
    if (this.currentHp <= 0) {
      this.currentHp = 0;
      this.isDead = true;
      this.status = 'dead';
    }
    
    return actualDamage;
  }
  
  heal(amount) {
    if (this.isDead) return 0;
    
    let actualHeal = Math.min(amount, this.maxHp - this.currentHp);
    this.currentHp += actualHeal;
    
    return actualHeal;
  }
  
  attack(target, skillMultiplier = 1) {
    if (this.isDead || target.isDead) return null;
    
    let damage = this.atk * skillMultiplier;
    let isCritical = Math.random() < this.critRate;
    
    if (isCritical) {
      damage *= this.critDamage;
    }
    
    let actualDamage = target.takeDamage(damage);
    
    if (this.lifeSteal > 0 && !this.isDead) {
      let healAmount = Math.floor(actualDamage * this.lifeSteal);
      this.heal(healAmount);
    }
    
    this.addHatred(actualDamage);
    
    return {
      damage: actualDamage,
      isCritical,
      attacker: this,
      target: target,
      isDead: target.isDead
    };
  }
  
  addHatred(damage) {
    let hatredGain = damage * (1 + this.getHatredBonus() / 10);
    this.hatred += hatredGain;
  }
  
  decayHatred(rate = 0.1) {
    this.hatred = Math.max(0, this.hatred * (1 - rate));
  }
  
  addBuff(buff) {
    if (this.isDead) return false;
    
    let existing = this.buffs.find(b => b.id === buff.id);
    if (existing) {
      existing.duration = buff.duration;
      return false;
    }
    
    this.buffs.push({ ...buff, remainingDuration: buff.duration });
    
    switch (buff.type) {
      case 'atk_up':
        this.atk = Math.floor(this.atk * (1 + buff.value));
        break;
      case 'hp_up':
        this.maxHp = Math.floor(this.maxHp * (1 + buff.value));
        this.currentHp = Math.floor(this.currentHp * (1 + buff.value));
        break;
      case 'crit_up':
        this.critRate = Math.min(this.critRate + buff.value, 0.90);
        break;
      case 'dodge_up':
        this.dodgeRate = Math.min(this.dodgeRate + buff.value, 0.90);
        break;
    }
    
    return true;
  }
  
  addDebuff(debuff) {
    if (this.isDead) return false;
    
    let existing = this.debuffs.find(d => d.id === debuff.id);
    if (existing) {
      existing.duration = debuff.duration;
      return false;
    }
    
    this.debuffs.push({ ...debuff, remainingDuration: debuff.duration });
    
    switch (debuff.type) {
      case 'atk_down':
        this.atk = Math.floor(this.atk * (1 - debuff.value));
        break;
      case 'def_down':
        this.damageReduction = Math.max(0, this.damageReduction - debuff.value);
        break;
      case 'silence':
        this.status = 'silenced';
        break;
    }
    
    return true;
  }
  
  updateBuffs() {
    for (let i = this.buffs.length - 1; i >= 0; i--) {
      this.buffs[i].remainingDuration--;
      if (this.buffs[i].remainingDuration <= 0) {
        this.removeBuff(this.buffs[i].id);
      }
    }
    
    for (let i = this.debuffs.length - 1; i >= 0; i--) {
      this.debuffs[i].remainingDuration--;
      if (this.debuffs[i].remainingDuration <= 0) {
        this.removeDebuff(this.debuffs[i].id);
      }
    }
  }
  
  removeBuff(buffId) {
    let index = this.buffs.findIndex(b => b.id === buffId);
    if (index !== -1) {
      let buff = this.buffs[index];
      this.buffs.splice(index, 1);

      // Reset to base stats then reapply all remaining buffs
      this.atk = this.getAtk();
      this.maxHp = this.getMaxHp();
      this.critRate = this.getCritRate();
      this.dodgeRate = this.getDodgeRate();
      this.currentHp = Math.min(this.currentHp, this.maxHp);

      // Reapply remaining buffs
      for (const remainingBuff of this.buffs) {
        switch (remainingBuff.type) {
          case 'atk_up':
            this.atk = Math.floor(this.atk * (1 + remainingBuff.value));
            break;
          case 'hp_up':
            this.maxHp = Math.floor(this.maxHp * (1 + remainingBuff.value));
            this.currentHp = Math.floor(this.currentHp * (1 + remainingBuff.value));
            break;
          case 'crit_up':
            this.critRate = Math.min(this.critRate + remainingBuff.value, 0.90);
            break;
          case 'dodge_up':
            this.dodgeRate = Math.min(this.dodgeRate + remainingBuff.value, 0.90);
            break;
        }
      }
    }
  }
  
  removeDebuff(debuffId) {
    let index = this.debuffs.findIndex(d => d.id === debuffId);
    if (index !== -1) {
      let debuff = this.debuffs[index];
      this.debuffs.splice(index, 1);
      
      switch (debuff.type) {
        case 'atk_down':
          this.atk = this.getAtk();
          break;
        case 'def_down':
          this.damageReduction = this.getBaseDamageReduction();
          break;
        case 'silence':
          if (this.debuffs.find(d => d.type === 'silence')) {
            this.status = 'silenced';
          } else {
            this.status = 'idle';
          }
          break;
      }
    }
  }
  
  canUseSkill() {
    return !this.isDead && this.status !== 'silenced' && this.status !== 'stunned';
  }
  
  getHpPercent() {
    return this.maxHp > 0 ? this.currentHp / this.maxHp : 0;
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      charClass: this.charClass,
      level: this.level,
      exp: this.exp,
      currentHp: this.currentHp,
      maxHp: this.maxHp,
      mp: this.mp,
      maxMp: this.maxMp,
      atk: this.atk,
      critRate: this.critRate,
      dodgeRate: this.dodgeRate,
      critDamage: this.critDamage,
      damageReduction: this.damageReduction,
      lifeSteal: this.lifeSteal,
      hatred: this.hatred,
      skills: this.skills,
      buffs: this.buffs,
      debuffs: this.debuffs,
      equipment: this.equipment,
      isDead: this.isDead
    };
  }
  
  static fromJSON(json) {
    let char = new Character(json);
    char.maxHp = char.getMaxHp();
    return char;
  }
}
