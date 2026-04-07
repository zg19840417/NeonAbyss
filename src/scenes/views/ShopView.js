import Const from '../../game/data/Const.js';
import AnimationHelper from '../../game/utils/AnimationHelper.js';
import ShopSystem, { ShopType, CurrencyConfig } from '../../game/systems/ShopSystem.js';
import GachaSystem from '../../game/systems/GachaSystem.js';

export default class ShopView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this.currentTab = ShopType.GACHA;
    this._detailOverlay = null;
    this._detailModal = null;
    this.shopSystem = new ShopSystem(scene.baseSystem || window.gameData?.base);
  }

  createCenteredHitArea(width, height) {
    return new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.shopSystem.refreshDaily();
    this.renderTabs(width);
    this.renderContent(width);
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

  renderContent(width) {
    const items = this.shopSystem.getCurrentItems();
    const height = this.scene.cameras.main.height;

    const marginX = 25;
    let startY = 130;
    const cardHeight = 58;
    const cardGap = 8;
    const bottomY = height - 120;
    const visibleHeight = bottomY - startY;
    const contentWidth = width - marginX * 2;

    if (items.length === 0) {
      this.addText(width / 2, startY + 50, '暂无商品', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
      return;
    }

    if (this.shopSystem.currentTab === ShopType.GACHA) {
      this.renderGachaHeader(width, startY);
      startY += 50;
    }

    const scrollContainer = this.scene.add.container(marginX, startY);
    this.elements.push(scrollContainer);
    this.scrollContainer = scrollContainer;

    const contentHeight = items.length * (cardHeight + cardGap);
    const maxScroll = Math.max(0, contentHeight - visibleHeight);

    this.scrollConfig = {
      containerY: startY,
      contentHeight: contentHeight,
      visibleHeight: visibleHeight,
      startY: 0,
      endY: -maxScroll,
      currentY: 0,
      speed: 8,
      isDragging: false,
      lastPointerY: 0
    };

    items.forEach((item, index) => {
      const y = index * (cardHeight + cardGap);
      const card = this.createShopCard(contentWidth / 2, y, item, index);
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

    this.setupScroll();
  }

  setupScroll() {
    const height = this.scene.cameras.main.height;
    const width = this.scene.cameras.main.width;
    const scrollTop = 130;
    const scrollBottom = height - 120;

    const maskGraphics = this.scene.add.graphics();
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRect(25, scrollTop - 30, width - 50, scrollBottom - scrollTop + 30);
    maskGraphics.setVisible(false);
    this.elements.push(maskGraphics);

    this.scrollContainer?.setMask(maskGraphics.createGeometryMask());

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
          this.scrollContainer.y = this.scrollConfig.containerY + this.scrollConfig.currentY;
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
            this.scrollContainer.y = this.scrollConfig.containerY + this.scrollConfig.currentY;
          }
        }
      }
    };

    this.scene.input.on('pointerdown', this.scrollHandlers.onPointerDown);
    this.scene.input.on('pointermove', this.scrollHandlers.onPointerMove);
    this.scene.input.on('pointerup', this.scrollHandlers.onPointerUp);
    this.scene.input.on('wheel', this.scrollHandlers.onWheel);
  }

  renderTabs(width) {
    const height = this.scene.cameras.main.height;
    const tabs = [
      { key: ShopType.GACHA, icon: '🎰', label: '抽卡' },
      { key: ShopType.SOURCE_CORE, icon: '💎', label: '源核' },
      { key: ShopType.MYCELIUM, icon: '🍄', label: '菌丝' },
      { key: ShopType.STAR_COIN, icon: '⭐', label: '星币' },
      { key: ShopType.FRAGMENT, icon: '🔮', label: '碎片' }
    ];

    const tabWidth = 68;
    const tabHeight = 30;
    const totalWidth = tabs.length * tabWidth;
    const startX = (width - totalWidth) / 2 + tabWidth / 2;
    // 避开主导航栏，防止二级分页按钮压住底部主导航点击区
    const y = height - Const.UI.NAV_HEIGHT - 30;

    tabs.forEach((tab, index) => {
      const x = startX + index * tabWidth;
      const isActive = this.shopSystem.currentTab === tab.key;

      const container = this.scene.add.container(x, y);

      const bg = this.scene.add.graphics();
      bg.fillStyle(isActive ? Const.COLORS.PURPLE : Const.COLORS.BG_MID, 0.95);
      bg.fillRoundedRect(-tabWidth/2 + 2, -tabHeight/2, tabWidth - 4, tabHeight, 6);
      if (isActive) {
        bg.lineStyle(2, Const.COLORS.PURPLE, 1);
        bg.strokeRoundedRect(-tabWidth/2 + 2, -tabHeight/2, tabWidth - 4, tabHeight, 6);
      }
      container.add(bg);

      const iconText = this.scene.add.text(0, -5, tab.icon, { fontSize: '14px' }).setOrigin(0.5);
      container.add(iconText);

      const labelText = this.scene.add.text(0, 6, tab.label, {
        fontSize: '9px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: isActive ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0.5);
      container.add(labelText);

      const hitZone = this.scene.add.rectangle(x, y, tabWidth - 4, tabHeight, 0x000000, 0.001);
      hitZone.setVisible(true);
      hitZone.setAlpha(0.001);
      hitZone.setDepth(Const.DEPTH.NAV + 2);
      hitZone.setInteractive();

      hitZone.on('pointerdown', () => {
        if (this.shopSystem.currentTab !== tab.key) {
          AnimationHelper.tweenPulse(this.scene, container, 0.9);
          this.shopSystem.setCurrentTab(tab.key);
          this.refresh();
        }
      });

      hitZone.on('pointerover', () => {
        if (this.shopSystem.currentTab !== tab.key) {
          AnimationHelper.tweenCardHover(this.scene, container, true);
        }
      });

      hitZone.on('pointerout', () => {
        if (this.shopSystem.currentTab !== tab.key) {
          container.setScale(1);
        }
      });

      this.elements.push(container);
      this.elements.push(hitZone);
    });
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
      if (result.reward.type === 'gacha') {
        this.scene.saveGameData();
        this.showGachaResult(result.reward.characters, result.reward.count);
      } else {
        const rewardText = this.getRewardText(result.reward);
        this.showToast(`获得 ${rewardText}！`, true);
        this.scene.saveGameData();
        this.refresh();
      }
    } else {
      this.showToast(this.getCannotPurchaseReason(result.reason), false);
    }
  }

  showGachaResult(characters, count) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(3000);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    this.elements.push(overlay);
    
    const container = this.scene.add.container(width / 2, height / 2);
    container.setDepth(3001);
    this.elements.push(container);
    
    const titleText = this.scene.add.text(0, -height/2 + 80, '融合召唤', {
      fontSize: '24px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);
    container.add(titleText);
    
    const isTenPull = count >= 10;
    const cardWidth = isTenPull ? 70 : 120;
    const cardGap = 10;
    const totalWidth = count * cardWidth + (count - 1) * cardGap;
    const startX = -totalWidth / 2 + cardWidth / 2;
    
    const cardContainers = [];
    
    characters.forEach((char, i) => {
      const x = startX + i * (cardWidth + cardGap);
      const card = this.createGachaCard(x, 0, char, i * 150);
      cardContainers.push(card);
      container.add(card);
    });
    
    const confirmBtn = this.scene.add.container(0, height/2 - 60);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0xffd700, 1);
    btnBg.fillRoundedRect(-50, -18, 100, 36, 8);
    confirmBtn.add(btnBg);
    
    const btnText = this.scene.add.text(0, 0, '确 定', {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#000000'
    }).setOrigin(0.5);
    confirmBtn.add(btnText);
    
    confirmBtn.setSize(100, 36);
    confirmBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 36), Phaser.Geom.Rectangle.Contains);
    
    const closeGacha = () => {
      container.destroy();
      this.elements = this.elements.filter(e => e !== overlay);
      overlay.destroy();
      this.refresh();
    };
    
    confirmBtn.on('pointerdown', closeGacha);
    container.add(confirmBtn);
    this.elements.push(confirmBtn);
  }

  createGachaCard(x, y, character, delay = 0) {
    const container = this.scene.add.container(x, y);
    
    const qualityColor = GachaSystem.getQualityColor(character.quality);
    const qualityName = GachaSystem.getQualityName(character.quality);
    
    this.scene.time.delayedCall(delay, () => {
      const glow = this.scene.add.graphics();
      glow.fillStyle(parseInt(qualityColor.replace('#', '0x')), 0.3);
      glow.fillCircle(0, 0, 50);
      container.add(glow);
      
      const bg = this.scene.add.graphics();
      bg.fillStyle(parseInt(qualityColor.replace('#', '0x')), 1);
      bg.fillRoundedRect(-40, -55, 80, 110, 8);
      container.add(bg);
      
      const innerBg = this.scene.add.graphics();
      innerBg.fillStyle(0x1a1a2e, 1);
      innerBg.fillRoundedRect(-36, -51, 72, 102, 6);
      container.add(innerBg);
      
      const border = this.scene.add.graphics();
      border.lineStyle(2, parseInt(qualityColor.replace('#', '0x')), 1);
      border.strokeRoundedRect(-36, -51, 72, 102, 6);
      container.add(border);
      
      const classIcon = this.getClassIcon(character.charClass);
      const iconText = this.scene.add.text(0, -25, classIcon, { fontSize: '32px' }).setOrigin(0.5);
      container.add(iconText);
      
      const nameText = this.scene.add.text(0, 10, character.name, {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: qualityColor
      }).setOrigin(0.5);
      container.add(nameText);
      
      const qualityText = this.scene.add.text(0, 30, qualityName, {
        fontSize: '10px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: qualityColor
      }).setOrigin(0.5);
      container.add(qualityText);
      
      container.setScale(0);
      this.scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.easeOut'
      });
      
      this.scene.tweens.add({
        targets: glow,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    });
    
    return container;
  }

  getClassIcon(charClass) {
    const icons = {
      plant: '🌿',
      animal: '🐾',
      mech: '⚙️',
      energy: '⚡',
      hybrid: '🔮'
    };
    return icons[charClass] || '❓';
  }

  renderGachaHeader(width, y) {
    const historyBtn = this.scene.add.container(width - 45, y + 15);
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_DARK, 0.9);
    bg.fillRoundedRect(-30, -15, 60, 30, 6);
    historyBtn.add(bg);
    
    const text = this.scene.add.text(0, 0, '抽卡记录', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#ffd700'
    }).setOrigin(0.5);
    historyBtn.add(text);
    
    historyBtn.setSize(60, 30);
    historyBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 60, 30), Phaser.Geom.Rectangle.Contains);
    
    historyBtn.on('pointerdown', () => {
      this.showGachaHistory();
    });
    
    historyBtn.on('pointerover', () => {
      historyBtn.setScale(1.05);
    });
    
    historyBtn.on('pointerout', () => {
      historyBtn.setScale(1);
    });
    
    this.elements.push(historyBtn);
    
    const pityInfo = this.shopSystem.getGachaPityInfo();
    const pityText = this.scene.add.text(25, y + 15, `保底: ${pityInfo.ssrPity}抽`, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0, 0.5);
    this.elements.push(pityText);
  }

  showGachaHistory() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const history = this.shopSystem.getGachaHistory();
    
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.9);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(3000);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    this.elements.push(overlay);
    
    const container = this.scene.add.container(0, 0);
    container.setDepth(3001);
    this.elements.push(container);
    
    const titleText = this.scene.add.text(width / 2, 50, '抽卡记录', {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5);
    container.add(titleText);
    
    const closeBtn = this.scene.add.container(width - 30, 50);
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(0xff6666, 1);
    closeBg.fillCircle(0, 0, 15);
    closeBtn.add(closeBg);
    
    const closeText = this.scene.add.text(0, 0, '×', {
      fontSize: '16px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    closeBtn.add(closeText);
    
    closeBtn.setSize(30, 30);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 30, 30), Phaser.Geom.Rectangle.Contains);
    
    const closeHistory = () => {
      container.destroy();
      this.elements = this.elements.filter(e => e !== overlay);
      overlay.destroy();
    };
    
    closeBtn.on('pointerdown', closeHistory);
    overlay.on('pointerdown', closeHistory);
    container.add(closeBtn);
    this.elements.push(closeBtn);
    
    if (history.length === 0) {
      const emptyText = this.scene.add.text(width / 2, height / 2, '暂无抽卡记录', {
        fontSize: '14px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5);
      container.add(emptyText);
    } else {
      const startY = 100;
      const itemHeight = 45;
      const visibleCount = 12;
      
      const listContainer = this.scene.add.container(0, startY);
      container.add(listContainer);
      
      history.slice(0, 50).forEach((record, index) => {
        const y = index * itemHeight;
        const item = this.scene.add.container(width / 2, y);
        
        const qualityColor = GachaSystem.getQualityColor(record.quality);
        const qualityName = GachaSystem.getQualityName(record.quality);
        const classIcon = this.getClassIcon(record.charClass);
        
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.8);
        bg.fillRoundedRect(-width/2 + 20, -itemHeight/2 + 2, width - 40, itemHeight - 4, 4);
        item.add(bg);
        
        const iconText = this.scene.add.text(-width/2 + 50, 0, classIcon, { fontSize: '20px' }).setOrigin(0.5);
        item.add(iconText);
        
        const nameText = this.scene.add.text(-width/2 + 90, -5, record.name, {
          fontSize: '12px',
          fontFamily: Const.FONT.FAMILY_CN,
          fontStyle: 'bold',
          color: qualityColor
        }).setOrigin(0, 0.5);
        item.add(nameText);
        
        const qualityText = this.scene.add.text(-width/2 + 90, 10, qualityName, {
          fontSize: '10px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: qualityColor
        }).setOrigin(0, 0.5);
        item.add(qualityText);
        
        const timeText = this.scene.add.text(width/2 - 40, 0, this.formatTime(record.time), {
          fontSize: '10px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.INACTIVE
        }).setOrigin(1, 0.5);
        item.add(timeText);
        
        listContainer.add(item);
      });
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${month}/${day} ${hour}:${minute.toString().padStart(2, '0')}`;
  }

  getRewardText(reward) {
    if (reward.type === 'currency') {
      const currencyName = CurrencyConfig[reward.currencyType]?.name || reward.currencyType;
      return `${currencyName}×${reward.amount}`;
    } else if (reward.type === 'item') {
      const itemInfo = this.shopSystem.getItemInfo(reward.item);
      return itemInfo?.name || reward.item;
    } else if (reward.type === 'gacha') {
      return `融合姬×${reward.count}`;
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
