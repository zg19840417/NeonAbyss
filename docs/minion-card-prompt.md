# 随从卡（MinionCard）完整实现提示词

> 本文档用于指导 AI 大模型在 NeonAbyss 项目中实现完整的随从卡系统。
> 项目技术栈：Phaser 3 + JavaScript（非 TypeScript）+ Vite，分辨率 375×812。

---

## 一、任务概述

在现有 NeonAbyss 项目基础上，扩展 Character 角色系统，新增**随从卡（MinionCard）**功能。随从卡拥有生命、攻击、1个主动技能、1个被动技能、立绘，以及品质、元素属性、种族分类。

**约束条件**：
- 必须使用纯 JavaScript（非 TypeScript），与现有代码风格一致
- 常量放 `Const.js`，多语言用 `Lang.js`，禁止硬编码
- 场景间通信用 `EventBus`
- 监听器必须在 `shutdown()` 中清理
- 复用现有 `Skill`、`BuffSystem`、`Character` 等模块

---

## 二、需要新建的文件

```
src/game/entities/MinionCard.js          # 随从卡实体类（扩展 Character）
src/game/systems/PassiveSkill.js         # 被动技能系统
src/game/data/MinionConfig.js            # 随从卡配置（品质、元素、种族枚举+配置）
src/game/data/minions.json               # 随从卡数据（示例数据）
```

---

## 三、文件一：`src/game/data/MinionConfig.js` — 枚举与配置

### 3.1 品质枚举与配置

```javascript
export const Rarity = {
  COMMON: 'common',       // 普通
  RARE: 'rare',           // 稀有
  EPIC: 'epic',           // 史诗
  LEGENDARY: 'legendary'  // 传说
};

export const RarityConfig = {
  [Rarity.COMMON]: {
    name: '普通',
    nameEn: 'Common',
    statMultiplier: 1.0,       // 属性倍率
    borderColor: 0x8a7a6a,     // 卡牌边框颜色
    glowColor: null,           // 光效颜色（无）
    particleColor: null        // 粒子颜色（无）
  },
  [Rarity.RARE]: {
    name: '稀有',
    nameEn: 'Rare',
    statMultiplier: 1.2,
    borderColor: 0x4dabf7,
    glowColor: 0x4dabf7,
    particleColor: 0x4dabf7
  },
  [Rarity.EPIC]: {
    name: '史诗',
    nameEn: 'Epic',
    statMultiplier: 1.5,
    borderColor: 0x9775fa,
    glowColor: 0x9775fa,
    particleColor: 0x9775fa
  },
  [Rarity.LEGENDARY]: {
    name: '传说',
    nameEn: 'Legendary',
    statMultiplier: 2.0,
    borderColor: 0xffd700,
    glowColor: 0xffd700,
    particleColor: 0xffd700
  }
};
```

### 3.2 元素属性枚举与配置

```javascript
export const Element = {
  FIRE: 'fire',       // 火
  ICE: 'ice',         // 冰
  THUNDER: 'thunder', // 雷
  DARK: 'dark',       // 暗
  LIGHT: 'light'      // 光
};

export const ElementConfig = {
  [Element.FIRE]: {
    name: '火',
    nameEn: 'Fire',
    icon: '🔥',
    color: 0xff6b35,
    // 元素克制关系：火 > 冰 > 雷 > 暗 > 光 > 火
    strongAgainst: Element.ICE,
    weakAgainst: Element.LIGHT,
    bonusMultiplier: 1.3,    // 克制时伤害倍率
    resistMultiplier: 0.7    // 被克制时受伤倍率
  },
  [Element.ICE]: {
    name: '冰',
    nameEn: 'Ice',
    icon: '❄️',
    color: 0x74c0fc,
    strongAgainst: Element.THUNDER,
    weakAgainst: Element.FIRE,
    bonusMultiplier: 1.3,
    resistMultiplier: 0.7
  },
  [Element.THUNDER]: {
    name: '雷',
    nameEn: 'Thunder',
    icon: '⚡',
    color: 0xffd43b,
    strongAgainst: Element.DARK,
    weakAgainst: Element.ICE,
    bonusMultiplier: 1.3,
    resistMultiplier: 0.7
  },
  [Element.DARK]: {
    name: '暗',
    nameEn: 'Dark',
    icon: '🌑',
    color: 0x9775fa,
    strongAgainst: Element.LIGHT,
    weakAgainst: Element.THUNDER,
    bonusMultiplier: 1.3,
    resistMultiplier: 0.7
  },
  [Element.LIGHT]: {
    name: '光',
    nameEn: 'Light',
    icon: '✨',
    color: 0xffee58,
    strongAgainst: Element.FIRE,
    weakAgainst: Element.DARK,
    bonusMultiplier: 1.3,
    resistMultiplier: 0.7
  }
};

// 元素克制判定函数
export function getElementMultiplier(attackerElement, defenderElement) {
  if (!attackerElement || !defenderElement) return 1.0;
  const attackerConfig = ElementConfig[attackerElement];
  if (!attackerConfig) return 1.0;
  if (attackerConfig.strongAgainst === defenderElement) return attackerConfig.bonusMultiplier;
  if (attackerConfig.weakAgainst === defenderElement) return attackerConfig.resistMultiplier;
  return 1.0;
}
```

### 3.3 种族分类枚举与配置

```javascript
export const Race = {
  HUMAN: 'human',       // 人类
  MECH: 'mech',         // 机械
  MUTANT: 'mutant',     // 变异体
  ENERGY: 'energy',     // 能量体
  BEAST: 'beast'        // 野兽
};

export const RaceConfig = {
  [Race.HUMAN]: {
    name: '人类',
    nameEn: 'Human',
    icon: '🧑',
    description: '均衡型种族，无特殊加成'
  },
  [Race.MECH]: {
    name: '机械',
    nameEn: 'Mech',
    icon: '🤖',
    description: '机械种族，受到治疗效果降低30%，但免疫中毒和眩晕'
  },
  [Race.MUTANT]: {
    name: '变异体',
    nameEn: 'Mutant',
    icon: '🧬',
    description: '变异种族，每回合恢复最大生命值5%'
  },
  [Race.ENERGY]: {
    name: '能量体',
    nameEn: 'Energy',
    icon: '💎',
    description: '能量种族，闪避率额外+15%，但生命值上限-20%'
  },
  [Race.BEAST]: {
    name: '野兽',
    nameEn: 'Beast',
    icon: '🐺',
    description: '野兽种族，攻击力+15%，暴击率+10%'
  }
};
```

---

## 四、文件二：`src/game/systems/PassiveSkill.js` — 被动技能系统

### 4.1 被动技能类型枚举

