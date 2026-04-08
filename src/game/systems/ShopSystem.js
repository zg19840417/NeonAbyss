import shopData from '../../../assets/data/json/shop.json';
import itemsData from '../../../assets/data/json/items.json';
import GachaSystem from './GachaSystem.js';

export const ShopType = {
  SOURCE_CORE: 'sourceCore',
  MYCELIUM: 'mycelium',
  STAR_COIN: 'starCoin',
  FRAGMENT: 'fragment',
  GACHA: 'gacha'
};

export const CurrencyConfig = {
  sourceCore: { icon: '💎', name: '源核', color: '#4dabf7' },
  mycelium: { icon: '🍄', name: '菌丝', color: '#51cf66' },
  starCoin: { icon: '⭐', name: '星币', color: '#ffd700' },
  water: { icon: '💧', name: '水点数', color: '#74c0fc' },
  fire: { icon: '🔥', name: '火点数', color: '#ff6b6b' },
  wind: { icon: '🍃', name: '风点数', color: '#63e6be' }
};

const SOURCE_CORE_AMOUNT_MAP = {
  ITEM_SOURCE_CORE_SMALL: 100,
  ITEM_SOURCE_CORE_MEDIUM: 500,
  ITEM_SOURCE_CORE_LARGE: 1000
};

export default class ShopSystem {
  constructor(baseSystem) {
    this.baseSystem = baseSystem;
    this.currentTab = ShopType.GACHA;
    this.shopItems = this.loadShopItems();
    this.gachaSystem = new GachaSystem(baseSystem);
  }

  loadShopItems() {
    const items = {};

    shopData.forEach((item) => {
      if (!item.visible) return;
      if (!items[item.shopType]) {
        items[item.shopType] = [];
      }
      items[item.shopType].push({ ...item });
    });

    Object.values(items).forEach((group) => {
      group.sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
    });

    return items;
  }

  getItemsByType(shopType) {
    return this.shopItems[shopType] || [];
  }

  getCurrentItems() {
    return this.getItemsByType(this.currentTab);
  }

  setCurrentTab(shopType) {
    this.currentTab = shopType;
  }

  canPurchase(shopItem) {
    if (!shopItem) {
      return { can: false, reason: 'invalid_item' };
    }

    if (shopItem.dailyLimit === -1) {
      const count = this.baseSystem.getDailyPurchaseCount(shopItem.shopId);
      if (count > 0) {
        return { can: false, reason: 'already_purchased' };
      }
    } else if (shopItem.dailyLimit > 0) {
      const count = this.baseSystem.getDailyPurchaseCount(shopItem.shopId);
      if (count >= shopItem.dailyLimit) {
        return { can: false, reason: 'daily_limit_reached', remaining: 0 };
      }
    }

    if (shopItem.shopType === ShopType.GACHA && !this.gachaSystem.hasAvailableFragments()) {
      return { can: false, reason: 'no_unlocked_fragments' };
    }

    if (!this.baseSystem.canAfford(shopItem.currency, shopItem.cost)) {
      return { can: false, reason: 'not_enough_currency' };
    }

    return { can: true };
  }

  getRemainingCount(shopItem) {
    if (!shopItem || shopItem.dailyLimit <= 0) {
      return -1;
    }

    const count = this.baseSystem.getDailyPurchaseCount(shopItem.shopId);
    return Math.max(0, shopItem.dailyLimit - count);
  }

  purchase(shopItem) {
    const check = this.canPurchase(shopItem);
    if (!check.can) {
      return { success: false, reason: check.reason };
    }

    const rewardPreview = this.previewReward(shopItem);
    if (!rewardPreview.success) {
      return rewardPreview;
    }

    const spendResult = this.baseSystem.spendCurrency(shopItem.currency, shopItem.cost);
    if (!spendResult.success) {
      return { success: false, reason: spendResult.reason };
    }

    if (shopItem.dailyLimit !== 0) {
      this.baseSystem.recordDailyPurchase(shopItem.shopId);
    }

    const reward = this.grantReward(shopItem, rewardPreview.payload);
    return {
      success: true,
      reward,
      currencySpent: { type: shopItem.currency, amount: shopItem.cost }
    };
  }

