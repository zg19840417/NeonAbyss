import Character from '../entities/Character.js';
import Skill from './Skill.js';
import { BuffType } from './BuffSystem.js';
import ChipCardManager from './ChipCardManager.js';
import { getElementMultiplier } from '../data/MinionConfig.js';

export const BattlePhase = {
  IDLE: 'idle',
  PLAYER_ATTACK: 'player_attack',
  ENEMY_ATTACK: 'enemy_attack',
  SKILL: 'skill',
  BUFF_PROCESS: 'buff_process',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
  PAUSED: 'paused'
};

export default class BattleSystem {
  constructor(scene, config = {}) {
    this.scene = scene;
    
    this.playerTeam = [];
    this.enemyTeam = [];
    
    this.currentPhase = BattlePhase.IDLE;
    this.battleSpeed = config.battleSpeed || 1;
    
    this.equipmentSkills = [];
    this.chipCardManager = null;
    
    this.listeners = {
      onAttack: [],
      onDamage: [],
      onHeal: [],
      onSkillUse: [],
      onBuffApply: [],
      onBuffRemove: [],
      onCharacterDeath: [],
      onVictory: [],
      onDefeat: [],
      onBattleLog: []
    };
    
    this.battleLog = [];
    this.turnCount = 0;
  }

  createCombatEntity(data = {}) {
    const entity = data instanceof Character ? data : new Character({
      id: data.id,
      name: data.name,
      charClass: data.charClass,
      level: data.level || 1,
      hp: data.maxHp || data.hp,
      currentHp: data.currentHp ?? data.hp ?? data.maxHp,
      skills: data.skills || [],
      equipment: data.equipment || {}
    });

    entity.id = data.id || entity.id;
    entity.name = data.name || entity.name;
    entity.level = data.level || entity.level || 1;
    entity.maxHp = data.maxHp ?? data.hp ?? entity.maxHp;
    entity.currentHp = data.currentHp ?? data.hp ?? data.maxHp ?? entity.currentHp;
    entity.atk = data.atk ?? entity.atk;
    entity.def = data.def ?? entity.def ?? 5;
    entity.spd = data.spd ?? data.baseSpd ?? entity.spd ?? 10;
    entity.critRate = data.critRate ?? entity.critRate ?? 0.1;
    entity.dodgeRate = data.dodgeRate ?? entity.dodgeRate ?? 0.05;
    entity.critDamage = data.critDamage ?? entity.critDamage ?? 1.5;
    entity.damageReduction = data.damageReduction ?? entity.damageReduction ?? 0;
    entity.lifeSteal = data.lifeSteal ?? entity.lifeSteal ?? 0;
    entity.skills = data.skills || entity.skills || [];
    entity.buffs = Array.isArray(data.buffs) ? [...data.buffs] : (entity.buffs || []);
    entity.debuffs = Array.isArray(data.debuffs) ? [...data.debuffs] : (entity.debuffs || []);
    entity.passiveSkill = data.passiveSkill ?? entity.passiveSkill ?? null;
    entity.element = data.element ?? entity.element ?? null;
    entity.race = data.race ?? entity.race ?? null;
    entity.rarity = data.rarity ?? entity.rarity ?? null;
    entity.isFusionGirl = Boolean(data.isFusionGirl || entity.isFusionGirl);
    entity.isBoss = Boolean(data.isBoss || entity.isBoss);
    entity.shieldValue = data.shieldValue ?? entity.shieldValue ?? 0;
    entity.equipmentEffects = Array.isArray(data.equipmentEffects) ? [...data.equipmentEffects] : (entity.equipmentEffects || []);
    entity._hasRebirthed = Boolean(data._hasRebirthed || entity._hasRebirthed);
    entity._windfuryUsed = Boolean(data._windfuryUsed || entity._windfuryUsed);

    return entity;
  }
  
  setPlayerTeam(characters) {
    this.playerTeam = characters.map(char => {
      char = this.createCombatEntity(char);
      char.isDead = false;
      char.currentHp = char.maxHp;
      char.equipmentEffects = [];
      return char;
    });
  }
  
  setEnemyTeam(enemies) {
    this.enemyTeam = enemies.map(enemy => {
      if (!(enemy instanceof Enemy)) {
        enemy = new Enemy(enemy);
      }
      enemy.isDead = false;
      enemy.equipmentEffects = [];
      return enemy;
    });
  }
  
