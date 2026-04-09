/**
 * 统一的 Canvas 滚动容器
 * 替代各 View 中重复实现的拖拽+滚轮滚动逻辑
 */
export default class ScrollHelper {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.GameObjects.Container} container - 需要滚动的容器
   * @param {Object} config
   * @param {number} config.contentTop - 可视区域顶部 Y 坐标
   * @param {number} config.contentBottom - 可视区域底部 Y 坐标
   * @param {number} config.contentHeight - 内容总高度
   * @param {number} [config.wheelSensitivity=0.4] - 滚轮灵敏度
   * @param {Phaser.GameObjects.Graphics} [config.maskGraphics] - 可选的遮罩图形
   */
  constructor(scene, container, config) {
    this.scene = scene;
    this.container = container;
    this.contentTop = config.contentTop;
    this.contentBottom = config.contentBottom;
    this.wheelSensitivity = config.wheelSensitivity || 0.4;

    const viewportHeight = this.contentBottom - this.contentTop;
    const maxScroll = Math.max(0, config.contentHeight - viewportHeight);

    this.state = {
      currentY: 0,
      maxScroll,
      isDragging: false,
      lastPointerY: 0
    };

    // 设置遮罩
    if (config.maskGraphics) {
      container.setMask(config.maskGraphics.createGeometryMask());
    }

    if (maxScroll <= 0) return;

    this._handlers = {
      onPointerDown: (pointer) => {
        if (pointer.y >= this.contentTop && pointer.y <= this.contentBottom) {
          this.state.isDragging = true;
          this.state.lastPointerY = pointer.y;
        }
      },
      onPointerMove: (pointer) => {
        if (!this.state.isDragging) return;
        const deltaY = pointer.y - this.state.lastPointerY;
        this.state.lastPointerY = pointer.y;
        this.scrollTo(this.state.currentY + deltaY);
      },
      onPointerUp: () => {
        this.state.isDragging = false;
      },
      onWheel: (_pointer, _go, _dx, deltaY) => {
        this.scrollTo(this.state.currentY - deltaY * this.wheelSensitivity);
      }
    };

    scene.input.on('pointerdown', this._handlers.onPointerDown);
    scene.input.on('pointermove', this._handlers.onPointerMove);
    scene.input.on('pointerup', this._handlers.onPointerUp);
    scene.input.on('wheel', this._handlers.onWheel);
  }

  /** 滚动到指定 Y 偏移（自动钳制） */
  scrollTo(y) {
    this.state.currentY = Phaser.Math.Clamp(y, -this.state.maxScroll, 0);
    this.container.y = this.contentTop + this.state.currentY;
  }

  /** 获取当前滚动偏移 */
  getScrollY() {
    return this.state.currentY;
  }

  /** 销毁，移除所有事件监听 */
  destroy() {
    if (!this._handlers) return;
    this.scene.input.off('pointerdown', this._handlers.onPointerDown);
    this.scene.input.off('pointermove', this._handlers.onPointerMove);
    this.scene.input.off('pointerup', this._handlers.onPointerUp);
    this.scene.input.off('wheel', this._handlers.onWheel);
    this._handlers = null;
  }
}
