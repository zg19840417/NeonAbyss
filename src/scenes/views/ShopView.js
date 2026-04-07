import Const from '../../game/data/Const.js';
import AnimationHelper from '../../game/utils/AnimationHelper.js';

export default class ShopView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this._detailOverlay = null;
    this._detailModal = null;
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.addText(width / 2, 90, '商店', {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });

    this.renderShop();

    this.addText(width / 2, height - 100, '点击卡片购买', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    });
  }

  renderShop() {
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
        const cardContainer = this.createMinionShopCard(width / 2, 170 + index * 80, card, index);
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

    this.renderRefreshButton(width);
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
    buyBtn.on('pointerover', () => AnimationHelper.tweenPulse(this.scene, buyBtn, 1.1));
    buyBtn.on('pointerout', () => buyBtn.setScale(1));
    container.add(buyBtn);

    container.setSize(cardWidth, cardHeight);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      AnimationHelper.tweenCardHover(this.scene, container, true);
    });

    container.on('pointerout', () => {
      AnimationHelper.tweenCardHover(this.scene, container, false);
    });

    container.on('pointerdown', (pointer, localX, localY) => {
      if (localX > cardWidth/2 - 70) {
        AnimationHelper.tweenPulse(this.scene, container, 0.9);
        this.scene.time.delayedCall(150, () => {
          this.buyMinionCard(index);
        });
      } else {
        AnimationHelper.tweenPulse(this.scene, container, 0.95);
        this.showCardDetail(card, index);
      }
    });

    this.elements.push(container);
    return container;
  }

  buyMinionCard(index) {
    const card = this.scene.minionCardManager.shopMinions?.[index];
    if (!card) return;

    const price = this.getMinionPrice(card);
    const gold = this.scene.baseSystem.coins || 0;

    if (gold < price) {
      this.scene.showToast?.('金币不足！');
      return;
    }

    this.scene.baseSystem.coins -= price;
    this.scene.minionCardManager.addCard(card);
    this.scene.minionCardManager.shopMinions.splice(index, 1);
    this.scene.saveGameData();
    this.scene.showToast?.('购买成功！');
    this.refresh();
  }

  renderRefreshButton(width) {
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
      this.refreshShop();
      this.scene.saveGameData();
      this.refresh();
    });

    this.elements.push(container);
  }

  refreshShop() {
    this.scene.minionCardManager.shopMinions = [];
    for (let i = 0; i < 3; i++) {
      this.scene.minionCardManager.shopMinions.push(
        this.scene.minionCardManager.generateShopCard()
      );
    }
  }

  getMinionPrice(card) {
    const basePrices = { common: 100, rare: 300, epic: 800, legendary: 2000 };
    const base = basePrices[card.rarity] || 100;
    const starMult = 1 + (card.star - 1) * 0.5;
    return Math.floor(base * starMult);
  }

  getMinionQualityConfig(quality) {
    const configs = {
      common: { name: '普通', color: '#8a7a6a', textColor: '#8a7a6a' },
      rare: { name: '稀有', color: '#4dabf7', textColor: '#4dabf7' },
      epic: { name: '史诗', color: '#9775fa', textColor: '#9775fa' },
      legendary: { name: '传说', color: '#ffd700', textColor: '#ffd700' },
      mythic: { name: '神话', color: '#ff00ff', textColor: '#ff00ff' }
    };
    return configs[quality] || configs.common;
  }

  showCardDetail(card, index) {
    if (this._detailModal) {
      this.closeCardDetail();
      return;
    }

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const qualityConfig = this.getMinionQualityConfig(card.rarity);

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
    closeBtn.on('pointerover', () => AnimationHelper.tweenPulse(this.scene, closeBtn, 1.2));
    closeBtn.on('pointerout', () => closeBtn.setScale(1));
    modal.add(closeBtn);

    const elementConfig = card.getElementConfig?.();
    const icon = this.scene.add.text(0, -160, elementConfig?.icon || '🐺', { fontSize: '48px' }).setOrigin(0.5);
    modal.add(icon);

    const typeLabel = this.scene.add.text(0, -115, '🐺 随从卡', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#ff6b6b'
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

    const price = this.getMinionPrice(card);
    const buyBtnContainer = this.scene.add.container(0, 150);
    const buyBtnBg = this.scene.add.graphics();
    buyBtnBg.fillStyle(Const.COLORS.BUTTON_PRIMARY, 1);
    buyBtnBg.fillRoundedRect(-70, -18, 140, 36, Const.UI.BUTTON_RADIUS);
    buyBtnContainer.add(buyBtnBg);

    const buyBtnText = this.scene.add.text(0, 0, `💰 购买 ${price}`, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    buyBtnContainer.add(buyBtnText);

    buyBtnContainer.setSize(140, 36);
    buyBtnContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 140, 36), Phaser.Geom.Rectangle.Contains);
    buyBtnContainer.on('pointerdown', () => {
      this.closeCardDetail();
      this.scene.time.delayedCall(300, () => {
        this.buyMinionCard(index);
      });
    });
    buyBtnContainer.on('pointerover', () => AnimationHelper.tweenPulse(this.scene, buyBtnContainer, 1.1));
    buyBtnContainer.on('pointerout', () => buyBtnContainer.setScale(1));
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

  closeCardDetail() {
    const overlay = this._detailOverlay;
    const modal = this._detailModal;

    if (overlay) {
      this.scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          overlay.destroy();
          this.elements = this.elements.filter(el => el !== overlay);
        }
      });
      this._detailOverlay = null;
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
          modal.destroy();
          this.elements = this.elements.filter(el => el !== modal);
        }
      });
      this._detailModal = null;
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
    this._detailOverlay = null;
    this._detailModal = null;
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
  }
}
