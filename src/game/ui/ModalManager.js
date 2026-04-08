import Const from '../data/Const.js';
import AnimationHelper from '../utils/AnimationHelper.js';

/**
 * 统一的模态框管理器
 * 支持 z-index 自动递增、栈式管理、动画
 */
export default class ModalManager {
  constructor(scene) {
    this.scene = scene;
    this._stack = [];
    this._baseDepth = Const.DEPTH.MODAL_OVERLAY;
  }

  /**
   * 显示模态框
   * @param {Object} config
   * @param {string} config.title - 标题
   * @param {string} config.desc - 描述文本
   * @param {Array} config.buttons - 按钮数组 [{text, offsetX, width, bgColor, textColor, callback}]
   * @param {number} [config.borderColor] - 边框颜色
   * @param {number} [config.titleColor] - 标题颜色
   * @param {boolean} [config.closeOnOverlay=true] - 点击遮罩是否关闭
   * @returns {Object} { close } 可手动关闭
   */
  show(config) {
    const { title, desc, buttons = [], borderColor = Const.COLORS.PURPLE, titleColor = Const.TEXT_COLORS.PINK, closeOnOverlay = true } = config;
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const depthOffset = this._stack.length * 10;
    const elements = [];

    // 遮罩
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(this._baseDepth + depthOffset);
    overlay.setAlpha(0);
    elements.push(overlay);

    if (closeOnOverlay) {
      overlay.setInteractive();
      overlay.on('pointerdown', () => close());
    }

    // 弹窗背景
    const modalW = Const.UI.MODAL_WIDTH;
    const modalH = Const.UI.MODAL_HEIGHT;
    const modal = this.scene.add.graphics();
    modal.setDepth(this._baseDepth + 1 + depthOffset);
    modal.fillStyle(Const.COLORS.BG_MID, 1);
    modal.fillRoundedRect(width/2 - modalW/2, height/2 - modalH/2, modalW, modalH, Const.UI.MODAL_RADIUS);
    modal.lineStyle(2, borderColor, 0.8);
    modal.strokeRoundedRect(width/2 - modalW/2, height/2 - modalH/2, modalW, modalH, Const.UI.MODAL_RADIUS);
    modal.setAlpha(0);
    elements.push(modal);

    // 标题
    const titleText = this.scene.add.text(width/2, height/2 - 50, title, {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: titleColor
    }).setOrigin(0.5).setDepth(this._baseDepth + 2 + depthOffset);
    titleText.setAlpha(0);
    elements.push(titleText);

    // 描述
    const descText = this.scene.add.text(width/2, height/2 - 15, desc, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY,
      align: 'center',
      wordWrap: { width: modalW - 40 }
    }).setOrigin(0.5).setDepth(this._baseDepth + 2 + depthOffset);
    descText.setAlpha(0);
    elements.push(descText);

    // 按钮
    buttons.forEach((btn) => {
      const btnContainer = this.scene.add.container(width/2 + (btn.offsetX || 0), height/2 + 40).setDepth(this._baseDepth + 2 + depthOffset);
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(btn.bgColor || Const.COLORS.BUTTON_SECONDARY, 1);
      btnBg.fillRoundedRect(-btn.width/2, -14, btn.width, 28, Const.UI.BUTTON_RADIUS);
      const btnLabel = this.scene.add.text(0, 0, btn.text, {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: btn.textColor || Const.TEXT_COLORS.PRIMARY
      }).setOrigin(0.5);
      btnContainer.add([btnBg, btnLabel]);
      btnContainer.setSize(btn.width, 28);
      btnContainer.setInteractive(new Phaser.Geom.Rectangle(-btn.width/2, -14, btn.width, 28), Phaser.Geom.Rectangle.Contains);
      btnContainer.setAlpha(0);
      btnContainer.on('pointerdown', () => close(btn.callback));
      elements.push(btnContainer);
    });

    // 入场动画
    this.scene.tweens.add({
      targets: elements,
      alpha: 1,
      duration: 150,
      ease: 'Power2'
    });

    const close = (callback) => {
      this.scene.tweens.add({
        targets: elements,
        alpha: 0,
        duration: 120,
        ease: 'Power2',
        onComplete: () => {
          elements.forEach(el => { if (el?.destroy) el.destroy(); });
          const idx = this._stack.indexOf(entry);
          if (idx !== -1) this._stack.splice(idx, 1);
          if (callback) callback();
        }
      });
    };

    const entry = { elements, close };
    this._stack.push(entry);
    return entry;
  }

  /** 关闭栈顶模态框 */
  closeTop() {
    if (this._stack.length > 0) {
      this._stack[this._stack.length - 1].close();
    }
  }

  /** 关闭所有模态框 */
  closeAll() {
    while (this._stack.length > 0) {
      this._stack[this._stack.length - 1].close();
    }
  }

  /** 是否有打开的模态框 */
  get isOpen() {
    return this._stack.length > 0;
  }

  /** 销毁管理器 */
  destroy() {
    this.closeAll();
  }
}