  previewReward(shopItem) {
    if (shopItem.shopType !== ShopType.GACHA) {
      return { success: true, payload: null };
    }

    const count = shopItem.itemId === 'GACHA_TEN' ? 10 : 1;
    const gachaResult = this.gachaSystem.rollGacha(count);
    if (!gachaResult.success) {
      return { success: false, reason: gachaResult.reason || 'gacha_failed' };
    }

    return { success: true, payload: gachaResult };
  }

  grantReward(shopItem, previewPayload = null) {
    const reward = { type: 'unknown', item: shopItem.itemId };

    switch (shopItem.shopType) {
      case ShopType.SOURCE_CORE:
      case ShopType.MYCELIUM:
      case ShopType.STAR_COIN:
        return this.grantStandardReward(shopItem, reward);

      case ShopType.GACHA: {
        const count = shopItem.itemId === 'GACHA_TEN' ? 10 : 1;
        const gachaResult = previewPayload || this.gachaSystem.rollGacha(count);
        const fragments = this.gachaSystem.applyResults(gachaResult.results || []);

        reward.type = 'gacha';
        reward.count = count;
        reward.fragments = fragments;
        reward.resultSummary = this.buildFragmentSummary(fragments);
        return reward;
      }

      default:
        this.baseSystem.addItem(shopItem.itemId, 1);
        reward.type = 'item';
        return reward;
    }
  }

  grantStandardReward(shopItem, reward) {
    if (shopItem.itemId in SOURCE_CORE_AMOUNT_MAP) {
      const amount = SOURCE_CORE_AMOUNT_MAP[shopItem.itemId];
      this.baseSystem.addCurrency('sourceCore', amount);
      reward.type = 'currency';
      reward.currencyType = 'sourceCore';
      reward.amount = amount;
      return reward;
    }

    if (shopItem.itemId === 'MYCELIUM_500') {
      this.baseSystem.addCurrency('mycelium', 500);
      reward.type = 'currency';
      reward.currencyType = 'mycelium';
      reward.amount = 500;
      return reward;
    }

    this.baseSystem.addItem(shopItem.itemId, 1);
    reward.type = 'item';
    return reward;
  }

  buildFragmentSummary(fragments) {
    const summary = {
      completedSetCount: 0,
      qualityUpgradeReadyCount: 0,
      overflowPoints: { water: 0, fire: 0, wind: 0 }
    };

    fragments.forEach((fragment) => {
      const result = fragment.progressResult;
      if (!result?.success) return;

      if (result.completedSet) {
        summary.completedSetCount += 1;
      }
      if (result.gainedUpgradeOpportunity) {
        summary.qualityUpgradeReadyCount += 1;
      }
      if (result.overflowCount > 0) {
        const element = result.overflowElement || 'water';
        summary.overflowPoints[element] = (summary.overflowPoints[element] || 0) + result.overflowCount;
      }
    });

    return summary;
  }

  getItemInfo(itemId) {
    return itemsData.find((item) => item.itemId === itemId);
  }

  getRefreshCountdown() {
    const now = new Date();
    const nextRefresh = new Date(now);
    nextRefresh.setHours(5, 0, 0, 0);
    if (now >= nextRefresh) {
      nextRefresh.setDate(nextRefresh.getDate() + 1);
    }
    return nextRefresh.getTime() - now.getTime();
  }

  refreshDaily() {
    this.baseSystem.checkDailyReset();
  }

  getCurrencyDisplay(type) {
    const config = CurrencyConfig[type];
    const amount = this.baseSystem.getCurrency ? this.baseSystem.getCurrency(type) : 0;
    return {
      icon: config?.icon || '?',
      name: config?.name || type,
      amount,
      color: config?.color || '#ffffff'
    };
  }

  getAllCurrenciesDisplay() {
    return Object.keys(CurrencyConfig).map((type) => this.getCurrencyDisplay(type));
  }

  getGachaHistory() {
    return this.gachaSystem.getHistory();
  }

  clearGachaHistory() {
    this.gachaSystem.clearHistory();
  }

  getGachaPityInfo() {
    return this.gachaSystem.getPityInfo();
  }
}
