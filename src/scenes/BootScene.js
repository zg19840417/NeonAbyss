import ResponsiveUtils, { DesignWidth, DesignHeight } from '../utils/ResponsiveUtils.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
    this.responsive = null;
    this._boundResize = null;
  }

  preload() {
  }

  create() {
    this.setupResponsive();
    this.setupGameScale();
    this.scene.start('PreloadScene');
  }

  setupResponsive() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.responsive = ResponsiveUtils.getInstance();
    this.responsive.update(width, height);

    this._boundResize = this._onResize.bind(this);
    
    window.addEventListener('resize', this._boundResize);
    window.addEventListener('orientationchange', this._boundResize);
  }

  _onResize() {
    if (!this.game || !this.game.scale) return;
    
    const width = this.scale.width;
    const height = this.scale.height;

    if (this.responsive) {
      this.responsive.update(width, height);
    }

    this.scale.setGameSize(width, height);

    const resizeEvent = new CustomEvent('gameResize', {
      detail: {
        width: width,
        height: height,
        orientation: width > height ? 'landscape' : 'portrait',
        responsive: this.responsive
      }
    });
    window.dispatchEvent(resizeEvent);
  }

  setupGameScale() {
    const config = this.sys.game.config;
    const baseWidth = parseInt(config.width) || DesignWidth;
    const baseHeight = parseInt(config.height) || DesignHeight;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      this.scale.setParentSize(baseWidth, baseHeight);
      this.scale.setGameSize(baseWidth, baseHeight);
    }
  }

  shutdown() {
    window.removeEventListener('resize', this._boundResize);
    window.removeEventListener('orientationchange', this._boundResize);
    this.tweens.killAll();
  }
}
