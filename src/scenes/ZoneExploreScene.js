import Phaser from 'phaser';
import ZoneManager from '../game/systems/ZoneManager.js';
import ZoneExploreView from './views/ZoneExploreView.js';
import { syncRuntimeGameData } from '../game/data/GameData.js';
import Const from '../game/data/Const.js';

export default class ZoneExploreScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ZoneExploreScene' });
  }

  init(data) {
    this.zoneId = data.zoneId || null;
  }

  create() {
    const { width, height } = this.scale.gameSize;

    if (!this.zoneId) {
      this.scene.start(Const.SCENES.WILD_STAGE);
      return;
    }

    this.zoneManager = new ZoneManager();
    this.zoneManager.enterZone(this.zoneId);

    // 背景
    this.add.graphics()
      .fillGradientStyle(Const.COLORS.BG_DARK, Const.COLORS.BG_DARK, Const.COLORS.BG_MID, Const.COLORS.BG_MID, 1)
      .fillRect(0, 0, width, height);

    // 标题
    const zoneInfo = this.zoneManager.getZoneInfo();
    this.add.text(width / 2, 30, zoneInfo?.zoneName || '禁区', {
      fontSize: '20px', color: Const.TEXT_COLORS.GOLD, fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 返回按钮
    const backBtn = this.add.text(20, 30, '← 返回', {
      fontSize: '14px', color: '#aaaaaa'
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.scene.start(Const.SCENES.WILD_STAGE);
    });

    // 禁区视图
    this.view = new ZoneExploreView(this, width, height);
  }

  saveZoneData() {
    syncRuntimeGameData({ zoneManager: this.zoneManager });
  }

  shutdown() {
    if (this.zoneManager) {
      // 保存区域数据
      this.saveZoneData?.();
    }
  }
}
