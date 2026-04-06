export default class ShopView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this.currentTab = 'minion';
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const { Const } = this.scene;

    this.addText(width / 2, 90, '商店', {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });

    this.renderTabButtons(width);
    this.renderContent();

    this.addText(width / 2, height - 100, '点击卡片购买', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    });
  }

  renderTabButtons(width) {
    const tabs = [
      { key: 'minion', icon: '🐺', label: '随从卡' },
      { key: 'equipment', icon: '⚔️', label: '装备卡' }
    ];

    const startX = 100;
    const tabWidth = 80;
    const startY = 125;

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
        this.currentTab = tab.key;
        this.refresh();
      });

      this.elements.push(container);
    });
  }

  renderContent() {
    if (this.currentTab === 'minion') {
      this.renderMinionShop();
    } else {
      this.renderEquipmentShop();
    }
  }

  renderMinionShop() {
    const width = this.scene.cameras.main.width;
    this.scene.minionCardManager.initManager?.();
    const shopMinions = this.scene.minionCardManager.shopMinions || [];

    if (shopMinions.length === 0) {
      this.addText(width / 2, 200, '暂无随从卡', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      shopMinions.forEach((card, index) => {
        this.createMinionShopCard(width / 2, 170 + index * 80, card, index);
      });
    }

    this.renderRefreshButton(width, 'minion');
  }

  renderEquipmentShop() {
    const width = this.scene.cameras.main.width;
    const shopEquipments = this.scene.equipmentCardManager?.shopCards || [];

    if (shopEquipments.length === 0) {
      this.addText(width / 2, 200, '暂无装备卡', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      shopEquipments.forEach((card, index) => {
        this.createEquipmentShopCard(width / 2, 170 + index * 80, card, index);
      });
    }

    this.renderRefreshButton(width, 'equipment');
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
    const btnText = this.scene.add.text(0, 0, `💰${price}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    buyBtn.add([btnBg, btnText]);
    buyBtn.setSize(60, 28);
    buyBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 60, 28), Phaser.Geom.Rectangle.Contains);
    buyBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.buyMinionCard(index);
    });
    container.add(buyBtn);

    container.setSize(cardWidth, cardHeight);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
    this.elements.push(container);
    return container;
  }

  createEquipmentShopCard(x, y, card, index) {
    const container = this.scene.add.container(x, y);
    const cardWidth = 300;
    const cardHeight = 70;
    const qualityConfig = this.getEquipmentQualityConfig(card.quality);

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

    const statsText = this.scene.add.text(-cardWidth/2 + 60, 25, this.getEquipmentStats(card), {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0, 0.5);
    container.add(statsText);

    const price = this.getEquipmentPrice(card);
    const buyBtn = this.scene.add.container(cardWidth/2 - 50, 0);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(Const.COLORS.BUTTON_PRIMARY, 1);
    btnBg.fillRoundedRect(-30, -14, 60, 28, Const.UI.BUTTON_RADIUS);
    const btnText = this.scene.add.text(0, 0, `💰${price}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    buyBtn.add([btnBg, btnText]);
    buyBtn.setSize(60, 28);
    buyBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 60, 28), Phaser.Geom.Rectangle.Contains);
    buyBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.buyEquipmentCard(index);
    });
    container.add(buyBtn);

    container.setSize(cardWidth, cardHeight);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
    this.elements.push(container);
    return container;
  }

  buyMinionCard(index) {
    const card = this.scene.minionCardManager.shopMinions?.[index];
    if (!card) return;

    const price = this.getMinionPrice(card);
    const gold = this.scene.baseSystem.gold || 0;

    if (gold < price) {
      this.scene.showToast?.('金币不足！');
      return;
    }

    this.scene.baseSystem.gold -= price;
    this.scene.minionCardManager.addCard(card);
    this.scene.minionCardManager.shopMinions.splice(index, 1);
    this.scene.saveGameData();
    this.scene.showToast?.('购买成功！');
    this.refresh();
  }

  buyEquipmentCard(index) {
    const card = this.scene.equipmentCardManager.shopCards?.[index];
    if (!card) return;

    const price = this.getEquipmentPrice(card);
    const gold = this.scene.baseSystem.gold || 0;

    if (gold < price) {
      this.scene.showToast?.('金币不足！');
      return;
    }

    this.scene.baseSystem.gold -= price;
    this.scene.equipmentCardManager.addCard(card);
    this.scene.equipmentCardManager.shopCards.splice(index, 1);
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
    container.on('pointerover', () => bg.clear().fillStyle(Const.COLORS.BUTTON_HOVER, 0.8).fillRoundedRect(-60, -16, 120, 32, Const.UI.BUTTON_RADIUS));
    container.on('pointerout', () => bg.clear().fillStyle(Const.COLORS.BUTTON_SECONDARY, 0.8).fillRoundedRect(-60, -16, 120, 32, Const.UI.BUTTON_RADIUS));

    this.elements.push(container);
  }

  refreshShop(type) {
    if (type === 'minion') {
      this.scene.minionCardManager.shopMinions = [];
      for (let i = 0; i < 3; i++) {
        this.scene.minionCardManager.shopMinions.push(
          this.scene.minionCardManager.generateRandomCard()
        );
      }
      this.scene.minionCardManager.ownedCards.splice(-3, 3);
    } else {
      this.scene.equipmentCardManager.shopCards = [];
      for (let i = 0; i < 2; i++) {
        const newCard = this.scene.equipmentCardManager.generateRandomCard?.();
        if (newCard) {
          this.scene.equipmentCardManager.shopCards.push(newCard);
          this.scene.equipmentCardManager.ownedCards.pop();
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

  getEquipmentPrice(card) {
    const basePrices = { N: 50, R: 150, SR: 400, SSR: 1000, 'SSR+': 2500 };
    const base = basePrices[card.quality] || 50;
    const starMult = 1 + (card.star - 1) * 0.5;
    return Math.floor(base * starMult);
  }

  getMinionQualityConfig(quality) {
    return this.getQualityConfig(quality);
  }

  getEquipmentQualityConfig(quality) {
    const configs = {
      N: { name: '普通', color: '#8a7a6a', textColor: '#8a7a6a', icon: '🔧' },
      R: { name: '稀有', color: '#4dabf7', textColor: '#4dabf7', icon: '⚔️' },
      SR: { name: '精良', color: '#51cf66', textColor: '#51cf66', icon: '🗡️' },
      SSR: { name: '史诗', color: '#9775fa', textColor: '#9775fa', icon: '🔥' },
      'SSR+': { name: '传说', color: '#ffd700', textColor: '#ffd700', icon: '💎' }
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

  getEquipmentStats(card) {
    const stats = [];
    const effective = card.getEffectiveStats?.() || {};
    if (effective.atk > 0) stats.push(`ATK+${effective.atk}`);
    if (effective.hp > 0) stats.push(`HP+${effective.hp}`);
    if (effective.critRate > 0) stats.push(`CRIT+${(effective.critRate * 100).toFixed(0)}%`);
    return stats.join(' | ') || '无加成';
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
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
  }
}
