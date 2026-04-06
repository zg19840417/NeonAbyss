import Character from './Character.js';
import Skill from '../systems/Skill.js';
import PassiveSkill from '../systems/PassiveSkill.js';
import { Rarity, RarityConfig, Element, ElementConfig, Race, RaceConfig, getElementMultiplier } from '../data/MinionConfig.js';

export default class MinionCard extends Character {
  constructor(data) {
    super({
      id: data.id,
      name: data.name,
      charClass: data.charClass,
      level: data.level || 1,
      hp: data.hp,
      skills: data.activeSkill ? [new Skill(data.activeSkill)] : [],
      equipment: data.equipment || {}
    });

    this.rarity = data.rarity || Rarity.COMMON;
    this.element = data.element || null;
    this.race = data.race || Race.HUMAN;
    this.portrait = data.portrait || null;
    this.description = data.description || '';
    this.star = data.star || 1;
    this.minionId = data.minionId || data.id;

    this.passiveSkill = data.passiveSkill
      ? (data.passiveSkill instanceof PassiveSkill ? data.passiveSkill : new PassiveSkill(data.passiveSkill))
      : null;

    this._applyRarityMultiplier();
    this._applyRaceBonus();

    this.isMinionCard = true;
    this._hasRebirthed = false;
    this._windfuryUsed = false;

    this.currentHp = this.maxHp;
  }

  _applyRarityMultiplier() {
    const config = RarityConfig[this.rarity];
    let mult = config?.statMultiplier || 1.0;

    const starMult = 1 + (this.star - 1) * 0.1;
    mult *= starMult;

    this.maxHp = Math.floor(this.maxHp * mult);
    this.currentHp = this.maxHp;
    this.atk = Math.floor(this.atk * mult);
  }

  _applyRaceBonus() {
    switch (this.race) {
      case Race.MECH:
        this._mechImmune = true;
        break;

      case Race.MUTANT:
        this._mutantRegen = 0.05;
        break;

      case Race.ENERGY:
        this.dodgeRate = Math.min(this.dodgeRate + 0.15, 0.90);
        this.maxHp = Math.floor(this.maxHp * 0.8);
        this.currentHp = this.maxHp;
        break;

      case Race.BEAST:
        this.atk = Math.floor(this.atk * 1.15);
        this.critRate = Math.min(this.critRate + 0.10, 0.90);
        break;

      case Race.HUMAN:
      default:
        break;
    }
  }

  attack(target, skillMultiplier = 1) {
    if (this.isDead || target.isDead) return null;

    let damage = this.atk * skillMultiplier;
    let isCritical = Math.random() < this.critRate;

    if (isCritical) {
      damage *= this.critDamage;
    }

    let elementMultiplier = 1.0;
    if (this.element && target.element) {
      elementMultiplier = getElementMultiplier(this.element, target.element);
      damage = Math.floor(damage * elementMultiplier);
    }

    let actualDamage = target.takeDamage(damage);

    if (this.lifeSteal > 0 && !this.isDead) {
      let healAmount = Math.floor(actualDamage * this.lifeSteal);
      this.heal(healAmount);
    }

    if (this.passiveSkill && this.passiveSkill.type === 'lifesteal_aura' && !this.isDead) {
      let healAmount = Math.floor(actualDamage * this.passiveSkill.value);
      this.heal(healAmount);
    }

    this.addHatred(actualDamage);

    return {
      damage: actualDamage,
      isCritical,
      elementMultiplier,
      attacker: this,
      target: target,
      isDead: target.isDead
    };
  }

  takeDamage(damage) {
    if (this.isDead) return 0;

    if (this.passiveSkill && this.passiveSkill.type === 'divine_shield' && !this.passiveSkill.triggered) {
      this.passiveSkill.triggered = true;
      console.log(`[被动] ${this.name} 的圣盾触发，免疫本次伤害`);
      return 0;
    }

    let actualDamage = Math.max(1, Math.floor(damage * (1 - this.getBaseDamageReduction())));

    this.currentHp -= actualDamage;

    if (this.currentHp <= 0) {
      if (this.passiveSkill && this.passiveSkill.type === 'rebirth' && !this._hasRebirthed) {
        this._hasRebirthed = true;
        this.currentHp = Math.floor(this.maxHp * 0.3);
        this.isDead = false;
        this.status = 'idle';
        console.log(`[被动] ${this.name} 的重生触发，恢复30%生命`);
        return actualDamage;
      }

      this.currentHp = 0;
      this.isDead = true;
      this.status = 'dead';
    }

    return actualDamage;
  }

  hasTaunt() {
    return this.passiveSkill && this.passiveSkill.type === 'taunt' && this.passiveSkill.isActive;
  }

  hasWindfury() {
    return this.passiveSkill && this.passiveSkill.type === 'windfury' && this.passiveSkill.isActive;
  }

  hasPoisonTouch() {
    return this.passiveSkill && this.passiveSkill.type === 'poison_touch' && this.passiveSkill.isActive;
  }

  isMechImmune() {
    return this._mechImmune === true;
  }

  getMutantRegen() {
    return this._mutantRegen || 0;
  }

  getRarityConfig() {
    return RarityConfig[this.rarity] || RarityConfig[Rarity.COMMON];
  }

  getElementConfig() {
    return this.element ? ElementConfig[this.element] : null;
  }

  getRaceConfig() {
    return RaceConfig[this.race] || RaceConfig[Race.HUMAN];
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      isMinionCard: true,
      rarity: this.rarity,
      element: this.element,
      race: this.race,
      portrait: this.portrait,
      description: this.description,
      star: this.star,
      minionId: this.minionId,
      passiveSkill: this.passiveSkill ? this.passiveSkill.toJSON() : null,
      _hasRebirthed: this._hasRebirthed,
      _windfuryUsed: this._windfuryUsed
    };
  }

  static fromJSON(json) {
    const minion = new MinionCard(json);
    return minion;
  }
}
