import { t, getLanguage, setLanguage, SUPPORTED_LANGUAGES } from '../game/data/Lang.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
    this.particles = [];
    this.config = {
      colors: {
        bgDark: 0x0a0a14,
        bgMid: 0x0d0d1d,
        cyan: 0x00ffff,
        magenta: 0xff00ff,
        pink: 0xff66cc,
        purple: 0x9933ff
      },
      animation: {
        particleCount: 30
      }
    };
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.createBackground(width, height);
    this.createTitle(width, height);
    this.createTapToStart(width, height);
    this.createParticles(width, height);

    this.time.addEvent({
      delay: 30,
      callback: () => this.updateParticles(),
      loop: true
    });
  }

  createBackground(width, height) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x080812, 0x080812, 1);
    bg.fillRect(0, 0, width, height);

    const grid = this.add.graphics();
    grid.setAlpha(0.06);
    grid.lineStyle(1, 0x00ffff, 0.3);
    for (let x = 0; x < width; x += 40) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 40) grid.lineBetween(0, y, width, y);

    const decor = this.add.graphics();
    decor.lineStyle(2, 0x00ffff, 0.6);
    decor.lineBetween(20, 20, 60, 20);
    decor.lineBetween(20, 20, 20, 60);
    decor.lineStyle(2, 0xff00ff, 0.6);
    decor.lineBetween(width - 20, 20, width - 60, 20);
    decor.lineBetween(width - 20, 20, width - 20, 60);
    decor.lineStyle(2, 0x00ffff, 0.6);
    decor.lineBetween(20, height - 20, 60, height - 20);
    decor.lineBetween(20, height - 20, 20, height - 60);
    decor.lineStyle(2, 0xff00ff, 0.6);
    decor.lineBetween(width - 20, height - 20, width - 60, height - 20);
    decor.lineBetween(width - 20, height - 20, width - 20, height - 60);
  }

  createTitle(width, height) {
    const title = this.add.text(width / 2, 180, t('game_title_zh'), {
      fontSize: '22px',
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: '#ff66cc'
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, 220, t('game_title_en'), {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#00ffff'
    }).setOrigin(0.5);

    const glow = this.add.graphics();
    glow.fillStyle(0xff66cc, 0.03);
    glow.fillCircle(width / 2, 200, 80);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.5, to: 1 },
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: title,
      alpha: { from: 0.9, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createTapToStart(width, height) {
    const tapHint = this.add.text(width / 2, height - 120, t('tap_to_start'), {
      fontSize: '14px',
      fontFamily: 'Noto Sans SC',
      color: '#8888aa'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: tapHint,
      alpha: { from: 0.4, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.createLanguageSwitch(width);

    const clickArea = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    clickArea.setInteractive();
    clickArea.on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0);
      setTimeout(() => this.scene.start('BaseScene'), 300);
    });
  }

  createLanguageSwitch(width) {
    const langSwitch = this.add.container(width - 35, 35);
    langSwitch.setDepth(100);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-25, -15, 50, 30, 8);
    bg.lineStyle(1, 0xffd700, 0.5);
    bg.strokeRoundedRect(-25, -15, 50, 30, 8);
    langSwitch.add(bg);
    
    const currentLang = getLanguage();
    const langText = currentLang === 'zh_cn' ? '中文' : 'EN';
    
    const text = this.add.text(0, 0, langText, {
      fontSize: '12px',
      fontFamily: 'Noto Sans SC',
      color: '#ffd700'
    }).setOrigin(0.5);
    langSwitch.add(text);
    
    const hitArea = this.add.rectangle(width - 35, 35, 50, 30, 0x000000, 0);
    hitArea.setDepth(101);
    langSwitch.on('pointerdown', () => {
      const newLang = getLanguage() === 'zh_cn' ? 'en_us' : 'zh_cn';
      setLanguage(newLang);
      this.scene.restart();
    });
    
    langSwitch.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2a2a4e, 0.95);
      bg.fillRoundedRect(-25, -15, 50, 30, 8);
      bg.lineStyle(1, 0xffd700, 0.8);
      bg.strokeRoundedRect(-25, -15, 50, 30, 8);
    });
    
    langSwitch.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a1a2e, 0.95);
      bg.fillRoundedRect(-25, -15, 50, 30, 8);
      bg.lineStyle(1, 0xffd700, 0.5);
      bg.strokeRoundedRect(-25, -15, 50, 30, 8);
    });
  }

  createParticles(width, height) {
    const colors = [0x00ffff, 0xff00ff, 0xff66cc, 0xffff00, 0x9933ff];
    for (let i = 0; i < this.config.animation.particleCount; i++) {
      const p = this.add.graphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Phaser.Math.Between(1, 3);
      p.fillStyle(color, Phaser.Math.FloatBetween(0.3, 0.7));
      p.fillCircle(0, 0, size);
      p.x = Phaser.Math.Between(0, width);
      p.y = Phaser.Math.Between(0, height);
      this.particles.push({
        graphics: p,
        speedX: Phaser.Math.FloatBetween(-0.3, 0.3),
        speedY: Phaser.Math.FloatBetween(-0.5, -0.1)
      });
    }
  }

  updateParticles() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.particles.forEach(p => {
      p.graphics.x += p.speedX;
      p.graphics.y += p.speedY;
      if (p.graphics.y < -10) {
        p.graphics.y = height + 10;
        p.graphics.x = Phaser.Math.Between(0, width);
      }
      if (p.graphics.x < -10) p.graphics.x = width + 10;
      if (p.graphics.x > width + 10) p.graphics.x = -10;
    });
  }

  shutdown() {
    this.tweens.killAll();
    this.particles = [];
  }
}
