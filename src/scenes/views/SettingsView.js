export default class SettingsView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const { t } = this.scene;
    const { Const } = this.scene;

    const settings = [
      { label: t('se_volume'), value: Math.floor((window.gameData?.settings?.seVolume || 0.8) * 100) + '%' },
      { label: t('bgm_volume'), value: Math.floor((window.gameData?.settings?.bgmVolume || 0.7) * 100) + '%' }
    ];

    const startY = 130;
    settings.forEach((setting, index) => {
      const y = startY + index * 60;

      const card = this.scene.add.graphics();
      card.fillStyle(Const.COLORS.BG_MID, 0.9);
      card.fillRoundedRect(width/2 - 120, y - 22, 240, 44, Const.UI.CARD_RADIUS_SMALL);
      card.lineStyle(1, Const.COLORS.BUTTON_SECONDARY, 0.5);
      card.strokeRoundedRect(width/2 - 120, y - 22, 240, 44, Const.UI.CARD_RADIUS_SMALL);
      this.elements.push(card);

      this.addText(width/2 - 100, y, setting.label, {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.PRIMARY
      }, 0, 0.5);

      this.addText(width/2 + 80, y, setting.value, {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_EN,
        color: Const.TEXT_COLORS.CYAN
      }, 1, 0.5);
    });

    this.addText(width / 2, 280, t('danger_zone'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DANGER
    });

    this.createResetButton(width / 2, 320);

    this.addText(width / 2, height - 130, '废土元年 v2.0.0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#6666aa'
    });
  }

  createResetButton(x, y) {
    const { Const, t } = this.scene;

    const resetBtn = this.scene.add.container(x, y);

    const resetGlow = this.scene.add.graphics();
    resetGlow.fillStyle(Const.COLORS.MAGENTA, 0.15);
    resetGlow.fillRoundedRect(-75, -20, 150, 40, Const.UI.CARD_RADIUS_SMALL);
    resetGlow.setBlendMode(Phaser.BlendModes.ADD);
    resetGlow.setAlpha(0.5);

    const resetBg = this.scene.add.graphics();
    resetBg.fillStyle(Const.COLORS.BG_DANGER, 1);
    resetBg.fillRoundedRect(-70, -16, 140, 32, Const.UI.BUTTON_RADIUS);
    resetBg.lineStyle(1, Const.COLORS.BUTTON_DANGER_BORDER, 0.8);
    resetBg.strokeRoundedRect(-70, -16, 140, 32, Const.UI.BUTTON_RADIUS);

    const resetLabel = this.scene.add.text(0, 0, t('reset_progress'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5);

    resetBtn.add([resetGlow, resetBg, resetLabel]);
    resetBtn.setSize(140, 32);
    resetBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 140, 32), Phaser.Geom.Rectangle.Contains);

    resetBtn.on('pointerover', () => {
      this.scene.tweens.add({ targets: resetGlow, alpha: 0.8, duration: 150 });
      resetLabel.setColor(Const.TEXT_COLORS.PRIMARY);
    });

    resetBtn.on('pointerout', () => {
      this.scene.tweens.add({ targets: resetGlow, alpha: 0.5, duration: 150 });
      resetLabel.setColor(Const.TEXT_COLORS.DANGER);
    });

    resetBtn.on('pointerdown', () => {
      this.scene.showResetConfirm();
    });

    this.elements.push(resetBtn);
    return resetBtn;
  }

  addText(x, y, text, options = {}, originX = 0.5, originY = 0.5) {
    const textObj = this.scene.add.text(x, y, text, options).setOrigin(originX, originY);
    this.elements.push(textObj);
    return textObj;
  }

  destroy() {
    this.elements.forEach(el => el.destroy());
    this.elements = [];
  }
}
