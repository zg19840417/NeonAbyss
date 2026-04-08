import DungeonSystem from '../game/systems/DungeonSystem.js';
import EventBus from '../game/EventBus.js';
import MinionCardManager from '../game/systems/MinionCardManager.js';
import ChipCardManager from '../game/systems/ChipCardManager.js';
import { ensureGlobalGameData, syncRuntimeGameData } from '../game/data/GameData.js';
import enemiesData from '../../assets/data/json/enemies.json';

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DungeonScene' });
    this.dungeonSystem = null;
    this.currentFloor = 1;
    this.currentDimension = 1;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.initializeDungeonSystem();
    this.createBackground(width, height);
    this.showDungeonInfo(width, height);
    this.setupEventListeners();
    this.startAutoBattle();
  }

  initializeDungeonSystem() {
    ensureGlobalGameData();
    this.dungeonSystem = new DungeonSystem(window.gameData.dungeon);
    this.dungeonSystem.load();
    this.currentFloor = this.dungeonSystem.currentFloor;
    this.currentDimension = this.dungeonSystem.currentDimension;
  }

  createBackground(width, height) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1815, 0x1a1815, 0x2d2824, 0x2d2824, 1);
    bg.fillRect(0, 0, width, height);
  }

  showDungeonInfo(width) {
    const isBossFloor = this.currentFloor % 10 === 0;

    this.add.text(width / 2, 60, '禁区探索', {
      fontSize: '24px',
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: '#d4a574'
    }).setOrigin(0.5);

    const bossLabel = isBossFloor ? ' BOSS' : '';
    this.add.text(width / 2, 100, `第 ${this.currentFloor} 层${bossLabel}`, {
      fontSize: '18px',
      fontFamily: 'Noto Sans SC',
      color: isBossFloor ? '#d86a6a' : '#d4a574'
    }).setOrigin(0.5);

    this.add.text(width / 2, 130, `次元 ${this.currentDimension}`, {
      fontSize: '12px',
      fontFamily: 'Noto Sans SC',
      color: '#8a7a6a'
    }).setOrigin(0.5);

    this.add.text(width / 2, 180, '正在进入自动战斗...', {
      fontSize: '14px',
      fontFamily: 'Noto Sans SC',
      color: '#8a7a6a'
    }).setOrigin(0.5);
  }

  setupEventListeners() {
    this._eventListeners = {
      battleVictory: (data) => this.onBattleVictory(data),
      battleDefeat: (data) => this.onBattleDefeat(data)
    };

    EventBus.on('battle:victory', this._eventListeners.battleVictory);
    EventBus.on('battle:defeat', this._eventListeners.battleDefeat);
  }

  getEnemyTemplates(type = null) {
    const templates = enemiesData || [];
    return type ? templates.filter((enemy) => enemy.type === type) : templates;
  }

  generateEnemyFromData(floorNumber) {
    const lostChance = Math.min(0.3, 0.05 + floorNumber * 0.01);
    const type = Math.random() < lostChance ? 'lost' : 'mutant';
    const templates = this.getEnemyTemplates(type);

    if (templates.length === 0) {
      return this.dungeonSystem.generateEnemy(floorNumber);
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    const hpScale = Math.pow(1.12, floorNumber - 1);
    const atkScale = Math.pow(1.1, floorNumber - 1);

    return {
      id: `${template.enemyId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: template.name,
      nameEn: template.nameEn,
      type: template.type,
      element: template.element,
      hp: Math.floor(template.baseHp * hpScale),
      maxHp: Math.floor(template.baseHp * hpScale),
      atk: Math.floor(template.baseAtk * atkScale),
      level: floorNumber,
      isBoss: false,
      dropTable: template.dropTable || [],
      skills: template.skills || []
    };
  }

  generateBossFromData(floorNumber) {
    const lostTemplates = this.getEnemyTemplates('lost');
    if (lostTemplates.length === 0) {
      return this.dungeonSystem.generateBoss(floorNumber);
    }

    const dimensionIndex = Math.min(this.currentDimension - 1, lostTemplates.length - 1);
    const template = lostTemplates[dimensionIndex] || lostTemplates[0];
    const scaleFactor = 1 + (floorNumber - this.currentDimension * 10) * 0.1;

    return {
      id: `${template.enemyId}_boss_${Date.now()}`,
      name: template.name,
      nameEn: template.nameEn,
      type: template.type,
      element: template.element,
      hp: Math.floor(template.baseHp * scaleFactor),
      maxHp: Math.floor(template.baseHp * scaleFactor),
      atk: Math.floor(template.baseAtk * scaleFactor),
      level: floorNumber,
      isBoss: true,
      dropTable: template.dropTable || [],
      skills: template.skills || []
    };
  }

  generateEnemiesForFloor(floorNumber) {
    const isBossFloor = floorNumber % 10 === 0;
    const enemyCount = isBossFloor ? 1 : Math.min(3, 1 + Math.floor(floorNumber / 15));

    if (isBossFloor) {
      return [this.generateBossFromData(floorNumber)];
    }

    return Array.from({ length: enemyCount }, () => this.generateEnemyFromData(floorNumber));
  }

  getPlayerTeam() {
    const manager = MinionCardManager.fromJSON(window.gameData?.minionCardManager || {});
    const deployedCards = manager.getDeployedCards();
    if (deployedCards.length > 0) {
      return deployedCards.map((card) => (card.toJSON ? card.toJSON() : card));
    }

    return [
      { id: 'starter_1', name: '艾伦', hp: 100, maxHp: 100, atk: 20, level: 1, element: 'fire', rarity: 'common' },
      { id: 'starter_2', name: '莉亚', hp: 80, maxHp: 80, atk: 25, level: 1, element: 'water', rarity: 'rare' },
      { id: 'starter_3', name: '杰克', hp: 120, maxHp: 120, atk: 18, level: 1, element: 'wind', rarity: 'common' }
    ];
  }

  getChipCard() {
    const manager = ChipCardManager.fromJSON(window.gameData?.chipCardManager || {});
    return manager.equippedCard ? manager.equippedCard.toJSON() : null;
  }

  startAutoBattle() {
    this.time.delayedCall(1500, () => {
      this.scene.start('BattleScene', {
        floor: this.currentFloor,
        dimension: this.currentDimension,
        enemies: this.generateEnemiesForFloor(this.currentFloor).map((enemy) => ({
          id: enemy.id,
          name: enemy.name,
          type: enemy.type,
          element: enemy.element,
          hp: enemy.hp || enemy.maxHp,
          maxHp: enemy.maxHp,
          atk: enemy.atk,
          level: enemy.level,
          isBoss: enemy.isBoss,
          dropTable: enemy.dropTable || [],
          skills: enemy.skills || []
        })),
        minions: this.getPlayerTeam(),
        equipmentCard: this.getChipCard()
      });
    });
  }

  calculateBattleRewards(enemies) {
    let mycelium = 0;
    let sourceCore = 0;

    enemies.forEach((enemy) => {
      (enemy.dropTable || []).forEach((drop) => {
        const amount = Phaser.Math.Between(drop.min || 0, drop.max || 0);
        if (drop.type === 'mycelium') {
          mycelium += amount;
        } else if (drop.type === 'sourceCore') {
          sourceCore += amount;
        }
      });
    });

    const floorBonus = 1 + (this.currentFloor - 1) * 0.15;
    const dimensionBonus = 1 + (this.currentDimension - 1) * 0.5;
    return {
      mycelium: Math.floor(mycelium * floorBonus * dimensionBonus),
      sourceCore
    };
  }

  onBattleVictory(data) {
    const currentFloor = data.floor || this.currentFloor;
    const isBossFloor = currentFloor % 10 === 0;
    const enemies = this.generateEnemiesForFloor(currentFloor);
    const rewards = this.calculateBattleRewards(enemies);

    if (window.gameData.base) {
      window.gameData.base.mycelium = (window.gameData.base.mycelium || 0) + rewards.mycelium;
      window.gameData.base.sourceCore = (window.gameData.base.sourceCore || 0) + rewards.sourceCore;
    }

    this.dungeonSystem.onBattleVictory(currentFloor, isBossFloor);
    this.currentFloor += 1;

    if (this.currentFloor > this.dungeonSystem.maxReachedFloor) {
      this.dungeonSystem.maxReachedFloor = this.currentFloor;
    }

    if (this.currentFloor > this.currentDimension * 10) {
      this.currentDimension += 1;
    }

    syncRuntimeGameData({ dungeonSystem: this.dungeonSystem });
    this.dungeonSystem.save();

    this.scene.start('BattleScene', {
      floor: this.currentFloor,
      dimension: this.currentDimension,
      enemies: this.generateEnemiesForFloor(this.currentFloor).map((enemy) => ({
        id: enemy.id,
        name: enemy.name,
        type: enemy.type,
        element: enemy.element,
        hp: enemy.hp || enemy.maxHp,
        maxHp: enemy.maxHp,
        atk: enemy.atk,
        level: enemy.level,
        isBoss: enemy.isBoss,
        dropTable: enemy.dropTable || [],
        skills: enemy.skills || []
      })),
      minions: this.getPlayerTeam(),
      equipmentCard: this.getChipCard()
    });
  }

  onBattleDefeat(data) {
    const currentFloor = data.floor || this.currentFloor;
    const consolationMycelium = Math.floor((10 + currentFloor * 5) * 0.1);

    if (window.gameData.base) {
      window.gameData.base.mycelium = (window.gameData.base.mycelium || 0) + consolationMycelium;
    }

    this.dungeonSystem.returnToBase();
    syncRuntimeGameData({ dungeonSystem: this.dungeonSystem });
    this.dungeonSystem.save();
    this.scene.start('BaseScene');
  }

  shutdown() {
    if (this._eventListeners) {
      EventBus.off('battle:victory', this._eventListeners.battleVictory);
      EventBus.off('battle:defeat', this._eventListeners.battleDefeat);
      this._eventListeners = null;
    }
    this.dungeonSystem?.save();
  }
}
