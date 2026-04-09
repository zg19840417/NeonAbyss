/**
 * View 标准基类
 *
 * 生命周期：constructor -> show() -> [update()] -> hide() -> destroy()
 *
 * 子类应实现：
 *   - onShow(): 创建 UI 元素
 *   - onUpdate(data): 差异化更新（可选）
 *   - onHide(): 隐藏但不销毁（可选）
 *   - get elements(): 返回需要销毁的元素列表
 */
export default class BaseView {
  constructor(scene) {
    this.scene = scene;
    this._elements = [];
    this._visible = false;
    this._dirty = false;
  }

  /** 显示 View */
  show() {
    this._visible = true;
    this._dirty = false;
    this.onShow();
  }

  /** 子类实现：创建 UI 元素 */
  onShow() {
    // override
  }

  /** 差异化更新（可选实现） */
  update(data) {
    if (!this._visible) return;
    this.onUpdate(data);
  }

  /** 子类实现：差异化更新 */
  onUpdate(_data) {
    // override
  }

  /** 隐藏 View（不销毁，可再次 show） */
  hide() {
    this._visible = false;
    this.onHide();
  }

  /** 子类实现：隐藏逻辑 */
  onHide() {
    // override - 默认设置所有元素不可见
    this._elements.forEach(el => {
      if (el?.setVisible) el.setVisible(false);
    });
  }

  /** 标记需要更新 */
  markDirty() {
    this._dirty = true;
  }

  /** 是否可见 */
  get visible() {
    return this._visible;
  }

  /** 是否需要更新 */
  get dirty() {
    return this._dirty;
  }

  /** 添加元素到追踪列表 */
  addElement(el) {
    this._elements.push(el);
    return el;
  }

  /** 创建文本并自动追踪 */
  addText(x, y, text, options = {}, originX = 0.5, originY = 0.5) {
    const textObj = this.scene.add.text(x, y, text, options).setOrigin(originX, originY);
    return this.addElement(textObj);
  }

  /** 销毁所有元素 */
  destroy() {
    this._elements.forEach(el => {
      if (el?.destroy) el.destroy();
    });
    this._elements = [];
    this._visible = false;
    this._dirty = false;
  }
}
