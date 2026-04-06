export default class Skill {
  constructor(data) {
    this.id = data.skillId || data.id;
    this.name = data.name;
    this.description = data.description || '';
    this.type = data.type;
    this.targetType = data.targetType;
    this.targetTeam = data.targetTeam || 'enemy';

    this.multiplier = data.multiplier || 1.0;
    this.baseValue = data.baseValue || 0;

    this.cooldown = data.cooldown || 0;
    this.currentCooldown = 0;
    this.mpCost = data.mpCost || 0;

    this.buffType = data.buffType || null;
    this.buffDuration = data.buffDuration || 0;
    this.buffValue = data.buffValue || 0;

    this.debuffType = data.debuffType || null;
    this.debuffDuration = data.debuffDuration || 0;
    this.debuffValue = data.debuffValue || 0;

    this.shieldDuration = data.shieldDuration || 0;
    this.shieldValue = data.shieldValue || 0;

    this.healPercent = data.healPercent || 0;
    this.critBonus = data.critBonus || 0;
    this.hitCount = data.hitCount || 1;

    this.classRequired = data.classRequired;
    this.animation = data.animation || 'normal';
    this.particle = data.particle || 'none';
  }

  canUse(character, targets) {
    if (this.currentCooldown > 0) {
      return { canUse: false, reason: 'cooldown', remaining: this.currentCooldown };
    }

    if (character.mp < this.mpCost) {
      return { canUse: false, reason: 'no_mp', required: this.mpCost };
    }

    if (targets.length === 0 && this.targetType !== 'self') {
      return { canUse: false, reason: 'no_target' };
    }

    return { canUse: true };
  }

  execute(caster, targets) {
    const result = {
      success: true,
      skill: this,
      caster: caster,
      effects: [],
      damage: 0,
      healing: 0,
      buffs: [],
      debuffs: []
    };

    caster.mp -= this.mpCost;
    this.currentCooldown = this.cooldown;

    switch (this.type) {
      case 'damage':
        this.executeDamage(caster, targets, result);
        break;

      case 'heal':
        this.executeHeal(caster, targets, result);
        break;

      case 'damage_heal':
        this.executeDamageAndHeal(caster, targets, result);
        break;

      case 'buff':
        this.executeBuff(caster, targets, result);
        break;

      case 'debuff':
        this.executeDebuff(caster, targets, result);
        break;

      case 'shield':
        this.executeShield(caster, targets, result);
        break;

      case 'cleanse':
        this.executeCleanse(caster, targets, result);
        break;

      case 'counter':
        this.executeCounter(caster, result);
        break;

      case 'support':
        this.executeSupport(caster, targets, result);
        break;
    }

    return result;
  }

  executeDamage(caster, targets, result) {
    let targetList = this.targetType === 'all_enemies' || this.targetType === 'all_allies'
      ? targets
      : [targets[0]];

    for (let i = 0; i < this.hitCount; i++) {
      for (let target of targetList) {
        if (!target || target.isDead) continue;

        let damage = caster.atk * this.multiplier;
        let isCritical = Math.random() < (caster.critRate + this.critBonus);

        if (isCritical) {
          damage *= caster.critDamage;
        }

        // BUG2 FIX: 不直接扣血，只计算伤害值，让BattleSystem统一处理扣血
        let actualDamage = damage;
        result.damage += actualDamage;

        result.effects.push({
          type: 'damage',
          target: target,
          damage: actualDamage,
          isCritical: isCritical
        });

        if (this.debuffType) {
          target.addDebuff({
            id: this.debuffType,
            type: this.debuffType,
            value: this.debuffValue || 0.1,
            duration: this.debuffDuration
          });

          result.debuffs.push({
            target: target,
            debuffType: this.debuffType,
            duration: this.debuffDuration
          });
        }

        if (this.healPercent > 0 && !caster.isDead) {
          let healAmount = Math.floor(actualDamage * this.healPercent);
          caster.heal(healAmount);
          result.healing += healAmount;
        }

        if (actualDamage > 0) {
          caster.addHatred(actualDamage);
        }
      }
    }
  }

  executeHeal(caster, targets, result) {
    // BUG1 FIX: [targets] 改为正确的单目标提取
    let targetList = this.targetType === 'all_allies'
      ? targets.filter(t => !t.isDead)
      : (targets[0] && !targets[0].isDead ? [targets[0]] : []);

    for (let target of targetList) {
      let healAmount = Math.floor(this.baseValue + caster.atk * 0.3);
      let actualHeal = target.heal(healAmount);
      result.healing += actualHeal;

      result.effects.push({
        type: 'heal',
        target: target,
        amount: actualHeal
      });
    }

    if (this.buffType && this.buffValue > 0) {
      for (let target of targetList) {
        target.addBuff({
          id: this.buffType,
          type: this.buffType,
          value: this.buffValue,
          duration: this.buffDuration
        });

        result.buffs.push({
          target: target,
          buffType: this.buffType,
          duration: this.buffDuration
        });
      }
    }
  }

  executeDamageAndHeal(caster, targets, result) {
    this.executeDamage(caster, targets, result);

    if (this.healPercent > 0 && !caster.isDead && result.damage > 0) {
      let healAmount = Math.floor(result.damage * this.healPercent);
      let actualHeal = caster.heal(healAmount);
      result.healing += actualHeal;

      result.effects.push({
        type: 'heal',
        target: caster,
        amount: actualHeal
      });
    }
  }

  executeBuff(caster, targets, result) {
    // BUG1 FIX: [targets] 改为正确的单目标提取
    let targetList = this.targetType === 'self'
      ? [caster]
      : (this.targetType === 'all_allies'
        ? targets.filter(t => !t.isDead)
        : (targets[0] && !targets[0].isDead ? [targets[0]] : []));

    for (let target of targetList) {
      if (this.buffType && this.buffValue > 0) {
        target.addBuff({
          id: this.buffType,
          type: this.buffType,
          value: this.buffValue,
          duration: this.buffDuration
        });

        result.buffs.push({
          target: target,
          buffType: this.buffType,
          value: this.buffValue,
          duration: this.buffDuration
        });
      }
    }
  }

  executeDebuff(caster, targets, result) {
    // BUG1 FIX: [targets] 改为 [targets[0]]
    let targetList = this.targetType === 'single' ? [targets[0]] : targets;

    for (let target of targetList) {
      if (!target || target.isDead) continue;

      target.addDebuff({
        id: this.debuffType,
        type: this.debuffType,
        value: this.debuffValue || 0.1,
        duration: this.debuffDuration
      });

      result.debuffs.push({
        target: target,
        debuffType: this.debuffType,
        duration: this.debuffDuration
      });
    }
  }

  executeShield(caster, targets, result) {
    // BUG1 FIX: [targets] 改为正确的单目标提取
    let targetList = this.targetType === 'self'
      ? [caster]
      : (this.targetType === 'all_allies'
        ? targets.filter(t => !t.isDead)
        : (targets[0] && !targets[0].isDead ? [targets[0]] : []));

    for (let target of targetList) {
      if (!target) continue;

      target.addShield({
        id: 'shield_' + this.id,
        value: this.shieldValue,
        duration: this.shieldDuration
      });

      result.buffs.push({
        target: target,
        buffType: 'shield',
        value: this.shieldValue,
        duration: this.shieldDuration
      });
    }
  }

  executeCleanse(caster, targets, result) {
    // BUG1 FIX: targets 改为 targets[0]
    let target = this.targetType === 'self' ? caster : targets[0];

    if (target && !target.isDead) {
      let removedCount = target.debuffs.length;
      target.debuffs = [];

      result.effects.push({
        type: 'cleanse',
        target: target,
        removedCount: removedCount
      });
    }
  }

  executeCounter(caster, result) {
    caster.addBuff({
      id: 'counter_stance',
      type: 'counter',
      value: this.baseValue,
      duration: 1
    });

    result.buffs.push({
      target: caster,
      buffType: 'counter',
      value: this.baseValue,
      duration: 1
    });
  }

  executeSupport(caster, targets, result) {
    // BUG1 FIX: targets 改为 targets[0]
    let target = this.targetType === 'self' ? caster : targets[0];

    if (target && !target.isDead) {
      target.status = 'ready';

      result.effects.push({
        type: 'support',
        target: target,
        action: 'ready'
      });
    }
  }

  reduceCooldown() {
    if (this.currentCooldown > 0) {
      this.currentCooldown--;
    }
  }

  resetCooldown() {
    this.currentCooldown = 0;
  }

  getRemainingCooldown() {
    return this.currentCooldown;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      currentCooldown: this.currentCooldown
    };
  }
}
