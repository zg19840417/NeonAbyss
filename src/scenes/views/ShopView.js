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

    this.shopSystem.refreshDaily();
    this.renderHeader(width);
    this.renderTabs(width);
    this.renderContent(width);
    this.renderFooter(width, height);
    this.startCountdown();
  }

  renderHeader(width) {
    this.addText(width / 2, 22, '商店', {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });

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
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    });
  }

  startCountdown() {
    // TODO: implement daily refresh countdown
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
    this._detailOverlay = null;
    this._detailModal = null;

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
