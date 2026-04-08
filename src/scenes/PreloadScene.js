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

// 懒加载的立绘资源映射
const fusionPortraitUrls = import.meta.glob('../../assets/images/characters/fusion/*.png', {
  eager: false,
  import: 'default'
});

const bossPortraitUrls = import.meta.glob('../../assets/images/characters/boss/*.png', {
  eager: false,
  import: 'default'
});

function findAssetUrl(assetMap, fileName) {
  const entry = Object.entries(assetMap).find(([path]) => path.endsWith(`/${fileName}`));
  return entry ? entry[1] : null;
}

/**
 * 按需加载单张立绘
 * @param {Phaser.Scene} scene - Phaser场景实例
 * @param {string} key - 立绘键名（如 'FM001', 'B002'）
 * @returns {Promise<void>}
 */
export async function loadPortrait(scene, key) {
  if (scene.textures.exists(key)) return; // 已加载则跳过

  const allMaps = { ...fusionPortraitUrls, ...bossPortraitUrls };
  const entry = Object.entries(allMaps).find(([path]) => path.endsWith(`/${key}.png`));
  if (!entry) return;

  const [_, loader] = entry;
  const assetUrl = await loader();
  if (assetUrl) {
    scene.load.image(key, assetUrl);
    return new Promise(resolve => {
      scene.load.once(`filecomplete-image-${key}`, resolve);
      scene.load.start();
    });
  }
}

/**
 * 批量预加载立绘
 * @param {Phaser.Scene} scene - Phaser场景实例
 * @param {string[]} keys - 立绘键名数组
 */
export async function preloadPortraits(scene, keys) {
  const promises = keys.map(key => loadPortrait(scene, key));
  await Promise.all(promises);
}

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
    this.config = {
      colors: {
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

    const tipText = this.add.text(width / 2, height / 2 + 40, '正在初始化游戏资源...', {
      fontSize: '12px',
      fill: this.config.colors.textSecondary,
      fontFamily: 'Noto Sans SC'
    }).setOrigin(0.5);

    // 仅加载核心UI资源
    const qualities = ['N', 'R', 'SR', 'SSR', 'UR', 'LE'];
    qualities.forEach((quality) => {
      const assetUrl = findAssetUrl(uiAssetUrls, `card-frame-${quality}.jpg`);
      if (assetUrl) this.load.image(`card-frame-${quality}`, assetUrl);
    });

    ['water', 'fire', 'wind', 'light', 'dark'].forEach((element) => {
      const assetUrl = findAssetUrl(placeholderAssetUrls, `placeholder-${element}.jpg`);
      if (assetUrl) this.load.image(`portrait-placeholder-${element}`, assetUrl);
    });

    const chipIconUrl = findAssetUrl(uiAssetUrls, 'chip-icon-set.jpg');
    if (chipIconUrl) this.load.image('chip-icon-set', chipIconUrl);

    // 角色立绘改为按需加载，不再预加载
    // 使用 loadPortrait(scene, key) 或 preloadPortraits(scene, keys) 按需加载

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
