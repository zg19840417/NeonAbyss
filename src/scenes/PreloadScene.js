import Const from '../game/data/Const.js';
import initConfigData from '../../assets/data/json/initConfig.json';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
    this.config = this.initConfig();
  }

  normalizeInitConfig(rawConfig) {
    const fallback = {
      currencies: {
        mycelium: Const.INITIAL_CURRENCY.mycelium,
        sourceCore: Const.INITIAL_CURRENCY.sourceCore,
        starCoin: Const.INITIAL_CURRENCY.starCoin
      },
      other: {
        energyDrinks: 0
      }
    };

    if (!Array.isArray(rawConfig)) {
      return fallback;
    }

    const currencies = { ...fallback.currencies };
    rawConfig.forEach(entry => {
      if (!entry?.key) return;
      const value = Number(entry.initialValue);
      currencies[entry.key] = Number.isFinite(value) ? value : 0;
    });

    return {
      currencies,
      other: { ...fallback.other }
    };
  }

  initConfig() {
    return {
      colors: {
        bgDark: 0x1a1815,
        bgMid: 0x252220,
        amber: 0xd4a574,
        textPrimary: '#d4ccc0',
        textSecondary: '#8a7a6a'
      }
    };
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x222222, 0.8);
    progressBg.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    progressBg.lineStyle(1, this.config.colors.amber, 0.3);
    progressBg.strokeRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const progressBar = this.add.graphics();
    progressBar.setName('progressBar');

    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '16px',
      fill: this.config.colors.textPrimary,
      fontFamily: 'Noto Sans SC'
    }).setOrigin(0.5);

    const tipText = this.add.text(width / 2, height / 2 + 40, '正在初始化游戏资源', {
      fontSize: '12px',
      fill: this.config.colors.textSecondary,
      fontFamily: 'Noto Sans SC'
    }).setOrigin(0.5);

    // 加载卡框图片资源
    const qualities = ['N', 'R', 'SR', 'SSR', 'UR', 'LE'];
    qualities.forEach(q => {
      this.load.image(`card-frame-${q}`, `assets/images/ui/card-frame-${q}.jpg`);
    });

    // 加载元素占位立绘
    const elements = ['water', 'fire', 'wind', 'light', 'dark'];
    elements.forEach(e => {
      this.load.image(`portrait-placeholder-${e}`, `assets/images/characters/placeholder-${e}.jpg`);
    });

    // 加载芯片图标集
    this.load.image('chip-icon-set', 'assets/images/ui/chip-icon-set.jpg');

    // 加载随从立绘（fusion 目录）
    const fusionPortraits = [
      'FM001',
      'FM002',
      'FM003',
      'FM004',
      'FM005',
      'FM006',
      'FM007',
      'FM008',
      'FM009',
      'FM010',
      'FM011',
      'FM012',
      'FM013',
      'FM014', 
      'FM015',
      'FM016',
      'FM020',
      'FM032',
      'FM033',
      'FM035',
      'FM036',
      'FM037',
      'FM039',
      'FM043',
      'FM044',
      'FM046',
      'FM048',
      'FM049',
      'FM053',
      'FM057',
      'FM058',
      'FM095'
    ];
    fusionPortraits.forEach(name => {
      this.load.image(name, `assets/images/characters/fusion/${name}.png`);
    });

    // 加载Boss立绘（boss 目录）
    const bossPortraits = [
      { key: 'B001', path: 'assets/images/characters/boss/B001.png' },
      { key: 'B002', path: 'assets/images/characters/boss/B002.png' },
      { key: 'B005', path: 'assets/images/characters/boss/B005.png' },
      { key: 'B006', path: 'assets/images/characters/boss/B006.png' },
      { key: 'B010', path: 'assets/images/characters/boss/B010.png' }
    ];
    bossPortraits.forEach(({ key, path }) => {
      this.load.image(key, path);
    });

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(this.config.colors.amber, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      
      const percent = Math.floor(value * 100);
      tipText.setText(`加载进度: ${percent}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBg.destroy();
      loadingText.destroy();
      tipText.destroy();
      this.scene.start('MainMenuScene');
    });

    this.load.on('loaderror', (file) => {
      console.warn('Load error (non-fatal):', file.key);
      tipText.setText('部分资源加载失败，继续中...');
    });

    this.initializeGameData();
  }

  initializeGameData() {
    const initConfig = this.normalizeInitConfig(initConfigData);

    if (!window.gameData) {
      window.gameData = {};
    }

    if (!window.gameData.base) {
      window.gameData.base = {
        mycelium: initConfig.currencies.mycelium,
        sourceCore: initConfig.currencies.sourceCore,
        starCoin: initConfig.currencies.starCoin,
        currencies: { ...initConfig.currencies },
        facilities: null,
        characters: [],
        team: [
          { id: 1, name: '艾伦', maxHp: 100, hp: 100, atk: 20, level: 1 },
          { id: 2, name: '莉莉', maxHp: 80, hp: 80, atk: 25, level: 1 },
          { id: 3, name: '杰克', maxHp: 120, hp: 120, atk: 18, level: 1 }
        ],
        availableRecruits: []
      };
    }

    if (!window.gameData.dungeon) {
      window.gameData.dungeon = {
        currentFloor: 1,
        maxReachedFloor: 1,
        currentDimension: 1,
        totalBattlesWon: 0,
        totalGoldEarned: 0,
        offlineProgress: {
          enabled: false,
          lastBattleTime: Date.now(),
          battlesWon: 0,
          goldEarned: 0
        }
      };
    }

    if (!window.gameData.settings) {
      window.gameData.settings = {
        masterVolume: 0.8,
        bgmVolume: 0.7,
        seVolume: 0.8,
        autoBattle: true,
        autoChip: true,
        battleSpeed: 1
      };
    }

    if (!window.gameData.achievements) {
      window.gameData.achievements = {
        progress: {},
        unlocked: [],
        claimedRewards: []
      };
    }

    this.loadSavedData();
  }

  loadSavedData() {
    try {
      const saved = localStorage.getItem('wasteland_year_save');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        if (parsed.base) {
          window.gameData.base = parsed.base;
        }
        if (parsed.dungeon) {
          window.gameData.dungeon = parsed.dungeon;
        }
        if (parsed.settings) {
          window.gameData.settings = parsed.settings;
        }
        if (parsed.achievements) {
          window.gameData.achievements = parsed.achievements;
        }
        
        console.log('存档已恢复');
      }
    } catch (e) {
      console.warn('存档加载失败，使用默认数据:', e);
    }
  }

  create() {
  }
}
