import shopData from '../../../assets/data/json/shop.json';
import itemsData from '../../../assets/data/json/items.json';

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
  r_fragment: { icon: '🔶', name: 'R碎片', color: '#cd7f32' },
  sr_fragment: { icon: '🔷', name: 'SR碎片', color: '#c0c0c0' },
  ssr_fragment: { icon: '💠', name: 'SSR碎片', color: '#ffd700' },
  ur_fragment: { icon: '💎', name: 'UR碎片', color: '#e5e4e2' }
};

export default class ShopSystem {
  constructor(baseSystem) {
    this.baseSystem = baseSystem;
    this.currentTab = ShopType.SOURCE_CORE;
    this.shopItems = this.loadShopItems();
  }
  
  loadShopItems() {
    const items = {};
    shopData.forEach(item => {
      if (!items[item.shopType]) {
        items[item.shopType] = [];
      }
      if (item.visible) {
        items[item.shopType].push({ ...item });
      }
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
    if (shopItem.dailyLimit === -1) {
      const count = this.baseSystem.getDailyPurchaseCount(shopItem.shopId);
      if (count > 0) return { can: false, reason: 'already_purchased' };
    } else if (shopItem.dailyLimit > 0) {
      const count = this.baseSystem.getDailyPurchaseCount(shopItem.shopId);
      if (count >= shopItem.dailyLimit) {
        return { can: false, reason: 'daily_limit_reached', remaining: 0 };
      }
    }
    
    if (!this.baseSystem.canAffordCurrency(shopItem.currency, shopItem.cost)) {
      return { can: false, reason: 'not_enough_currency' };
    }
    
    return { can: true };
  }
  
  getRemainingCount(shopItem) {
    if (shopItem.dailyLimit <= 0) return -1;
    const count = this.baseSystem.getDailyPurchaseCount(shopItem.shopId);
    return Math.max(0, shopItem.dailyLimit - count);
  }
  
  purchase(shopItem) {
    const check = this.canPurchase(shopItem);
    if (!check.can) {
      return { success: false, reason: check.reason };
    }
    
    const spendResult = this.baseSystem.spendCurrency(shopItem.currency, shopItem.cost);
    if (!spendResult.success) {
      return { success: false, reason: spendResult.reason };
    }
    
    if (shopItem.dailyLimit !== 0) {
      this.baseSystem.recordDailyPurchase(shopItem.shopId);
    }
    
    const reward = this.grantReward(shopItem);
    
    return {
      success: true,
      reward: reward,
      currencySpent: { type: shopItem.currency, amount: shopItem.cost }
    };
  }
  
  grantReward(shopItem) {
    const reward = { type: 'unknown', item: shopItem.itemId };
    
    switch (shopItem.shopType) {
      case ShopType.SOURCE_CORE:
      case ShopType.MYCELIUM:
      case ShopType.STAR_COIN:
        if (shopItem.itemId === 'ITEM_SOURCE_CORE') {
          const amounts = { '源核×100': 100, '源核×500': 500, '源核×1000': 1000 };
          const amount = amounts[shopItem.itemName] || 100;
          this.baseSystem.addCurrency('sourceCore', amount);
          reward.type = 'currency';
          reward.currencyType = 'sourceCore';
          reward.amount = amount;
        } else if (shopItem.itemId === 'MYCELIUM_500') {
          this.baseSystem.addCurrency('mycelium', 500);
          reward.type = 'currency';
          reward.currencyType = 'mycelium';
          reward.amount = 500;
        } else {
          this.baseSystem.addItem(shopItem.itemId, 1);
          reward.type = 'item';
        }
        break;
        
      case ShopType.GACHA:
        reward.type = 'gacha';
        reward.gachaType = shopItem.itemId;
        break;
        
      default:
        this.baseSystem.addItem(shopItem.itemId, 1);
        reward.type = 'item';
    }
    
    return reward;
  }
  
  getItemInfo(itemId) {
    return itemsData.find(item => item.itemId === itemId);
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
    const amount = this.baseSystem.getCurrency(type);
    return {
      icon: config?.icon || '?',
      name: config?.name || type,
      amount: amount,
      color: config?.color || '#ffffff'
    };
  }
  
  getAllCurrenciesDisplay() {
    return Object.keys(CurrencyConfig).map(type => this.getCurrencyDisplay(type));
  }
}
