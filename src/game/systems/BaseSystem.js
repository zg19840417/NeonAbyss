import { INIT_CONFIG } from '../data/GameData.js';

export default class BaseSystem {
  constructor(gameData = {}) {
    this.mycelium = gameData.mycelium ?? INIT_CONFIG.currencies.mycelium;
    this.sourceCore = gameData.sourceCore ?? INIT_CONFIG.currencies.sourceCore;
    this.starCoin = gameData.starCoin ?? INIT_CONFIG.currencies.starCoin;
    this.energyDrinks = Array.isArray(gameData.energyDrinks)
      ? gameData.energyDrinks
      : Array(INIT_CONFIG.other.energyDrinks).fill(null);
    this.inventory = gameData.inventory || {};
    this.dailyPurchaseRecords = gameData.dailyPurchaseRecords || {};
    this.lastDailyReset = gameData.lastDailyReset || this.getTodayString();
  }

  addItem(itemId, count = 1) {
    if (!this.inventory[itemId]) {
      this.inventory[itemId] = 0;
    }
    this.inventory[itemId] += count;
    return this.inventory[itemId];
  }

  removeItem(itemId, count = 1) {
    if (!this.inventory[itemId] || this.inventory[itemId] < count) {
      return { success: false, reason: 'not_enough_items' };
    }

    this.inventory[itemId] -= count;
    if (this.inventory[itemId] <= 0) {
      delete this.inventory[itemId];
    }

    return { success: true, remaining: this.inventory[itemId] || 0 };
  }

  getItemCount(itemId) {
    return this.inventory[itemId] || 0;
  }

  hasItem(itemId, count = 1) {
    return this.getItemCount(itemId) >= count;
  }

  getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  checkDailyReset() {
    const today = this.getTodayString();
    if (today !== this.lastDailyReset) {
      this.dailyPurchaseRecords = {};
      this.lastDailyReset = today;
      return true;
    }
    return false;
  }

  getDailyPurchaseCount(shopId) {
    return this.dailyPurchaseRecords[shopId] || 0;
  }

  recordDailyPurchase(shopId) {
    if (!this.dailyPurchaseRecords[shopId]) {
      this.dailyPurchaseRecords[shopId] = 0;
    }
    this.dailyPurchaseRecords[shopId] += 1;
  }

  // ===== 三级货币系统 =====
  addCurrency(type, amount) {
    if (type === 'mycelium') this.mycelium += amount;
    else if (type === 'sourceCore') this.sourceCore += amount;
    else if (type === 'starCoin') this.starCoin += amount;
    else return { success: false, reason: 'invalid_currency_type' };

    return { success: true, balance: this.getCurrency(type) };
  }

  spendCurrency(type, amount) {
    if (!this.canAfford(type, amount)) {
      return {
        success: false,
        reason: 'not_enough_currency',
        required: amount,
        current: this.getCurrency(type)
      };
    }

    if (type === 'mycelium') this.mycelium -= amount;
    else if (type === 'sourceCore') this.sourceCore -= amount;
    else if (type === 'starCoin') this.starCoin -= amount;
    else return { success: false, reason: 'invalid_currency_type' };

    return { success: true, remaining: this.getCurrency(type) };
  }

  canAfford(type, amount) {
    return this.getCurrency(type) >= amount;
  }

  getCurrency(type) {
    if (type === 'mycelium') return this.mycelium;
    if (type === 'sourceCore') return this.sourceCore;
    if (type === 'starCoin') return this.starCoin;
    return 0;
  }

  toJSON() {
    return {
      mycelium: this.mycelium,
      sourceCore: this.sourceCore,
      starCoin: this.starCoin,
      inventory: this.inventory,
      dailyPurchaseRecords: this.dailyPurchaseRecords,
      lastDailyReset: this.lastDailyReset
    };
  }

  save() {
    // BaseSystem 不再直接写本地存档，统一交给全局 GameData 持久化。
    return this.toJSON();
  }

  load() {
    return this;
  }
}
