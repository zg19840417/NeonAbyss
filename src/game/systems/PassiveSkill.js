export const PassiveType = {
  AURA_ATK_UP: 'aura_atk_up',
  AURA_DEF_UP: 'aura_def_up',
  AURA_HEAL: 'aura_heal',
  ON_ATTACK: 'on_attack',
  ON_DAMAGE_TAKEN: 'on_damage_taken',
  ON_ALLY_DEATH: 'on_ally_death',
  ON_KILL: 'on_kill',
  ON_HP_BELOW_THRESHOLD: 'on_hp_below',
  ON_TURN_START: 'on_turn_start',
  ON_SUMMON: 'on_summon',
  DIVINE_SHIELD: 'divine_shield',
  TAUNT: 'taunt',
  WINDFURY: 'windfury',
  REBIRTH: 'rebirth',
  POISON_TOUCH: 'poison_touch',
  LIFESTEAL_AURA: 'lifesteal_aura'
};

export default class PassiveSkill {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.value = data.value || 0;
    this.threshold = data.threshold || 0;
    this.duration = data.duration || 0;
    this.icon = data.icon || '✦';
    this.targetType = data.targetType || 'self';
    this.buffType = data.buffType || null;
    this.buffDuration = data.buffDuration || 0;
    this.buffValue = data.buffValue || 0;
    this.triggered = data.triggered || false;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  canTrigger(context) {
    if (!this.isActive || this.triggered) return false;

    const eventMap = {
      [PassiveType.ON_ATTACK]: 'attack',
      [PassiveType.ON_DAMAGE_TAKEN]: 'damage_taken',
      [PassiveType.ON_ALLY_DEATH]: 'ally_death',
      [PassiveType.ON_KILL]: 'kill',
      [PassiveType.ON_HP_BELOW_THRESHOLD]: 'damage_taken',
      [PassiveType.ON_TURN_START]: 'turn_start',
      [PassiveType.ON_SUMMON]: 'summon'
    };

    const expectedEvent = eventMap[this.type];
    if (!expectedEvent || context.eventType !== expectedEvent) return false;

    if (this.type === PassiveType.ON_HP_BELOW_THRESHOLD && context.source) {
      const hpPercent = context.source.currentHp / context.source.maxHp;
      if (hpPercent > this.threshold) return false;
    }

    if (this.type === PassiveType.ON_DAMAGE_TAKEN) {
      // Probability check moved to individual execute() per passive type
      // canTrigger only checks event type match
    }

    return true;
  }

  execute(context, allAllies = [], allEnemies = []) {
    const result = {
      passive: this,
      effects: [],
      damage: 0,
      healing: 0,
      buffs: [],
      debuffs: [],
      messages: []
    };

    switch (this.type) {
      case PassiveType.AURA_ATK_UP:
        this._applyAuraBuff(allAllies, 'atk_up', this.value, result);
        break;

      case PassiveType.AURA_DEF_UP:
        this._applyAuraBuff(allAllies, 'def_up', this.value, result);
        break;

      case PassiveType.AURA_HEAL:
        for (const ally of allAllies) {
          if (!ally.isDead) {
            const healAmount = Math.floor(ally.maxHp * this.value);
            const actual = ally.heal(healAmount);
            result.healing += actual;
            result.effects.push({ type: 'heal', target: ally, amount: actual });
            result.messages.push(`${ally.name} 恢复了 ${actual} 点生命（${this.name}）`);
          }
        }
        break;

      case PassiveType.ON_ATTACK:
        if (context.target && !context.target.isDead) {
          const extraDamage = Math.floor(context.source.atk * this.value);
          const actual = context.target.takeDamage(extraDamage);
          result.damage += actual;
          result.effects.push({ type: 'damage', target: context.target, damage: actual });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，额外造成 ${actual} 点伤害`);
        }
        break;

      case PassiveType.ON_DAMAGE_TAKEN:
        if (context.source && !context.source.isDead) {
          context.source.addBuff({
            id: 'passive_atk_boost_' + this.id,
            type: 'atk_up',
            value: this.value,
            duration: this.duration || 2
          });
          result.buffs.push({ target: context.source, type: 'atk_up', value: this.value });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，攻击力提升`);
        }
        break;

      case PassiveType.ON_ALLY_DEATH:
        if (context.source && !context.source.isDead) {
          context.source.atk = Math.floor(context.source.atk * (1 + this.value));
          context.source.maxHp = Math.floor(context.source.maxHp * (1 + this.value));
          context.source.currentHp = Math.min(context.source.currentHp + Math.floor(context.source.maxHp * this.value), context.source.maxHp);
          result.effects.push({ type: 'stat_boost', target: context.source });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，属性永久提升`);
        }
        break;

      case PassiveType.ON_KILL:
        if (context.source && !context.source.isDead) {
          const healAmount = Math.floor(context.source.maxHp * this.value);
          const actual = context.source.heal(healAmount);
          result.healing += actual;
          result.effects.push({ type: 'heal', target: context.source, amount: actual });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，恢复了 ${actual} 点生命`);
        }
        break;

