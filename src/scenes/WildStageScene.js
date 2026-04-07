import Phaser from 'phaser';
import StageData from '../game/data/StageData.js';
import StageManager from '../game/systems/StageManager.js';
import WildStageView from './views/WildStageView.js';

export default class WildStageScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WildStageScene' });
  }

  create() {
    const { width, height } = this.scale.gameSize;
    this.stageManager = new StageManager();

    // 背景
    this.add.graphics()
      .fillGradientStyle(0x1a1815, 0x1a1815, 0x2d2824, 0x2d2824, 1)
      .fillRect(0, 0, width, height);

    // 标题
    this.add.text(width / 2, 30, '野外探索', {
      fontSize: '20px', color: '#d4a574', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 返回按钮
    const backBtn = this.add.text(20, 30, '← 返回', {
      fontSize: '14px', color: '#aaaaaa'
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
      this.scene.start('BaseScene');
    });

    // 关卡视图
    this.view = new WildStageView(this, width, height);
  }
}
