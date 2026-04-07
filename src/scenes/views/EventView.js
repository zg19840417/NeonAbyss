export default class EventView {
  /**
   * 显示事件弹窗
   * @param {Phaser.Scene} scene
   * @param {Object} config - { type, title, content, rewards, onContinue }
   */
  static show(scene, config) {
    const { width, height } = scene.scale.gameSize;

    // 遮罩
    const overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    // 弹窗背景
    const boxW = width - 40;
    const boxH = 300;
    const boxX = 20;
    const boxY = (height - boxH) / 2;

    const box = scene.add.graphics();
    box.fillStyle(0x2d2824, 1);
    box.fillRoundedRect(boxX, boxY, boxW, boxH, 8);
    box.lineStyle(2, 0xd4a574, 1);
    box.strokeRoundedRect(boxX, boxY, boxW, boxH, 8);

    // 标题
    const titleColors = { story: '#4dabf7', trade: '#ffd43b', random: '#aa88ff' };
    scene.add.text(width / 2, boxY + 25, config.title || '事件', {
      fontSize: '16px', color: titleColors[config.type] || '#d4a574', fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 内容
    scene.add.text(width / 2, boxY + boxH / 2 - 20, config.content || '', {
      fontSize: '13px', color: '#e0e0e0', fontFamily: 'Arial',
      wordWrap: { width: boxW - 40 }, align: 'center'
    }).setOrigin(0.5, 0);

    // 继续按钮
    const continueBtn = scene.add.text(width / 2, boxY + boxH - 40, '确认', {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#4a6a4a',
      padding: { x: 30, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerdown', () => {
      overlay.destroy();
      box.destroy();
      continueBtn.destroy();
      if (config.onContinue) config.onContinue();
    });
  }
}
