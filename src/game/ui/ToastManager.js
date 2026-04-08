import Const from '../data/Const.js';

/**
 * 统一的 Toast 轻提示管理器
 * 替代 BaseScene.showToast() 和 ShopView.showToast()
 */
export default class ToastManager {
  constructor(scene) {
    this.scene = scene;
    this._current = null;
  }

  /**
   * 显示 Toast
   * @param {string} message - 消息文本
   * @param {Object} [options]
   * @param {'info'|'success'|'error'} [options.type='info'] - 类型
   * @param {number} [options.duration=2000] - 显示时长(ms)
   * @param {number} [options.y=120] - Y 坐标
   */
  show(message, options = {}) {
    const { type = 'info', duration = 2000, y = 120 } = options;

    // 如果有当前 toast，立即销毁
    if (this._current) {
      this._current.bg.destroy();
      this._current.text.destroy();
      this._current = null;
    }

    const width = this.scene.cameras.main.width;

    const typeConfig = {
      info: { bg: 0x2a2520, border: 0xa8d8a8, color: '#d4ccc0' },
      success: { bg: 0x003300, border: 0x00ff88, color: '#00ff88' },
      error: { bg: 0x330000, border: 0xff6b6b, color: '#ff6666' }
    };
    const cfg = typeConfig[type] || typeConfig.info;

    const toastBg = this.scene.add.rectangle(
      width / 2, y,
      Math.min(message.length * 16 + 40, width - 40), 36,
      cfg.bg, 0.92
    ).setStrokeStyle(1, cfg.border).setDepth(2000);

    const toastText = this.scene.add.text(width / 2, y, message, {
      fontSize: '14px',
      fontFamily: 'Noto Sans SC',
      color: cfg.color,
      wordWrap: { width: width - 60 }
    }).setOrigin(0.5).setDepth(2001);

    this._current = { bg: toastBg, text: toastText };

    this.scene.tweens.add({
      targets: [toastBg, toastText],
      alpha: 0,
      delay: duration,
      duration: 300,
      onComplete: () => {
        toastBg.destroy();
        toastText.destroy();
        if (this._current?.bg === toastBg) {
          this._current = null;
        }
      }
    });
  }

  destroy() {
    if (this._current) {
      this._current.bg.destroy();
      this._current.text.destroy();
      this._current = null;
    }
  }
}
