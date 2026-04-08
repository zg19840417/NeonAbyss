import Const from '../game/data/Const.js';
import { ensureGlobalGameData } from '../game/data/GameData.js';
import { extractPortraitKey } from '../game/utils/PortraitRegistry.js';

const uiAssetUrls = import.meta.glob('../../assets/images/ui/*.jpg', {
  eager: true,
  import: 'default'
});

const placeholderAssetUrls = import.meta.glob('../../assets/images/characters/placeholder-*.jpg', {
  eager: true,
  import: 'default'
});

const fusionPortraitUrls = import.meta.glob('../../assets/images/characters/fusion/*.png', {
  eager: true,
  import: 'default'
});

const bossPortraitUrls = import.meta.glob('../../assets/images/characters/boss/*.png', {
  eager: true,
  import: 'default'
});

function findAssetUrl(assetMap, fileName) {
  const entry = Object.entries(assetMap).find(([path]) => path.endsWith(`/${fileName}`));
  return entry ? entry[1] : null;
}

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
    this.config = this.initConfig();
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

    const qualities = ['N', 'R', 'SR', 'SSR', 'UR', 'LE'];
    qualities.forEach((quality) => {
      const assetUrl = findAssetUrl(uiAssetUrls, `card-frame-${quality}.jpg`);
      if (assetUrl) {
        this.load.image(`card-frame-${quality}`, assetUrl);
      }
    });

    ['water', 'fire', 'wind', 'light', 'dark'].forEach((element) => {
      const assetUrl = findAssetUrl(placeholderAssetUrls, `placeholder-${element}.jpg`);
      if (assetUrl) {
        this.load.image(`portrait-placeholder-${element}`, assetUrl);
      }
    });

    const chipIconUrl = findAssetUrl(uiAssetUrls, 'chip-icon-set.jpg');
    if (chipIconUrl) {
      this.load.image('chip-icon-set', chipIconUrl);
    }

    [...Object.entries(fusionPortraitUrls), ...Object.entries(bossPortraitUrls)].forEach(([filePath, assetUrl]) => {
      const portraitKey = extractPortraitKey(filePath);
      if (portraitKey && assetUrl) {
        this.load.image(portraitKey, assetUrl);
      }
    });

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(this.config.colors.amber, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      tipText.setText(`加载进度: ${Math.floor(value * 100)}%`);
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
      tipText.setText('部分资源加载失败，继续进入游戏...');
    });

    this.initializeGameData();
  }

  initializeGameData() {
    ensureGlobalGameData();
  }

  loadSavedData() {
    ensureGlobalGameData();
    console.log('存档已恢复');
  }

  create() {}
}
