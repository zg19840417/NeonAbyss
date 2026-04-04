import Character from '../entities/Character.js';
import Skill from './Skill.js';
import { BuffType } from './BuffSystem.js';

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
      return char;
    });
  }
  
  setEnemyTeam(enemies) {
    this.enemyTeam = enemies.map(enemy => {
      if (!(enemy instanceof Enemy)) {
        enemy = new Enemy(enemy);
      }
      enemy.isDead = false;
      return enemy;
    });
  }
  
  initialize() {
    this.currentPhase = BattlePhase.IDLE;
    this.battleLog = [];
    
    this.playerTeam.forEach(char => {
      char.isDead = false;
      char.currentHp = char.maxHp;
    });
    
    this.enemyTeam.forEach(enemy => {
      enemy.isDead = false;
      enemy.currentHp = enemy.maxHp;
    });
  }
  
  startBattle() {
    this.initialize();
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
    
    this.processBuffs(this.playerTeam);
    this.processBuffs(this.enemyTeam);
    
    const playerToAct = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    if (playerToAct && !this.hasBuff(playerToAct, BuffType.STUN)) {
      const availableSkill = this.tryUseSkill(playerToAct);
      if (availableSkill) {
        this.currentPhase = BattlePhase.SKILL;
        this.executeSkillAction(playerToAct, availableSkill, () => {
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
        setTimeout(() => {
          this.executeEnemyTurn();
        }, 300 / this.battleSpeed);
      });
    } else {
      this.executeEnemyTurn();
    }
  }
  
  hasBuff(entity, buffType) {
    return entity.buffs?.some(b => b.type === buffType) || false;
  }
  
  processBuffs(team) {
    for (const entity of team) {
      if (!entity.buffs) entity.buffs = [];
      
      for (let i = entity.buffs.length - 1; i >= 0; i--) {
        const buff = entity.buffs[i];
        
        if (buff.type === BuffType.POISON) {
          const poisonDamage = Math.floor(buff.value * entity.maxHp);
          entity.currentHp = Math.max(0, entity.currentHp - poisonDamage);
          this.addBattleLog(`${entity.name} 受到中毒伤害`, `-${poisonDamage}`);
          this.emit('onDamage', { target: entity, damage: poisonDamage, isCrit: false, isPlayer: this.playerTeam.includes(entity) });
          
          if (entity.currentHp <= 0) {
            entity.isDead = true;
            this.emit('onCharacterDeath', { character: entity, isPlayer: this.playerTeam.includes(entity) });
          }
        }
        
        if (buff.type === BuffType.REGEN) {
          const healAmount = Math.floor(buff.value * entity.maxHp);
          entity.currentHp = Math.min(entity.maxHp, entity.currentHp + healAmount);
          this.addBattleLog(`${entity.name} 恢复生命`, `+${healAmount}`);
          this.emit('onHeal', { target: entity, amount: healAmount });
        }
        
        if (buff.type === BuffType.STUN) {
        }
        
        if (buff.type === BuffType.SHIELD) {
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
    
    const damage = this.calculateDamage(attacker, target);
    const isCrit = Math.random() < critRate;
    const finalDamage = isCrit ? Math.floor(damage * 2) : damage;
    
    target.currentHp = Math.max(0, target.currentHp - finalDamage);
    
    if (target.currentHp <= 0) {
      target.isDead = true;
      this.emit('onCharacterDeath', { character: target, isPlayer: !this.playerTeam.includes(target) });
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
    
    const damage = this.calculateDamage(attacker, target);
    const isCrit = Math.random() < critRate;
    const finalDamage = isCrit ? Math.floor(damage * 2) : damage;
    
    target.currentHp = Math.max(0, target.currentHp - finalDamage);
    
    if (target.currentHp <= 0) {
      target.isDead = true;
      this.emit('onCharacterDeath', { character: target, isPlayer: true });
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
    
    const baseDamage = attackerAtk - targetDef * 0.5;
    const variance = 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.floor(baseDamage * variance));
  }
  
  selectTarget(targets) {
    if (targets.length === 0) return null;
    if (targets.length === 1) return targets[0];
    
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
  }
  
  getHpPercent() {
    return this.currentHp / this.maxHp;
  }
}