```javascript
export const PassiveType = {
  // 光环类 — 持续生效，影响周围友军
  AURA_ATK_UP: 'aura_atk_up',           // 光环：友军攻击力提升
  AURA_DEF_UP: 'aura_def_up',           // 光环：友军防御力提升
  AURA_HEAL: 'aura_heal',               // 光环：友军每回合恢复生命

  // 触发类 — 满足条件时自动触发
  ON_ATTACK: 'on_attack',               // 攻击时触发（如：攻击附带额外伤害）
  ON_DAMAGE_TAKEN: 'on_damage_taken',   // 受伤时触发（如：反弹伤害、受伤后加攻击）
  ON_ALLY_DEATH: 'on_ally_death',       // 友军死亡时触发（如：获得属性加成）
  ON_KILL: 'on_kill',                   // 击杀敌人时触发（如：恢复生命、永久加攻击）
  ON_HP_BELOW_THRESHOLD: 'on_hp_below', // 生命低于阈值时触发（如：低于30%时暴击翻倍）
  ON_TURN_START: 'on_turn_start',       // 回合开始时触发（如：每回合获得护盾）
  ON_SUMMON: 'on_summon',               // 登场时触发（如：入场时对所有敌人造成伤害）

  // 状态类 — 永久改变自身属性
  DIVINE_SHIELD: 'divine_shield',       // 圣盾：免疫一次伤害
  TAUNT: 'taunt',                       // 嘲讽：强制敌人攻击自己
  WINDFURY: 'windfury',                 // 风怒：每回合可攻击两次
  REBIRTH: 'rebirth',                   // 重生：死亡后以30%生命值复活一次
  POISON_TOUCH: 'poison_touch',         // 剧毒之触：攻击附带中毒效果
  LIFESTEAL_AURA: 'lifesteal_aura'      // 吸血光环：攻击时回复造成伤害的20%
};
```

### 4.2 PassiveSkill 类

