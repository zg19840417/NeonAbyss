import { Enemy } from './BattleSystem.js';

export const DungeonState = {
  IDLE: 'idle',
  BATTLING: 'battling',
  VICTORY: 'victory',
  RETURNING: 'returning'
};

export default class DungeonSystem {
  constructor(gameData = {}) {
    this.currentFloor = gameData.currentFloor || 1;
    this.maxReachedFloor = gameData.maxReachedFloor || 1;
    this.currentDimension = gameData.currentDimension || 1;
    
    this.state = DungeonState.IDLE;
    
    this.autoBattleEnabled = gameData.autoBattleEnabled !== undefined ? gameData.autoBattleEnabled : true;
    this.autoEquipmentEnabled = gameData.autoEquipmentEnabled !== undefined ? gameData.autoEquipmentEnabled : true;
    
    this.offlineProgress = gameData.offlineProgress || {
      enabled: false,
      lastBattleTime: 0,
      battlesWon: 0,
      goldEarned: 0,
      floorsCleared: 0
    };
    
    this.totalBattlesWon = gameData.totalBattlesWon || 0;
    this.totalGoldEarned = gameData.totalGoldEarned || 0;
    this.totalBossDefeated = gameData.totalBossDefeated || 0;
    
    this.listeners = {
      onFloorStart: [],
      onFloorComplete: [],
      onBattleStart: [],
      onBattleEnd: [],
      onReturnToBase: [],
      onDimensionChange: [],
      onAchievementProgress: []
    };
  }
  
  startDungeon() {
    if (this.state === DungeonState.BATTLING) return;
    
    this.state = DungeonState.BATTLING;
    this.emit('onFloorStart', { floor: this.currentFloor, dimension: this.currentDimension });
  }
  
