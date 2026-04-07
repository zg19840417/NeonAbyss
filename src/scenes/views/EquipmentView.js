import { t } from '../../game/data/Lang.js';
import Const from '../../game/data/Const.js';
import ChipCard from '../../game/entities/ChipCard.js';
import ChipCardManager from '../../game/systems/ChipCardManager.js';

export default class EquipmentView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this.cardManager = null;
    this.selectedCard = null;
  }

  t(key, params = {}) {
    return t(key, params);
  }

  show() {
    this.initCardManager();
    this.render();
  }

  initCardManager() {
    if (!window.gameData.chipCardManager) {
      window.gameData.chipCardManager = {
        ownedCards: [],
        equippedCardId: null
      };
    }
    this.cardManager = this.scene.chipCardManager;
  }

  render() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.addText(width / 2, 100, this.t('equipment_card'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    this.showEquippedCard(width / 2, 160);

    this.addText(width / 2, 350, '─ ' + this.t('my_cards') + ' ─', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    this.showOwnedCards(width / 2, 390);

    const hint = this.scene.add.text(width / 2, height - 130, this.t('tap_to_equip'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0.5);
    this.elements.push(hint);
  }

  showEquippedCard(x, y) {
    const equippedCard = this.cardManager.equippedCard;
    const cardWidth = 280;
    const cardHeight = 120;
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    if (equippedCard) {
      const qualityConfig = Const.CHIP_QUALITY[equippedCard.quality] || Const.CHIP_QUALITY.N;
      bg.fillStyle(Const.COLORS.BG_MID, 0.95);
      bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS);
      bg.lineStyle(3, parseInt(qualityConfig.color.replace('#', '0x')), qualityConfig.glow);
      bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS);

      const glow = this.scene.add.graphics();
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.fillStyle(parseInt(qualityConfig.color.replace('#', '0x')), 0.15);
      glow.fillCircle(0, -10, 80);
      container.add(glow);
      this.elements.push(glow);
    } else {
      bg.fillStyle(Const.COLORS.BG_MID, 0.9);
      bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS);
      bg.lineStyle(2, Const.COLORS.BUTTON_SECONDARY, 0.5);
      bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS);
    }
    container.add(bg);

    if (equippedCard) {
      const qualityConfig = Const.CHIP_QUALITY[equippedCard.quality] || Const.CHIP_QUALITY.N;

      const icon = this.scene.add.text(-cardWidth/2 + 40, -10, this.getCardIcon(equippedCard.quality), {
        fontSize: '48px'
      }).setOrigin(0.5);
      container.add(icon);

      const nameText = this.scene.add.text(-cardWidth/2 + 90, -30, equippedCard.name, {
        fontSize: Const.FONT.SIZE_NORMAL,
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: qualityConfig.textColor
      }).setOrigin(0, 0.5);
      container.add(nameText);

      const starText = this.scene.add.text(-cardWidth/2 + 90, 0, equippedCard.getStarDisplay(), {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_EN,
        color: Const.TEXT_COLORS.YELLOW
      }).setOrigin(0, 0.5);
      container.add(starText);

      const statsText = this.scene.add.text(-cardWidth/2 + 90, 30, this.getStatsText(equippedCard), {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0, 0.5);
      container.add(statsText);

      const unequipBtn = this.scene.add.text(cardWidth/2 - 50, 0, '[' + this.t('unequip') + ']', {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.DANGER
      }).setOrigin(0.5).setInteractive();
      unequipBtn.on('pointerdown', () => this.unequipCard());
      container.add(unequipBtn);
    } else {
      const icon = this.scene.add.text(0, -15, '📦', { fontSize: '36px' }).setOrigin(0.5);
      container.add(icon);

      const emptyText = this.scene.add.text(0, 25, this.t('no_card_equipped'), {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5);
      container.add(emptyText);
    }

    container.setSize(cardWidth, cardHeight);
    this.elements.push(container);
    return container;
  }

  showOwnedCards(x, startY) {
    const cards = this.cardManager.getAllCards();

    if (cards.length === 0) {
      const emptyText = this.scene.add.text(x, startY + 30, '暂无装备卡', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5);
      this.elements.push(emptyText);
      return;
    }

    const cardHeight = 80;
    const spacing = 15;
    const maxDisplay = Math.min(cards.length, 5);

    for (let i = 0; i < maxDisplay; i++) {
      const y = startY + i * (cardHeight + spacing);
      this.createCardItem(x, y, cards[i]);
    }

    if (cards.length > 5) {
      const moreText = this.scene.add.text(x, startY + maxDisplay * (cardHeight + spacing) + 10, `还有 ${cards.length - maxDisplay} 张...`, {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5);
      this.elements.push(moreText);
    }
  }

  createCardItem(x, y, card) {
    const container = this.scene.add.container(x, y);
    const cardWidth = 280;
    const cardHeight = 70;
    const qualityConfig = Const.CHIP_QUALITY[card.quality] || Const.CHIP_QUALITY.N;
    const isEquipped = this.cardManager.equippedCard && this.cardManager.equippedCard.id === card.id;

    const bg = this.scene.add.graphics();
    bg.fillStyle(isEquipped ? parseInt(qualityConfig.color.replace('#', '0x')) : Const.COLORS.BG_MID, isEquipped ? 0.2 : 0.9);
    bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(2, parseInt(qualityConfig.color.replace('#', '0x')), isEquipped ? 0.8 : 0.5);
    bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    container.add(bg);

    const icon = this.scene.add.text(-cardWidth/2 + 35, 0, this.getCardIcon(card.quality), {
      fontSize: '32px'
    }).setOrigin(0.5);
    container.add(icon);

    const nameText = this.scene.add.text(-cardWidth/2 + 70, -12, card.name, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityConfig.textColor
    }).setOrigin(0, 0.5);
    container.add(nameText);

    const starText = this.scene.add.text(-cardWidth/2 + 70, 10, card.getStarDisplay(), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.YELLOW
    }).setOrigin(0, 0.5);
    container.add(starText);

    const qualityBadge = this.scene.add.text(-cardWidth/2 + 160, 10, qualityConfig.name, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: qualityConfig.textColor
    }).setOrigin(0, 0.5);
    container.add(qualityBadge);

    const equipText = this.scene.add.text(cardWidth/2 - 50, 0, isEquipped ? '[' + this.t('equipped') + ']' : '[' + this.t('equip') + ']', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: isEquipped ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5).setInteractive();
    equipText.on('pointerdown', () => this.showCardDetail(card));
    container.add(equipText);

    container.setSize(cardWidth, cardHeight);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => this.showCardDetail(card));

    this.elements.push(container);
    return container;
  }

  showCardDetail(card) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    this.destroy();

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(999);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.closeDetail());
    this.elements.push(overlay);

    const modalWidth = 300;
    const modalHeight = 450;
    const modal = this.scene.add.container(width / 2, height / 2);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 1);
    bg.fillRoundedRect(-modalWidth/2, -modalHeight/2, modalWidth, modalHeight, Const.UI.CARD_RADIUS);
    modal.add(bg);

    const qualityConfig = Const.CHIP_QUALITY[card.quality] || Const.CHIP_QUALITY.N;
    const borderGlow = this.scene.add.graphics();
    borderGlow.setBlendMode(Phaser.BlendModes.ADD);
    borderGlow.fillStyle(parseInt(qualityConfig.color.replace('#', '0x')), 0.1);
    borderGlow.fillCircle(0, -modalHeight/2 + 60, 50);
    modal.add(borderGlow);
    this.elements.push(borderGlow);

    const closeBtn = this.scene.add.text(modalWidth/2 - 20, -modalHeight/2 + 20, '✕', {
      fontSize: '20px',
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5).setInteractive().setDepth(1002);
    closeBtn.on('pointerdown', () => this.closeDetail());
    modal.add(closeBtn);
    this.elements.push(closeBtn);

    const icon = this.scene.add.text(0, -modalHeight/2 + 60, this.getCardIcon(card.quality), {
      fontSize: '56px'
    }).setOrigin(0.5);
    modal.add(icon);

    const nameText = this.scene.add.text(0, -modalHeight/2 + 115, card.name, {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityConfig.textColor
    }).setOrigin(0.5);
    modal.add(nameText);

    const starText = this.scene.add.text(0, -modalHeight/2 + 145, card.getStarDisplay(), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.YELLOW
    }).setOrigin(0.5);
    modal.add(starText);

    const statsTitle = this.scene.add.text(-modalWidth/2 + 20, -modalHeight/2 + 175, this.t('stat_bonus'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    modal.add(statsTitle);

    const stats = card.getEffectiveStats();
    const statsLines = [];
    if (stats.atk > 0) statsLines.push(`攻击 +${stats.atk}`);
    if (stats.hp > 0) statsLines.push(`生命 +${stats.hp}`);
    if (stats.critRate > 0) statsLines.push(`暴击 +${(stats.critRate * 100).toFixed(0)}%`);
    if (stats.dodgeRate > 0) statsLines.push(`闪避 +${(stats.dodgeRate * 100).toFixed(0)}%`);
    if (stats.damageReduction > 0) statsLines.push(`减伤 +${(stats.damageReduction * 100).toFixed(0)}%`);
    if (stats.lifeSteal > 0) statsLines.push(`吸血 +${(stats.lifeSteal * 100).toFixed(0)}%`);

    const statsText = statsLines.join('\n') || '无属性加成';
    const statsDisplay = this.scene.add.text(-modalWidth/2 + 20, -modalHeight/2 + 200, statsText, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN,
      lineSpacing: 6
    }).setOrigin(0, 0);
    modal.add(statsDisplay);

    const skillsTitle = this.scene.add.text(-modalWidth/2 + 20, -modalHeight/2 + 265, this.t('skills'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    modal.add(skillsTitle);

    const unlockedSkills = card.getUnlockedSkills();
    let skillY = -modalHeight/2 + 285;
    unlockedSkills.forEach(skill => {
      const skillTypeColor = skill.type === 'aura' ? Const.TEXT_COLORS.PINK : 
                            skill.type === 'trigger' ? Const.TEXT_COLORS.YELLOW : Const.TEXT_COLORS.CYAN;
      const skillTypeText = skill.type === 'aura' ? this.t('skill_type_aura') :
                            skill.type === 'trigger' ? this.t('skill_type_trigger') : this.t('skill_type_modify');

      const skillName = this.scene.add.text(-modalWidth/2 + 20, skillY, `[${skillTypeText}] ${skill.name}`, {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: skillTypeColor
      }).setOrigin(0, 0);
      modal.add(skillName);

      const skillDesc = this.scene.add.text(-modalWidth/2 + 20, skillY + 16, skill.description, {
        fontSize: '10px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SECONDARY,
        wordWrap: { width: modalWidth - 40 }
      }).setOrigin(0, 0);
      modal.add(skillDesc);

      skillY += 40;
    });

    const btnY = modalHeight/2 - 40;
    const isEquipped = this.cardManager.equippedCard && this.cardManager.equippedCard.id === card.id;

    const equipBtn = this.scene.add.container(0, btnY).setDepth(1002);
    const equipBg = this.scene.add.graphics();
    equipBg.fillStyle(isEquipped ? Const.COLORS.BUTTON_SECONDARY : Const.COLORS.BUTTON_PRIMARY, 1);
    equipBg.fillRoundedRect(-60, -16, 120, 32, Const.UI.BUTTON_RADIUS);
    const equipBtnText = this.scene.add.text(0, 0, isEquipped ? this.t('unequip') : this.t('equip'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    equipBtn.add([equipBg, equipBtnText]);
    equipBtn.setSize(120, 32);
    equipBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 120, 32), Phaser.Geom.Rectangle.Contains);
    equipBtn.on('pointerdown', () => {
      if (isEquipped) this.unequipCard();
      else this.equipCard(card.id);
      this.closeDetail();
    });
    modal.add(equipBtn);
    this.elements.push(equipBtn);

    if (card.canUpgradeStar()) {
      const upgradeBtn = this.scene.add.container(-80, btnY).setDepth(1002);
      const upgradeBg = this.scene.add.graphics();
      upgradeBg.fillStyle(Const.COLORS.PURPLE, 1);
      upgradeBg.fillRoundedRect(-35, -14, 70, 28, Const.UI.BUTTON_RADIUS);
      const upgradeText = this.scene.add.text(0, 0, this.t('star_upgrade'), {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.PRIMARY
      }).setOrigin(0.5);
      upgradeBtn.add([upgradeBg, upgradeText]);
      upgradeBtn.setSize(70, 28);
      upgradeBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 70, 28), Phaser.Geom.Rectangle.Contains);
      upgradeBtn.on('pointerdown', () => this.showUpgradePanel(card));
      modal.add(upgradeBtn);
      this.elements.push(upgradeBtn);
    }

    modal.setDepth(1000);
    this.elements.push(modal);
  }

  showUpgradePanel(card) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    this.destroy();

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(999);
    overlay.setInteractive();
    overlay.on('pointerdown', () => { this.destroy(); this.show(); });
    this.elements.push(overlay);

    const panelWidth = 280;
    const panelHeight = 320;
    const panel = this.scene.add.container(width / 2, height / 2);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 1);
    bg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, Const.UI.CARD_RADIUS);
    bg.lineStyle(2, Const.COLORS.PURPLE, 0.8);
    bg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, Const.UI.CARD_RADIUS);
    panel.add(bg);

    const title = this.scene.add.text(0, -panelHeight/2 + 30, this.t('star_upgrade'), {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    }).setOrigin(0.5);
    panel.add(title);

    const currentStar = card.star;
    const nextStar = currentStar + 1;
    const upgradeInfo = this.scene.add.text(0, -panelHeight/2 + 70, `${currentStar}★ → ${nextStar}★`, {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.YELLOW
    }).setOrigin(0.5);
    panel.add(upgradeInfo);

    const materialCost = Const.STAR_UPGRADE_COST[currentStar] || 0;
    const starStones = window.gameData.starStones || 0;

    const materialText = this.scene.add.text(0, -panelHeight/2 + 110, `${this.t('material_upgrade')}: ${materialCost} ${this.t('star_stone')}`, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
    panel.add(materialText);

    const ownedText = this.scene.add.text(0, -panelHeight/2 + 135, `(${this.t('owned')}: ${starStones})`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: starStones >= materialCost ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5);
    panel.add(ownedText);

    const sameCards = this.cardManager.getCardsByStar(currentStar)
      .filter(c => c.equipCardId === card.equipCardId && c.id !== card.id);
    const mergeAvailable = sameCards.length >= 2;

    const mergeText = this.scene.add.text(0, -panelHeight/2 + 170, `${this.t('merge_upgrade')}: 3张 → 1张 (需2张额外卡)`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
    panel.add(mergeText);

    const confirmBtn = this.scene.add.container(0, panelHeight/2 - 50).setDepth(1002);
    const confirmBg = this.scene.add.graphics();
    const canUpgrade = starStones >= materialCost || mergeAvailable;
    confirmBg.fillStyle(canUpgrade ? Const.COLORS.BUTTON_PRIMARY : Const.COLORS.BUTTON_SECONDARY, 1);
    confirmBg.fillRoundedRect(-70, -18, 140, 36, Const.UI.BUTTON_RADIUS);
    const confirmText = this.scene.add.text(0, 0, canUpgrade ? this.t('confirm') : this.t('insufficient_material'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    confirmBtn.add([confirmBg, confirmText]);
    confirmBtn.setSize(140, 36);
    confirmBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 140, 36), Phaser.Geom.Rectangle.Contains);
    if (canUpgrade) {
      confirmBtn.on('pointerdown', () => {
        if (mergeAvailable) this.mergeUpgrade(card, sameCards);
        else this.materialUpgrade(card);
      });
    }
    panel.add(confirmBtn);
    this.elements.push(confirmBtn);

    const cancelBtn = this.scene.add.container(0, panelHeight/2 - 15).setDepth(1002);
    const cancelBg = this.scene.add.graphics();
    cancelBg.fillStyle(Const.COLORS.BUTTON_SECONDARY, 0.5);
    cancelBg.fillRoundedRect(-50, -14, 100, 28, Const.UI.BUTTON_RADIUS);
    const cancelText = this.scene.add.text(0, 0, this.t('cancel'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
    cancelBtn.add([cancelBg, cancelText]);
    cancelBtn.setSize(100, 28);
    cancelBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 28), Phaser.Geom.Rectangle.Contains);
    cancelBtn.on('pointerdown', () => { this.destroy(); this.show(); });
    panel.add(cancelBtn);
    this.elements.push(cancelBtn);

    panel.setDepth(1000);
    this.elements.push(panel);
  }

  materialUpgrade(card) {
    const cost = Const.STAR_UPGRADE_COST[card.star];
    if ((window.gameData.starStones || 0) < cost) return;
    window.gameData.starStones = (window.gameData.starStones || 0) - cost;
    const result = this.cardManager.upgradeStar(card.id, cost);
    if (result.success) this.saveAndRefresh();
  }

  mergeUpgrade(card, sameCards) {
    if (sameCards.length < 2) return;
    const cardIds = [card.id, sameCards[0]?.id, sameCards[1]?.id].filter(Boolean);
    if (cardIds.length < 3) return;
    const result = this.cardManager.mergeUpgrade(cardIds[0], cardIds[1], cardIds[2]);
    if (result.success) this.saveAndRefresh();
  }

  equipCard(cardId) {
    const result = this.cardManager.equipCard(cardId);
    if (result.success) this.saveAndRefresh();
  }

  unequipCard() {
    this.cardManager.unequipCard();
    this.saveAndRefresh();
  }

  saveAndRefresh() {
    window.gameData.chipCardManager = this.cardManager.toJSON();
    this.destroy();
    this.show();
  }

  closeDetail() {
    this.destroy();
    this.show();
  }

  addText(x, y, text, options = {}) {
    const textObj = this.scene.add.text(x, y, text, options).setOrigin(0.5);
    this.elements.push(textObj);
    return textObj;
  }

  getCardIcon(quality) {
    const icons = { 'N': '🟫', 'R': '🔵', 'SR': '🟣', 'SSR': '🟡', 'SSR+': '🔴' };
    return icons[quality] || '🟫';
  }

  getStatsText(card) {
    const stats = card.getEffectiveStats();
    const parts = [];
    if (stats.atk > 0) parts.push(`ATK+${stats.atk}`);
    if (stats.hp > 0) parts.push(`HP+${stats.hp}`);
    if (stats.critRate > 0) parts.push(`CRIT+${(stats.critRate * 100).toFixed(0)}%`);
    return parts.join(' | ') || '无加成';
  }

  destroy() {
    this.elements.forEach(el => { if (el && el.destroy) el.destroy(); });
    this.elements = [];
  }
}
