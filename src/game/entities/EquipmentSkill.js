export default class EquipmentSkill {
  constructor(data) {
    this.id = data.skillId;
    this.equipCardId = data.equipCardId;
    this.type = data.skillType || 'aura';
    this.name = data.skillName || '';
    this.description = data.skillDescription || '';

    this.triggerCondition = data.triggerCondition || 'none';
    this.triggerCooldown = data.triggerCooldown || 0;
    this.currentCooldown = 0;

    this.modifyTarget = data.modifyTarget || 'all';
    this.modifyType = data.modifyType || 'none';
    this.modifyValue = data.modifyValue || 0;

    this.effectType = data.effectType || 'none';
    this.effectValue = data.effectValue || 0;
    this.effectDuration = data.effectDuration || 0;
    this.effectChance = data.effectChance || 1.0;

    this.unlockStar = data.unlockStar || 1;
    this.skillLevel = data.skillLevel || 1;
  }

  isUnlocked(equipStar) {
    return equipStar >= this.unlockStar;
  }

  getEffectiveValue(equipCard) {
    return Math.floor(this.effectValue * equipCard.getSkillMultiplier());
  }

  applyAura(follower, equipCard) {
    if (this.type !== 'aura') return;
    if (!this.isUnlocked(equipCard.star)) return;

    const effectiveValue = this.getEffectiveValue(equipCard);

    switch (this.effectType) {
      case 'atk_boost':
        follower.atk = Math.min(follower.atk * (1 + effectiveValue / 100), follower.atk * 3);
        follower.atk = Math.floor(follower.atk);
        break;
      case 'def_boost':
        follower.damageReduction = Math.min(follower.damageReduction + effectiveValue / 100, 0.9);
        break;
      case 'crit_boost':
        follower.critRate = Math.min(follower.critRate + effectiveValue / 100, 0.9);
        break;
      case 'dodge_boost':
        follower.dodgeRate = Math.min(follower.dodgeRate + effectiveValue / 100, 0.9);
        break;
      case 'shield':
        follower.shieldValue = (follower.shieldValue || 0) + effectiveValue;
        break;
      case 'heal':
        const healAmount = Math.floor(follower.maxHp * effectiveValue / 100);
        follower.currentHp = Math.min(follower.maxHp, follower.currentHp + healAmount);
        break;
      case 'cooldown_reduce':
        follower.cooldownReduce = (follower.cooldownReduce || 0) + effectiveValue;
        break;
    }
  }

  checkTrigger(condition, context) {
    if (this.type !== 'trigger') return false;
    if (!this.isUnlocked(context.equipStar)) return false;
    if (this.currentCooldown > 0) return false;

    const conditionMap = {
      'none': true,
      'on_crit': context.isCrit === true,
      'on_dodge': context.isDodged === true,
      'on_attack': context.isAttacking === true,
      'on_death': context.targetDied === true,
      'on_low_hp': (context.targetHpPercent || 1) < 0.3,
      'turn_start': true,
      'battle_start': context.isBattleStart === true,
      'ally_death': context.allyDied === true
    };

    return conditionMap[this.triggerCondition] || false;
  }

  executeTrigger(equipCard, context) {
    if (this.currentCooldown > 0) return null;

    this.currentCooldown = this.triggerCooldown;

    const chance = this.effectChance || 1.0;
    if (Math.random() > chance) return null;

    const effectiveValue = this.getEffectiveValue(equipCard);

    const effect = {
      skill: this,
      type: this.effectType,
      value: effectiveValue,
      duration: this.effectDuration,
      targets: context.targets || []
    };

    switch (this.effectType) {
      case 'burn':
      case 'poison':
        for (const target of effect.targets) {
          target.addDebuff({
            id: this.effectType + '_' + Date.now(),
            type: this.effectType,
            value: effectiveValue / 100,
            duration: this.effectDuration
          });
        }
        break;
      case 'freeze':
        for (const target of effect.targets) {
          target.addDebuff({
            id: 'stun_' + Date.now(),
            type: 'stun',
            value: 0,
            duration: this.effectDuration
          });
        }
        break;
      case 'heal':
        for (const target of effect.targets) {
          const healAmount = Math.floor(target.maxHp * effectiveValue / 100);
          target.heal(healAmount);
        }
        break;
      case 'shield':
        for (const target of effect.targets) {
          target.shieldValue = (target.shieldValue || 0) + effectiveValue;
          target.addBuff({
            id: 'shield_' + Date.now(),
            type: 'shield',
            value: effectiveValue,
            duration: this.effectDuration
          });
        }
        break;
      case 'atk_boost':
        for (const target of effect.targets) {
          target.addBuff({
            id: 'atk_up_' + Date.now(),
            type: 'atk_up',
            value: effectiveValue / 100,
            duration: this.effectDuration
          });
        }
        break;
      case 'haste':
        for (const target of effect.targets) {
          target.addBuff({
            id: 'speed_up_' + Date.now(),
            type: 'speed_up',
            value: effectiveValue / 100,
            duration: this.effectDuration
          });
        }
        break;
    }

    return effect;
  }

  applyModify(followerSkills, equipCard) {
    if (this.type !== 'modify') return;
    if (!this.isUnlocked(equipCard.star)) return;

    const effectiveValue = this.getEffectiveValue(equipCard);

    for (const skill of followerSkills) {
      if (this.modifyTarget !== 'all' && skill.id !== this.modifyTarget) continue;

      switch (this.modifyType) {
        case 'damage_x':
          skill.multiplier = (skill.multiplier || 1) * (1 + effectiveValue / 100);
          break;
        case 'cooldown_reduce':
          skill.cooldown = Math.max(0, (skill.cooldown || 0) - effectiveValue);
          break;
        case 'aoe_expand':
          skill.targetType = skill.targetType === 'single' ? 'all_enemies' : skill.targetType;
          break;
        case 'add_effect':
          if (!skill.additionalEffects) {
            skill.additionalEffects = [];
          }
          skill.additionalEffects.push({
            type: this.effectType,
            value: effectiveValue,
            chance: this.effectChance
          });
          break;
        case 'heal_convert':
          skill.healPercent = (skill.healPercent || 0) + effectiveValue / 100;
          break;
      }
    }
  }

  onTurnEnd() {
    if (this.currentCooldown > 0) {
      this.currentCooldown--;
    }
  }

  toJSON() {
    return {
      id: this.id,
      equipCardId: this.equipCardId,
      type: this.type,
      name: this.name,
      description: this.description,
      triggerCondition: this.triggerCondition,
      triggerCooldown: this.triggerCooldown,
      currentCooldown: this.currentCooldown,
      modifyTarget: this.modifyTarget,
      modifyType: this.modifyType,
      modifyValue: this.modifyValue,
      effectType: this.effectType,
      effectValue: this.effectValue,
      effectDuration: this.effectDuration,
      effectChance: this.effectChance,
      unlockStar: this.unlockStar,
      skillLevel: this.skillLevel
    };
  }

  static fromJSON(json) {
    return new EquipmentSkill(json);
  }
}
