import Const from '../../game/data/Const.js';
import AnimationHelper from '../../game/utils/AnimationHelper.js';
import ShopSystem, { ShopType, CurrencyConfig } from '../../game/systems/ShopSystem.js';

export default class ShopView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this.shopSystem = new ShopSystem(scene.baseSystem);
    this.countdownEvent = null;
    this.scrollHandlers = null;
  }
  
  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.shopSystem.refreshDaily();
    this.renderHeader(width);
    this.renderTabs(width);
    this.renderContent(width);
    this.renderFooter(width, height);
    this.startCountdown();
  }
  
  renderHeader(width) {
    this.addText(width / 2, 45, '商店', {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });
    
    const currencies = this.shopSystem.getAllCurrenciesDisplay();
    const displayCurrencies = currencies.filter(c => c.amount > 0 || c.name === '源核' || c.name === '菌丝');
    
    const startX = width - 30;
    displayCurrencies.slice(0, 3).forEach((curr, index) => {
      const x = startX - index * 90;
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x000000, 0.3);
      bg.fillRoundedRect(x - 40, 25, 80, 24, 4);
      this.elements.push(bg);
      
      const text = this.scene.add.text(x, 37, `${curr.icon} ${curr.amount}`, {
        fontSize: '11px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: curr.color
      }).setOrigin(0.5);
      this.elements.push(text);
    });
  }
  
  renderTabs(width) {
    const tabs = [
      { key: ShopType.SOURCE_CORE, icon: '💎', label: '源核' },
      { key: ShopType.MYCELIUM, icon: '🍄', label: '菌丝' },
      { key: ShopType.STAR_COIN, icon: '⭐', label: '星币' },
      { key: ShopType.FRAGMENT, icon: '🔮', label: '碎片' },
      { key: ShopType.GACHA, icon: '🎰', label: '抽卡' }
    ];
    
    const tabWidth = 55;
    const totalWidth = tabs.length * tabWidth;
    const startX = (width - totalWidth) / 2 + tabWidth / 2;
    const y = 80;
    
    tabs.forEach((tab, index) => {
      const x = startX + index * tabWidth;
      const isActive = this.shopSystem.currentTab === tab.key;
      
      const container = this.scene.add.container(x, y);
      
      const bg = this.scene.add.graphics();
      bg.fillStyle(isActive ? Const.COLORS.PURPLE : Const.COLORS.BG_DARK, 0.8);
      bg.fillRoundedRect(-tabWidth/2 + 2, -12, tabWidth - 4, 24, 6);
      if (isActive) {
        bg.lineStyle(2, Const.COLORS.PURPLE, 0.8);
        bg.strokeRoundedRect(-tabWidth/2 + 2, -12, tabWidth - 4, 24, 6);
      }
      container.add(bg);
      
      const iconText = this.scene.add.text(0, -3, tab.icon, { fontSize: '14px' }).setOrigin(0.5);
      container.add(iconText);
      
      const labelText = this.scene.add.text(0, 7, tab.label, {
        fontSize: '9px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: isActive ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0.5);
      container.add(labelText);
      
      container.setSize(tabWidth - 4, 24);
      container.setInteractive(new Phaser.Geom.Rectangle(0, 0, tabWidth - 4, 24), Phaser.Geom.Rectangle.Contains);
      
      container.on('pointerdown', () => {
        if (this.shopSystem.currentTab !== tab.key) {
          AnimationHelper.tweenPulse(this.scene, container, 0.9);
          this.shopSystem.setCurrentTab(tab.key);
          this.refresh();
        }
      });
      
      container.on('pointerover', () => {
        if (this.shopSystem.currentTab !== tab.key) {
          AnimationHelper.tweenCardHover(this.scene, container, true);
        }
      });
      
      container.on('pointerout', () => {
        if (this.shopSystem.currentTab !== tab.key) {
          container.setScale(1);
        }
      });
      
      this.elements.push(container);
    });
  }
  
  renderContent(width) {
    const items = this.shopSystem.getCurrentItems();
    const height = this.scene.cameras.main.height;
    
    if (items.length === 0) {
      this.addText(width / 2, 300, '暂无商品', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
      return;
    }
    
    const startY = 115;
    const cardHeight = 58;
    const cardGap = 8;
    const contentHeight = items.length * (cardHeight + cardGap);
    const scrollHeight = Math.min(contentHeight, height - 200);
    const scrollY = startY;
    
    const scrollBg = this.scene.add.graphics();
    scrollBg.fillStyle(0x000000, 0.2);
    scrollBg.fillRoundedRect(15, scrollY, width - 30, scrollHeight, 8);
    this.elements.push(scrollBg);
    
    const scrollMask = this.scene.add.graphics();
    scrollMask.fillStyle(0xffffff, 1);
    scrollMask.fillRect(0, scrollY, width, scrollHeight);
    this.elements.push(scrollMask);
    
    const scrollContainer = this.scene.add.container(0, 0);
    scrollContainer.setMask(scrollMask.createGeometryMask());
    this.elements.push(scrollContainer);
    
    this.scrollContainer = scrollContainer;
    this.scrollMask = scrollMask;
    this.scrollBg = scrollBg;
    
    items.forEach((item, index) => {
      const y = startY + index * (cardHeight + cardGap);
      const card = this.createShopCard(width / 2, y, item, index);
      card.setAlpha(0);
      this.scene.tweens.add({
        targets: card,
        alpha: 1,
        duration: 200,
        delay: index * 50,
        ease: 'Power2'
      });
      scrollContainer.add(card);
    });
    
    this.scrollConfig = {
      startY: startY,
      endY: startY + contentHeight - scrollHeight,
      currentY: startY,
      speed: 8,
      isDragging: false,
      lastPointerY: 0
    };
    
    this.setupScroll();
  }
  
  setupScroll() {
    const height = this.scene.cameras.main.height;
    const scrollTop = 115;
    const scrollBottom = height - 80;
    
    this.scrollHandlers = {
      onPointerDown: (pointer) => {
        if (pointer.y > scrollTop && pointer.y < scrollBottom) {
          this.scrollConfig.isDragging = true;
          this.scrollConfig.lastPointerY = pointer.y;
        }
      },
      onPointerMove: (pointer) => {
        if (!this.scrollConfig.isDragging) return;
        
        const deltaY = pointer.y - this.scrollConfig.lastPointerY;
        this.scrollConfig.lastPointerY = pointer.y;
        
        const newY = this.scrollConfig.currentY + deltaY;
        this.scrollConfig.currentY = Phaser.Math.Clamp(newY, this.scrollConfig.endY, this.scrollConfig.startY);
        
        if (this.scrollContainer) {
          this.scrollContainer.y = this.scrollConfig.currentY - this.scrollConfig.startY;
        }
      },
      onPointerUp: () => {
        this.scrollConfig.isDragging = false;
      },
      onWheel: (pointer, gameObjects, deltaX, deltaY) => {
        if (pointer.y > scrollTop && pointer.y < scrollBottom) {
          const newY = this.scrollConfig.currentY + deltaY * 0.5;
          this.scrollConfig.currentY = Phaser.Math.Clamp(newY, this.scrollConfig.endY, this.scrollConfig.startY);
          
          if (this.scrollContainer) {
            this.scrollContainer.y = this.scrollConfig.currentY - this.scrollConfig.startY;
          }
        }
      }
    };
    
    this.scene.input.on('pointerdown', this.scrollHandlers.onPointerDown);
    this.scene.input.on('pointermove', this.scrollHandlers.onPointerMove);
    this.scene.input.on('pointerup', this.scrollHandlers.onPointerUp);
    this.scene.input.on('wheel', this.scrollHandlers.onWheel);
  }
  
  createShopCard(x, y, item, index) {
    const container = this.scene.add.container(x, y);
    const cardWidth = 320;
    const cardHeight = 60;
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(1, Const.COLORS.BG_DARK, 0.5);
    bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    container.add(bg);
    
    const currencyConfig = CurrencyConfig[item.currency] || { icon: '?', color: '#ffffff' };
    const itemInfo = this.shopSystem.getItemInfo(item.itemId);
    const icon = itemInfo?.name?.includes('源核') ? '💎' : 
                 itemInfo?.name?.includes('菌丝') ? '🍄' : 
                 item.icon || '📦';
    
    const iconText = this.scene.add.text(-cardWidth/2 + 35, 0, icon, { fontSize: '24px' }).setOrigin(0.5);
    container.add(iconText);
    
    const nameText = this.scene.add.text(-cardWidth/2 + 65, -8, item.itemName, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    container.add(nameText);
    
    const limitText = this.getLimitText(item);
    const limitDisplay = this.scene.add.text(-cardWidth/2 + 65, 10, limitText, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5);
    container.add(limitDisplay);
    
    const buyBtn = this.scene.add.container(cardWidth/2 - 55, 0);
    const canPurchase = this.shopSystem.canPurchase(item);
    const btnColor = canPurchase.can ? Const.COLORS.BUTTON_PRIMARY : Const.COLORS.BG_DARK;
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(btnColor, 1);
    btnBg.fillRoundedRect(-35, -14, 70, 28, Const.UI.BUTTON_RADIUS);
    buyBtn.add(btnBg);
    
    const priceText = this.scene.add.text(0, 0, `${currencyConfig.icon} ${item.cost}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: canPurchase.can ? Const.TEXT_COLORS.DARK : Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0.5);
    buyBtn.add(priceText);
    
    buyBtn.setSize(70, 28);
    buyBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 70, 28), Phaser.Geom.Rectangle.Contains);
    
    buyBtn.on('pointerdown', () => {
      if (canPurchase.can) {
        AnimationHelper.tweenPulse(this.scene, buyBtn, 0.9);
        this.scene.time.delayedCall(150, () => {
          this.purchaseItem(item, index);
        });
      } else {
        this.showToast(this.getCannotPurchaseReason(canPurchase.reason));
      }
    });
    
    buyBtn.on('pointerover', () => {
      if (canPurchase.can) {
        AnimationHelper.tweenPulse(this.scene, buyBtn, 1.1);
      }
    });
    
    buyBtn.on('pointerout', () => {
      buyBtn.setScale(1);
    });
    
    container.add(buyBtn);
    
    this.elements.push(container);
    return container;
  }
  
  getLimitText(item) {
    if (item.dailyLimit === 0) return '无限购';
    if (item.dailyLimit === -1) return '一次性';
    const remaining = this.shopSystem.getRemainingCount(item);
    return `剩余: ${remaining}/${item.dailyLimit}`;
  }
  
  getCannotPurchaseReason(reason) {
    switch (reason) {
      case 'daily_limit_reached': return '今日已售罄';
      case 'already_purchased': return '已购买过';
      case 'not_enough_currency': return '货币不足';
      default: return '无法购买';
    }
  }
  
  purchaseItem(item, index) {
    const canPurchase = this.shopSystem.canPurchase(item);
    if (!canPurchase.can) {
      this.showToast(this.getCannotPurchaseReason(canPurchase.reason));
      return;
    }
    
    const result = this.shopSystem.purchase(item);
    
    if (result.success) {
      const rewardText = this.getRewardText(result.reward);
      this.showToast(`获得 ${rewardText}！`, true);
      this.scene.saveGameData();
      this.refresh();
    } else {
      this.showToast(this.getCannotPurchaseReason(result.reason), false);
    }
  }
  
  getRewardText(reward) {
    if (reward.type === 'currency') {
      const currencyName = CurrencyConfig[reward.currencyType]?.name || reward.currencyType;
      return `${currencyName}×${reward.amount}`;
    } else if (reward.type === 'item') {
      const itemInfo = this.shopSystem.getItemInfo(reward.item);
      return itemInfo?.name || reward.item;
    } else if (reward.type === 'gacha') {
      return reward.gachaType === 'GACHA_SINGLE' ? '单抽券×1' : '十连券×10';
    }
    return '奖励';
  }
  
  showToast(message, isSuccess = true) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const toastBg = this.scene.add.graphics();
    const bgColor = isSuccess ? 0x003300 : 0x330000;
    toastBg.fillStyle(bgColor, 0.9);
    toastBg.fillRoundedRect(width/2 - 80, height/2 - 20, 160, 40, 8);
    toastBg.setDepth(2000);
    this.elements.push(toastBg);
    
    const borderColor = isSuccess ? 0x00ff00 : 0xff6666;
    toastBg.lineStyle(2, borderColor, 0.8);
    toastBg.strokeRoundedRect(width/2 - 80, height/2 - 20, 160, 40, 8);
    
    const textColor = isSuccess ? '#00ff88' : '#ff6666';
    const toastText = this.scene.add.text(width/2, height/2, message, {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: textColor
    }).setOrigin(0.5).setDepth(2001);
    this.elements.push(toastText);
    
    this.scene.tweens.add({
      targets: [toastBg, toastText],
      alpha: 0,
      duration: 500,
      delay: 1500,
      ease: 'Power2',
      onComplete: () => {
        toastBg.destroy();
        toastText.destroy();
        this.elements = this.elements.filter(el => el !== toastBg && el !== toastText);
      }
    });
  }
  
  renderFooter(width, height) {
    const footerY = height - 35;
    
    const line = this.scene.add.graphics();
    line.lineStyle(1, Const.COLORS.BG_DARK, 0.5);
    line.lineBetween(30, footerY - 10, width - 30, footerY - 10);
    this.elements.push(line);
    
    this.addText(width / 2, footerY, '滑动查看更多商品 | 点击购买', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    });
    
    this.countdownText = this.addText(width / 2, footerY + 18, '', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    });
  }
  
  startCountdown() {
    this.updateCountdown();
    this.countdownEvent = this.scene.time.addEvent({
      delay: 1000,
      callback: () => this.updateCountdown(),
      loop: true
    });
  }
  
  updateCountdown() {
    if (!this.countdownText) return;
    
    const remaining = this.shopSystem.getRefreshCountdown();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    this.countdownText.setText(`每日5:00刷新  剩余 ${timeStr}`);
  }
  
  refresh() {
    this.destroy();
    this.show();
  }
  
  addText(x, y, text, options = {}) {
    const textObj = this.scene.add.text(x, y, text, options).setOrigin(0.5);
    this.elements.push(textObj);
    return textObj;
  }
  
  destroy() {
    if (this.countdownEvent) {
      this.countdownEvent.destroy();
      this.countdownEvent = null;
    }
    
    if (this.scrollContainer) {
      this.scrollContainer.clearMask();
      this.scrollContainer.destroy();
      this.scrollContainer = null;
    }
    
    if (this.scrollHandlers) {
      this.scene.input.off('pointerdown', this.scrollHandlers.onPointerDown);
      this.scene.input.off('pointermove', this.scrollHandlers.onPointerMove);
      this.scene.input.off('pointerup', this.scrollHandlers.onPointerUp);
      this.scene.input.off('wheel', this.scrollHandlers.onWheel);
      this.scrollHandlers = null;
    }
    
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
  }
}