      case PassiveType.ON_HP_BELOW_THRESHOLD:
        if (context.source && !context.source.isDead) {
          context.source.addBuff({
            id: 'passive_crit_boost_' + this.id,
            type: 'crit_up',
            value: this.value,
            duration: this.duration || 99
          });
          result.buffs.push({ target: context.source, type: 'crit_up', value: this.value });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，暴击率大幅提升！`);
        }
        break;

      case PassiveType.ON_TURN_START:
        if (context.source && !context.source.isDead) {
          if (this.targetType === 'all_enemies') {
            // Damage all enemies (e.g. 炎魔卫士)
            for (const enemy of allEnemies) {
              if (!enemy.isDead) {
                const damage = Math.floor(context.source.atk * this.value);
                const actual = enemy.takeDamage(damage);
                result.damage += actual;
                result.effects.push({ type: 'damage', target: enemy, damage: actual });
              }
            }
            result.messages.push(`${context.source.name} 的 ${this.name} 触发，对所有敌人造成 ${result.damage} 点伤害`);
          } else {
            // Default: add shield to self
            context.source.addBuff({
              id: 'passive_shield_' + this.id,
              type: 'shield',
              value: this.value,
              duration: 1
            });
            result.buffs.push({ target: context.source, type: 'shield', value: this.value });
            result.messages.push(`${context.source.name} 的 ${this.name} 触发，获得护盾`);
          }
        }
        break;

      case PassiveType.ON_SUMMON:
        for (const enemy of allEnemies) {
          if (!enemy.isDead) {
            const damage = Math.floor(context.source.atk * this.value);
            const actual = enemy.takeDamage(damage);
            result.damage += actual;
            result.effects.push({ type: 'damage', target: enemy, damage: actual });
          }
        }
        result.messages.push(`${context.source.name} 登场！${this.name} 对所有敌人造成伤害`);
        this.triggered = true;
        break;

      case PassiveType.DIVINE_SHIELD:
        break;

      case PassiveType.TAUNT:
        break;

      case PassiveType.WINDFURY:
        break;

      case PassiveType.REBIRTH:
        break;

      case PassiveType.POISON_TOUCH:
        if (context.target && !context.target.isDead) {
          const debuffData = {
            id: 'poison_touch_' + this.id + '_' + Date.now(),
            type: 'poison',
            value: this.value,
            duration: this.duration || 3
          };
          if (context.target.addDebuff) {
            context.target.addDebuff(debuffData);
          } else if (context.target.addBuff) {
            context.target.addBuff({ ...debuffData, isDebuff: true });
          }
          result.debuffs.push({ target: context.target, type: 'poison' });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，目标中毒`);
        }
        break;

      case PassiveType.LIFESTEAL_AURA:
        break;
    }

    return result;
  }

  _applyAuraBuff(allies, buffType, value, result) {
    for (const ally of allies) {
      if (!ally.isDead) {
        ally.addBuff({
          id: 'aura_' + this.id + '_' + ally.id,
          type: buffType,
          value: value,
          duration: 1
        });
        result.buffs.push({ target: ally, type: buffType, value });
      }
    }
    result.messages.push(`${this.name} 光环生效，全体友军获得增益`);
  }

  isOneTime() {
    return [
      PassiveType.DIVINE_SHIELD,
      PassiveType.REBIRTH,
      PassiveType.ON_SUMMON
    ].includes(this.type);
  }

  isAura() {
    return [
      PassiveType.AURA_ATK_UP,
      PassiveType.AURA_DEF_UP,
      PassiveType.AURA_HEAL
    ].includes(this.type);
  }

  isStatus() {
    return [
      PassiveType.DIVINE_SHIELD,
      PassiveType.TAUNT,
      PassiveType.WINDFURY,
      PassiveType.REBIRTH,
      PassiveType.POISON_TOUCH,
      PassiveType.LIFESTEAL_AURA
    ].includes(this.type);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      value: this.value,
      threshold: this.threshold,
      triggered: this.triggered,
      isActive: this.isActive
    };
  }
}
