import Const from '../../game/data/Const.js';
import AnimationHelper from '../../game/utils/AnimationHelper.js';

export default class ShopView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this.currentTab = 'minion';
    this._detailOverlay = null;
    this._detailModal = null;
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

<<<<<<< HEAD
    this.shopSystem.refreshDaily();
    this.renderHeader(width);
    this.renderTabs(width);
    this.renderContent(width);
    this.renderFooter(width, height);
    this.startCountdown();
  }
  
  renderHeader(width) {
    this.addText(width / 2, 22, '商店', {
=======
    this.addText(width / 2, 90, '商店', {
>>>>>>> 8256356097c1a929f1b2b783279580c85758b5a5
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });
<<<<<<< HEAD
    
    const currencies = this.shopSystem.getAllCurrenciesDisplay();
    const displayCurrencies = currencies.filter(c => c.amount > 0 || c.name === '源核' || c.name === '菌丝');
    
    const startX = width - 20;
    displayCurrencies.slice(0, 3).forEach((curr, index) => {
      const x = startX - index * 80;
      const bg = this.scene.add.graphics();
      bg.fillStyle(Const.COLORS.BG_DARK, 0.95);
      bg.fillRoundedRect(x - 36, 10, 70, 20, 4);
      bg.lineStyle(1, parseInt(curr.color.replace('#', '0x')), 0.5);
      bg.strokeRoundedRect(x - 36, 10, 70, 20, 4);
      this.elements.push(bg);
      
      const text = this.scene.add.text(x, 20, `${curr.icon} ${this.formatNumber(curr.amount)}`, {
        fontSize: '10px',
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: curr.color
      }).setOrigin(0.5);
      this.elements.push(text);
    });
  }
  
  formatNumber(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
  
  renderTabs(width) {
    const tabs = [
      { key: ShopType.SOURCE_CORE, icon: '💎', label: '源核' },
      { key: ShopType.MYCELIUM, icon: '🍄', label: '菌丝' },
      { key: ShopType.STAR_COIN, icon: '⭐', label: '星币' },
      { key: ShopType.FRAGMENT, icon: '🔮', label: '碎片' },
      { key: ShopType.GACHA, icon: '🎰', label: '抽卡' }
    ];
    
    const tabWidth = 68;
    const tabHeight = 36;
    const totalWidth = tabs.length * tabWidth;
    const startX = (width - totalWidth) / 2 + tabWidth / 2;
    const y = 52;
    
    tabs.forEach((tab, index) => {
      const x = startX + index * tabWidth;
      const isActive = this.shopSystem.currentTab === tab.key;
      
      const container = this.scene.add.container(x, y);
      
      const bg = this.scene.add.graphics();
      bg.fillStyle(isActive ? Const.COLORS.PURPLE : Const.COLORS.BG_MID, 0.95);
      bg.fillRoundedRect(-tabWidth/2 + 2, -tabHeight/2, tabWidth - 4, tabHeight, 8);
      if (isActive) {
        bg.lineStyle(2, Const.COLORS.PURPLE, 1);
        bg.strokeRoundedRect(-tabWidth/2 + 2, -tabHeight/2, tabWidth - 4, tabHeight, 8);
      }
      container.add(bg);
      
      const iconText = this.scene.add.text(0, -6, tab.icon, { fontSize: '18px' }).setOrigin(0.5);
      container.add(iconText);
      
      const labelText = this.scene.add.text(0, 10, tab.label, {
        fontSize: '11px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: isActive ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0.5);
      container.add(labelText);
      
      container.setSize(tabWidth - 4, tabHeight);
      container.setInteractive(new Phaser.Geom.Rectangle(0, 0, tabWidth - 4, tabHeight), Phaser.Geom.Rectangle.Contains);
      
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
    
    const startY = 75;
    const cardHeight = 58;
    const cardGap = 8;
    const bottomMargin = 90;
    const contentHeight = items.length * (cardHeight + cardGap);
    const scrollHeight = Math.min(contentHeight, height - startY - bottomMargin);
    
    if (items.length === 0) {
      this.addText(width / 2, startY + 100, '暂无商品', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
      return;
    }
    
    const scrollMask = this.scene.add.graphics();
    scrollMask.fillStyle(0xffffff, 1);
    scrollMask.fillRect(0, startY, width, scrollHeight);
    this.elements.push(scrollMask);
    
    const scrollContainer = this.scene.add.container(0, 0);
    scrollContainer.setMask(scrollMask.createGeometryMask());
    this.elements.push(scrollContainer);
    
    this.scrollContainer = scrollContainer;
    this.scrollMask = scrollMask;
    
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
    const scrollTop = 75;
    const scrollBottom = height - 90;
    
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
    
    const currencyConfig = CurrencyConfig[item.currency] || { icon: '?', color: '#ffffff' };
    const itemInfo = this.shopSystem.getItemInfo(item.itemId);
    const itemIcon = this.getItemIcon(item, itemInfo);
    const rarityColor = this.getRarityColor(item);
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(2, rarityColor, 0.6);
    bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    container.add(bg);
    
    const glowBg = this.scene.add.graphics();
    glowBg.fillStyle(rarityColor, 0.1);
    glowBg.fillCircle(-cardWidth/2 + 35, 0, 28);
    container.add(glowBg);
    container.sendToBack(glowBg);
    
    const iconText = this.scene.add.text(-cardWidth/2 + 35, 0, itemIcon, { fontSize: '26px' }).setOrigin(0.5);
    container.add(iconText);
    
    const nameText = this.scene.add.text(-cardWidth/2 + 65, -10, item.itemName, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    container.add(nameText);
    
    const limitText = this.getLimitText(item);
    const limitColor = item.dailyLimit > 0 ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.SECONDARY;
    const limitDisplay = this.scene.add.text(-cardWidth/2 + 65, 10, limitText, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: limitColor
    }).setOrigin(0, 0.5);
    container.add(limitDisplay);
    
    const buyBtn = this.scene.add.container(cardWidth/2 - 55, 0);
    const canPurchase = this.shopSystem.canPurchase(item);
    const btnColor = canPurchase.can ? Const.COLORS.BUTTON_PRIMARY : Const.COLORS.BG_DARK;
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(btnColor, canPurchase.can ? 1 : 0.5);
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
    
    const currentItem = item;
    const currentIndex = index;
    const currentCanPurchase = canPurchase;
    
    buyBtn.on('pointerdown', () => {
      if (currentCanPurchase.can) {
        AnimationHelper.tweenPulse(this.scene, buyBtn, 0.9);
        this.scene.time.delayedCall(150, () => {
          this.purchaseItem(currentItem, currentIndex);
        });
      } else {
        this.showToast(this.getCannotPurchaseReason(currentCanPurchase.reason), false);
      }
    });
    
    buyBtn.on('pointerover', () => {
      if (currentCanPurchase.can) {
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
  
  getItemIcon(item, itemInfo) {
    const iconMap = {
      'ITEM_RAD_MEDICINE': '💊',
      'ITEM_PLUGIN_PROF_RANDOM': '🔧',
      'ITEM_PLUGIN_PROF_TANK': '🛡️',
      'ITEM_PLUGIN_PROF_DPS': '⚔️',
      'ITEM_PLUGIN_PROF_SUPPORT': '💚',
      'ITEM_PLUGIN_RACE_SR': '🧬',
      'ITEM_PLUGIN_ELEMENT_SR': '⚡',
      'ITEM_PLUGIN_SSR': '🔮',
      'ITEM_EXP_CHIP_SMALL': '📗',
      'ITEM_EXP_CHIP_MEDIUM': '📘',
      'ITEM_EXP_CHIP_LARGE': '📙',
      'ITEM_N_FRAGMENT_BOX': '📦',
      'ITEM_UPGRADE_MATERIAL_LOW': '🪨',
      'ITEM_UPGRADE_MATERIAL_MID': '💎',
      'ITEM_CHIP_EXP_SMALL': '🧪',
      'ITEM_CHIP_EXP_MEDIUM': '⚗️',
      'ITEM_SKILL_UPGRADE_MATERIAL': '✨',
      'ITEM_SOURCE_CORE': '💎',
      'PACK_NEWBIE': '🎁',
      'PACK_DAILY_DEAL': '📫',
      'PACK_LIMITED_UP': '🌟',
      'GACHA_SINGLE': '🎟️',
      'GACHA_TEN': '🎫',
      'MINION_R': '👤',
      'MINION_SR': '👤',
      'MINION_SSR': '👤',
      'MINION_UR': '👑'
    };
    
    if (iconMap[item.itemId]) return iconMap[item.itemId];
    
    if (item.itemName.includes('源核')) return '💎';
    if (item.itemName.includes('菌丝')) return '🍄';
    if (item.itemName.includes('芯片') || item.itemName.includes('晶片')) return '🔧';
    if (item.itemName.includes('经验') || item.itemName.includes('芯片')) return '📖';
    if (item.itemName.includes('礼包')) return '🎁';
    if (item.itemName.includes('角色') || item.itemName.includes('角色')) return '👤';
    
    return '📦';
  }
  
  getRarityColor(item) {
    const price = item.cost;
    const currency = item.currency;
    
    if (item.itemId.includes('SSR') || item.itemId.includes('UR') || 
        (currency === 'starCoin' && price >= 50)) {
      return 0xff8800;
    }
    if (item.itemId.includes('SR') || price >= 500 || 
        (currency === 'sourceCore' && price >= 300)) {
      return 0xaa44ff;
    }
    if (item.itemId.includes('_R') || price >= 100) {
      return 0x4488ff;
    }
    
    return 0x666666;
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
=======

    this.renderCurrencyDisplay(width);
    this.renderTabButtons(width);
    this.renderContent();

    this.addText(width / 2, height - 100, '点击卡片购买', {
>>>>>>> 8256356097c1a929f1b2b783279580c85758b5a5
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    });
  }

  renderCurrencyDisplay(width) {
    const mycelium = window.gameData?.base?.mycelium || 0;
    const sourceCore = window.gameData?.base?.sourceCore || 0;

    this.addText(width / 2 - 80, 115, `🍄 菌丝: ${mycelium.toLocaleString()}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#51cf66'
    });

    this.addText(width / 2 + 80, 115, `💎 源核: ${sourceCore.toLocaleString()}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#4dabf7'
    });
  }

  renderTabButtons(width) {
    const tabs = [
      { key: 'minion', icon: '🐺', label: '随从卡' },
      { key: 'chip', icon: '🔧', label: '芯片卡' }
    ];

    const startX = 100;
    const tabWidth = 80;
    const startY = 145;

    tabs.forEach((tab, index) => {
      const x = startX + index * tabWidth;
      const container = this.scene.add.container(x, startY);

      const bg = this.scene.add.graphics();
      bg.fillStyle(this.currentTab === tab.key ? Const.COLORS.PURPLE : Const.COLORS.BG_MID, 0.9);
      bg.fillRoundedRect(-tabWidth/2 + 5, -15, tabWidth - 10, 30, 8);
      if (this.currentTab === tab.key) {
        bg.lineStyle(2, Const.COLORS.PURPLE, 0.8);
        bg.strokeRoundedRect(-tabWidth/2 + 5, -15, tabWidth - 10, 30, 8);
      }
      container.add(bg);

      const iconText = this.scene.add.text(0, -5, tab.icon, {
        fontSize: '14px'
      }).setOrigin(0.5);
      container.add(iconText);

      const labelText = this.scene.add.text(0, 8, tab.label, {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: this.currentTab === tab.key ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0.5);
      container.add(labelText);

      container.setSize(tabWidth - 10, 30);
      container.setInteractive(new Phaser.Geom.Rectangle(0, 0, tabWidth - 10, 30), Phaser.Geom.Rectangle.Contains);

      container.on('pointerdown', () => {
        if (this.currentTab !== tab.key) {
          AnimationHelper.tweenPulse(this.scene, container, 0.9);
          this.currentTab = tab.key;
          this.refresh();
        }
      });

      this.elements.push(container);
    });
  }

  renderContent() {
    if (this.currentTab === 'minion') {
      this.renderMinionShop();
    } else {
      this.renderChipShop();
    }
  }

  renderMinionShop() {
    const width = this.scene.cameras.main.width;

    if (!this.scene.minionCardManager.shopMinions || this.scene.minionCardManager.shopMinions.length === 0) {
      this.scene.minionCardManager.shopMinions = [];
      for (let i = 0; i < 3; i++) {
        this.scene.minionCardManager.shopMinions.push(
          this.scene.minionCardManager.generateShopCard()
        );
      }
    }

    const shopMinions = this.scene.minionCardManager.shopMinions;

    if (shopMinions.length === 0) {
      this.addText(width / 2, 200, '暂无随从卡', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      shopMinions.forEach((card, index) => {
        const cardContainer = this.createMinionShopCard(width / 2, 190 + index * 80, card, index);
        cardContainer.setAlpha(0);
        this.scene.tweens.add({
          targets: cardContainer,
          alpha: 1,
          duration: 300,
          delay: index * 80,
          ease: 'Power2'
        });
      });
    }

    this.renderRefreshButton(width, 'minion');
  }

  renderChipShop() {
    const width = this.scene.cameras.main.width;

    if (!this.scene.chipCardManager.shopCards || this.scene.chipCardManager.shopCards.length === 0) {
      this.scene.chipCardManager.shopCards = [];
      for (let i = 0; i < 2; i++) {
        this.scene.chipCardManager.shopCards.push(
          this.scene.chipCardManager.generateShopCard()
        );
      }
    }

    const shopChips = this.scene.chipCardManager.shopCards;

    if (shopChips.length === 0) {
      this.addText(width / 2, 200, '暂无芯片卡', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      shopChips.forEach((card, index) => {
        const cardContainer = this.createChipShopCard(width / 2, 190 + index * 80, card, index);
        cardContainer.setAlpha(0);
        this.scene.tweens.add({
          targets: cardContainer,
          alpha: 1,
          duration: 300,
          delay: index * 80,
          ease: 'Power2'
        });
      });
    }

    this.renderRefreshButton(width, 'chip');
  }

  createMinionShopCard(x, y, card, index) {
    const container = this.scene.add.container(x, y);
    const cardWidth = 300;
    const cardHeight = 70;
    const qualityConfig = this.getMinionQualityConfig(card.rarity);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(2, parseInt(qualityConfig.color.replace('#', '0x')), 0.7);
    bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    container.add(bg);

    const elementConfig = card.getElementConfig?.();
    const icon = this.scene.add.text(-cardWidth/2 + 30, 0, elementConfig?.icon || '🐺', {
      fontSize: '28px'
    }).setOrigin(0.5);
    container.add(icon);

    const nameText = this.scene.add.text(-cardWidth/2 + 60, -10, card.name, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityConfig.textColor
    }).setOrigin(0, 0.5);
    container.add(nameText);

    const qualityBadge = this.scene.add.text(-cardWidth/2 + 60, 10, qualityConfig.name, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: qualityConfig.textColor
    }).setOrigin(0, 0.5);
    container.add(qualityBadge);

    const statsText = this.scene.add.text(-cardWidth/2 + 60, 25, `HP:${card.maxHp} ATK:${card.atk}`, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0, 0.5);
    container.add(statsText);

    const price = this.getMinionPrice(card);
    const buyBtn = this.scene.add.container(cardWidth/2 - 50, 0);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(Const.COLORS.BUTTON_PRIMARY, 1);
    btnBg.fillRoundedRect(-30, -14, 60, 28, Const.UI.BUTTON_RADIUS);
    const btnText = this.scene.add.text(0, 0, `💎${price}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    buyBtn.add([btnBg, btnText]);
    buyBtn.setSize(60, 28);
    container.add(buyBtn);

    // 交互区域居中对齐子元素
    container.setSize(cardWidth, cardHeight);
    container.setInteractive(new Phaser.Geom.Rectangle(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', (pointer, localX, localY) => {
      // localX 范围: -cardWidth/2 ~ +cardWidth/2
      // 按钮区域: 右侧 80px (localX > cardWidth/2 - 80)
      if (localX > cardWidth/2 - 80) {
        AnimationHelper.tweenPulse(this.scene, container, 0.9);
        this.scene.time.delayedCall(150, () => {
          this.buyMinionCard(index);
        });
      } else {
        AnimationHelper.tweenPulse(this.scene, container, 0.95);
        this.showCardDetail(card, 'minion', index);
      }
    });

    this.elements.push(container);
    return container;
  }

  createChipShopCard(x, y, card, index) {
    const container = this.scene.add.container(x, y);
    const cardWidth = 300;
    const cardHeight = 70;
    const qualityConfig = this.getChipQualityConfig(card.quality);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(2, parseInt(qualityConfig.color.replace('#', '0x')), 0.7);
    bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    container.add(bg);

    const icon = this.scene.add.text(-cardWidth/2 + 30, 0, qualityConfig.icon, {
      fontSize: '28px'
    }).setOrigin(0.5);
    container.add(icon);

    const nameText = this.scene.add.text(-cardWidth/2 + 60, -10, card.name, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityConfig.textColor
    }).setOrigin(0, 0.5);
    container.add(nameText);

    const qualityBadge = this.scene.add.text(-cardWidth/2 + 60, 10, qualityConfig.name, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: qualityConfig.textColor
    }).setOrigin(0, 0.5);
    container.add(qualityBadge);

    const statsText = this.scene.add.text(-cardWidth/2 + 60, 25, this.getChipStats(card), {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0, 0.5);
    container.add(statsText);

    const price = this.getChipPrice(card);
    const buyBtn = this.scene.add.container(cardWidth/2 - 50, 0);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(Const.COLORS.BUTTON_PRIMARY, 1);
    btnBg.fillRoundedRect(-30, -14, 60, 28, Const.UI.BUTTON_RADIUS);
    const btnText = this.scene.add.text(0, 0, `🍄${price}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    buyBtn.add([btnBg, btnText]);
    buyBtn.setSize(60, 28);
    container.add(buyBtn);

    // 交互区域居中对齐子元素
    container.setSize(cardWidth, cardHeight);
    container.setInteractive(new Phaser.Geom.Rectangle(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', (pointer, localX, localY) => {
      // localX 范围: -cardWidth/2 ~ +cardWidth/2
      // 按钮区域: 右侧 80px (localX > cardWidth/2 - 80)
      if (localX > cardWidth/2 - 80) {
        AnimationHelper.tweenPulse(this.scene, container, 0.9);
        this.scene.time.delayedCall(150, () => {
          this.buyChipCard(index);
        });
      } else {
        AnimationHelper.tweenPulse(this.scene, container, 0.95);
        this.showCardDetail(card, 'chip', index);
      }
    });

    this.elements.push(container);
    return container;
  }

  buyMinionCard(index) {
    const card = this.scene.minionCardManager.shopMinions?.[index];
    if (!card) return;

    const price = this.getMinionPrice(card);
    const sourceCore = window.gameData?.base?.sourceCore || 0;

    if (sourceCore < price) {
      this.scene.showToast?.('源核不足！');
      return;
    }

    window.gameData.base.sourceCore -= price;
    this.scene.minionCardManager.addCard(card);
    this.scene.minionCardManager.shopMinions.splice(index, 1);
    this.scene.saveGameData();
    this.scene.showToast?.('购买成功！');
    this.refresh();
  }

  buyChipCard(index) {
    const card = this.scene.chipCardManager.shopCards?.[index];
    if (!card) return;

    const price = this.getChipPrice(card);
    const mycelium = window.gameData?.base?.mycelium || 0;

    if (mycelium < price) {
      this.scene.showToast?.('菌丝不足！');
      return;
    }

    window.gameData.base.mycelium -= price;
    this.scene.chipCardManager.addCard(card);
    this.scene.chipCardManager.shopCards.splice(index, 1);
    this.scene.saveGameData();
    this.scene.showToast?.('购买成功！');
    this.refresh();
  }

  renderRefreshButton(width, type) {
    const y = 520;
    const container = this.scene.add.container(width / 2, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BUTTON_SECONDARY, 0.8);
    bg.fillRoundedRect(-60, -16, 120, 32, Const.UI.BUTTON_RADIUS);
    container.add(bg);

    const text = this.scene.add.text(0, 0, '🔄 刷新商品', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(120, 32);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 120, 32), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', () => {
      this.refreshShop(type);
      this.scene.saveGameData();
      this.refresh();
    });

    this.elements.push(container);
  }

  refreshShop(type) {
    if (type === 'minion') {
      this.scene.minionCardManager.shopMinions = [];
      for (let i = 0; i < 3; i++) {
        this.scene.minionCardManager.shopMinions.push(
          this.scene.minionCardManager.generateShopCard()
        );
      }
    } else {
      this.scene.chipCardManager.shopCards = [];
      for (let i = 0; i < 2; i++) {
        const newCard = this.scene.chipCardManager.generateShopCard?.();
        if (newCard) {
          this.scene.chipCardManager.shopCards.push(newCard);
        }
      }
    }
  }

  getMinionPrice(card) {
    const basePrices = { common: 100, rare: 300, epic: 800, legendary: 2000 };
    const base = basePrices[card.rarity] || 100;
    const starMult = 1 + (card.star - 1) * 0.5;
    return Math.floor(base * starMult);
  }

  getChipPrice(card) {
    const basePrices = { N: 50, R: 150, SR: 400, SSR: 1000, UR: 2500, LE: 5000 };
    const base = basePrices[card.quality] || 50;
    const starMult = 1 + (card.star - 1) * 0.5;
    return Math.floor(base * starMult);
  }

  getMinionQualityConfig(quality) {
    return this.getQualityConfig(quality);
  }

  getChipQualityConfig(quality) {
    const configs = {
      N: { name: '普通', color: '#8a7a6a', textColor: '#8a7a6a', icon: '🔧' },
      R: { name: '稀有', color: '#4dabf7', textColor: '#4dabf7', icon: '⚙️' },
      SR: { name: '精良', color: '#51cf66', textColor: '#51cf66', icon: '🔧' },
      SSR: { name: '史诗', color: '#9775fa', textColor: '#9775fa', icon: '🔥' },
      UR: { name: '传说', color: '#ffd700', textColor: '#ffd700', icon: '💎' },
      LE: { name: '神话', color: '#ff00ff', textColor: '#ff00ff', icon: '🌟' }
    };
    return configs[quality] || configs.N;
  }

  getQualityConfig(quality) {
    const configs = {
      common: { name: '普通', color: '#8a7a6a', textColor: '#8a7a6a' },
      rare: { name: '稀有', color: '#4dabf7', textColor: '#4dabf7' },
      epic: { name: '史诗', color: '#9775fa', textColor: '#9775fa' },
      legendary: { name: '传说', color: '#ffd700', textColor: '#ffd700' },
      mythic: { name: '神话', color: '#ff00ff', textColor: '#ff00ff' }
    };
    return configs[quality] || configs.common;
  }

  getChipStats(card) {
    const stats = [];
    const effective = card.getEffectiveStats?.() || {};
    if (effective.hpPercent > 0) stats.push(`HP+${effective.hpPercent.toFixed(1)}%`);
    if (effective.atkPercent > 0) stats.push(`ATK+${effective.atkPercent.toFixed(1)}%`);
    return stats.join(' | ') || '无加成';
  }

  showCardDetail(card, cardType, index) {
    // 如果已有弹窗打开，先关闭
    if (this._detailModal) {
      this.closeCardDetail();
      return;
    }

    const isMinion = cardType === 'minion';
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(999);
    overlay.setAlpha(0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.closeCardDetail());
    this._detailOverlay = overlay;
    this.elements.push(overlay);
    this.scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });

    const modal = this.scene.add.container(width / 2, height / 2);
    modal.setDepth(1000);
    modal.setScale(0.5);
    modal.setAlpha(0);

    const qualityConfig = isMinion
      ? this.getMinionQualityConfig(card.rarity)
      : this.getChipQualityConfig(card.quality);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 1);
    bg.fillRoundedRect(-140, -200, 280, 400, Const.UI.CARD_RADIUS);
    modal.add(bg);

    const closeBtn = this.scene.add.text(125, -185, '✕', {
      fontSize: '20px',
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
    closeBtn.setDepth(1002);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeCardDetail());
    modal.add(closeBtn);

    const icon = isMinion
      ? this.scene.add.text(0, -160, card.getElementConfig?.()?.icon || '🐺', { fontSize: '48px' }).setOrigin(0.5)
      : this.scene.add.text(0, -160, qualityConfig.icon, { fontSize: '48px' }).setOrigin(0.5);
    modal.add(icon);

    const typeLabel = this.scene.add.text(0, -115, isMinion ? '🐺 随从卡' : '🔧 芯片卡', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: isMinion ? '#ff6b6b' : '#4dabf7'
    }).setOrigin(0.5);
    modal.add(typeLabel);

    const nameText = this.scene.add.text(0, -85, card.name, {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityConfig.textColor
    }).setOrigin(0.5);
    modal.add(nameText);

    const starText = this.scene.add.text(0, -55, '★'.repeat(card.star || 1), {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.YELLOW
    }).setOrigin(0.5);
    modal.add(starText);

    let y = -20;

    if (isMinion) {
      const stats = [
        `生命: ${card.maxHp}`,
        `攻击: ${card.atk}`,
        `暴击: ${((card.critRate || 0.1) * 100).toFixed(0)}%`,
        `闪避: ${((card.dodgeRate || 0.05) * 100).toFixed(0)}%`
      ];
      stats.forEach(stat => {
        const statText = this.scene.add.text(-100, y, stat, {
          fontSize: Const.FONT.SIZE_TINY,
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.SECONDARY
        }).setOrigin(0, 0.5);
        modal.add(statText);
        y += 22;
      });

      if (card.passiveSkill) {
        const passiveText = this.scene.add.text(-100, y + 5, `被动: ${card.passiveSkill.icon} ${card.passiveSkill.name}`, {
          fontSize: Const.FONT.SIZE_TINY,
          fontFamily: Const.FONT.FAMILY_CN,
          color: '#27ae60'
        }).setOrigin(0, 0.5);
        modal.add(passiveText);
        y += 25;
      }
    } else {
      const chipStats = this.scene.add.text(-100, y, this.getChipStats(card), {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.CYAN
      }).setOrigin(0, 0.5);
      modal.add(chipStats);
      y += 25;

      if (card.skills && card.skills.length > 0) {
        card.skills.forEach(skill => {
          const skillText = this.scene.add.text(-100, y, `技能: ${skill.name}`, {
            fontSize: Const.FONT.SIZE_TINY,
            fontFamily: Const.FONT.FAMILY_CN,
            color: '#9b59b6'
          }).setOrigin(0, 0.5);
          modal.add(skillText);
          y += 20;
        });
      }

      // 显示目标限制
      if (card.targetProfession || card.targetElement || card.targetRace) {
        const restrictions = [];
        if (card.targetProfession) restrictions.push(`职业: ${card.targetProfession}`);
        if (card.targetElement) restrictions.push(`元素: ${card.targetElement}`);
        if (card.targetRace) restrictions.push(`种族: ${card.targetRace}`);
        const restrictText = this.scene.add.text(-100, y, `适用: ${restrictions.join(', ')}`, {
          fontSize: Const.FONT.SIZE_TINY,
          fontFamily: Const.FONT.FAMILY_CN,
          color: '#e67e22'
        }).setOrigin(0, 0.5);
        modal.add(restrictText);
        y += 20;
      }
    }

    const price = isMinion ? this.getMinionPrice(card) : this.getChipPrice(card);
    const currencyIcon = isMinion ? '💎' : '🍄';

    // 购买按钮
    const buyBtnContainer = this.scene.add.container(0, 150);
    const buyBtnBg = this.scene.add.graphics();
    buyBtnBg.fillStyle(Const.COLORS.BUTTON_PRIMARY, 1);
    buyBtnBg.fillRoundedRect(-70, -18, 140, 36, Const.UI.BUTTON_RADIUS);
    buyBtnContainer.add(buyBtnBg);

    const buyBtnText = this.scene.add.text(0, 0, `${currencyIcon} 购买 ${price}`, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    buyBtnContainer.add(buyBtnText);

    buyBtnContainer.setSize(140, 36);
    buyBtnContainer.setInteractive(new Phaser.Geom.Rectangle(-70, -18, 140, 36), Phaser.Geom.Rectangle.Contains);
    buyBtnContainer.on('pointerdown', () => {
      AnimationHelper.tweenPulse(this.scene, buyBtnContainer, 0.9);
      this.scene.time.delayedCall(150, () => {
        // 先执行购买（数据变更），再关闭弹窗刷新界面
        if (isMinion) {
          this.buyMinionCard(index);
        } else {
          this.buyChipCard(index);
        }
        // buyXxxCard 内部会调用 refresh()，无需单独 closeCardDetail
      });
    });
    modal.add(buyBtnContainer);

    this._detailModal = modal;
    this.elements.push(modal);

    this.scene.tweens.add({
      targets: modal,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  closeCardDetail(skipRefresh = false) {
    const overlay = this._detailOverlay;
    const modal = this._detailModal;

    // 立即清除引用，防止重复关闭
    this._detailOverlay = null;
    this._detailModal = null;

    if (overlay) {
      this.scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          if (overlay.destroy) overlay.destroy();
        }
      });
    }

    if (modal) {
      this.scene.tweens.add({
        targets: modal,
        scaleX: 0.5,
        scaleY: 0.5,
        alpha: 0,
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => {
          if (modal.destroy) modal.destroy();
          if (!skipRefresh) {
            this.refresh();
          }
        }
      });
    } else if (!skipRefresh) {
      this.refresh();
    }
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
    // 清理弹窗引用
    this._detailOverlay = null;
    this._detailModal = null;
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
  }
}
