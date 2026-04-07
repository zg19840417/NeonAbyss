import Phaser from 'phaser';
import ZoneManager from '../game/systems/ZoneManager.js';
import ZoneExploreView from './views/ZoneExploreView.js';

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
      this.scene.start('WildStageScene');
      return;
    }

    this.zoneManager = new ZoneManager();
    this.zoneManager.enterZone(this.zoneId);

    // 背景
    this.add.graphics()
      .fillGradientStyle(0x1a1815, 0x1a1815, 0x2d2824, 0x2d2824, 1)
      .fillRect(0, 0, width, height);

    // 标题
    const zoneInfo = this.zoneManager.getZoneInfo();
    this.add.text(width / 2, 30, zoneInfo?.zoneName || '禁区', {
      fontSize: '20px', color: '#d4a574', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 返回按钮
    const backBtn = this.add.text(20, 30, '← 返回', {
      fontSize: '14px', color: '#aaaaaa'
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.scene.start('WildStageScene');
    });

    // 禁区视图
    this.view = new ZoneExploreView(this, width, height);
  }
}
