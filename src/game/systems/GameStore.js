import EventBus, { GameEvents } from '../EventBus.js';

/**
 * 轻量响应式状态管理
 * 替代 window.gameData 的裸全局变量访问
 *
 * 使用方式：
 *   const store = GameStore.getInstance();
 *   store.set('mycelium', 1000);  // 自动触发 currency:changed 事件
 *   const val = store.get('mycelium');
 */
export default class GameStore {
  static _instance = null;

  static getInstance() {
    if (!GameStore._instance) {
      GameStore._instance = new GameStore();
    }
    return GameStore._instance;
  }

  constructor() {
    this._data = {};
    this._listeners = new Map();
  }

  /** 初始化（从 window.gameData 加载） */
  init(gameData) {
    this._data = gameData;
  }

  /** 获取状态值（支持点号路径，如 'base.mycelium'） */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this._data);
  }

  /** 设置状态值（支持点号路径），自动触发变更事件 */
  set(path, value) {
    const keys = path.split('.');
    let obj = this._data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] == null) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    const old = obj[keys[keys.length - 1]];
    obj[keys[keys.length - 1]] = value;
    if (old !== value) {
      this._notify(path, value, old);
    }
  }

  /** 获取原始数据对象（向后兼容） */
  get raw() {
    return this._data;
  }

  /** 监听特定路径变化 */
  on(path, fn) {
    if (!this._listeners.has(path)) {
      this._listeners.set(path, new Set());
    }
    this._listeners.get(path).add(fn);
    return () => this.off(path, fn);
  }

  /** 取消监听 */
  off(path, fn) {
    this._listeners.get(path)?.delete(fn);
  }

  /** 通知变更 */
  _notify(path, value, old) {
    // 通知路径精确匹配的监听器
    this._listeners.get(path)?.forEach(fn => {
      try { fn(value, old); } catch (e) { console.warn('GameStore listener error:', e); }
    });

    // 通知通配符监听器
    this._listeners.get('*')?.forEach(fn => {
      try { fn(path, value, old); } catch (e) { console.warn('GameStore listener error:', e); }
    });

    // 自动映射到 EventBus
    if (path.startsWith('base.') || path === 'base') {
      EventBus.emit(GameEvents.CURRENCY_CHANGED, { path, value, old });
    }
  }
}