  initialize() {
    this.currentPhase = BattlePhase.IDLE;
    this.battleLog = [];
    this.turnCount = 0;
    this.equipmentSkills = [];
    
    this.playerTeam.forEach(char => {
      char.isDead = false;
      char.currentHp = char.maxHp;
      char.equipmentEffects = [];
      if (char.passiveSkill) {
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
      enemy.currentHp = enemy.maxHp;
      if (enemy.passiveSkill) {
        enemy._hasRebirthed = false;
        enemy._windfuryUsed = false;
        if (enemy.passiveSkill) {
          enemy.passiveSkill.triggered = false;
          enemy.passiveSkill.isActive = true;
        }
      }
    });
    
    this.applyChipCardBonuses();
    this.applyChipSkills();
  }
  
  applyChipCardBonuses() {
    try {
      const chipData = window.gameData?.chipCardManager;
      if (!chipData?.equippedCardId) return;
      
      const manager = ChipCardManager.fromJSON(chipData);
      const equippedCard = manager.equippedCard;
      
      if (!equippedCard) return;
      
      const bonuses = equippedCard.getEffectiveStats();
      
      this.playerTeam.forEach(follower => {
        // [C14 FIX] 先计算加成增量，再分别加到 maxHp 和 currentHp，避免用已修改的 maxHp 计算 currentHp
        const hpBonus = Math.floor(follower.maxHp * (bonuses.hpPercent || 0) / 100);
        const atkBonus = Math.floor(follower.atk * (bonuses.atkPercent || 0) / 100);
        follower.maxHp += hpBonus;
        follower.currentHp += hpBonus;
        follower.atk += atkBonus;
      });
      
      this.equipmentSkills = equippedCard.skills
        .filter(skill => skill.isUnlocked(equippedCard.star))
        .map(skill => {
          const skillCopy = { ...skill };
          skillCopy.currentCooldown = 0;
          return skillCopy;
        });
      
      this.addBattleLog('芯片卡', `【${equippedCard.name}】已生效`);
    } catch (e) {
      console.warn('Failed to apply equipment card bonuses:', e);
    }
  }
  
  applyChipSkills() {
    if (!this.equipmentSkills || this.equipmentSkills.length === 0) return;
    
    this.equipmentSkills.forEach(skill => {
      if (skill.type === 'aura') {
        this.applyChipAura(skill);
      } else if (skill.type === 'modify') {
        this.applyChipModify(skill);
      }
    });
    
    const auraCount = this.equipmentSkills.filter(s => s.type === 'aura').length;
    const modifyCount = this.equipmentSkills.filter(s => s.type === 'modify').length;
    
    if (auraCount > 0 || modifyCount > 0) {
      this.addBattleLog('芯片技能', `光环${auraCount}个 + 改造${modifyCount}个已激活`);
    }
  }
  
  applyChipAura(skill) {
    if (skill.type !== 'aura') return;
    
    const effectiveValue = Math.floor(skill.effectValue * (skill.skillMultiplier || 1));
    
    this.playerTeam.forEach(follower => {
      if (follower.isDead) return;
      
      switch (skill.effectType) {
        case 'atk_boost':
          follower.atk = Math.floor(follower.atk * (1 + effectiveValue / 100));
          break;
        case 'def_boost':
          follower.damageReduction = Math.min((follower.damageReduction || 0) + effectiveValue / 100, 0.9);
          break;
        case 'crit_boost':
          follower.critRate = Math.min((follower.critRate || 0) + effectiveValue / 100, 0.9);
          break;
        case 'dodge_boost':
          follower.dodgeRate = Math.min((follower.dodgeRate || 0) + effectiveValue / 100, 0.9);
          break;
        case 'heal':
          const healAmount = Math.floor(follower.maxHp * effectiveValue / 100);
          follower.currentHp = Math.min(follower.maxHp, follower.currentHp + healAmount);
          break;
        case 'shield':
          follower.shieldValue = (follower.shieldValue || 0) + effectiveValue;
          follower.addBuff?.({
            id: 'equip_shield_' + skill.id,
            type: 'shield',
            value: effectiveValue,
            duration: skill.effectDuration || 999
          });
          break;
        case 'burn':
        case 'poison':
          follower.equipmentEffects = follower.equipmentEffects || [];
          follower.equipmentEffects.push({
            type: skill.effectType,
            value: effectiveValue / 100,
            duration: skill.effectDuration || 3,
            chance: skill.effectChance || 1.0
          });
          break;
        case 'cooldown_reduce':
          follower.cooldownReduce = (follower.cooldownReduce || 0) + effectiveValue;
          break;
      }
    });
  }
  
  applyChipModify(skill) {
    if (skill.type !== 'modify') return;
    
    const effectiveValue = skill.modifyValue || skill.effectValue;
    
    this.playerTeam.forEach(follower => {
      if (!follower.skills || follower.isDead) return;
      
      follower.skills.forEach(followerSkill => {
        if (skill.modifyTarget !== 'all' && followerSkill.id !== skill.modifyTarget) return;
        
        switch (skill.modifyType) {
          case 'damage_x':
            followerSkill.multiplier = (followerSkill.multiplier || 1) * (1 + effectiveValue / 100);
            break;
          case 'cooldown_reduce':
            followerSkill.cooldown = Math.max(1, (followerSkill.cooldown || 0) - effectiveValue);
            break;
          case 'aoe_expand':
            followerSkill.targetCount = (followerSkill.targetCount || 1) + Math.floor(effectiveValue);
            break;
          case 'add_effect':
            followerSkill.additionalEffects = followerSkill.additionalEffects || [];
            followerSkill.additionalEffects.push({
              type: skill.effectType,
              value: effectiveValue,
              chance: skill.effectChance || 1.0,
              duration: skill.effectDuration || 3
            });
            break;
          case 'heal_convert':
            followerSkill.healPercent = (followerSkill.healPercent || 0) + effectiveValue / 100;
            break;
        }
      });
    });
  }
  
  checkChipTriggers(triggerType, context = {}) {
    if (!this.equipmentSkills || this.equipmentSkills.length === 0) return;
    
    const triggerConditions = {
      'on_crit': context.isCrit === true,
      'on_dodge': context.isDodged === true,
      'on_attack': context.isAttacking === true,
      'on_death': context.targetDied === true,
      'on_low_hp': (context.targetHpPercent || 1) < 0.3,
      'on_low_hp_50': (context.targetHpPercent || 1) < 0.5,
      'turn_start': triggerType === 'turn_start',
      'battle_start': triggerType === 'battle_start'
    };
    
    this.equipmentSkills.forEach(skill => {
      if (skill.type !== 'trigger') return;
      if (skill.currentCooldown > 0) return;
      if (skill.unlockStar > (context.equipStar || 5)) return;
      
      const shouldTrigger = triggerConditions[skill.triggerCondition];
      if (shouldTrigger) {
        const chance = skill.effectChance || 1.0;
        if (Math.random() <= chance) {
          this.executeChipTrigger(skill, context);
          skill.currentCooldown = skill.triggerCooldown || 0;
        }
      }
    });
  }
  
  executeChipTrigger(skill, context = {}) {
    const effectiveValue = Math.floor(skill.effectValue * (skill.skillMultiplier || 1));
    
    switch (skill.effectType) {
      case 'heal':
        this.playerTeam.forEach(follower => {
          if (!follower.isDead) {
            const healAmount = Math.floor(follower.maxHp * effectiveValue / 100);
            follower.currentHp = Math.min(follower.maxHp, follower.currentHp + healAmount);
          }
        });
        this.addBattleLog('芯片触发', `【${skill.name}】全队恢复${effectiveValue}%生命`);
        this.emit('onBattleLog', { action: '芯片触发', result: `【${skill.name}】全队恢复${effectiveValue}%生命` });
        break;
        
      case 'atk_boost':
        this.playerTeam.forEach(follower => {
          if (!follower.isDead) {
            follower.addBuff?.({
              id: 'equip_atk_' + skill.id,
              type: 'atk_up',
              value: effectiveValue / 100,
              duration: skill.effectDuration || 2
            });
          }
        });
        this.addBattleLog('芯片触发', `【${skill.name}】全队攻击+${effectiveValue}%`);
        this.emit('onBattleLog', { action: '芯片触发', result: `【${skill.name}】攻击提升` });
        break;
        
      case 'shield':
        this.playerTeam.forEach(follower => {
          if (!follower.isDead) {
            follower.shieldValue = (follower.shieldValue || 0) + effectiveValue;
            follower.addBuff?.({
              id: 'equip_shield_trig_' + skill.id,
              type: 'shield',
              value: effectiveValue,
              duration: skill.effectDuration || 2
            });
          }
        });
        this.addBattleLog('芯片触发', `【${skill.name}】全队获得护盾`);
        this.emit('onBattleLog', { action: '芯片触发', result: `【${skill.name}】护盾生成` });
        break;
        
      case 'burn':
      case 'poison':
        if (context.targets && context.targets.length > 0) {
          context.targets.forEach(target => {
            if (!target.isDead) {
              target.addDebuff?.({
                id: skill.effectType + '_equip_' + Date.now(),
                type: skill.effectType,
                value: effectiveValue / 100,
                duration: skill.effectDuration || 3
              });
            }
          });
          this.addBattleLog('芯片触发', `【${skill.name}】使敌人${skill.effectType === 'burn' ? '灼烧' : '中毒'}`);
        }
        break;
        
      case 'freeze':
        if (context.targets && context.targets.length > 0) {
          context.targets.forEach(target => {
            if (!target.isDead) {
              target.addDebuff?.({
                id: 'stun_equip_' + Date.now(),
                type: 'stun',
                value: 0,
                duration: skill.effectDuration || 1
              });
            }
          });
          this.addBattleLog('芯片触发', `【${skill.name}】使敌人眩晕`);
        }
        break;
    }
  }
  
  applyOnHitChipEffects(attacker, target) {
    if (!attacker.equipmentEffects || attacker.equipmentEffects.length === 0) return;
    
    attacker.equipmentEffects.forEach(effect => {
      if (Math.random() > (effect.chance || 1)) return;
      
      if (effect.type === 'burn' || effect.type === 'poison') {
        target.addDebuff?.({
          id: effect.type + '_' + Date.now(),
          type: effect.type,
          value: effect.value,
          duration: effect.duration || 3
        });
        this.addBattleLog('芯片效果', `${target.name} 受到${effect.type === 'burn' ? '灼烧' : '中毒'}`);
      }
    });
  }
  
  startBattle() {
    this.initialize();
    this.checkChipTriggers('battle_start');
    this.executeAutoBattle();
  }
  
  executeAutoBattle() {
    if (this.currentPhase === BattlePhase.PAUSED) return;
    if (this.isBattleEnded()) return;
    
    const alivePlayers = this.playerTeam.filter(c => !c.isDead);
    const aliveEnemies = this.enemyTeam.filter(e => !e.isDead);
    
    if (alivePlayers.length === 0) {
      this.endBattle(false);
      return;
    }
    
    if (aliveEnemies.length === 0) {
      this.endBattle(true);
      return;
    }
    
    this.executeAutoTurn();
  }
  
  executeAutoTurn() {
    this.turnCount++;
    
    const alivePlayers = this.playerTeam.filter(c => !c.isDead);
    const aliveEnemies = this.enemyTeam.filter(e => !e.isDead);
    
    if (alivePlayers.length === 0 || aliveEnemies.length === 0) {
      this.executeAutoBattle();
      return;
    }
    
    this.checkChipTriggers('turn_start');
    this.processPassiveSkills(this.playerTeam, 'turn_start', this.playerTeam, this.enemyTeam);
    this.processPassiveSkills(this.enemyTeam, 'turn_start', this.enemyTeam, this.playerTeam);
    this.processBuffs(this.playerTeam);
    this.processBuffs(this.enemyTeam);
    
    const playerToAct = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    if (playerToAct && !this.hasBuff(playerToAct, BuffType.STUN)) {
      const availableSkill = this.tryUseSkill(playerToAct);
      if (availableSkill) {
        this.currentPhase = BattlePhase.SKILL;
        this.executeSkillAction(playerToAct, availableSkill, () => {
          this.decrementChipSkillCooldowns();
          setTimeout(() => {
            this.executeEnemyTurn();
          }, 200 / this.battleSpeed);
        });
        return;
      }
    }
    
    if (playerToAct) {
      this.currentPhase = BattlePhase.PLAYER_ATTACK;
      this.executeCharacterAction(playerToAct, () => {
        this.decrementChipSkillCooldowns();

        // Windfury: second attack if available
        if (playerToAct.hasWindfury && playerToAct.hasWindfury() && !playerToAct._windfuryUsed && !playerToAct.isDead) {
          playerToAct._windfuryUsed = true;
          setTimeout(() => {
            this.executeCharacterAction(playerToAct, () => {
              setTimeout(() => {
                this.executeEnemyTurn();
              }, 300 / this.battleSpeed);
            });
          }, 200 / this.battleSpeed);
        } else {
          setTimeout(() => {
            this.executeEnemyTurn();
          }, 300 / this.battleSpeed);
        }
      });
    } else {
      this.decrementChipSkillCooldowns();
      this.executeEnemyTurn();
    }
  }
  
  decrementChipSkillCooldowns() {
    if (!this.equipmentSkills) return;
    this.equipmentSkills.forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--;
      }
    });
  }
  
  hasBuff(entity, buffType) {
    return entity.buffs?.some(b => b.type === buffType) || false;
  }
  
  // BUG6 FIX: 添加可选的target参数
  processPassiveSkills(team, eventType, allies, enemies, target = null) {
    for (const entity of team) {
      if (entity.isDead || !entity.passiveSkill) continue;

      const context = {
        eventType,
        source: entity,
        target: target,
        damage: 0
      };

      if (entity.passiveSkill.canTrigger(context)) {
        const result = entity.passiveSkill.execute(context, allies, enemies);

        if (result.damage > 0) {
          this.addBattleLog(`[被动] ${entity.passiveSkill.name}`, `造成 ${result.damage} 伤害`);
        }
        if (result.healing > 0) {
          this.addBattleLog(`[被动] ${entity.passiveSkill.name}`, `恢复 ${result.healing} 生命`);
        }

        for (const msg of result.messages) {
          this.addBattleLog(`[被动]`, msg);
        }

        this.emit('onPassiveTrigger', { entity, passive: entity.passiveSkill, result });
      }

      if (entity.getMutantRegen() > 0) {
        const regenAmount = Math.floor(entity.maxHp * entity.getMutantRegen());
        entity.currentHp = Math.min(entity.maxHp, entity.currentHp + regenAmount);
        this.addBattleLog(`[种族天赋]`, `${entity.name} 恢复了 ${regenAmount} 点生命`);
      }
    }
  }

  processAllyDeathPassiveSkills(deadCharacter, allies, enemies) {
    for (const entity of allies) {
      if (entity.isDead || !entity.passiveSkill) continue;
      if (entity.passiveSkill.type !== 'on_ally_death') continue;

      const context = {
        eventType: 'ally_death',
        source: entity,
        target: deadCharacter,
        damage: 0
      };

      if (entity.passiveSkill.canTrigger(context)) {
        const result = entity.passiveSkill.execute(context, allies, enemies);
        for (const msg of result.messages) {
          this.addBattleLog(`[被动]`, msg);
        }
        this.emit('onPassiveTrigger', { entity, passive: entity.passiveSkill, result });
      }
    }
  }
  
  processBuffs(team) {
    for (const entity of team) {
      if (!entity.buffs) entity.buffs = [];
      
      for (let i = entity.buffs.length - 1; i >= 0; i--) {
        const buff = entity.buffs[i];
        
        if (buff.type === BuffType.POISON) {
          if (entity.isMechImmune?.()) continue;
          const poisonDamage = Math.floor(buff.value * entity.maxHp);
          entity.currentHp = Math.max(0, entity.currentHp - poisonDamage);
          this.addBattleLog(`${entity.name} 受到中毒伤害`, `-${poisonDamage}`);
          this.emit('onDamage', { target: entity, damage: poisonDamage, isCrit: false, isPlayer: this.playerTeam.includes(entity) });
          
          if (entity.currentHp <= 0) {
            entity.isDead = true;
            this.emit('onCharacterDeath', { character: entity, isPlayer: this.playerTeam.includes(entity) });
            if (this.playerTeam.includes(entity)) {
              this.processAllyDeathPassiveSkills(entity, this.playerTeam, this.enemyTeam);
            } else {
              this.processAllyDeathPassiveSkills(entity, this.enemyTeam, this.playerTeam);
            }
          }
        }
        
        if (buff.type === BuffType.STUN) {
          if (entity.isMechImmune?.()) {
            entity.buffs.splice(i, 1);
            this.addBattleLog(`[免疫]`, `${entity.name} 机械种族免疫眩晕`);
            continue;
          }
        }
        
        if (buff.type === BuffType.REGEN) {
          const healAmount = Math.floor(buff.value * entity.maxHp);
          entity.currentHp = Math.min(entity.maxHp, entity.currentHp + healAmount);
          this.addBattleLog(`${entity.name} 恢复生命`, `+${healAmount}`);
          this.emit('onHeal', { target: entity, amount: healAmount });
        }
        
        buff.duration--;
        if (buff.duration <= 0) {
          entity.buffs.splice(i, 1);
          this.emit('onBuffRemove', { entity, buff });
        }
      }

      // BUG4 FIX: Process debuffs (poison, stun, etc.)
      if (entity.debuffs && entity.debuffs.length > 0) {
        for (let i = entity.debuffs.length - 1; i >= 0; i--) {
          const debuff = entity.debuffs[i];

          if (debuff.type === BuffType.POISON) {
            if (entity.isMechImmune?.()) continue;
            const poisonDamage = Math.floor(debuff.value * entity.maxHp);
            entity.currentHp = Math.max(0, entity.currentHp - poisonDamage);
            this.addBattleLog(`${entity.name} 受到中毒伤害`, `-${poisonDamage}`);
            this.emit('onDamage', { target: entity, damage: poisonDamage, isCrit: false, isPlayer: this.playerTeam.includes(entity) });

            if (entity.currentHp <= 0) {
              entity.isDead = true;
              this.emit('onCharacterDeath', { character: entity, isPlayer: this.playerTeam.includes(entity) });
              if (this.playerTeam.includes(entity)) {
                this.processAllyDeathPassiveSkills(entity, this.playerTeam, this.enemyTeam);
              } else {
                this.processAllyDeathPassiveSkills(entity, this.enemyTeam, this.playerTeam);
              }
            }
          }

          if (debuff.type === BuffType.STUN) {
            if (entity.isMechImmune?.()) {
              entity.debuffs.splice(i, 1);
              this.addBattleLog(`[免疫]`, `${entity.name} 机械种族免疫眩晕`);
              continue;
            }
          }

          debuff.remainingDuration--;
          if (debuff.remainingDuration <= 0) {
            entity.debuffs.splice(i, 1);
          }
        }
      }
    }
  }
  
  // BUG8 FIX: 将新创建的Skill实例保存回character.skills数组以保持冷却状态
  tryUseSkill(character) {
    if (!character.skills || character.skills.length === 0) return null;

    for (let i = 0; i < character.skills.length; i++) {
      let skill = character.skills[i];
      if (!(skill instanceof Skill)) {
        skill = new Skill(skill);
        character.skills[i] = skill; // 保存实例以保持冷却状态
      }

      const aliveEnemies = this.enemyTeam.filter(e => !e.isDead);
      const targets = skill.targetTeam === 'enemy' ? aliveEnemies : this.playerTeam.filter(p => !p.isDead);

      const canUse = skill.canUse(character, targets);
      if (canUse.canUse) {
        return skill;
      }
    }
    return null;
  }
  
  executeSkillAction(character, skill, onComplete) {
    const isPlayer = this.playerTeam.includes(character);
    const targets = skill.targetTeam === 'enemy' 
      ? this.enemyTeam.filter(e => !e.isDead)
      : this.playerTeam.filter(p => !p.isDead);
    
    if (targets.length === 0) {
      onComplete();
      return;
    }
    
    const result = skill.execute(character, targets);
    
    this.addBattleLog(`${character.name} 使用 ${skill.name}`, skill.description);
    this.emit('onSkillUse', { character, skill, result });
    
    // BUG3 FIX: Skill.executeDamage已计算伤害但未扣血，这里统一扣血
    if (result.damage > 0) {
      for (const effect of result.effects) {
        if (effect.type === 'damage' && effect.target) {
          const target = effect.target;
          const dmg = effect.damage;
          target.currentHp = Math.max(0, target.currentHp - dmg);

          if (isPlayer) {
            this.applyOnHitChipEffects(character, target);
          }

          this.emit('onDamage', { target, damage: dmg, isCrit: effect.isCrit || false, isPlayer });

          if (target.currentHp <= 0) {
            target.isDead = true;
            this.emit('onCharacterDeath', { character: target, isPlayer: this.playerTeam.includes(target) });
          }
        }
      }
    }
    
    if (result.healing > 0) {
      const target = result.targets?.[0] || character;
      target.currentHp = Math.min(target.maxHp, target.currentHp + result.healing);
      this.emit('onHeal', { target, amount: result.healing });
    }
    
    // BUG5 FIX: 从buffData构建正确的buff对象
    if (result.buffs?.length > 0) {
      for (const buffData of result.buffs) {
        const target = buffData.target || character;
        if (!target.buffs) target.buffs = [];
        const buffObj = {
          id: (buffData.buffType || 'buff') + '_' + Date.now(),
          type: buffData.buffType,
          value: buffData.value || 0,
          duration: buffData.duration,
          remainingDuration: buffData.duration
        };
        target.buffs.push(buffObj);
        this.emit('onBuffApply', { target, buff: buffObj });
      }
    }

    // BUG5 FIX: 从debuffData构建正确的buff对象
    if (result.debuffs?.length > 0) {
      for (const debuffData of result.debuffs) {
        const target = debuffData.target;
        if (!target.buffs) target.buffs = [];
        const buffObj = {
          id: (debuffData.debuffType || 'debuff') + '_' + Date.now(),
          type: debuffData.debuffType,
          value: debuffData.value || 0.1,
          duration: debuffData.duration,
          remainingDuration: debuffData.duration
        };
        target.buffs.push(buffObj);
        this.emit('onBuffApply', { target, buff: buffObj });
      }
    }
    
    this.scene.onSkillAnimation(character, targets, skill, () => {
      onComplete();
    });
  }
  
  executeEnemyTurn() {
    const alivePlayers = this.playerTeam.filter(c => !c.isDead);
    const aliveEnemies = this.enemyTeam.filter(e => !e.isDead);
    
    if (alivePlayers.length === 0) {
      this.endBattle(false);
      return;
    }
    
    if (aliveEnemies.length === 0) {
      this.endBattle(true);
      return;
    }
    
    const enemyToAct = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    
    if (enemyToAct && !this.hasBuff(enemyToAct, BuffType.STUN)) {
      const availableSkill = this.tryUseSkill(enemyToAct);
      if (availableSkill) {
        this.currentPhase = BattlePhase.SKILL;
        this.executeSkillAction(enemyToAct, availableSkill, () => {
          setTimeout(() => {
            this.executeAutoBattle();
          }, 200 / this.battleSpeed);
        });
        return;
      }
    }
    
    this.currentPhase = BattlePhase.ENEMY_ATTACK;
    
    if (enemyToAct) {
      this.executeCharacterAction(enemyToAct, () => {
        // 敌人风怒检查（与玩家风怒逻辑对称）
        if (enemyToAct.hasWindfury && enemyToAct.hasWindfury() && !enemyToAct._windfuryUsed && !enemyToAct.isDead) {
          enemyToAct._windfuryUsed = true;
          setTimeout(() => {
            this.executeCharacterAction(enemyToAct, () => {
              setTimeout(() => {
                this.executeAutoBattle();
              }, 300 / this.battleSpeed);
            });
          }, 200 / this.battleSpeed);
        } else {
          setTimeout(() => {
            this.executeAutoBattle();
          }, 300 / this.battleSpeed);
        }
      });
    } else {
      this.executeAutoBattle();
    }
  }
  
  executeCharacterAction(entity, onComplete) {
    const isPlayer = this.playerTeam.includes(entity);
    const targets = isPlayer 
      ? this.enemyTeam.filter(e => !e.isDead)
      : this.playerTeam.filter(c => !c.isDead);
    
    if (targets.length === 0) {
      onComplete();
      return;
    }
    
    const target = this.selectTarget(targets);
    
    if (isPlayer) {
      this.executePlayerAttack(entity, target, onComplete);
    } else {
      this.executeEnemyAttack(entity, target, onComplete);
    }
  }
  
  executeAttack(attacker, target, onComplete) {
    const isPlayer = this.playerTeam.includes(attacker);
    const defaultCritRate = isPlayer ? 0.15 : 0.1;

    let critRate = attacker.critRate || defaultCritRate;
    if (attacker.buffs) {
      for (const buff of attacker.buffs) {
        if (buff.type === BuffType.CRIT_UP) {
          critRate += buff.value;
        } else if (buff.type === BuffType.CRIT_DOWN) {
          critRate -= buff.value;
        }
      }
    }

    let dodgeRate = target.dodgeRate || 0.05;
    if (target.buffs) {
      for (const buff of target.buffs) {
        if (buff.type === BuffType.DODGE_UP) {
          dodgeRate += buff.value;
        } else if (buff.type === BuffType.DODGE_DOWN) {
          dodgeRate -= buff.value;
        }
      }
    }

    const isDodged = Math.random() < dodgeRate;
    if (isDodged) {
      this.addBattleLog(`${target.name} 闪避了攻击`, 'MISS');
      this.emit('onAttack', { attacker, target, damage: 0, isCrit: false, isDodged: true });
      this.checkChipTriggers('on_dodge', { attacker, target, isDodged: true });
      this.scene.onAttackAnimation(attacker, target, false, () => {
        onComplete();
      });
      return;
    }

    let damage = this.calculateDamage(attacker, target);
    const isCrit = Math.random() < critRate;
    let finalDamage = damage;
    if (isCrit) {
      finalDamage = Math.floor(damage * (attacker.critDamage || 2));
    }

    // 元素克制：最终伤害 +20%/-20%
    if (attacker.element && target.element) {
      const elemMult = getElementMultiplier(attacker.element, target.element);
      if (elemMult > 1) {
        finalDamage = Math.floor(finalDamage * elemMult);
      } else if (elemMult < 1) {
        finalDamage = Math.floor(finalDamage * elemMult);
      }
    }

    // [C12 FIX] hpPercentBefore 必须在扣血之前计算，否则死亡时 currentHp=0 永远触发 low_hp
    const hpPercentBefore = target.currentHp / target.maxHp;

    // 使用 takeDamage 让圣盾和重生逻辑生效
    let actualDamage;
    if (typeof target.takeDamage === 'function') {
      actualDamage = target.takeDamage(finalDamage);
    } else {
      actualDamage = Math.max(1, Math.floor(finalDamage * (1 - (target.getBaseDamageReduction ? target.getBaseDamageReduction() : 0))));
      target.currentHp = Math.max(0, target.currentHp - actualDamage);
    }

    if (target.currentHp <= 0) {
      target.isDead = true;
    }

    const attackerAllies = isPlayer ? this.playerTeam : this.enemyTeam;
    const attackerEnemies = isPlayer ? this.enemyTeam : this.playerTeam;

    // Trigger on_attack passives for attacker
    if (attacker.passiveSkill) {
      this.processPassiveSkills([attacker], 'attack', attackerAllies, attackerEnemies, target);
    }

    // Trigger on_damage_taken passives for target
    if (target.passiveSkill) {
      const targetAllies = this.playerTeam.includes(target) ? this.playerTeam : this.enemyTeam;
      const targetEnemies = this.playerTeam.includes(target) ? this.enemyTeam : this.playerTeam;
      this.processPassiveSkills([target], 'damage_taken', targetAllies, targetEnemies);
    }

    this.applyOnHitChipEffects(attacker, target);

    if (target.isDead) {
      this.emit('onCharacterDeath', { character: target, isPlayer: this.playerTeam.includes(target) });

      const deathTriggerType = isPlayer ? 'enemy_death' : 'ally_death';
      this.checkChipTriggers(deathTriggerType, { target, targets: [target] });

      const targetAllies = this.playerTeam.includes(target) ? this.playerTeam : this.enemyTeam;
      const targetEnemies = this.playerTeam.includes(target) ? this.enemyTeam : this.playerTeam;
      this.processAllyDeathPassiveSkills(target, targetAllies, targetEnemies);

      // Trigger on_kill passives for attacker
      if (attacker.passiveSkill && attacker.passiveSkill.type === 'on_kill') {
        this.processPassiveSkills([attacker], 'kill', attackerAllies, attackerEnemies);
      }
    }

    // [C12 FIX] 使用扣血前的 hpPercentBefore 判断低血量触发
    if (hpPercentBefore >= 0.3 && target.currentHp / target.maxHp < 0.3) {
      this.checkChipTriggers('on_low_hp', { target, targetHpPercent: target.currentHp / target.maxHp });
    }
    if (hpPercentBefore >= 0.5 && target.currentHp / target.maxHp < 0.5) {
      this.checkChipTriggers('on_low_hp_50', { target, targetHpPercent: target.currentHp / target.maxHp });
    }

    if (isCrit) {
      this.checkChipTriggers('on_crit', { attacker, target, isCrit: true, targets: [target] });
    }

    if (attacker.lifeSteal > 0 && finalDamage > 0) {
      const healAmount = Math.floor(finalDamage * attacker.lifeSteal);
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
      this.addBattleLog(`${attacker.name} 吸血`, `+${healAmount}`);
      this.emit('onHeal', { target: attacker, amount: healAmount });
    }

    this.emit('onAttack', { attacker, target, damage: finalDamage, isCrit });
    this.emit('onDamage', { target, damage: finalDamage, isCrit, isPlayer: !isPlayer });

    let logMsg = `${attacker.name} 攻击 ${target.name}`;
    let resultMsg = isCrit ? `暴击! ${finalDamage}` : `-${finalDamage}`;
    this.addBattleLog(logMsg, resultMsg);

    this.scene.onAttackAnimation(attacker, target, isCrit, () => {
      onComplete();
    });
  }

  executePlayerAttack(attacker, target, onComplete) {
    this.executeAttack(attacker, target, onComplete);
  }

  executeEnemyAttack(attacker, target, onComplete) {
    this.executeAttack(attacker, target, onComplete);
  }
  
  calculateDamage(attacker, target) {
    let attackerAtk = attacker.atk || 20;
    let targetDef = target.def || 5;
    
    if (attacker.tempAtkBoost) {
      attackerAtk *= (1 + attacker.tempAtkBoost);
    }
    
    if (attacker.buffs) {
      for (const buff of attacker.buffs) {
        if (buff.type === BuffType.ATK_UP) {
          attackerAtk *= (1 + buff.value);
        } else if (buff.type === BuffType.ATK_DOWN) {
          attackerAtk *= (1 - buff.value);
        }
      }
    }
    
    if (target.buffs) {
      for (const buff of target.buffs) {
        if (buff.type === BuffType.DEF_UP) {
          targetDef *= (1 + buff.value);
        } else if (buff.type === BuffType.DEF_DOWN) {
          targetDef *= (1 - buff.value);
        }
        if (buff.type === BuffType.SHIELD) {
          targetDef += buff.value;
        }
      }
    }
    
    if (target.shieldValue && target.shieldValue > 0) {
      targetDef += target.shieldValue;
      target.shieldValue = 0;
    }
    
    const baseDamage = attackerAtk - targetDef * 0.5;
    const variance = 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.floor(baseDamage * variance));
  }
  
  selectTarget(targets) {
    if (targets.length === 0) return null;
    if (targets.length === 1) return targets[0];
    
    const tauntTargets = targets.filter(t => t.hasTaunt?.());
    if (tauntTargets.length > 0) {
      return tauntTargets[Math.floor(Math.random() * tauntTargets.length)];
    }
    
    const weights = targets.map(t => {
      let weight = 1;
      if (t.isBoss) weight += 3;
      if (t.currentHp / t.maxHp < 0.3) weight -= 0.5;
      return { target: t, weight };
    });
    
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let w of weights) {
      random -= w.weight;
      if (random <= 0) return w.target;
    }
    
    return targets[targets.length - 1];
  }
  
  addBattleLog(action, result) {
    this.battleLog.push({ action, result, timestamp: Date.now() });
    this.emit('onBattleLog', { action, result });
    
    if (this.battleLog.length > 50) {
      this.battleLog.shift();
    }
  }
  
  isBattleEnded() {
    return this.currentPhase === BattlePhase.VICTORY || this.currentPhase === BattlePhase.DEFEAT;
  }
  
  endBattle(victory) {
    if (victory) {
      this.currentPhase = BattlePhase.VICTORY;
      this.emit('onVictory', {
        survivors: this.playerTeam.filter(c => !c.isDead),
        rewards: this.calculateRewards()
      });
    } else {
      this.currentPhase = BattlePhase.DEFEAT;
      this.emit('onDefeat', {
        enemies: this.enemyTeam
      });
    }
  }
  
  calculateRewards() {
    const totalEnemyHp = this.enemyTeam.reduce((sum, e) => sum + (e.maxHp || 0), 0);
    const mycelium = Math.floor(totalEnemyHp / 10);
    return { mycelium };
  }
  
  pause() {
    this.currentPhase = BattlePhase.PAUSED;
  }
  
  resume() {
    if (this.currentPhase === BattlePhase.PAUSED) {
      this.currentPhase = BattlePhase.IDLE;
      this.executeAutoBattle();
    }
  }
  
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }
  
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export class Enemy {
  constructor(data = {}) {
    this.id = data.id || Math.random().toString(36).substr(2, 9);
    this.name = data.name || '敌人';
    this.maxHp = data.hp || 100;
    this.currentHp = this.maxHp;
    this.atk = data.atk || 15;
    this.def = data.def || 5;
    this.critRate = data.critRate || 0.1;
    this.dodgeRate = data.dodgeRate || 0.05;
    this.level = data.level || 1;
    this.isBoss = data.isBoss || false;
    this.isDead = false;
    this.buffs = [];
    this.equipmentEffects = [];
    this.shieldValue = 0;
  }
  
  addDebuff(debuff) {
    if (!this.buffs) this.buffs = [];
    const existing = this.buffs.find(b => b.id === debuff.id);
    if (existing) {
      existing.duration = debuff.duration;
      return;
    }
    this.buffs.push({ ...debuff, remainingDuration: debuff.duration });
  }
  
  addBuff(buff) {
    if (!this.buffs) this.buffs = [];
    const existing = this.buffs.find(b => b.id === buff.id);
    if (existing) {
      existing.duration = buff.duration;
      return;
    }
    this.buffs.push({ ...buff, remainingDuration: buff.duration });
  }
  
  getHpPercent() {
    return this.currentHp / this.maxHp;
  }
}
