import DungeonSystem from '../game/systems/DungeonSystem.js';
import EventBus from '../game/EventBus.js';

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

  startAutoBattle(width, height) {
    this.time.delayedCall(1500, () => {
      const players = this.getPlayerTeam();
      const enemies = this.dungeonSystem.generateEnemiesForFloor(this.currentFloor);

      this.scene.start('BattleScene', {
        floor: this.currentFloor,
        dimension: this.currentDimension,
        enemies: enemies.map(e => ({
          id: e.id,
          name: e.name,
          hp: e.currentHp || e.maxHp,
          maxHp: e.maxHp,
          atk: e.atk,
          level: e.level,
          isBoss: e.isBoss
        })),
        players: players
      });
    });
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

  onBattleVictory(data) {
    const currentFloor = data.floor || this.currentFloor;
    this.dungeonSystem.onBattleVictory(currentFloor);
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
    const enemies = this.dungeonSystem.generateEnemiesForFloor(this.currentFloor);

    this.scene.start('BattleScene', {
      floor: this.currentFloor,
      dimension: this.currentDimension,
      enemies: enemies.map(e => ({
        id: e.id,
        name: e.name,
        hp: e.currentHp || e.maxHp,
        maxHp: e.maxHp,
        atk: e.atk,
        level: e.level,
        isBoss: e.isBoss
      })),
      players: players
    });
  }

  onBattleDefeat(data) {
    const currentFloor = data.floor || this.currentFloor;
    const rewards = this.dungeonSystem.calculateRewards(
      this.dungeonSystem.generateEnemiesForFloor(currentFloor)
    );

    if (window.gameData.base) {
      window.gameData.base.coins = (window.gameData.base.coins || 0) + rewards.gold;
    }

    this.dungeonSystem.returnToBase();
    window.gameData.dungeon = this.dungeonSystem.toJSON();
    this.dungeonSystem.save();

    localStorage.setItem('sodaDungeonSave', JSON.stringify(window.gameData));

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
