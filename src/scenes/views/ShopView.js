import Const from '../../game/data/Const.js';
import AnimationHelper from '../../game/utils/AnimationHelper.js';
import ShopSystem, { ShopType, CurrencyConfig } from '../../game/systems/ShopSystem.js';
import GachaSystem from '../../game/systems/GachaSystem.js';

const TAB_CONFIG = [
  { key: ShopType.GACHA, icon: '🎴', label: '召唤' },
  { key: ShopType.SOURCE_CORE, icon: '💎', label: '源核' },
  { key: ShopType.MYCELIUM, icon: '🍄', label: '菌丝' },
  { key: ShopType.STAR_COIN, icon: '⭐', label: '星币' },
  { key: ShopType.FRAGMENT, icon: '🧩', label: '碎片' }
];

const GACHA_NAME_MAP = {
  GACHA_SINGLE: '单次召唤',
  GACHA_TEN: '十连召唤'
};

export default class ShopView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this.shopSystem = new ShopSystem(scene.baseSystem || window.gameData?.base);
    this.scrollContainer = null;
    this.scrollConfig = null;
    this.scrollHandlers = null;
  }

  show() {
    this.shopSystem.refreshDaily();
    this.renderTabs();
    this.renderContent();
  }

  renderTabs() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const tabWidth = 68;
    const tabHeight = 30;
    const totalWidth = TAB_CONFIG.length * tabWidth;
    const startX = (width - totalWidth) / 2 + tabWidth / 2;
    const y = height - Const.UI.NAV_HEIGHT - 30;

    TAB_CONFIG.forEach((tab, index) => {
      const x = startX + index * tabWidth;
      const isActive = this.shopSystem.currentTab === tab.key;
      const container = this.scene.add.container(x, y);
      container.setDepth(Const.DEPTH.NAV + 1);

      const bg = this.scene.add.graphics();
      bg.fillStyle(isActive ? Const.COLORS.PURPLE : Const.COLORS.BG_MID, 0.95);
      bg.fillRoundedRect(-tabWidth / 2 + 2, -tabHeight / 2, tabWidth - 4, tabHeight, 0);
      if (isActive) {
        bg.lineStyle(2, Const.COLORS.PURPLE, 1);
      bg.strokeRoundedRect(-tabWidth / 2 + 2, -tabHeight / 2, tabWidth - 4, tabHeight, 0);
      }
      container.add(bg);

      container.add(this.scene.add.text(0, -5, tab.icon, { fontSize: '14px' }).setOrigin(0.5));
      container.add(this.scene.add.text(0, 6, tab.label, {
        fontSize: '9px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: isActive ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0.5));

      const hitZone = this.scene.add.rectangle(x, y, tabWidth, 42, 0x000000, 0.001);
      hitZone.setDepth(Const.DEPTH.NAV + 3);
      hitZone.setInteractive();
      hitZone.on('pointerdown', () => {
        if (this.shopSystem.currentTab === tab.key) return;
        AnimationHelper.tweenPulse(this.scene, container, 0.92);
        this.shopSystem.setCurrentTab(tab.key);
        this.refresh();
      });
      hitZone.on('pointerover', () => {
        if (!isActive) {
          AnimationHelper.tweenCardHover(this.scene, container, true);
        }
      });
      hitZone.on('pointerout', () => {
        if (!isActive) {
          container.setScale(1);
        }
      });

      this.elements.push(container, hitZone);
    });
  }

  renderContent() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const items = this.shopSystem.getCurrentItems();
    const marginX = 25;
    let startY = 130;
    const bottomY = height - 120;
    const contentWidth = width - marginX * 2;
    const cardHeight = 58;
    const cardGap = 8;

    if (this.shopSystem.currentTab === ShopType.GACHA) {
      this.renderGachaHeader(width, startY);
      startY += 50;
    }

    if (items.length === 0) {
      this.addText(width / 2, startY + 40, '暂时没有可售商品', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
      return;
    }

    const visibleHeight = bottomY - startY;
    const contentHeight = items.length * (cardHeight + cardGap);
    const maxScroll = Math.max(0, contentHeight - visibleHeight);

    this.scrollContainer = this.scene.add.container(marginX, startY);
    this.elements.push(this.scrollContainer);

    this.scrollConfig = {
      containerY: startY,
      currentY: 0,
      startY: 0,
      endY: -maxScroll,
      isDragging: false,
      lastPointerY: 0,
      scrollTop: startY - 24,
      scrollBottom: bottomY,
      contentWidth
    };

    items.forEach((item, index) => {
      const card = this.createShopCard(contentWidth / 2, index * (cardHeight + cardGap), item);
      card.setAlpha(0);
      this.scene.tweens.add({
        targets: card,
        alpha: 1,
        duration: 180,
        delay: index * 40,
        ease: 'Power2'
      });
      this.scrollContainer.add(card);
    });

    this.setupScroll(width, marginX, startY, bottomY);
  }

  setupScroll(width, marginX, startY, bottomY) {
    const maskGraphics = this.scene.add.graphics();
    maskGraphics.fillStyle(0xffffff, 1);
    maskGraphics.fillRect(marginX, startY - 24, width - marginX * 2, bottomY - startY + 30);
    maskGraphics.setVisible(false);
    this.elements.push(maskGraphics);
    this.scrollContainer?.setMask(maskGraphics.createGeometryMask());

    this.scrollHandlers = {
      onPointerDown: (pointer) => {
        if (pointer.y < this.scrollConfig.scrollTop || pointer.y > this.scrollConfig.scrollBottom) return;
        this.scrollConfig.isDragging = true;
        this.scrollConfig.lastPointerY = pointer.y;
      },
      onPointerMove: (pointer) => {
        if (!this.scrollConfig.isDragging) return;
        const deltaY = pointer.y - this.scrollConfig.lastPointerY;
        this.scrollConfig.lastPointerY = pointer.y;
        this.setScrollY(this.scrollConfig.currentY + deltaY);
      },
      onPointerUp: () => {
        this.scrollConfig.isDragging = false;
      },
      onWheel: (pointer, gameObjects, deltaX, deltaY) => {
        if (pointer.y < this.scrollConfig.scrollTop || pointer.y > this.scrollConfig.scrollBottom) return;
        this.setScrollY(this.scrollConfig.currentY - deltaY * 0.45);
      }
    };

    this.scene.input.on('pointerdown', this.scrollHandlers.onPointerDown);
    this.scene.input.on('pointermove', this.scrollHandlers.onPointerMove);
    this.scene.input.on('pointerup', this.scrollHandlers.onPointerUp);
    this.scene.input.on('wheel', this.scrollHandlers.onWheel);
  }

  setScrollY(nextY) {
    if (!this.scrollConfig || !this.scrollContainer) return;
    this.scrollConfig.currentY = Phaser.Math.Clamp(nextY, this.scrollConfig.endY, this.scrollConfig.startY);
    this.scrollContainer.y = this.scrollConfig.containerY + this.scrollConfig.currentY;
  }

  createShopCard(x, y, item) {
    const container = this.scene.add.container(x, y);
    const cardWidth = 320;
    const cardHeight = 60;
    const canPurchase = this.shopSystem.canPurchase(item);
    const rarityColor = this.getRarityColor(item);
    const currencyConfig = CurrencyConfig[item.currency] || { icon: '?', color: '#ffffff' };

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(2, rarityColor, 0.55);
    bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    container.add(bg);

    const glow = this.scene.add.graphics();
    glow.fillStyle(rarityColor, 0.12);
    glow.fillCircle(-cardWidth / 2 + 35, 0, 28);
    container.add(glow);
    container.sendToBack(glow);

    const iconText = this.scene.add.text(-cardWidth / 2 + 35, 0, this.getItemIcon(item), {
      fontSize: '26px'
    }).setOrigin(0.5);
    container.add(iconText);

    container.add(this.scene.add.text(-cardWidth / 2 + 65, -10, this.getDisplayItemName(item), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5));

    container.add(this.scene.add.text(-cardWidth / 2 + 65, 10, this.getLimitText(item), {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: item.dailyLimit > 0 ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5));

    const buyBtn = this.scene.add.container(cardWidth / 2 - 55, 0);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(canPurchase.can ? Const.COLORS.BUTTON_PRIMARY : Const.COLORS.BG_DARK, canPurchase.can ? 1 : 0.5);
    btnBg.fillRoundedRect(-35, -14, 70, 28, Const.UI.BUTTON_RADIUS);
    buyBtn.add(btnBg);
    buyBtn.add(this.scene.add.text(0, 0, `${currencyConfig.icon} ${item.cost}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: canPurchase.can ? Const.TEXT_COLORS.DARK : Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0.5));
    buyBtn.setSize(70, 28);
    buyBtn.setInteractive(new Phaser.Geom.Rectangle(-35, -14, 70, 28), Phaser.Geom.Rectangle.Contains);
    buyBtn.on('pointerdown', () => {
      if (!canPurchase.can) {
        this.showToast(this.getCannotPurchaseReason(canPurchase.reason), false);
        return;
      }
      AnimationHelper.tweenPulse(this.scene, buyBtn, 0.92);
      this.scene.time.delayedCall(120, () => this.purchaseItem(item));
    });
    buyBtn.on('pointerover', () => {
      if (canPurchase.can) {
        AnimationHelper.tweenPulse(this.scene, buyBtn, 1.05);
      }
    });
    buyBtn.on('pointerout', () => buyBtn.setScale(1));
    container.add(buyBtn);

    this.elements.push(container);
    return container;
  }

  purchaseItem(item) {
    const result = this.shopSystem.purchase(item);
    if (!result.success) {
      this.showToast(this.getCannotPurchaseReason(result.reason), false);
      return;
    }

    if (result.reward.type === 'gacha') {
      this.scene.saveGameData?.();
      this.showGachaResult(result.reward.fragments || [], result.reward.resultSummary || null);
      return;
    }

    this.showToast(`获得 ${this.getRewardText(result.reward)}`, true);
    this.scene.saveGameData?.();
    this.refresh();
  }

  renderGachaHeader(width, y) {
    const historyBtn = this.scene.add.container(width - 45, y + 15);
    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_DARK, 0.9);
    bg.fillRoundedRect(-30, -15, 60, 30, 6);
    historyBtn.add(bg);
    historyBtn.add(this.scene.add.text(0, 0, '记录', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#ffd700'
    }).setOrigin(0.5));
    historyBtn.setSize(60, 30);
    historyBtn.setInteractive(new Phaser.Geom.Rectangle(-30, -15, 60, 30), Phaser.Geom.Rectangle.Contains);
    historyBtn.on('pointerdown', () => this.showGachaHistory());
    historyBtn.on('pointerover', () => historyBtn.setScale(1.05));
    historyBtn.on('pointerout', () => historyBtn.setScale(1));
    this.elements.push(historyBtn);

    const pityInfo = this.shopSystem.getGachaPityInfo();
    const pityText = this.scene.add.text(25, y + 15, `保底: SR ${pityInfo.srPity} 抽 / SSR ${pityInfo.ssrPity} 抽 / UR ${pityInfo.urPity} 抽`, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0, 0.5);
    this.elements.push(pityText);
  }

  showGachaResult(fragments, summary) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.88).setOrigin(0, 0);
    overlay.setDepth(3000);
    overlay.setInteractive();
    const container = this.scene.add.container(width / 2, height / 2);
    container.setDepth(3001);

    container.add(this.scene.add.text(0, -height / 2 + 80, '立绘碎片召唤', {
      fontSize: '24px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5));

    const isTenPull = fragments.length >= 10;
    const cardWidth = isTenPull ? 92 : 120;
    const cardHeight = isTenPull ? 112 : 132;
    const columns = isTenPull ? 5 : Math.max(1, fragments.length);
    const gapX = 10;
    const gapY = 12;
    const totalWidth = columns * cardWidth + (columns - 1) * gapX;

    fragments.forEach((fragment, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const x = -totalWidth / 2 + cardWidth / 2 + col * (cardWidth + gapX);
      const y = -20 + row * (cardHeight + gapY);
      container.add(this.createGachaCard(x, y, fragment, cardWidth, cardHeight));
    });

    if (summary) {
      const lines = [];
      if (summary.completedSetCount > 0) {
        lines.push(`完成立绘套装 ${summary.completedSetCount} 套`);
      }
      if (summary.qualityUpgradeReadyCount > 0) {
        lines.push(`新增可升品质机会 ${summary.qualityUpgradeReadyCount} 次`);
      }
      const overflowParts = Object.entries(summary.overflowPoints || {})
        .filter(([, amount]) => amount > 0)
        .map(([key, amount]) => `${CurrencyConfig[key]?.name || key}+${amount}`);
      if (overflowParts.length > 0) {
        lines.push(overflowParts.join(' / '));
      }
      if (lines.length > 0) {
        container.add(this.scene.add.text(0, height / 2 - 122, lines.join('\n'), {
          fontSize: '12px',
          fontFamily: Const.FONT.FAMILY_CN,
          align: 'center',
          color: '#8ce99a'
        }).setOrigin(0.5));
      }
    }

    const confirmBtn = this.scene.add.container(0, height / 2 - 60);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0xffd700, 1);
    btnBg.fillRoundedRect(-55, -18, 110, 36, 8);
    confirmBtn.add(btnBg);
    confirmBtn.add(this.scene.add.text(0, 0, '确认', {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#000000'
    }).setOrigin(0.5));
    confirmBtn.setSize(110, 36);
    confirmBtn.setInteractive(new Phaser.Geom.Rectangle(-55, -18, 110, 36), Phaser.Geom.Rectangle.Contains);

    const close = () => {
      overlay.destroy();
      container.destroy();
      confirmBtn.destroy();
      this.elements = this.elements.filter((element) => ![overlay, container, confirmBtn].includes(element));
      this.refresh();
    };

    confirmBtn.on('pointerdown', close);
    overlay.on('pointerdown', close);
    container.add(confirmBtn);
    this.elements.push(overlay, container, confirmBtn);
  }

  createGachaCard(x, y, fragment, cardWidth, cardHeight) {
    const container = this.scene.add.container(x, y);
    const qualityColor = GachaSystem.getQualityColor(fragment.fragmentQuality);
    const qualityName = GachaSystem.getQualityName(fragment.fragmentQuality);

    const bg = this.scene.add.graphics();
    bg.fillStyle(parseInt(qualityColor.replace('#', '0x'), 16), 0.22);
    bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 10);
    bg.lineStyle(2, parseInt(qualityColor.replace('#', '0x'), 16), 1);
    bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 10);
    container.add(bg);

    container.add(this.scene.add.text(0, -28, fragment.icon || '🧩', { fontSize: '28px' }).setOrigin(0.5));
    container.add(this.scene.add.text(0, 2, fragment.fusionGirlName, {
      fontSize: cardWidth <= 100 ? '10px' : '12px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5));
    container.add(this.scene.add.text(0, 20, `${fragment.portraitSetName} / ${fragment.fragmentSlot}`, {
      fontSize: '9px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#cdd6f4'
    }).setOrigin(0.5));
    container.add(this.scene.add.text(0, 38, qualityName, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: qualityColor
    }).setOrigin(0.5));
    container.add(this.scene.add.text(0, 53, `需求 ${fragment.requiredCount}`, {
      fontSize: '9px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#adb5bd'
    }).setOrigin(0.5));

    container.setScale(0);
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 260,
      ease: 'Back.easeOut'
    });

    return container;
  }

  showGachaHistory() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const history = this.shopSystem.getGachaHistory();

    const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0, 0);
    overlay.setDepth(3000);
    overlay.setInteractive();

    const container = this.scene.add.container(0, 0);
    container.setDepth(3001);
    container.add(this.scene.add.text(width / 2, 50, '召唤记录', {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#ffd700'
    }).setOrigin(0.5));

    const closeBtn = this.scene.add.container(width - 30, 50);
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(0xff6666, 1);
    closeBg.fillCircle(0, 0, 15);
    closeBtn.add(closeBg);
    closeBtn.add(this.scene.add.text(0, 0, '×', {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5));
    closeBtn.setSize(30, 30);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(-15, -15, 30, 30), Phaser.Geom.Rectangle.Contains);

    const close = () => {
      overlay.destroy();
      container.destroy();
      closeBtn.destroy();
      this.elements = this.elements.filter((element) => ![overlay, container, closeBtn].includes(element));
    };

    closeBtn.on('pointerdown', close);
    overlay.on('pointerdown', close);
    container.add(closeBtn);

    if (history.length === 0) {
      container.add(this.scene.add.text(width / 2, height / 2, '暂时没有召唤记录', {
        fontSize: '14px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5));
    } else {
      const listContainer = this.scene.add.container(0, 100);
      history.slice(0, 50).forEach((record, index) => {
        const y = index * 45;
        const item = this.scene.add.container(width / 2, y);
        const qualityColor = GachaSystem.getQualityColor(record.fragmentQuality);
        const qualityName = GachaSystem.getQualityName(record.fragmentQuality);

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.8);
        bg.fillRoundedRect(-width / 2 + 20, -20, width - 40, 40, 4);
        item.add(bg);
        item.add(this.scene.add.text(-width / 2 + 45, 0, '🧩', { fontSize: '18px' }).setOrigin(0.5));
        item.add(this.scene.add.text(-width / 2 + 75, -6, record.fusionGirlName, {
          fontSize: '12px',
          fontFamily: Const.FONT.FAMILY_CN,
          fontStyle: 'bold',
          color: qualityColor
        }).setOrigin(0, 0.5));
        item.add(this.scene.add.text(-width / 2 + 75, 10, `${record.portraitSetName} / ${record.fragmentSlot} / ${qualityName}`, {
          fontSize: '10px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: '#cdd6f4'
        }).setOrigin(0, 0.5));
        item.add(this.scene.add.text(width / 2 - 40, 0, this.formatTime(record.time), {
          fontSize: '10px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.INACTIVE
        }).setOrigin(1, 0.5));
        listContainer.add(item);
      });
      container.add(listContainer);
    }

    this.elements.push(overlay, container, closeBtn);
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${month}/${day} ${hour}:${minute.toString().padStart(2, '0')}`;
  }

  getDisplayItemName(item) {
    if (GACHA_NAME_MAP[item.itemId]) {
      return GACHA_NAME_MAP[item.itemId];
    }
    if (typeof item.itemName === 'string' && /[\u4e00-\u9fa5]/.test(item.itemName)) {
      return item.itemName;
    }
    const itemInfo = this.shopSystem.getItemInfo(item.itemId);
    if (itemInfo?.name && /[\u4e00-\u9fa5]/.test(itemInfo.name)) {
      return itemInfo.name;
    }
    return item.itemId;
  }

  getRewardText(reward) {
    if (reward.type === 'currency') {
      const currencyName = CurrencyConfig[reward.currencyType]?.name || reward.currencyType;
      return `${currencyName} x${reward.amount}`;
    }
    if (reward.type === 'item') {
      return this.shopSystem.getItemInfo(reward.item)?.name || reward.item;
    }
    if (reward.type === 'gacha') {
      return `立绘碎片 x${reward.count}`;
    }
    return '奖励';
  }

  getLimitText(item) {
    if (item.dailyLimit === 0) return '不限购';
    if (item.dailyLimit === -1) return '限购一次';
    return `剩余 ${this.shopSystem.getRemainingCount(item)}/${item.dailyLimit}`;
  }

  getCannotPurchaseReason(reason) {
    switch (reason) {
      case 'daily_limit_reached': return '今日购买次数已用尽';
      case 'already_purchased': return '该商品已购买';
      case 'not_enough_currency': return '货币不足';
      case 'no_unlocked_fragments': return '当前还没有开放可召唤的融合姬碎片';
      case 'gacha_failed': return '召唤失败';
      default: return '无法购买';
    }
  }

  getItemIcon(item) {
    if (item.itemId === 'GACHA_SINGLE' || item.itemId === 'GACHA_TEN') return '🎴';
    if (item.currency === 'sourceCore') return '💎';
    if (item.currency === 'mycelium') return '🍄';
    if (item.currency === 'starCoin') return '⭐';
    return '📦';
  }

  getRarityColor(item) {
    if (item.itemId === 'GACHA_TEN') return 0xffd43b;
    if (item.itemId === 'GACHA_SINGLE') return 0x9775fa;
    if (item.cost >= 1000) return 0xf59f00;
    if (item.cost >= 300) return 0x9775fa;
    if (item.cost >= 100) return 0x4dabf7;
    return 0x666666;
  }

  showToast(message, isSuccess = true) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const toastBg = this.scene.add.graphics();
    const bgColor = isSuccess ? 0x003300 : 0x330000;
    toastBg.fillStyle(bgColor, 0.92);
    toastBg.fillRoundedRect(width / 2 - 110, height / 2 - 22, 220, 44, 8);
    toastBg.lineStyle(2, isSuccess ? 0x00ff88 : 0xff6b6b, 0.75);
    toastBg.strokeRoundedRect(width / 2 - 110, height / 2 - 22, 220, 44, 8);
    toastBg.setDepth(2000);

    const toastText = this.scene.add.text(width / 2, height / 2, message, {
      fontSize: '13px',
      fontFamily: Const.FONT.FAMILY_CN,
      align: 'center',
      color: isSuccess ? '#00ff88' : '#ff6666',
      wordWrap: { width: 200 }
    }).setOrigin(0.5).setDepth(2001);

    this.elements.push(toastBg, toastText);

    this.scene.tweens.add({
      targets: [toastBg, toastText],
      alpha: 0,
      duration: 400,
      delay: 1400,
      ease: 'Power2',
      onComplete: () => {
        toastBg.destroy();
        toastText.destroy();
        this.elements = this.elements.filter((element) => element !== toastBg && element !== toastText);
      }
    });
  }

  addText(x, y, text, options = {}) {
    const textObj = this.scene.add.text(x, y, text, options).setOrigin(0.5);
    this.elements.push(textObj);
    return textObj;
  }

  refresh() {
    this.destroy();
    this.show();
  }

  destroy() {
    if (this.scrollHandlers) {
      this.scene.input.off('pointerdown', this.scrollHandlers.onPointerDown);
      this.scene.input.off('pointermove', this.scrollHandlers.onPointerMove);
      this.scene.input.off('pointerup', this.scrollHandlers.onPointerUp);
      this.scene.input.off('wheel', this.scrollHandlers.onWheel);
      this.scrollHandlers = null;
    }

    this.elements.forEach((element) => {
      if (element?.destroy) {
        element.destroy();
      }
    });
    this.elements = [];
    this.scrollContainer = null;
    this.scrollConfig = null;
  }
}
