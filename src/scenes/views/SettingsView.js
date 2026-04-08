import AnimationHelper from '../../game/utils/AnimationHelper.js';

export default class SettingsView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const { t, Const } = this.scene;

    // === 账号绑定区 ===
    this.addText(width / 2, 138, '账号', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.CYAN
    });

    const bindCard = this.scene.add.container(width / 2, 210);
    const bindBg = this.scene.add.graphics();
    bindBg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bindBg.fillRoundedRect(-140, -38, 280, 76, Const.UI.CARD_RADIUS);
    bindBg.lineStyle(1.5, Const.COLORS.BUTTON_CYAN, 0.65);
    bindBg.strokeRoundedRect(-140, -38, 280, 76, Const.UI.CARD_RADIUS);
    bindCard.add(bindBg);
    this.elements.push(bindCard);

    bindCard.add(this.scene.add.text(-116, -10, '绑定账号', {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5));

    bindCard.add(this.scene.add.text(-116, 16, '功能预留，后续接入账号 SDK', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5));

    const bindBtn = this.scene.add.container(92, 0);
    const bindBtnBg = this.scene.add.graphics();
    bindBtnBg.fillStyle(Const.COLORS.BUTTON_SECONDARY, 1);
    bindBtnBg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.9);
    bindBtnBg.fillRoundedRect(-42, -16, 84, 32, Const.UI.BUTTON_RADIUS);
    bindBtnBg.strokeRoundedRect(-42, -16, 84, 32, Const.UI.BUTTON_RADIUS);
    bindBtn.add(bindBtnBg);
    bindBtn.add(this.scene.add.text(0, 0, '敬请期待', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5));
    bindBtn.setSize(84, 32);
    bindBtn.setInteractive(new Phaser.Geom.Rectangle(-42, -16, 84, 32), Phaser.Geom.Rectangle.Contains);
    bindBtn.on('pointerdown', () => {
      this.scene.showToast('账号绑定功能暂未接入 SDK');
    });
    bindCard.add(bindBtn);
    this.elements.push(bindBtn);

    // === 音量设置 ===
    const settings = [
      { label: t('se_volume'), value: Math.floor((window.gameData?.settings?.seVolume || 0.8) * 100) + '%' },
      { label: t('bgm_volume'), value: Math.floor((window.gameData?.settings?.bgmVolume || 0.7) * 100) + '%' }
    ];

    const startY = 280;
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

    this.addText(width / 2, 430, t('danger_zone'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DANGER
    });

    this.createResetButton(width / 2, 470);

    this.createLanguageButton(width / 2, 530);

    this.addText(width / 2, height - 130, t('game_title_zh') + ' v1.0.0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#6666aa'
    });
  }

  createLanguageButton(x, y) {
    const { Const, getLanguage, setLanguage } = this.scene;
    
    const currentLang = getLanguage();
    const langText = currentLang === 'zh_cn' ? '中文' : 'English';
    
    const btn = this.scene.add.container(x, y);
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 1);
    bg.fillRoundedRect(-60, -18, 120, 36, Const.UI.BUTTON_RADIUS);
    btn.add(bg);
    
    const label = this.scene.add.text(0, 0, t('language') + ': ' + langText, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5);
    btn.add(label);
    
    btn.setSize(120, 36);
    btn.setInteractive(new Phaser.Geom.Rectangle(-60, -18, 120, 36), Phaser.Geom.Rectangle.Contains);
    
    btn.on('pointerdown', () => {
      const newLang = getLanguage() === 'zh_cn' ? 'en_us' : 'zh_cn';
      setLanguage(newLang);
      this.scene.saveGameData();
      this.scene.scene.restart();
    });
    
    btn.on('pointerover', () => {
      AnimationHelper.tweenPulse(this.scene, btn, 1.05);
    });
    
    btn.on('pointerout', () => {
      btn.setScale(1);
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
