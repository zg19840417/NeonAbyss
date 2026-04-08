/**
 * DOM UI 管理器
 * 在 Phaser Canvas 上层提供 DOM UI 渲染能力
 * 用于商店、背包、任务等复杂列表界面
 */
export default class DOMUIManager {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('ui-overlay');
    this.activePanel = null;
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  /** 获取游戏画布的实际渲染区域（居中+FIT缩放后的位置和尺寸） */
  getCanvasBounds() {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      scaleX: rect.width / this.game.config.width,
      scaleY: rect.height / this.game.config.height
    };
  }

  /**
   * 显示一个 DOM 面板（全屏覆盖）
   * @param {string} id - 面板唯一标识
   * @param {object} options - 配置项
   * @param {string} options.title - 面板标题
   * @param {Function} options.render - 渲染函数，接收面板容器DOM元素
   * @param {Function} options.onClose - 关闭回调
   */
  showPanel(id, options = {}) {
    this.closePanel(); // 先关闭已有面板

    const bounds = this.getCanvasBounds();
    const panel = document.createElement('div');
    panel.className = 'ui-panel';
    panel.id = `ui-panel-${id}`;
    panel.style.width = `${bounds.width}px`;
    panel.style.height = `${bounds.height}px`;
    panel.style.left = `${bounds.x}px`;
    panel.style.top = `${bounds.y}px`;

    // 标题栏
    const header = document.createElement('div');
    header.className = 'ui-header';
    header.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid rgba(201,168,76,0.2);
      background: rgba(12,14,26,0.98);
    `;

    const title = document.createElement('span');
    title.style.cssText = 'font-size:16px; font-weight:bold; color:#c9a84c;';
    title.textContent = options.title || '';

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      background:none; border:1px solid rgba(201,168,76,0.3); color:#c9a84c;
      padding:4px 12px; border-radius:4px; cursor:pointer; font-size:14px;
    `;
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.closePanel());

    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // 内容区域
    const content = document.createElement('div');
    content.className = 'ui-content';
    content.style.cssText = 'padding:12px 16px; overflow-y:auto; flex:1;';
    panel.appendChild(content);

    // 底部安全区（给手机底部留空间）
    const footer = document.createElement('div');
    footer.style.cssText = 'height:env(safe-area-inset-bottom, 0px);';
    panel.appendChild(footer);

    this.container.appendChild(panel);
    this.activePanel = { id, panel, content };

    // 调用自定义渲染
    if (options.render) {
      options.render(content, {
        bounds,
        close: () => this.closePanel()
      });
    }

    // 暂停 Phaser 场景更新（可选）
    if (this.game.scene.scenes.length > 0) {
      const activeScene = this.game.scene.scenes[this.game.scene.scenes.length - 1];
      if (activeScene && activeScene.scene && activeScene.scene.key === 'BaseScene') {
        // 不暂停，允许背景继续渲染
      }
    }
  }

  /** 关闭当前面板 */
  closePanel() {
    if (this.activePanel) {
      const { panel } = this.activePanel;
      panel.style.opacity = '0';
      panel.style.transition = 'opacity 0.15s ease-out';
      setTimeout(() => {
        if (panel.parentNode) panel.parentNode.removeChild(panel);
      }, 150);
      this.activePanel = null;
    }
  }

  /** 显示 Toast 提示 */
  showToast(message, type = 'info', duration = 2000) {
    const bounds = this.getCanvasBounds();
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      left: ${bounds.x + bounds.width / 2}px;
      top: ${bounds.y + 60}px;
      transform: translateX(-50%);
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 13px;
      color: #fff;
      z-index: 200;
      pointer-events: none;
      transition: opacity 0.3s;
      white-space: nowrap;
      background: ${type === 'success' ? 'rgba(0,180,80,0.9)' : type === 'error' ? 'rgba(220,50,50,0.9)' : 'rgba(20,24,40,0.95)'};
      border: 1px solid ${type === 'success' ? 'rgba(0,220,100,0.5)' : type === 'error' ? 'rgba(255,80,80,0.5)' : 'rgba(201,168,76,0.3)'};
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  /** 窗口大小变化时重新定位面板 */
  _onResize() {
    if (this.activePanel) {
      const bounds = this.getCanvasBounds();
      const { panel } = this.activePanel;
      panel.style.width = `${bounds.width}px`;
      panel.style.height = `${bounds.height}px`;
      panel.style.left = `${bounds.x}px`;
      panel.style.top = `${bounds.y}px`;
    }
  }

  /** 销毁管理器 */
  destroy() {
    this.closePanel();
    window.removeEventListener('resize', this._onResize);
  }
}