  generateEnemiesForFloor(floorNumber) {
    const isBossFloor = floorNumber % 10 === 0;
    const enemyCount = isBossFloor ? 1 : Math.min(3, 1 + Math.floor(floorNumber / 15));
    
    if (isBossFloor) {
      return [this.generateBoss(floorNumber)];
    }
    
    const enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      enemies.push(this.generateEnemy(floorNumber));
    }
    return enemies;
  }
  
  generateEnemy(floorNumber) {
    const enemyTypes = [
      { name: '机械猎犬', baseHp: 80, baseAtk: 15, hpGrowth: 1.12, atkGrowth: 1.10 },
      { name: '巡逻机甲', baseHp: 120, baseAtk: 12, hpGrowth: 1.13, atkGrowth: 1.09 },
      { name: '变异蜘蛛', baseHp: 60, baseAtk: 14, hpGrowth: 1.11, atkGrowth: 1.10 },
      { name: '炮台', baseHp: 50, baseAtk: 20, hpGrowth: 1.10, atkGrowth: 1.12 },
      { name: '腐化者', baseHp: 100, baseAtk: 10, hpGrowth: 1.12, atkGrowth: 1.08 },
      { name: '暴走者', baseHp: 70, baseAtk: 22, hpGrowth: 1.11, atkGrowth: 1.13 },
      { name: '影子刺客', baseHp: 65, baseAtk: 18, hpGrowth: 1.11, atkGrowth: 1.11 },
      { name: '重装卫士', baseHp: 200, baseAtk: 8, hpGrowth: 1.15, atkGrowth: 1.07 },
      { name: '毒液喷射者', baseHp: 90, baseAtk: 12, hpGrowth: 1.12, atkGrowth: 1.09 },
      { name: '灵魂收割者', baseHp: 110, baseAtk: 16, hpGrowth: 1.13, atkGrowth: 1.10 }
    ];
    
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const hpScale = Math.pow(enemyType.hpGrowth, floorNumber - 1);
    const atkScale = Math.pow(enemyType.atkGrowth, floorNumber - 1);
    
    return new Enemy({
      name: enemyType.name,
      hp: Math.floor(enemyType.baseHp * hpScale),
      atk: Math.floor(enemyType.baseAtk * atkScale),
      critRate: 0.1 + Math.min(floorNumber * 0.005, 0.2),
      dodgeRate: 0.03 + Math.min(floorNumber * 0.002, 0.1),
      level: floorNumber,
      isBoss: false
    });
  }
  
  generateBoss(floorNumber) {
    const dimensionBosses = [
      [{ name: '毁灭领主', baseHp: 2000, baseAtk: 30, critRate: 0.15, dodgeRate: 0.05 }],
      [{ name: '暗影帝王', baseHp: 3500, baseAtk: 35, critRate: 0.30, dodgeRate: 0.25 }],
      [{ name: '天网核心', baseHp: 5000, baseAtk: 40, critRate: 0.20, dodgeRate: 0.10 }],
      [{ name: '机械母体', baseHp: 8000, baseAtk: 35, critRate: 0.10, dodgeRate: 0.00 }],
      [{ name: '终焉之神', baseHp: 15000, baseAtk: 50, critRate: 0.25, dodgeRate: 0.15 }]
    ];
    
    const dimensionIndex = Math.min(this.currentDimension - 1, dimensionBosses.length - 1);
    const bossData = dimensionBosses[dimensionIndex][0];
    const scaleFactor = 1 + (floorNumber - this.currentDimension * 10) * 0.1;
    
    return new Enemy({
      name: bossData.name,
      hp: Math.floor(bossData.baseHp * scaleFactor),
      atk: Math.floor(bossData.baseAtk * scaleFactor),
      critRate: bossData.critRate,
      dodgeRate: bossData.dodgeRate,
      level: floorNumber,
      isBoss: true
    });
  }
  
  onBattleVictory(floorNumber, isBoss = false) {
    this.totalBattlesWon++;
    
    if (isBoss) {
      this.totalBossDefeated++;
      this.emit('onAchievementProgress', {
        type: 'boss_defeat',
        value: this.totalBossDefeated
      });
    }
    
    this.emit('onAchievementProgress', {
      type: 'battle_win',
      value: this.totalBattlesWon
    });
    
    this.emit('onBattleEnd', { floor: floorNumber, victory: true });
  }
  
  advanceFloor() {
    this.currentFloor++;
    
    if (this.currentFloor > this.maxReachedFloor) {
      this.maxReachedFloor = this.currentFloor;
      this.emit('onAchievementProgress', {
        type: 'floor_reach',
        value: this.currentFloor
      });
    }
    
    if (this.currentFloor > this.currentDimension * 10) {
      this.currentDimension++;
      this.emit('onAchievementProgress', {
        type: 'dimension_reach',
        value: this.currentDimension
      });
      this.emit('onDimensionChange', { dimension: this.currentDimension });
    }
    
    this.emit('onFloorStart', { floor: this.currentFloor, dimension: this.currentDimension });
    
    return {
      floor: this.currentFloor,
      dimension: this.currentDimension,
      isBossFloor: this.currentFloor % 10 === 0,
      enemies: this.generateEnemiesForFloor(this.currentFloor)
    };
  }
  
  calculateRewards(enemies) {
    const totalEnemyHp = enemies.reduce((sum, e) => sum + (e.maxHp || e.hp || 0), 0);
    const floorBonus = 1 + (this.currentFloor - 1) * 0.15;
    const dimensionBonus = 1 + (this.currentDimension - 1) * 0.5;
    
    const baseGold = Math.floor(totalEnemyHp / 10 * floorBonus);
    const gold = Math.floor(baseGold * dimensionBonus);
    
    this.totalGoldEarned += gold;
    
    this.emit('onAchievementProgress', {
      type: 'gold_earn',
      value: this.totalGoldEarned
    });
    
    const loot = {
      gold: gold,
      equipment: null
    };
    
    if (Math.random() < 0.15 + this.currentDimension * 0.05) {
      loot.equipment = this.generateLoot();
    }
    
    return loot;
  }
  
  generateLoot() {
    const qualityRoll = Math.random();
    const floorBonus = Math.min(this.currentFloor / 100, 0.5);
    
    let quality = 'N';
    if (qualityRoll < 0.03 + floorBonus * 0.02) quality = 'SR';
    else if (qualityRoll < 0.10 + floorBonus * 0.05) quality = 'R';
    else if (qualityRoll < 0.25 + floorBonus * 0.10) quality = 'N';
    
    const lootTypes = ['weapon', 'armor', 'accessory'];
    const type = lootTypes[Math.floor(Math.random() * lootTypes.length)];
    
    return {
      type: type,
      quality: quality,
      floor: this.currentFloor
    };
  }
  
  startOfflineProgress() {
    this.offlineProgress.enabled = true;
    this.offlineProgress.lastBattleTime = Date.now();
  }
  
  calculateOfflineProgress() {
    if (!this.offlineProgress.enabled) return null;
    
    const now = Date.now();
    const elapsedMs = now - this.offlineProgress.lastBattleTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const maxOfflineSeconds = 8 * 60 * 60;
    const effectiveSeconds = Math.min(elapsedSeconds, maxOfflineSeconds);
    
    const battlesPerSecond = 0.5;
    const estimatedBattles = Math.floor(effectiveSeconds * battlesPerSecond);
    
    const avgGoldPerBattle = 50 + this.currentFloor * 10;
    const estimatedGold = Math.floor(estimatedBattles * avgGoldPerBattle * (1 + this.currentDimension * 0.3));
    
    const result = {
      battlesWon: estimatedBattles,
      goldEarned: estimatedGold,
      floorsCleared: Math.floor(estimatedBattles / 3),
      duration: effectiveSeconds
    };
    
    this.offlineProgress.battlesWon += estimatedBattles;
    this.offlineProgress.goldEarned += estimatedGold;
    this.offlineProgress.floorsCleared += result.floorsCleared;
    this.totalBattlesWon += estimatedBattles;
    this.totalGoldEarned += estimatedGold;
    
    this.offlineProgress.lastBattleTime = now;
    
    return result;
  }
  
  returnToBase() {
    this.state = DungeonState.RETURNING;
    this.offlineProgress.enabled = true;
    this.offlineProgress.lastBattleTime = Date.now();
    
    this.emit('onReturnToBase', {
      floor: this.currentFloor,
      dimension: this.currentDimension,
      totalBattlesWon: this.totalBattlesWon,
      totalGoldEarned: this.totalGoldEarned,
      offlineProgress: this.offlineProgress
    });
  }
  
  resetDungeonProgress() {
    this.currentFloor = 1;
    this.currentDimension = 1;
    this.state = DungeonState.IDLE;
  }
  
  getCurrentState() {
    return {
      currentFloor: this.currentFloor,
      maxReachedFloor: this.maxReachedFloor,
      currentDimension: this.currentDimension,
      state: this.state,
      autoBattleEnabled: this.autoBattleEnabled,
      autoEquipmentEnabled: this.autoEquipmentEnabled,
      totalBattlesWon: this.totalBattlesWon,
      totalGoldEarned: this.totalGoldEarned,
      isBossFloor: this.currentFloor % 10 === 0
    };
  }
  
  setAutoBattle(enabled) {
    this.autoBattleEnabled = enabled;
    return this.autoBattleEnabled;
  }
  
  setAutoEquipment(enabled) {
    this.autoEquipmentEnabled = enabled;
    return this.autoEquipmentEnabled;
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
  
  toJSON() {
    return {
      currentFloor: this.currentFloor,
      maxReachedFloor: this.maxReachedFloor,
      currentDimension: this.currentDimension,
      autoBattleEnabled: this.autoBattleEnabled,
      autoEquipmentEnabled: this.autoEquipmentEnabled,
      totalBattlesWon: this.totalBattlesWon,
      totalGoldEarned: this.totalGoldEarned,
      offlineProgress: this.offlineProgress
    };
  }
  
  save() {
    try {
      localStorage.setItem('dungeonSystem', JSON.stringify(this.toJSON()));
    } catch (e) {
      console.warn('Failed to save dungeon system:', e);
    }
  }
  
  load() {
    try {
      const saved = localStorage.getItem('dungeonSystem');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentFloor = data.currentFloor || 1;
        this.maxReachedFloor = data.maxReachedFloor || 1;
        this.currentDimension = data.currentDimension || 1;
        this.autoBattleEnabled = data.autoBattleEnabled !== undefined ? data.autoBattleEnabled : true;
        this.autoEquipmentEnabled = data.autoEquipmentEnabled !== undefined ? data.autoEquipmentEnabled : true;
        this.totalBattlesWon = data.totalBattlesWon || 0;
        this.totalGoldEarned = data.totalGoldEarned || 0;
        this.offlineProgress = data.offlineProgress || this.offlineProgress;
      }
    } catch (e) {
      console.warn('Failed to load dungeon system:', e);
    }
  }
}
