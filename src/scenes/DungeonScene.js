import DungeonSystem from '../game/systems/DungeonSystem.js';
import EventBus from '../game/EventBus.js';

// 从 enemies.json 预加载的敌人数据（构建时通过 import 引入）
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
    this.startAutoBattle(width, height);
  }

  initializeDungeonSystem() {
    if (!window.gameData) {
      window.gameData = {};
    }
    if (!window.gameData.dungeon) {
      window.gameData.dungeon = {};
    }

    this.dungeonSystem = new DungeonSystem(window.gameData.dungeon);
    this.dungeonSystem.load();

    this.currentFloor = this.dungeonSystem.currentFloor;
    this.currentDimension = this.dungeonSystem.currentDimension;
  }

  createBackground(width, height) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      0x1a1815, 0x1a1815,
      0x2d2824, 0x2d2824,
      1
    );
    bg.fillRect(0, 0, width, height);
  }

  showDungeonInfo(width, height) {
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

    this.add.text(width / 2, 210, '🤖 ⚔️ 🤖', {
      fontSize: '32px'
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

  /**
   * 从 enemies.json 数据中获取敌人模板
   * 根据楼层和类型筛选
   */
  getEnemyTemplates(type = null) {
    let templates = enemiesData || [];
    if (type) {
      templates = templates.filter(e => e.type === type);
    }
    return templates;
  }

  /**
   * 生成基于 enemies.json 数据的敌人
   */
  generateEnemyFromData(floorNumber) {
    // 根据楼层决定敌人类型比例
    // 低楼层以变异生物为主，高楼层逐渐出现失心者
    const lostChance = Math.min(0.3, 0.05 + floorNumber * 0.01);
    const isLost = Math.random() < lostChance;
    const type = isLost ? 'lost' : 'mutant';

    const templates = this.getEnemyTemplates(type);
    if (templates.length === 0) {
      // 回退到默认生成
      return this.dungeonSystem.generateEnemy(floorNumber);
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    const hpScale = Math.pow(1.12, floorNumber - 1);
    const atkScale = Math.pow(1.10, floorNumber - 1);

    return {
      id: template.enemyId + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
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

  startAutoBattle(width, height) {
    this.time.delayedCall(1500, () => {
      const players = this.getPlayerTeam();
      const enemies = this.generateEnemiesForFloor(this.currentFloor);
      const chipCard = this.getChipCard();

      this.scene.start('BattleScene', {
        floor: this.currentFloor,
        dimension: this.currentDimension,
        enemies: enemies.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          element: e.element,
          hp: e.hp || e.maxHp,
          maxHp: e.maxHp,
          atk: e.atk,
          level: e.level,
          isBoss: e.isBoss,
          dropTable: e.dropTable || [],
          skills: e.skills || []
        })),
        players: players,
        chipCard: chipCard
      });
    });
  }

  /**
   * 生成当前楼层的敌人列表
   */
  generateEnemiesForFloor(floorNumber) {
    const isBossFloor = floorNumber % 10 === 0;
    const enemyCount = isBossFloor ? 1 : Math.min(3, 1 + Math.floor(floorNumber / 15));

    if (isBossFloor) {
      return [this.generateBossFromData(floorNumber)];
    }

    const enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      enemies.push(this.generateEnemyFromData(floorNumber));
    }
    return enemies;
  }

  /**
   * 从 enemies.json 生成 Boss（使用失心者数据）
   */
  generateBossFromData(floorNumber) {
    const lostTemplates = this.getEnemyTemplates('lost');
    if (lostTemplates.length === 0) {
      return this.dungeonSystem.generateBoss(floorNumber);
    }

    // 根据次元选择不同的失心者 Boss
    const dimensionIndex = Math.min(this.currentDimension - 1, lostTemplates.length - 1);
    const template = lostTemplates[dimensionIndex] || lostTemplates[0];
    const scaleFactor = 1 + (floorNumber - this.currentDimension * 10) * 0.1;

    return {
      id: template.enemyId + '_boss_' + Date.now(),
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

  getChipCard() {
    if (window.gameData && window.gameData.chipCardManager) {
      const equippedId = window.gameData.chipCardManager.equippedCardId;
      if (equippedId) {
        const card = window.gameData.chipCardManager.ownedCards?.find(c => c.id === equippedId);
        return card || null;
      }
    }
    return null;
  }

  getPlayerTeam() {
    if (window.gameData && window.gameData.base && window.gameData.base.team) {
      return window.gameData.base.team.map(char => ({
        id: char.id,
        name: char.name || '冒险者',
        hp: char.maxHp || 100,
        maxHp: char.maxHp || 100,
        atk: char.atk || 20,
        level: char.level || 1
      }));
    }

    return [
      { id: 1, name: '艾伦', hp: 100, maxHp: 100, atk: 20, level: 1 },
      { id: 2, name: '莉莉', hp: 80, maxHp: 80, atk: 25, level: 1 },
      { id: 3, name: '杰克', hp: 120, maxHp: 120, atk: 18, level: 1 }
    ];
  }

  /**
   * 计算战斗奖励（基于敌人的 dropTable）
   */
  calculateBattleRewards(enemies) {
    let mycelium = 0;
    let sourceCore = 0;

    for (const enemy of enemies) {
      const dropTable = enemy.dropTable || [];
      for (const drop of dropTable) {
        const amount = Phaser.Math.Between(drop.min || 0, drop.max || 0);
        if (drop.type === 'mycelium') {
          mycelium += amount;
        } else if (drop.type === 'sourceCore') {
          sourceCore += amount;
        }
      }
    }

    // 额外的楼层/次元加成
    const floorBonus = 1 + (this.currentFloor - 1) * 0.15;
    const dimensionBonus = 1 + (this.currentDimension - 1) * 0.5;
    mycelium = Math.floor(mycelium * floorBonus * dimensionBonus);

    return { mycelium, sourceCore };
  }

  onBattleVictory(data) {
    const currentFloor = data.floor || this.currentFloor;
    const isBossFloor = currentFloor % 10 === 0;

    // 使用基于 dropTable 的奖励计算
    const enemies = this.generateEnemiesForFloor(currentFloor);
    const rewards = this.calculateBattleRewards(enemies);

    if (window.gameData.base) {
      window.gameData.base.mycelium = (window.gameData.base.mycelium || 0) + rewards.mycelium;
      window.gameData.base.sourceCore = (window.gameData.base.sourceCore || 0) + rewards.sourceCore;
    }

    // 如果有芯片掉落，添加到背包
    if (Math.random() < 0.15 + this.currentDimension * 0.05 && window.gameData.chipCardManager) {
      window.gameData.chipCardManager.addCard({
        id: 'chip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        quality: ['N', 'R', 'SR'][Math.floor(Math.random() * 3)],
        star: 1,
        hpPercent: Math.floor(Math.random() * 10) + 2,
        atkPercent: Math.floor(Math.random() * 8) + 1
      });
    }

    this.dungeonSystem.onBattleVictory(currentFloor, isBossFloor);
    this.currentFloor++;

    if (this.currentFloor > this.dungeonSystem.maxReachedFloor) {
      this.dungeonSystem.maxReachedFloor = this.currentFloor;
    }

    if (this.currentFloor > this.currentDimension * 10) {
      this.currentDimension++;
    }

    window.gameData.dungeon = this.dungeonSystem.toJSON();
    this.dungeonSystem.save();

    const players = this.getPlayerTeam();
    const nextEnemies = this.generateEnemiesForFloor(this.currentFloor);
    const chipCard = this.getChipCard();

    this.scene.start('BattleScene', {
      floor: this.currentFloor,
      dimension: this.currentDimension,
      enemies: nextEnemies.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        element: e.element,
        hp: e.hp || e.maxHp,
        maxHp: e.maxHp,
        atk: e.atk,
        level: e.level,
        isBoss: e.isBoss,
        dropTable: e.dropTable || [],
        skills: e.skills || []
      })),
      players: players,
      chipCard: chipCard
    });
  }

  onBattleDefeat(data) {
    const currentFloor = data.floor || this.currentFloor;
    const enemies = this.generateEnemiesForFloor(currentFloor);
    const rewards = this.calculateBattleRewards(enemies);

    if (window.gameData.base) {
      window.gameData.base.mycelium = (window.gameData.base.mycelium || 0) + rewards.mycelium;
      window.gameData.base.sourceCore = (window.gameData.base.sourceCore || 0) + rewards.sourceCore;
    }

    // 如果有芯片掉落，添加到背包
    if (Math.random() < 0.15 + this.currentDimension * 0.05 && window.gameData.chipCardManager) {
      window.gameData.chipCardManager.addCard({
        id: 'chip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        quality: ['N', 'R', 'SR'][Math.floor(Math.random() * 3)],
        star: 1,
        hpPercent: Math.floor(Math.random() * 10) + 2,
        atkPercent: Math.floor(Math.random() * 8) + 1
      });
    }

    this.dungeonSystem.returnToBase();
    window.gameData.dungeon = this.dungeonSystem.toJSON();
    this.dungeonSystem.save();

    localStorage.setItem('wasteland_year_save', JSON.stringify(window.gameData));

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
