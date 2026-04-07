export default class BranchSelectView {
  /**
   * 显示分支选择UI
   * @param {Phaser.Scene} scene
   * @param {Object} config - { branchCount, onSelect }
   */
  static show(scene, config) {
    const { width, height } = scene.scale.gameSize;
    const { branchCount = 2, onSelect } = config;

    const btnWidth = Math.min(140, (width - 60) / branchCount - 10);
    const totalW = btnWidth * branchCount + 10 * (branchCount - 1);
    const startX = (width - totalW) / 2;
    const y = height / 2;

    scene.add.text(width / 2, y - 50, '选择路径', {
      fontSize: '16px', color: '#d4a574', fontFamily: 'Arial'
    }).setOrigin(0.5);

    for (let i = 0; i < branchCount; i++) {
      const bx = startX + i * (btnWidth + 10);
      const btn = scene.add.text(bx + btnWidth / 2, y, `路径 ${i + 1}`, {
        fontSize: '14px', color: '#ffffff', backgroundColor: '#3d5a3d',
        padding: { x: 15, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        if (onSelect) onSelect(i);
      });

      btn.on('pointerover', () => {
        btn.setBackgroundColor('#4a7a4a');
      });

      btn.on('pointerout', () => {
        btn.setBackgroundColor('#3d5a3d');
      });
    }
  }
}