```javascript
export default class PassiveSkill {
  /**
   * @param {Object} data - 被动技能数据
   * @param {string} data.id - 技能唯一ID
   * @param {string} data.name - 技能名称
   * @param {string} data.description - 技能描述文本
   * @param {string} data.type - PassiveType 枚举值
   * @param {number} [data.value] - 效果数值（如提升百分比、伤害值等）
   * @param {number} [data.threshold] - 触发阈值（如生命百分比 0.3 = 30%）
   * @param {number} [data.duration] - 效果持续回合数（0 = 永久）
   * @param {string} [data.icon] - 技能图标
   * @param {string} [data.targetType] - 影响目标类型：'self' | 'all_allies' | 'single_enemy' | 'all_enemies'
   * @param {string} [data.buffType] - 触发后附加的 Buff 类型（复用 BuffSystem.BuffType）
   * @param {number} [data.buffDuration] - 附加 Buff 的持续回合数
   * @param {number} [data.buffValue] - 附加 Buff 的数值
   * @param {boolean} [data.triggered] - 是否已触发过（用于一次性被动如圣盾、重生）
   * @param {boolean} [data.isActive] - 被动是否处于激活状态
   */
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

  /**
   * 判断被动技能是否可以被触发
   * @param {Object} context - 触发上下文
   * @param {string} context.eventType - 事件类型：'attack' | 'damage_taken' | 'ally_death' | 'kill' | 'turn_start' | 'summon'
   * @param {Object} context.source - 触发来源实体
   * @param {Object} [context.target] - 事件目标实体
   * @param {number} [context.damage] - 事件造成的伤害值
   * @returns {boolean}
   */
  canTrigger(context) {
    if (!this.isActive || this.triggered) return false;

    // 根据被动类型匹配事件
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

    // 特殊条件判定
    if (this.type === PassiveType.ON_HP_BELOW_THRESHOLD && context.source) {
      const hpPercent = context.source.hp / context.source.maxHp;
      if (hpPercent >= this.threshold) return false;
    }

    return true;
  }

  /**
   * 执行被动技能效果
   * @param {Object} context - 触发上下文（同 canTrigger）
   * @param {Array} allAllies - 所有友军列表（用于光环类）
   * @param {Array} allEnemies - 所有敌人列表（用于触发类）
   * @returns {Object} 效果结果
   */
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
      // ===== 光环类 =====
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

      // ===== 触发类 =====
      case PassiveType.ON_ATTACK:
        // 攻击时附带额外伤害
        if (context.target && !context.target.isDead) {
          const extraDamage = Math.floor(context.source.atk * this.value);
          const actual = context.target.takeDamage(extraDamage);
          result.damage += actual;
          result.effects.push({ type: 'damage', target: context.target, damage: actual });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，额外造成 ${actual} 点伤害`);
        }
        break;

      case PassiveType.ON_DAMAGE_TAKEN:
        // 受伤后提升攻击力
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
        // 友军死亡时获得永久属性加成
        if (context.source && !context.source.isDead) {
          context.source.atk = Math.floor(context.source.atk * (1 + this.value));
          context.source.maxHp = Math.floor(context.source.maxHp * (1 + this.value));
          context.source.hp = Math.min(context.source.hp + Math.floor(context.source.maxHp * this.value), context.source.maxHp);
          result.effects.push({ type: 'stat_boost', target: context.source });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，属性永久提升`);
        }
        break;

      case PassiveType.ON_KILL:
        // 击杀时恢复生命
        if (context.source && !context.source.isDead) {
          const healAmount = Math.floor(context.source.maxHp * this.value);
          const actual = context.source.heal(healAmount);
          result.healing += actual;
          result.effects.push({ type: 'heal', target: context.source, amount: actual });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，恢复了 ${actual} 点生命`);
        }
        break;

      case PassiveType.ON_HP_BELOW_THRESHOLD:
        // 生命低于阈值时暴击率大幅提升
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
        // 回合开始时获得护盾
        if (context.source && !context.source.isDead) {
          context.source.addBuff({
            id: 'passive_shield_' + this.id,
            type: 'shield',
            value: this.value,
            duration: 1
          });
          result.buffs.push({ target: context.source, type: 'shield', value: this.value });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，获得护盾`);
        }
        break;

      case PassiveType.ON_SUMMON:
        // 登场时对所有敌人造成伤害
        for (const enemy of allEnemies) {
          if (!enemy.isDead) {
            const damage = Math.floor(context.source.atk * this.value);
            const actual = enemy.takeDamage(damage);
            result.damage += actual;
            result.effects.push({ type: 'damage', target: enemy, damage: actual });
          }
        }
        result.messages.push(`${context.source.name} 登场！${this.name} 对所有敌人造成伤害`);
        // 入场效果是一次性的
        this.triggered = true;
        break;

      // ===== 状态类 =====
      case PassiveType.DIVINE_SHIELD:
        // 圣盾在 takeDamage 时由 BattleSystem 拦截处理
        // 这里标记为已触发
        break;

      case PassiveType.TAUNT:
        // 嘲讽由 BattleSystem 的 selectTarget 逻辑处理
        break;

      case PassiveType.WINDFURY:
        // 风怒由 BattleSystem 的行动次数逻辑处理
        break;

      case PassiveType.REBIRTH:
        // 重生由 BattleSystem 的 onCharacterDeath 逻辑处理
        break;

      case PassiveType.POISON_TOUCH:
        // 剧毒之触在攻击命中后附加中毒
        if (context.target && !context.target.isDead) {
          context.target.addDebuff({
            id: 'poison_touch_' + this.id,
            type: 'poison',
            value: this.value,
            duration: this.duration || 3
          });
          result.debuffs.push({ target: context.target, type: 'poison' });
          result.messages.push(`${context.source.name} 的 ${this.name} 触发，目标中毒`);
        }
        break;

      case PassiveType.LIFESTEAL_AURA:
        // 吸血在攻击命中后由 BattleSystem 处理回复
        break;
    }

    return result;
  }

  /**
   * 光环类辅助方法：给所有友军添加 Buff
   */
  _applyAuraBuff(allies, buffType, value, result) {
    for (const ally of allies) {
      if (!ally.isDead) {
        ally.addBuff({
          id: 'aura_' + this.id + '_' + ally.id,
          type: buffType,
          value: value,
          duration: 1  // 光环每回合重新施加
        });
        result.buffs.push({ target: ally, type: buffType, value });
      }
    }
    result.messages.push(`${this.name} 光环生效，全体友军获得增益`);
  }

  /**
   * 判断是否为一次性被动（触发后永久失效）
   */
  isOneTime() {
    return [
      PassiveType.DIVINE_SHIELD,
      PassiveType.REBIRTH,
      PassiveType.ON_SUMMON
    ].includes(this.type);
  }

  /**
   * 判断是否为光环类被动
   */
  isAura() {
    return [
      PassiveType.AURA_ATK_UP,
      PassiveType.AURA_DEF_UP,
      PassiveType.AURA_HEAL
    ].includes(this.type);
  }

  /**
   * 判断是否为状态类被动（持续生效，不需要事件触发）
   */
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
```

---

## 五、文件三：`src/game/entities/MinionCard.js` — 随从卡实体类

### 5.1 MinionCard 类（继承 Character）

```javascript
import Character from './Character.js';
import Skill from '../systems/Skill.js';
import PassiveSkill from '../systems/PassiveSkill.js';
import { Rarity, RarityConfig, Element, ElementConfig, Race, RaceConfig, getElementMultiplier } from '../data/MinionConfig.js';

export default class MinionCard extends Character {
  /**
   * @param {Object} data - 随从卡数据
   * @param {string} data.id - 唯一ID（如 'minion_001'）
   * @param {string} data.name - 随从名称
   * @param {string} data.charClass - 职业配置键（复用 CharacterClass）
   * @param {string} data.rarity - 品质（Rarity 枚举值）
   * @param {string} data.element - 元素属性（Element 枚举值）
   * @param {string} data.race - 种族（Race 枚举值）
   * @param {string} data.portrait - 立绘资源路径（如 'characters/minion_001'）
   * @param {Object} data.activeSkill - 主动技能数据（Skill 构造参数）
   * @param {Object} data.passiveSkill - 被动技能数据（PassiveSkill 构造参数）
   * @param {number} [data.level] - 等级
   * @param {string} [data.description] - 随从描述文本
   */
  constructor(data) {
    // 调用父类 Character 构造函数
    super({
      id: data.id,
      name: data.name,
      charClass: data.charClass,
      level: data.level || 1,
      hp: data.hp,
      skills: data.activeSkill ? [new Skill(data.activeSkill)] : [],
      equipment: data.equipment || {}
    });

    // ===== 随从卡独有属性 =====
    this.rarity = data.rarity || Rarity.COMMON;
    this.element = data.element || null;
    this.race = data.race || Race.HUMAN;
    this.portrait = data.portrait || null;
    this.description = data.description || '';

    // 被动技能
    this.passiveSkill = data.passiveSkill
      ? (data.passiveSkill instanceof PassiveSkill ? data.passiveSkill : new PassiveSkill(data.passiveSkill))
      : null;

    // 应用品质倍率到基础属性
    this._applyRarityMultiplier();

    // 应用种族天赋
    this._applyRaceBonus();

    // 标记为随从卡类型
    this.isMinionCard = true;

    // 重生标记（用于 REBIRTH 被动）
    this._hasRebirthed = false;

    // 风怒额外攻击标记
    this._windfuryUsed = false;
  }

  /**
   * 应用品质属性倍率
   * 品质越高，基础属性越强
   */
  _applyRarityMultiplier() {
    const config = RarityConfig[this.rarity];
    if (!config || config.statMultiplier === 1.0) return;

    const mult = config.statMultiplier;
    this.maxHp = Math.floor(this.maxHp * mult);
    this.hp = this.maxHp;  // 品质加成在创建时满血
    this.atk = Math.floor(this.atk * mult);
  }

  /**
   * 应用种族天赋
   */
  _applyRaceBonus() {
    switch (this.race) {
      case Race.MECH:
        // 机械：免疫中毒和眩晕（通过标记实现，在 BattleSystem 中判定）
        this._mechImmune = true;
        break;

      case Race.MUTANT:
        // 变异体：每回合恢复最大生命值5%（在 BattleSystem 回合处理中实现）
        this._mutantRegen = 0.05;
        break;

      case Race.ENERGY:
        // 能量体：闪避率+15%，生命上限-20%
        this.dodgeRate = Math.min(this.dodgeRate + 0.15, 0.90);
        this.maxHp = Math.floor(this.maxHp * 0.8);
        this.hp = this.maxHp;
        break;

      case Race.BEAST:
        // 野兽：攻击力+15%，暴击率+10%
        this.atk = Math.floor(this.atk * 1.15);
        this.critRate = Math.min(this.critRate + 0.10, 0.90);
        break;

      case Race.HUMAN:
      default:
        break;
    }
  }

  /**
   * 重写 attack 方法，加入元素克制判定
   */
  attack(target, skillMultiplier = 1) {
    if (this.isDead || target.isDead) return null;

    let damage = this.atk * skillMultiplier;
    let isCritical = Math.random() < this.critRate;

    if (isCritical) {
      damage *= this.critDamage;
    }

    // 元素克制判定
    let elementMultiplier = 1.0;
    if (this.element && target.element) {
      elementMultiplier = getElementMultiplier(this.element, target.element);
      damage = Math.floor(damage * elementMultiplier);
    }

    let actualDamage = target.takeDamage(damage);

    // 吸血
    if (this.lifeSteal > 0 && !this.isDead) {
      let healAmount = Math.floor(actualDamage * this.lifeSteal);
      this.heal(healAmount);
    }

    // 吸血光环被动
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

  /**
   * 重写 takeDamage 方法，加入圣盾和嘲讽判定
   */
  takeDamage(damage) {
    if (this.isDead) return 0;

    // 圣盾判定
    if (this.passiveSkill && this.passiveSkill.type === 'divine_shield' && !this.passiveSkill.triggered) {
      this.passiveSkill.triggered = true;
      return 0;  // 圣盾抵消全部伤害
    }

    let actualDamage = Math.max(1, Math.floor(damage * (1 - this.getBaseDamageReduction())));

    this.hp -= actualDamage;

    if (this.hp <= 0) {
      // 重生判定
      if (this.passiveSkill && this.passiveSkill.type === 'rebirth' && !this._hasRebirthed) {
        this._hasRebirthed = true;
        this.hp = Math.floor(this.maxHp * 0.3);
        return actualDamage;  // 返回伤害值但角色不死亡
      }

      this.hp = 0;
      this.isDead = true;
      this.status = 'dead';
    }

    return actualDamage;
  }

  /**
   * 判断是否有嘲讽被动
   */
  hasTaunt() {
    return this.passiveSkill && this.passiveSkill.type === 'taunt' && this.passiveSkill.isActive;
  }

  /**
   * 判断是否有风怒被动
   */
  hasWindfury() {
    return this.passiveSkill && this.passiveSkill.type === 'windfury' && this.passiveSkill.isActive;
  }

  /**
   * 判断是否有剧毒之触
   */
  hasPoisonTouch() {
    return this.passiveSkill && this.passiveSkill.type === 'poison_touch' && this.passiveSkill.isActive;
  }

  /**
   * 判断机械免疫
   */
  isMechImmune() {
    return this._mechImmune === true;
  }

  /**
   * 获取变异体回复比例
   */
  getMutantRegen() {
    return this._mutantRegen || 0;
  }

  /**
   * 获取品质配置
   */
  getRarityConfig() {
    return RarityConfig[this.rarity] || RarityConfig[Rarity.COMMON];
  }

  /**
   * 获取元素配置
   */
  getElementConfig() {
    return this.element ? ElementConfig[this.element] : null;
  }

  /**
   * 获取种族配置
   */
  getRaceConfig() {
    return RaceConfig[this.race] || RaceConfig[Race.HUMAN];
  }

  /**
   * 重写 toJSON，包含随从卡独有属性
   */
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
      passiveSkill: this.passiveSkill ? this.passiveSkill.toJSON() : null,
      _hasRebirthed: this._hasRebirthed,
      _windfuryUsed: this._windfuryUsed
    };
  }

  static fromJSON(json) {
    const minion = new MinionCard(json);
    minion.maxHp = minion.getMaxHp();
    return minion;
  }
}
```

---

## 六、文件四：`src/game/data/minions.json` — 示例随从卡数据

```json
[
  {
    "id": "minion_001",
    "name": "炎魔卫士",
    "charClass": "iron_wall",
    "rarity": "rare",
    "element": "fire",
    "race": "human",
    "portrait": "characters/ComfyUI_temp_axxiq_00077_.png",
    "level": 1,
    "description": "来自废土深处的火焰守卫，以烈焰为盾",
    "activeSkill": {
      "skillId": "SK_fire_slash",
      "name": "烈焰斩",
      "description": "挥出燃烧的巨刃，对单体敌人造成150%攻击力伤害",
      "type": "damage",
      "targetType": "single",
      "targetTeam": "enemy",
      "multiplier": 1.5,
      "cooldown": 3,
      "animation": "slash",
      "particle": "fire"
    },
    "passiveSkill": {
      "id": "PS_fire_aura",
      "name": "灼烧光环",
      "description": "回合开始时，对所有敌人造成攻击力20%的火焰伤害",
      "type": "on_turn_start",
      "value": 0.2,
      "targetType": "all_enemies",
      "icon": "🔥"
    }
  },
  {
    "id": "minion_002",
    "name": "寒冰射手",
    "charClass": "shadow_assassin",
    "rarity": "rare",
    "element": "ice",
    "race": "human",
    "portrait": "characters/ComfyUI_temp_axxiq_00081_.png",
    "level": 1,
    "description": "被冰霜附体的狙击手，箭矢穿透一切",
    "activeSkill": {
      "skillId": "SK_ice_arrow",
      "name": "寒冰箭",
      "description": "射出冰箭，对单体造成120%伤害并降低攻击力20%，持续2回合",
      "type": "damage",
      "targetType": "single",
      "targetTeam": "enemy",
      "multiplier": 1.2,
      "cooldown": 2,
      "debuffType": "atk_down",
      "debuffValue": 0.2,
      "debuffDuration": 2,
      "animation": "arrow",
      "particle": "ice"
    },
    "passiveSkill": {
      "id": "PS_frost_armor",
      "name": "霜甲",
      "description": "受到攻击时，有30%概率冻结攻击者1回合",
      "type": "on_damage_taken",
      "value": 0.3,
      "buffType": "stun",
      "buffDuration": 1,
      "icon": "❄️"
    }
  },
  {
    "id": "minion_003",
    "name": "雷神机甲",
    "charClass": "steel_bastion",
    "rarity": "epic",
    "element": "thunder",
    "race": "mech",
    "portrait": "characters/ComfyUI_temp_axxiq_00087_.png",
    "level": 1,
    "description": "搭载雷电核心的重型机甲，攻防一体",
    "activeSkill": {
      "skillId": "SK_thunder_strike",
      "name": "雷霆一击",
      "description": "释放雷电能量，对所有敌人造成100%攻击力伤害",
      "type": "damage",
      "targetType": "all_enemies",
      "targetTeam": "enemy",
      "multiplier": 1.0,
      "cooldown": 4,
      "animation": "thunder",
      "particle": "thunder"
    },
    "passiveSkill": {
      "id": "PS_divine_shield",
      "name": "能量护盾",
      "description": "免疫第一次受到的伤害",
      "type": "divine_shield",
      "icon": "🔰"
    }
  },
  {
    "id": "minion_004",
    "name": "暗影猎手",
    "charClass": "berserker",
    "rarity": "epic",
    "element": "dark",
    "race": "beast",
    "portrait": "characters/ComfyUI_temp_axxiq_00097_.png",
    "level": 1,
    "description": "暗夜中的猎杀者，越战越勇",
    "activeSkill": {
      "skillId": "SK_shadow_bite",
      "name": "暗影撕咬",
      "description": "对单体造成200%伤害，并回复造成伤害的30%生命值",
      "type": "damage_heal",
      "targetType": "single",
      "targetTeam": "enemy",
      "multiplier": 2.0,
      "healPercent": 0.3,
      "cooldown": 3,
      "animation": "bite",
      "particle": "dark"
    },
    "passiveSkill": {
      "id": "PS_blood_fury",
      "name": "嗜血狂怒",
      "description": "生命值低于30%时，暴击率提升50%",
      "type": "on_hp_below",
      "value": 0.5,
      "threshold": 0.3,
      "icon": "🩸"
    }
  },
  {
    "id": "minion_005",
    "name": "圣光守护者",
    "charClass": "holy_priest",
    "rarity": "legendary",
    "element": "light",
    "race": "energy",
    "portrait": "characters/ComfyUI_temp_axxiq_00099_.png",
    "level": 1,
    "description": "光之化身，守护一切生命",
    "activeSkill": {
      "skillId": "SK_holy_light",
      "name": "圣光审判",
      "description": "对所有敌人造成120%伤害，同时治疗全体友军20%最大生命值",
      "type": "damage_heal",
      "targetType": "all_enemies",
      "targetTeam": "enemy",
      "multiplier": 1.2,
      "cooldown": 5,
      "animation": "holy",
      "particle": "light"
    },
    "passiveSkill": {
      "id": "PS_rebirth",
      "name": "涅槃重生",
      "description": "死亡后以30%生命值复活一次",
      "type": "rebirth",
      "icon": "✨"
    }
  }
]
```

---

## 七、BattleSystem 集成修改

在现有 `BattleSystem.js` 中需要修改以下逻辑以支持随从卡：

### 7.1 修改 `executeAutoTurn()` — 加入被动技能回合开始触发

在 `processBuffs()` 之后、角色行动之前，插入被动技能处理：

```javascript
// 在 executeAutoTurn() 中，processBuffs 之后添加：
// ===== 处理随从卡被动技能（回合开始） =====
this.processPassiveSkills(this.playerTeam, 'turn_start', this.playerTeam, this.enemyTeam);
this.processPassiveSkills(this.enemyTeam, 'turn_start', this.enemyTeam, this.playerTeam);
```

### 7.2 新增 `processPassiveSkills()` 方法

```javascript
/**
 * 处理所有随从卡的被动技能
 * @param {Array} team - 当前队伍
 * @param {string} eventType - 事件类型
 * @param {Array} allies - 友军列表
 * @param {Array} enemies - 敌军列表
 */
processPassiveSkills(team, eventType, allies, enemies) {
  for (const entity of team) {
    if (entity.isDead || !entity.isMinionCard || !entity.passiveSkill) continue;

    const context = {
      eventType,
      source: entity,
      target: null,
      damage: 0
    };

    if (entity.passiveSkill.canTrigger(context)) {
      const result = entity.passiveSkill.execute(context, allies, enemies);

      // 处理被动效果结果
      if (result.damage > 0) {
        this.addBattleLog(`[被动] ${entity.passiveSkill.name}`, `造成 ${result.damage} 伤害`);
      }
      if (result.healing > 0) {
        this.addBattleLog(`[被动] ${entity.passiveSkill.name}`, `恢复 ${result.healing} 生命`);
      }

      // 输出被动消息
      for (const msg of result.messages) {
        this.addBattleLog(`[被动]`, msg);
      }

      this.emit('onPassiveTrigger', { entity, passive: entity.passiveSkill, result });
    }

    // 变异体种族天赋：每回合恢复
    if (entity.getMutantRegen() > 0) {
      const regenAmount = Math.floor(entity.maxHp * entity.getMutantRegen());
      entity.heal(regenAmount);
      this.addBattleLog(`[种族天赋]`, `${entity.name} 恢复了 ${regenAmount} 点生命`);
    }
  }
}
```

### 7.3 修改 `executePlayerAttack()` — 攻击后触发被动

在攻击命中后、返回前，插入：

```javascript
// 在 executePlayerAttack() 的 damage 计算后添加：
// ===== 攻击后触发随从卡被动 =====
if (attacker.isMinionCard && attacker.passiveSkill) {
  const passiveContext = {
    eventType: 'attack',
    source: attacker,
    target: target,
    damage: finalDamage
  };

  if (attacker.passiveSkill.canTrigger(passiveContext)) {
    const passiveResult = attacker.passiveSkill.execute(
      passiveContext,
      this.playerTeam,
      this.enemyTeam
    );
    for (const msg of passiveResult.messages) {
      this.addBattleLog(`[被动]`, msg);
    }
    this.emit('onPassiveTrigger', { entity: attacker, passive: attacker.passiveSkill, result: passiveResult });
  }

  // 剧毒之触
  if (attacker.hasPoisonTouch() && !target.isDead) {
    target.addDebuff({
      id: 'poison_touch_' + attacker.passiveSkill.id,
      type: 'poison',
      value: attacker.passiveSkill.value,
      duration: attacker.passiveSkill.duration || 3
    });
    this.addBattleLog(`[被动]`, `${attacker.name} 的剧毒之触触发，${target.name} 中毒了`);
  }
}

// ===== 受伤后触发被动 =====
if (target.isMinionCard && target.passiveSkill) {
  const defendContext = {
    eventType: 'damage_taken',
    source: target,
    target: attacker,
    damage: finalDamage
  };

  if (target.passiveSkill.canTrigger(defendContext)) {
    const passiveResult = target.passiveSkill.execute(
      defendContext,
      this.playerTeam.includes(target) ? this.playerTeam : this.enemyTeam,
      this.playerTeam.includes(target) ? this.enemyTeam : this.playerTeam
    );
    for (const msg of passiveResult.messages) {
      this.addBattleLog(`[被动]`, msg);
    }
    this.emit('onPassiveTrigger', { entity: target, passive: target.passiveSkill, result: passiveResult });
  }
}

// ===== 击杀触发被动 =====
if (target.isDead && attacker.isMinionCard && attacker.passiveSkill) {
  const killContext = {
    eventType: 'kill',
    source: attacker,
    target: target,
    damage: finalDamage
  };

  if (attacker.passiveSkill.canTrigger(killContext)) {
    const passiveResult = attacker.passiveSkill.execute(
      killContext,
      this.playerTeam,
      this.enemyTeam
    );
    for (const msg of passiveResult.messages) {
      this.addBattleLog(`[被动]`, msg);
    }
    this.emit('onPassiveTrigger', { entity: attacker, passive: attacker.passiveSkill, result: passiveResult });
  }
}
```

### 7.4 修改 `selectTarget()` — 嘲讽判定

在 `selectTarget()` 方法中，优先选择有嘲讽的敌人：

```javascript
selectTarget(targets) {
  if (targets.length === 0) return null;

  // 优先攻击有嘲讽的随从
  const tauntTargets = targets.filter(t => t.isMinionCard && t.hasTaunt());
  if (tauntTargets.length > 0) {
    return tauntTargets[Math.floor(Math.random() * tauntTargets.length)];
  }

  // 原有逻辑...
  if (targets.length === 1) return targets[0];
  // ...（保持原有权重选择逻辑不变）
}
```

### 7.5 修改 `processBuffs()` — 机械免疫判定

在处理中毒和眩晕时，检查机械免疫：

```javascript
// 在 processBuffs() 中，处理 POISON 和 STUN 时添加判定：
if (buff.type === BuffType.POISON) {
  // 机械种族免疫中毒
  if (entity.isMinionCard && entity.isMechImmune()) continue;
  // ...原有中毒逻辑
}

if (buff.type === BuffType.STUN) {
  // 机械种族免疫眩晕
  if (entity.isMinionCard && entity.isMechImmune()) continue;
  // ...原有眩晕逻辑
}
```

### 7.6 修改 `executeAutoTurn()` — 风怒额外攻击

在角色行动完成后，检查风怒：

```javascript
// 在 executeAutoTurn() 中，角色行动完成后添加：
if (playerToAct && playerToAct.isMinionCard && playerToAct.hasWindfury() && !playerToAct._windfuryUsed) {
  playerToAct._windfuryUsed = true;
  // 执行第二次攻击
  this.executeCharacterAction(playerToAct, () => {
    setTimeout(() => {
      this.executeEnemyTurn();
    }, 300 / this.battleSpeed);
  });
  return;  // 跳过正常的敌方回合调用
}
```

### 7.7 修改 `setPlayerTeam()` — 支持 MinionCard

```javascript
setPlayerTeam(characters) {
  this.playerTeam = characters.map(char => {
    // 如果已经是 Character/MinionCard 实例，直接使用
    if (char instanceof Character) {
      char.isDead = false;
      return char;
    }
    // 如果是 MinionCard 数据（含 isMinionCard 或 rarity 字段），创建 MinionCard
    if (char.rarity || char.isMinionCard) {
      const MinionCard = require('../entities/MinionCard.js').default;
      const minion = new MinionCard(char);
      minion.isDead = false;
      return minion;
    }
    // 否则创建普通 Character
    const newChar = new Character(char);
    newChar.isDead = false;
    return newChar;
  });
}
```

### 7.8 修改 `initialize()` — 重置随从卡状态

```javascript
initialize() {
  this.currentPhase = BattlePhase.IDLE;
  this.battleLog = [];

  this.playerTeam.forEach(char => {
    char.isDead = false;
    // 重置随从卡特有状态
    if (char.isMinionCard) {
      char._hasRebirthed = false;
      char._windfuryUsed = false;
      if (char.passiveSkill) {
        char.passiveSkill.triggered = false;
        char.passiveSkill.isActive = true;
      }
    }
  });

  this.enemyTeam.forEach(enemy => {
    enemy.isDead = false;
    if (enemy.isMinionCard) {
      enemy._hasRebirthed = false;
      enemy._windfuryUsed = false;
      if (enemy.passiveSkill) {
        enemy.passiveSkill.triggered = false;
        enemy.passiveSkill.isActive = true;
      }
    }
  });
}
```

---

## 八、随从卡 UI 界面设计

### 8.1 卡牌视觉规格

```
┌─────────────────────────┐
│  [品质边框 - 圆角12px]    │
│  ┌───────────────────┐  │
│  │  ★★★ 品质星级      │  │  ← 顶部：品质星级 + 元素图标
│  │  🔥 火属性         │  │
│  ├───────────────────┤  │
│  │                   │  │
│  │   ┌───────────┐   │  │  ← 中部：立绘区域（占卡面60%）
│  │   │           │   │  │     背景色 #1a1815
│  │   │  立绘图片  │   │  │     稀有度以上有光效边框
│  │   │           │   │  │
│  │   └───────────┘   │  │
│  │                   │  │
│  ├───────────────────┤  │
│  │  炎魔卫士    Lv.1  │  │  ← 名称 + 等级
│  │  🧑 人类           │  │  ← 种族图标
│  ├───────────────────┤  │
│  │  ❤️ 800/800       │  │  ← 生命值条（绿色渐变）
│  │  ⚔️ 45            │  │  ← 攻击力
│  ├───────────────────┤  │
│  │  主动：烈焰斩 ⏱3  │  │  ← 主动技能名称 + 冷却
│  │  被动：灼烧光环 ✦  │  │  ← 被动技能名称 + 图标
│  └───────────────────┘  │
└─────────────────────────┘
```

### 8.2 卡牌尺寸（适配 375×812 分辨率）

| 元素 | 尺寸 | 说明 |
|------|------|------|
| 卡牌总宽 | 160px | 战斗中展示用 |
| 卡牌总高 | 240px | |
| 立绘区域 | 140×90px | 居中，圆角4px |
| 品质边框 | 2px | 颜色根据 RarityConfig.borderColor |
| 生命条 | 130×10px | 绿色渐变 #6abd6a → #51cf66 |
| 攻击力图标 | 16px | ⚔️ emoji |
| 技能文字 | 11px | Noto Sans SC |
| 卡牌圆角 | 12px | |

### 8.3 品质视觉效果

| 品质 | 边框颜色 | 特效 |
|------|----------|------|
| 普通 | #8a7a6a（灰色） | 无 |
| 稀有 | #4dabf7（蓝色） | 边框微弱发光 |
| 史诗 | #9775fa（紫色） | 边框发光 + 角落粒子 |
| 传说 | #ffd700（金色） | 边框强发光 + 流动粒子 + 卡牌呼吸缩放动画 |

### 8.4 `createMinionCard()` UI 方法

在 `BattleScene.js` 中新增随从卡渲染方法：

```javascript
/**
 * 创建随从卡 UI 容器
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @param {MinionCard} minion - 随从卡实例
 * @returns {Phaser.GameObjects.Container}
 */
createMinionCard(x, y, minion) {
  const container = this.add.container(x, y);
  const { colors } = this.config;
  const cardWidth = 160;
  const cardHeight = 240;
  const rarityConfig = minion.getRarityConfig();
  const elementConfig = minion.getElementConfig();
  const raceConfig = minion.getRaceConfig();

  // ===== 1. 卡牌背景 =====
  const bg = this.add.graphics();
  bg.fillStyle(0x2a2520, 0.95);
  bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
  // 品质边框
  bg.lineStyle(2, rarityConfig.borderColor, 0.9);
  bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
  container.add(bg);

  // ===== 2. 品质光效（稀有及以上） =====
  if (rarityConfig.glowColor) {
    const glowBg = this.add.graphics();
    glowBg.lineStyle(4, rarityConfig.glowColor, 0.3);
    glowBg.strokeRoundedRect(-cardWidth / 2 - 2, -cardHeight / 2 - 2, cardWidth + 4, cardHeight + 4, 14);
    container.add(glowBg);

    // 传说品质：呼吸动画
    if (minion.rarity === 'legendary') {
      this.tweens.add({
        targets: glowBg,
        alpha: { from: 0.3, to: 0.8 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  // ===== 3. 顶部信息区 =====
  const rarityStars = this._getRarityStars(minion.rarity);
  const topInfo = this.add.text(0, -cardHeight / 2 + 15, rarityStars, {
    fontSize: '10px',
    color: '#ffd700'
  }).setOrigin(0.5);
  container.add(topInfo);

  // 元素图标
  const elementIcon = elementConfig
    ? this.add.text(cardWidth / 2 - 18, -cardHeight / 2 + 12, elementConfig.icon, { fontSize: '14px' }).setOrigin(0.5)
    : null;
  if (elementIcon) container.add(elementIcon);

  // ===== 4. 立绘区域 =====
  const portraitX = -cardWidth / 2 + 10;
  const portraitY = -cardHeight / 2 + 35;
  const portraitW = cardWidth - 20;
  const portraitH = 90;

  const portraitBg = this.add.graphics();
  portraitBg.fillStyle(0x1a1815, 1);
  portraitBg.fillRoundedRect(portraitX, portraitY, portraitW, portraitH, 4);
  portraitBg.lineStyle(1, colors.border, 0.3);
  portraitBg.strokeRoundedRect(portraitX, portraitY, portraitW, portraitH, 4);
  container.add(portraitBg);

  // 立绘图片（如果资源存在）
  if (minion.portrait) {
    this.load.image(minion.id + '_portrait', `assets/images/${minion.portrait}`);
    this.load.once('complete', () => {
      const portrait = this.add.image(0, portraitY + portraitH / 2, minion.id + '_portrait')
        .setDisplaySize(portraitW - 4, portraitH - 4);
      container.add(portrait);
      // 调整层级，确保在背景之上
      portrait.setDepth(1);
    });
    this.load.start();
  } else {
    // 无立绘时显示占位符
    const placeholder = this.add.text(0, portraitY + portraitH / 2, raceConfig.icon, {
      fontSize: '36px'
    }).setOrigin(0.5);
    container.add(placeholder);
  }

  // ===== 5. 名称 + 种族 =====
  const nameY = portraitY + portraitH + 15;
  const nameText = this.add.text(0, nameY, minion.name, {
    fontSize: '13px',
    fontFamily: 'Noto Sans SC',
    fontStyle: 'bold',
    color: colors.textPrimary
  }).setOrigin(0.5);
  container.add(nameText);

  const raceText = this.add.text(0, nameY + 16, `${raceConfig.icon} ${raceConfig.name}`, {
    fontSize: '10px',
    fontFamily: 'Noto Sans SC',
    color: colors.textSecondary
  }).setOrigin(0.5);
  container.add(raceText);

  // ===== 6. 生命值条 =====
  const hpBarY = nameY + 32;
  const hpBarBg = this.add.graphics();
  hpBarBg.fillStyle(0x1a1815, 1);
  hpBarBg.fillRoundedRect(-cardWidth / 2 + 15, hpBarY, cardWidth - 30, 10, 3);
  container.add(hpBarBg);

  const hpBar = this.add.graphics();
  const hpPercent = minion.hp / minion.maxHp;
  hpBar.fillStyle(colors.hpGreen, 1);
  hpBar.fillRoundedRect(-cardWidth / 2 + 16, hpBarY + 1, (cardWidth - 32) * hpPercent, 8, 2);
  container.add(hpBar);

  const hpText = this.add.text(0, hpBarY + 5, `${minion.hp}/${minion.maxHp}`, {
    fontSize: '8px',
    fontFamily: 'Noto Sans SC',
    color: '#ffffff'
  }).setOrigin(0.5);
  container.add(hpText);

  // ===== 7. 攻击力 =====
  const atkText = this.add.text(0, hpBarY + 18, `⚔️ ${minion.atk}`, {
    fontSize: '11px',
    fontFamily: 'Noto Sans SC',
    color: colors.textSecondary
  }).setOrigin(0.5);
  container.add(atkText);

  // ===== 8. 技能信息 =====
  const skillY = hpBarY + 34;

  // 主动技能
  if (minion.skills && minion.skills.length > 0) {
    const activeSkill = minion.skills[0];
    const activeText = this.add.text(-cardWidth / 2 + 15, skillY, `主动：${activeSkill.name}`, {
      fontSize: '10px',
      fontFamily: 'Noto Sans SC',
      color: '#9b59b6'
    });
    container.add(activeText);

    const cdText = this.add.text(cardWidth / 2 - 15, skillY, `⏱${activeSkill.cooldown}`, {
      fontSize: '9px',
      fontFamily: 'Noto Sans SC',
      color: colors.textSecondary
    }).setOrigin(1, 0);
    container.add(cdText);
  }

  // 被动技能
  if (minion.passiveSkill) {
    const passiveText = this.add.text(-cardWidth / 2 + 15, skillY + 14,
      `被动：${minion.passiveSkill.icon} ${minion.passiveSkill.name}`, {
      fontSize: '10px',
      fontFamily: 'Noto Sans SC',
      color: '#27ae60'
    });
    container.add(passiveText);
  }

  // ===== 存储引用用于动态更新 =====
  container.setData('minion', minion);
  container.setData('hpBar', hpBar);
  container.setData('hpText', hpText);
  container.setData('cardWidth', cardWidth);

  return container;
}

/**
 * 获取品质星级文本
 */
_getRarityStars(rarity) {
  const starMap = {
    'common': '★',
    'rare': '★★',
    'epic': '★★★',
    'legendary': '★★★★'
  };
  return starMap[rarity] || '★';
}

/**
 * 更新随从卡 HP 显示
 */
updateMinionCardHP(container) {
  const minion = container.getData('minion');
  const hpBar = container.getData('hpBar');
  const hpText = container.getData('hpText');
  const cardWidth = container.getData('cardWidth');

  if (!minion || !hpBar || !hpText) return;

  hpBar.clear();
  const hpPercent = Math.max(0, minion.hp / minion.maxHp);
  hpBar.fillStyle(0x6abd6a, 1);
  hpBar.fillRoundedRect(-cardWidth / 2 + 16, hpBar.y + 1, (cardWidth - 32) * hpPercent, 8, 2);
  hpText.setText(`${Math.max(0, minion.hp)}/${minion.maxHp}`);
}
```

### 8.5 被动技能触发 UI 特效

```javascript
/**
 * 显示被动技能触发特效
 * @param {Phaser.GameObjects.Container} cardContainer - 随从卡容器
 * @param {PassiveSkill} passive - 被动技能
 */
showPassiveTriggerEffect(cardContainer, passive) {
  const x = cardContainer.x;
  const y = cardContainer.y;

  // 被动名称弹出
  const passiveText = this.add.text(x, y - 130, `${passive.icon} ${passive.name}`, {
    fontSize: '14px',
    fontFamily: 'Noto Sans SC',
    fontStyle: 'bold',
    color: '#27ae60',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5);

  // 光环扩散效果
  const ring = this.add.graphics();
  ring.lineStyle(2, 0x27ae60, 0.8);
  ring.strokeCircle(x, y, 10);

  this.tweens.add({
    targets: ring,
    scaleX: 3,
    scaleY: 3,
    alpha: 0,
    duration: 600,
    ease: 'Power2',
    onComplete: () => ring.destroy()
  });

  this.tweens.add({
    targets: passiveText,
    y: passiveText.y - 25,
    alpha: 0,
    duration: 800,
    ease: 'Power2',
    onComplete: () => passiveText.destroy()
  });
}

/**
 * 显示圣盾破碎特效
 */
showDivineShieldBreakEffect(cardContainer) {
  const x = cardContainer.x;
  const y = cardContainer.y;

  // 碎片粒子
  for (let i = 0; i < 8; i++) {
    const particle = this.add.graphics();
    particle.fillStyle(0x74c0fc, 0.9);
    particle.fillCircle(0, 0, 3);
    particle.x = x;
    particle.y = y;

    const angle = (Math.PI * 2 / 8) * i;
    const distance = 40 + Math.random() * 20;

    this.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => particle.destroy()
    });
  }

  const shieldText = this.add.text(x, y - 100, '🔰 护盾破碎!', {
    fontSize: '12px',
    fontFamily: 'Noto Sans SC',
    fontStyle: 'bold',
    color: '#74c0fc'
  }).setOrigin(0.5);

  this.tweens.add({
    targets: shieldText,
    y: shieldText.y - 20,
    alpha: 0,
    duration: 600,
    onComplete: () => shieldText.destroy()
  });
}

/**
 * 显示重生特效
 */
showRebirthEffect(cardContainer) {
  const x = cardContainer.x;
  const y = cardContainer.y;

  // 金色光芒
  const glow = this.add.graphics();
  glow.fillStyle(0xffd700, 0.5);
  glow.fillCircle(x, y, 20);

  this.tweens.add({
    targets: glow,
    scaleX: 3,
    scaleY: 3,
    alpha: 0,
    duration: 800,
    ease: 'Power2',
    onComplete: () => glow.destroy()
  });

  const rebirthText = this.add.text(x, y - 100, '✨ 涅槃重生!', {
    fontSize: '14px',
    fontFamily: 'Noto Sans SC',
    fontStyle: 'bold',
    color: '#ffd700',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5);

  this.tweens.add({
    targets: rebirthText,
    y: rebirthText.y - 30,
    alpha: 0,
    duration: 1000,
    onComplete: () => rebirthText.destroy()
  });
}

/**
 * 显示元素克制提示
 */
showElementAdvantageEffect(attackerCard, defenderCard, elementConfig) {
  const x = (attackerCard.x + defenderCard.x) / 2;
  const y = (attackerCard.y + defenderCard.y) / 2;

  const advText = this.add.text(x, y, `${elementConfig.icon} 元素克制!`, {
    fontSize: '16px',
    fontFamily: 'Noto Sans SC',
    fontStyle: 'bold',
    color: '#' + elementConfig.color.toString(16).padStart(6, '0'),
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0.5);

  this.tweens.add({
    targets: advText,
    y: advText.y - 30,
    alpha: 0,
    scale: 1.3,
    duration: 800,
    ease: 'Power2',
    onComplete: () => advText.destroy()
  });
}
```

---

## 九、Const.js 新增常量

在 `src/game/data/Const.js` 的 `Const` 对象中新增：

```javascript
// 在 Const 对象中添加：
MINION: {
  CARD_WIDTH: 160,
  CARD_HEIGHT: 240,
  PORTRAIT_WIDTH: 140,
  PORTRAIT_HEIGHT: 90,
  PORTRAIT_RADIUS: 4,
  HP_BAR_HEIGHT: 10,
  HP_BAR_OFFSET_X: 15,
  HP_BAR_OFFSET_Y: 0,
  SKILL_TEXT_SIZE: '10px',
  NAME_TEXT_SIZE: '13px',
  RACE_TEXT_SIZE: '10px'
}
```

---

## 十、Lang.js 新增多语言条目

在 `src/game/data/Lang.js` 中新增：

```javascript
// 随从卡相关多语言
MINION_CARD: {
  RARITY: {
    common: { zh: '普通', en: 'Common' },
    rare: { zh: '稀有', en: 'Rare' },
    epic: { zh: '史诗', en: 'Epic' },
    legendary: { zh: '传说', en: 'Legendary' }
  },
  ELEMENT: {
    fire: { zh: '火', en: 'Fire' },
    ice: { zh: '冰', en: 'Ice' },
    thunder: { zh: '雷', en: 'Thunder' },
    dark: { zh: '暗', en: 'Dark' },
    light: { zh: '光', en: 'Light' }
  },
  RACE: {
    human: { zh: '人类', en: 'Human' },
    mech: { zh: '机械', en: 'Mech' },
    mutant: { zh: '变异体', en: 'Mutant' },
    energy: { zh: '能量体', en: 'Energy' },
    beast: { zh: '野兽', en: 'Beast' }
  },
  PASSIVE_TRIGGER: { zh: '被动触发', en: 'Passive Triggered' },
  DIVINE_SHIELD_BREAK: { zh: '护盾破碎!', en: 'Shield Broken!' },
  REBIRTH: { zh: '涅槃重生!', en: 'Rebirth!' },
  ELEMENT_ADVANTAGE: { zh: '元素克制!', en: 'Element Advantage!' },
  ACTIVE_SKILL: { zh: '主动', en: 'Active' },
  PASSIVE_SKILL: { zh: '被动', en: 'Passive' }
}
```

---

## 十一、实现检查清单

完成实现后，请逐项验证：

- [ ] `MinionConfig.js` — 品质/元素/种族枚举与配置完整
- [ ] `PassiveSkill.js` — 3类被动（光环/触发/状态）均可正确触发
- [ ] `MinionCard.js` — 继承 Character，新增属性正确初始化
- [ ] `minions.json` — 5张示例随从卡数据完整
- [ ] `BattleSystem.js` — 被动技能在正确时机触发（回合开始/攻击/受伤/击杀）
- [ ] `BattleSystem.js` — 嘲讽强制选中、风怒二次攻击、圣盾免伤、重生复活
- [ ] `BattleSystem.js` — 元素克制伤害倍率正确计算
- [ ] `BattleSystem.js` — 机械免疫中毒和眩晕
- [ ] `BattleSystem.js` — 变异体每回合回复生命
- [ ] `BattleScene.js` — 随从卡 UI 正确渲染（品质边框、立绘、属性、技能信息）
- [ ] `BattleScene.js` — 品质光效和传说呼吸动画
- [ ] `BattleScene.js` — 被动触发/圣盾破碎/重生/元素克制 特效显示
- [ ] `Const.js` — 随从卡常量已添加
- [ ] `Lang.js` — 随从卡多语言已添加
- [ ] 所有新增监听器在 `shutdown()` 中正确清理
- [ ] 无硬编码，常量统一使用 `Const.js`
