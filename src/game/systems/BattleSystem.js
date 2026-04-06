import Character from '../entities/Character.js';
import Skill from './Skill.js';
import { BuffType } from './BuffSystem.js';
import EquipmentCardManager from './EquipmentCardManager.js';

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
    this.equipmentCardManager = null;
    
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
  
  setPlayerTeam(characters) {
    this.playerTeam = characters.map(char => {
      if (!(char instanceof Character)) {
        char = new Character(char);
      }
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
      enemy.currentHp = enemy.maxHp;
      if (enemy.isMinionCard) {
        enemy._hasRebirthed = false;
        enemy._windfuryUsed = false;
        if (enemy.passiveSkill) {
          enemy.passiveSkill.triggered = false;
          enemy.passiveSkill.isActive = true;
        }
      }
    });
    
    this.applyEquipmentCardBonuses();
    this.applyEquipmentSkills();
  }
  
  applyEquipmentCardBonuses() {
    try {
      const equipData = window.gameData?.equipmentCardManager;
      if (!equipData?.equippedCardId) return;
      
      const manager = EquipmentCardManager.fromJSON(equipData);
      const equippedCard = manager.equippedCard;
      
      if (!equippedCard) return;
      
      const bonuses = equippedCard.getEffectiveStats();
      
      this.playerTeam.forEach(follower => {
        follower.atk += bonuses.atk || 0;
        follower.maxHp += bonuses.hp || 0;
        follower.currentHp += bonuses.hp || 0;
        follower.critRate = Math.min((follower.critRate || 0) + (bonuses.critRate || 0), 0.9);
        follower.dodgeRate = Math.min((follower.dodgeRate || 0) + (bonuses.dodgeRate || 0), 0.9);
        follower.damageReduction = Math.min((follower.damageReduction || 0) + (bonuses.damageReduction || 0), 0.9);
        follower.lifeSteal = (follower.lifeSteal || 0) + (bonuses.lifeSteal || 0);
      });
      
      this.equipmentSkills = equippedCard.skills
        .filter(skill => skill.isUnlocked(equippedCard.star))
        .map(skill => {
          const skillCopy = { ...skill };
          skillCopy.currentCooldown = 0;
          return skillCopy;
        });
      
      this.addBattleLog('装备卡', `【${equippedCard.name}】已生效`);
    } catch (e) {
      console.warn('Failed to apply equipment card bonuses:', e);
    }
  }
  
  applyEquipmentSkills() {
    if (!this.equipmentSkills || this.equipmentSkills.length === 0) return;
    
    this.equipmentSkills.forEach(skill => {
      if (skill.type === 'aura') {
        this.applyEquipmentAura(skill);
      } else if (skill.type === 'modify') {
        this.applyEquipmentModify(skill);
      }
    });
    
    const auraCount = this.equipmentSkills.filter(s => s.type === 'aura').length;
    const modifyCount = this.equipmentSkills.filter(s => s.type === 'modify').length;
    
    if (auraCount > 0 || modifyCount > 0) {
      this.addBattleLog('装备技能', `光环${auraCount}个 + 改造${modifyCount}个已激活`);
    }
  }
  
  applyEquipmentAura(skill) {
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
  
  applyEquipmentModify(skill) {
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
            followerSkill附加效果 = followerSkill附加效果 || [];
            followerSkill附加效果.push({
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
  
  checkEquipmentTriggers(triggerType, context = {}) {
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
          this.executeEquipmentTrigger(skill, context);
          skill.currentCooldown = skill.triggerCooldown || 0;
        }
      }
    });
  }
  
  executeEquipmentTrigger(skill, context = {}) {
    const effectiveValue = Math.floor(skill.effectValue * (skill.skillMultiplier || 1));
    
    switch (skill.effectType) {
      case 'heal':
        this.playerTeam.forEach(follower => {
          if (!follower.isDead) {
            const healAmount = Math.floor(follower.maxHp * effectiveValue / 100);
            follower.currentHp = Math.min(follower.maxHp, follower.currentHp + healAmount);
          }
        });
        this.addBattleLog('装备触发', `【${skill.name}】全队恢复${effectiveValue}%生命`);
        this.emit('onBattleLog', { action: '装备触发', result: `【${skill.name}】全队恢复${effectiveValue}%生命` });
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
        this.addBattleLog('装备触发', `【${skill.name}】全队攻击+${effectiveValue}%`);
        this.emit('onBattleLog', { action: '装备触发', result: `【${skill.name}】攻击提升` });
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
        this.addBattleLog('装备触发', `【${skill.name}】全队获得护盾`);
        this.emit('onBattleLog', { action: '装备触发', result: `【${skill.name}】护盾生成` });
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
          this.addBattleLog('装备触发', `【${skill.name}】使敌人${skill.effectType === 'burn' ? '灼烧' : '中毒'}`);
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
          this.addBattleLog('装备触发', `【${skill.name}】使敌人眩晕`);
        }
        break;
    }
  }
  
  applyOnHitEquipmentEffects(attacker, target) {
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
        this.addBattleLog('装备效果', `${target.name} 受到${effect.type === 'burn' ? '灼烧' : '中毒'}`);
      }
    });
  }
  
  startBattle() {
    this.initialize();
    this.checkEquipmentTriggers('battle_start');
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
    
    this.checkEquipmentTriggers('turn_start');
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
          this.decrementEquipmentSkillCooldowns();
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
        this.decrementEquipmentSkillCooldowns();
        setTimeout(() => {
          this.executeEnemyTurn();
        }, 300 / this.battleSpeed);
      });
    } else {
      this.decrementEquipmentSkillCooldowns();
      this.executeEnemyTurn();
    }
  }
  
  decrementEquipmentSkillCooldowns() {
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
      if (entity.isDead || !entity.isMinionCard || !entity.passiveSkill) continue;
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
          if (entity.isMinionCard && entity.isMechImmune?.()) continue;
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
          if (entity.isMinionCard && entity.isMechImmune?.()) {
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
    }
  }
  
  tryUseSkill(character) {
    if (!character.skills || character.skills.length === 0) return null;
    
    for (const skillData of character.skills) {
      const skill = skillData instanceof Skill ? skillData : new Skill(skillData);
      
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
    
    if (result.damage > 0) {
      for (const target of targets) {
        target.currentHp = Math.max(0, target.currentHp - result.damage);
        
        if (isPlayer) {
          this.applyOnHitEquipmentEffects(character, target);
        }
        
        this.emit('onDamage', { target, damage: result.damage, isCrit: false, isPlayer });
        
        if (target.currentHp <= 0) {
          target.isDead = true;
          this.emit('onCharacterDeath', { character: target, isPlayer: this.playerTeam.includes(target) });
        }
      }
    }
    
    if (result.healing > 0) {
      const target = result.targets?.[0] || character;
      target.currentHp = Math.min(target.maxHp, target.currentHp + result.healing);
      this.emit('onHeal', { target, amount: result.healing });
    }
    
    if (result.buffs?.length > 0) {
      for (const buffData of result.buffs) {
        const target = buffData.target || character;
        if (!target.buffs) target.buffs = [];
        target.buffs.push(buffData.buff);
        this.emit('onBuffApply', { target, buff: buffData.buff });
      }
    }
    
    if (result.debuffs?.length > 0) {
      for (const debuffData of result.debuffs) {
        const target = debuffData.target;
        if (!target.buffs) target.buffs = [];
        target.buffs.push(debuffData.buff);
        this.emit('onBuffApply', { target, buff: debuffData.buff });
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
        setTimeout(() => {
          this.executeAutoBattle();
        }, 300 / this.battleSpeed);
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
  
  executePlayerAttack(attacker, target, onComplete) {
    let critRate = attacker.critRate || 0.15;
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
      this.checkEquipmentTriggers('on_dodge', { attacker, target, isDodged: true });
      this.scene.onAttackAnimation(attacker, target, false, () => {
        onComplete();
      });
      return;
    }
    
    let damage = this.calculateDamage(attacker, target);
    const isCrit = Math.random() < critRate;
    let finalDamage = isCrit ? Math.floor(damage * 2) : damage;
    
    if (isCrit) {
      finalDamage = Math.floor(finalDamage * (attacker.critDamage || 2));
    }
    
    target.currentHp = Math.max(0, target.currentHp - finalDamage);
    
    this.applyOnHitEquipmentEffects(attacker, target);
    
    if (target.currentHp <= 0) {
      target.isDead = true;
      this.emit('onCharacterDeath', { character: target, isPlayer: !this.playerTeam.includes(target) });
      this.checkEquipmentTriggers('enemy_death', { target, targets: [target] });
      this.processAllyDeathPassiveSkills(target, this.playerTeam, this.enemyTeam);
    }
    
    const hpPercentBefore = target.currentHp / target.maxHp;
    if (hpPercentBefore < 0.3) {
      this.checkEquipmentTriggers('on_low_hp', { target, targetHpPercent: hpPercentBefore });
    } else if (hpPercentBefore < 0.5) {
      this.checkEquipmentTriggers('on_low_hp_50', { target, targetHpPercent: hpPercentBefore });
    }
    
    if (isCrit) {
      this.checkEquipmentTriggers('on_crit', { attacker, target, isCrit: true, targets: [target] });
    }
    
    if (attacker.lifeSteal > 0 && finalDamage > 0) {
      const healAmount = Math.floor(finalDamage * attacker.lifeSteal);
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
      this.addBattleLog(`${attacker.name} 吸血`, `+${healAmount}`);
      this.emit('onHeal', { target: attacker, amount: healAmount });
    }
    
    this.emit('onAttack', { attacker, target, damage: finalDamage, isCrit });
    this.emit('onDamage', { target, damage: finalDamage, isCrit, isPlayer: false });
    
    let logMsg = `${attacker.name} 攻击 ${target.name}`;
    let resultMsg = isCrit ? `暴击! ${finalDamage}` : `-${finalDamage}`;
    this.addBattleLog(logMsg, resultMsg);
    
    this.scene.onAttackAnimation(attacker, target, isCrit, () => {
      onComplete();
    });
  }
  
  executeEnemyAttack(attacker, target, onComplete) {
    let critRate = attacker.critRate || 0.1;
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
      this.scene.onAttackAnimation(attacker, target, false, () => {
        onComplete();
      });
      return;
    }
    
    let damage = this.calculateDamage(attacker, target);
    const isCrit = Math.random() < critRate;
    let finalDamage = isCrit ? Math.floor(damage * 2) : damage;
    
    if (isCrit) {
      finalDamage = Math.floor(finalDamage * (attacker.critDamage || 2));
    }
    
    target.currentHp = Math.max(0, target.currentHp - finalDamage);
    
    if (target.currentHp <= 0) {
      target.isDead = true;
      this.emit('onCharacterDeath', { character: target, isPlayer: true });
      this.checkEquipmentTriggers('ally_death', { target, targets: [target] });
      this.processAllyDeathPassiveSkills(target, this.enemyTeam, this.playerTeam);
    }
    
    this.emit('onAttack', { attacker, target, damage: finalDamage, isCrit });
    this.emit('onDamage', { target, damage: finalDamage, isCrit, isPlayer: true });
    
    let logMsg = `${attacker.name} 攻击 ${target.name}`;
    let resultMsg = isCrit ? `暴击! ${finalDamage}` : `-${finalDamage}`;
    this.addBattleLog(logMsg, resultMsg);
    
    this.scene.onAttackAnimation(attacker, target, isCrit, () => {
      onComplete();
    });
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
    
    const tauntTargets = targets.filter(t => t.isMinionCard && t.hasTaunt?.());
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
    const coins = Math.floor(totalEnemyHp / 10);
    return { coins };
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
