import Const from '../../game/data/Const.js';
import AnimationHelper from '../../game/utils/AnimationHelper.js';
import CardRenderer from '../../game/utils/CardRenderer.js';
import { RoleType } from '../../game/data/CharacterClass.js';

const RARITY_TO_QUALITY = {
  common: 'N',
  rare: 'R',
  epic: 'SR',
  legendary: 'SSR'
};

const PORTRAIT_KEY_MAP = {};

const ROLE_STYLE = {
  [RoleType.TANK]: { label: 'T', color: 0x4dabf7 },
  [RoleType.DPS]: { label: 'D', color: 0xff922b },
  [RoleType.SUPPORT]: { label: 'S', color: 0x20c997 },
  [RoleType.HEALER]: { label: 'H', color: 0xff6bcb }
};

const ELEMENT_STYLE = {
  water: { label: 'W', color: 0x3d8bfd, emoji: '💧' },
  fire: { label: 'F', color: 0xff6b6b, emoji: '🔥' },
  wind: { label: 'A', color: 0x51cf66, emoji: '🍃' },
  light: { label: 'L', color: 0xf7b801, emoji: '✨' },
  dark: { label: 'D', color: 0x845ef7, emoji: '🌑' }
};

function extractPortraitKey(portraitPath) {
  if (!portraitPath) return null;
  const fileName = portraitPath.split('/').pop().replace('.png', '');
  return PORTRAIT_KEY_MAP[fileName] || fileName;
}

export default class TeamView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this.overlayElements = [];
    this.scrollHandlers = null;
    this.scrollState = null;
    this.contentContainer = null;
    this.maskGraphics = null;
    this.collectionTop = 0;
    this.collectionBottom = 0;
    this.collectionViewportHeight = 0;
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const contentTop = 100;
    const contentBottom = height - Const.UI.NAV_HEIGHT - 8;

    this.renderFormation(width, contentTop);
    this.renderCollectionChrome(width, contentBottom);
    this.renderCollectionList(width);
  }

  renderFormation(width, contentTop) {
    this.addText(width / 2, contentTop + 10, '上阵阵容', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN,
      fontStyle: 'bold'
    });

    const deployedMinions = this.scene.minionCardManager.getDeployedCards?.() || [];
    const cardY = contentTop + 116;
    const spacing = 104;
    const cardXs = [width / 2 - spacing, width / 2, width / 2 + spacing];

    for (let index = 0; index < 3; index++) {
      const card = deployedMinions[index];
      if (card) {
        this.renderDeployedMinionCard(cardXs[index], cardY, card);
      } else {
        this.renderEmptySlot(cardXs[index], cardY, `空位 ${index + 1}`);
      }
    }

    this.renderChipAura(width / 2, contentTop + 246, width - 30);
    this.formationBottom = contentTop + 286;
  }

  renderDeployedMinionCard(x, y, card) {
    const quality = RARITY_TO_QUALITY[card.rarity] || 'N';
    const cardContainer = CardRenderer.createMinionCard(this.scene, {
      x,
      y,
      quality,
      name: card.name,
      hp: card.currentHp ?? card.maxHp,
      maxHp: card.maxHp,
      atk: card.atk,
      spd: this.getSpeedValue(card),
      element: card.element || 'water',
      charClass: card.charClass,
      portraitKey: extractPortraitKey(card.portrait),
      scale: 1,
      interactive: false
    });
    cardContainer.setDepth(Const.DEPTH.CONTENT + 1);
    this.elements.push(cardContainer);
    CardRenderer.addInteraction(this.scene, cardContainer, () => this.showCardDetail(card, true));

    const action = this.createActionButton(x, y + 88, '卸下', Const.COLORS.BUTTON_SECONDARY, () => {
      this.toggleDeploy(card, true);
    }, 50, 22);
    action.setDepth(Const.DEPTH.CONTENT + 2);
  }

  renderEmptySlot(x, y, label) {
    const width = 82;
    const height = 126;
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.45);
    bg.lineStyle(1.5, Const.COLORS.BUTTON_SECONDARY, 0.7);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.lineStyle(1, Const.COLORS.BUTTON_SECONDARY, 0.25);
    bg.strokeRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, 10);
    container.add(bg);

    container.add(this.scene.add.text(0, -10, '+', {
      fontSize: '28px',
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0.5));

    container.add(this.scene.add.text(0, 20, label, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0.5));

    container.setDepth(Const.DEPTH.CONTENT + 1);
    this.elements.push(container);
  }

  renderChipAura(x, y, width) {
    const chip = this.scene.chipCardManager?.equippedCard;

    const frame = this.scene.add.container(x, y);
    frame.setDepth(Const.DEPTH.CONTENT + 1);

    if (chip) {
      const aura = this.createChipAuraBanner(x, y, width, chip, true);
      CardRenderer.animateEntry(this.scene, aura, 120);
    } else {
      const bg = this.scene.add.graphics();
      bg.fillStyle(Const.COLORS.BG_MID, 0.7);
      bg.lineStyle(1.5, Const.COLORS.BUTTON_SECONDARY, 0.7);
      bg.fillRoundedRect(-width / 2, -36, width, 72, 18);
      bg.strokeRoundedRect(-width / 2, -36, width, 72, 18);
      bg.lineStyle(1, Const.COLORS.BUTTON_SECONDARY, 0.25);
      bg.strokeRoundedRect(-width / 2 + 8, -28, width - 16, 56, 14);
      frame.add(bg);

      frame.add(this.scene.add.text(0, -6, '未装配芯片核心', {
        fontSize: '14px',
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0.5));

      frame.add(this.scene.add.text(0, 16, '装备后可为整队提供光环加成', {
        fontSize: '11px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5));

      this.elements.push(frame);
    }
  }

  renderCollectionChrome(width, contentBottom) {
    const headerY = this.formationBottom || 388;
    const left = 16;
    const right = width - 16;

    const title = this.scene.add.text(left, headerY, '未上阵卡库', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0, 0.5);
    title.setDepth(Const.DEPTH.CONTENT + 2);
    this.elements.push(title);

    const tag = this.scene.add.graphics();
    tag.fillStyle(Const.COLORS.BG_MID, 0.92);
    tag.lineStyle(1, Const.COLORS.BUTTON_SECONDARY, 0.7);
    tag.fillRoundedRect(right - 82, headerY - 12, 82, 24, 12);
    tag.strokeRoundedRect(right - 82, headerY - 12, 82, 24, 12);
    tag.setDepth(Const.DEPTH.CONTENT + 2);
    this.elements.push(tag);

    const count = (this.scene.minionCardManager.getAvailableCards?.() || []).length;
    const countText = this.scene.add.text(right - 41, headerY, `${count} 张待命`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
    countText.setDepth(Const.DEPTH.CONTENT + 3);
    this.elements.push(countText);

    this.collectionTop = headerY + 24;
    this.collectionBottom = contentBottom;
    this.collectionViewportHeight = this.collectionBottom - this.collectionTop;

    this.maskGraphics = this.scene.add.graphics();
    this.maskGraphics.fillStyle(0xffffff, 1);
    this.maskGraphics.fillRect(0, this.collectionTop, width, this.collectionViewportHeight);
    this.maskGraphics.setVisible(false);
    this.elements.push(this.maskGraphics);

    this.contentContainer = this.scene.add.container(0, this.collectionTop);
    this.contentContainer.setDepth(Const.DEPTH.CONTENT + 1);
    this.contentContainer.setMask(this.maskGraphics.createGeometryMask());
    this.elements.push(this.contentContainer);
  }

  renderCollectionList(width) {
    const availableMinions = this.scene.minionCardManager.getAvailableCards?.() || [];
    const allChips = this.scene.chipCardManager?.getAllCards?.() || [];
    const equippedId = this.scene.chipCardManager?.equippedCard?.id;
    const reserveChips = allChips.filter(card => card.id !== equippedId);
    let y = 0;

    if (availableMinions.length === 0) {
      this.contentContainer.add(this.scene.add.text(width / 2, 24, '暂无待命随从', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5));
      y += 52;
    } else {
      availableMinions.forEach((card) => {
        const row = this.createCompactMinionRow(width / 2, y + 38, width - 30, card);
        CardRenderer.animateEntry(this.scene, row, 0);
        y += 86;
      });
    }

    if (reserveChips.length > 0) {
      const sectionTitle = this.scene.add.text(16, y + 10, '备用芯片', {
        fontSize: '13px',
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.PINK
      }).setOrigin(0, 0.5);
      this.contentContainer.add(sectionTitle);
      y += 40;

      reserveChips.forEach((chip) => {
        const row = this.createCompactChipRow(width / 2, y + 30, width - 30, chip);
        CardRenderer.animateEntry(this.scene, row, 60);
        y += 68;
      });
    }

    this.setupScroll(Math.max(y + 20, this.collectionViewportHeight));
  }

  createCompactMinionRow(x, y, width, card) {
    const row = CardRenderer.createCompactMinionRow(this.scene, {
      x,
      y,
      width,
      card,
      portraitKey: extractPortraitKey(card.portrait),
      actionLabel: '上阵',
      onClick: () => this.showCardDetail(card, true),
      onAction: () => this.toggleDeploy(card, true)
    });

    this.contentContainer.add(row);
    return row;
  }

  createCompactChipRow(x, y, width, chip) {
    const color = this.getQualityColorInt(chip.quality || 'N');
    const row = this.scene.add.container(x, y);
    const rowWidth = width;
    const rowHeight = 60;

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.92);
    bg.lineStyle(1.5, color, 0.75);
    bg.fillRoundedRect(-rowWidth / 2, -rowHeight / 2, rowWidth, rowHeight, 14);
    bg.strokeRoundedRect(-rowWidth / 2, -rowHeight / 2, rowWidth, rowHeight, 14);
    row.add(bg);

    const coreBg = this.scene.add.graphics();
    coreBg.fillStyle(color, 0.18);
    coreBg.lineStyle(1, color, 0.9);
    coreBg.fillRoundedRect(-rowWidth / 2 + 10, -18, 48, 36, 10);
    coreBg.strokeRoundedRect(-rowWidth / 2 + 10, -18, 48, 36, 10);
    row.add(coreBg);

    row.add(this.scene.add.text(-rowWidth / 2 + 34, 0, 'CORE', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: this.getQualityColorText(chip.quality || 'N')
    }).setOrigin(0.5));

    const title = this.scene.add.text(-rowWidth / 2 + 70, -10, chip.name, {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    title.setWordWrapWidth(rowWidth - 180);
    row.add(title);

    row.add(this.scene.add.text(-rowWidth / 2 + 70, 12, this.getChipAuraText(chip), {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5));

    row.add(this.scene.add.text(rowWidth / 2 - 84, -10, `${chip.quality || 'N'} ${'★'.repeat(Math.min(chip.star || 1, 5))}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: this.getQualityColorText(chip.quality || 'N')
    }).setOrigin(0, 0.5));

    this.getChipSkillIcons(chip).forEach((icon, index) => {
      row.add(this.createMiniBadge(rowWidth / 2 - 76 + index * 24, 12, 20, 18, color, icon));
    });

    const button = this.createInlineButton(rowWidth / 2 - 42, 0, '装备', () => {
      this.toggleDeploy(chip, false);
    });
    row.add(button);

    row.setSize(rowWidth, rowHeight);
    row.setInteractive(new Phaser.Geom.Rectangle(-rowWidth / 2, -rowHeight / 2, rowWidth - 72, rowHeight), Phaser.Geom.Rectangle.Contains);
    row.on('pointerdown', () => this.showCardDetail(chip, false));
    row.on('pointerover', () => AnimationHelper.tweenCardHover(this.scene, row, true));
    row.on('pointerout', () => AnimationHelper.tweenCardHover(this.scene, row, false));

    this.contentContainer.add(row);
    return row;
  }

  createChipAuraBanner(x, y, width, chip, interactive = false) {
    const quality = chip.quality || 'N';
    const color = this.getQualityColorInt(quality);
    const container = this.scene.add.container(x, y);
    const height = 72;

    const glow = this.scene.add.graphics();
    glow.fillStyle(color, 0.18);
    glow.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    glow.fillRoundedRect(-width / 2 + 14, -height / 2 - 10, 72, 20, 12);
    glow.fillRoundedRect(width / 2 - 86, -height / 2 - 10, 72, 20, 12);
    container.add(glow);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.96);
    bg.lineStyle(2, color, 0.85);
    bg.fillRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 16);
    bg.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 16);
    bg.lineStyle(1, color, 0.25);
    bg.strokeRoundedRect(-width / 2 + 10, -height / 2 + 10, width - 20, height - 20, 12);
    container.add(bg);

    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(color, 0.18);
    iconBg.lineStyle(1, color, 0.9);
    iconBg.fillRoundedRect(-width / 2 + 14, -20, 54, 40, 12);
    iconBg.strokeRoundedRect(-width / 2 + 14, -20, 54, 40, 12);
    container.add(iconBg);

    container.add(this.scene.add.text(-width / 2 + 41, 0, 'CORE', {
      fontSize: '12px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: this.getQualityColorText(quality)
    }).setOrigin(0.5));

    const title = this.scene.add.text(-width / 2 + 80, -16, chip.name, {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    title.setWordWrapWidth(width - 210);
    container.add(title);

    container.add(this.scene.add.text(width / 2 - 78, -16, `${quality} ${'★'.repeat(Math.min(chip.star || 1, 5))}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: this.getQualityColorText(quality)
    }).setOrigin(0, 0.5));

    const auraText = this.scene.add.text(-width / 2 + 80, 12, this.getChipAuraText(chip), {
      fontSize: '13px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: this.getQualityColorText(quality)
    }).setOrigin(0, 0.5);
    auraText.setWordWrapWidth(width - 190);
    container.add(auraText);

    this.getChipSkillIcons(chip).forEach((icon, index) => {
      container.add(this.createMiniBadge(width / 2 - 76 + index * 24, 18, 20, 18, color, icon));
    });

    const actionLabel = this.scene.chipCardManager?.equippedCard?.id === chip.id ? '卸下' : '装备';
    const action = this.createInlineButton(width / 2 - 46, 0, actionLabel, () => {
      this.toggleDeploy(chip, false);
    }, 50, 24);
    container.add(action);

    if (interactive) {
      container.setSize(width, height);
      container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width - 70, height), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => this.showCardDetail(chip, false));
      container.on('pointerover', () => AnimationHelper.tweenCardHover(this.scene, container, true));
      container.on('pointerout', () => AnimationHelper.tweenCardHover(this.scene, container, false));
    }

    container.setDepth(Const.DEPTH.CONTENT + 1);
    this.elements.push(container);
    return container;
  }

  createMiniBadge(x, y, width, height, color, label) {
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    bg.fillStyle(color, 0.18);
    bg.lineStyle(1, color, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    container.add(bg);

    container.add(this.scene.add.text(0, 0, label, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5));

    return container;
  }

  createInlineButton(x, y, label, callback, width = 48, height = 22) {
    const button = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BUTTON_SECONDARY, 1);
    bg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    button.add(bg);

    button.add(this.scene.add.text(0, 0, label, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5));

    button.setSize(width, height);
    button.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      callback();
    });
    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(Const.COLORS.BUTTON_CYAN, 1);
      bg.lineStyle(1, Const.COLORS.BUTTON_HOVER, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    });
    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(Const.COLORS.BUTTON_SECONDARY, 1);
      bg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.8);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    });

    return button;
  }

  createActionButton(x, y, label, color, callback, width = 52, height = 24) {
    const button = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.65);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    button.add(bg);

    button.add(this.scene.add.text(0, 0, label, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.PRIMARY,
      fontStyle: 'bold'
    }).setOrigin(0.5));

    button.setSize(width, height);
    button.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', () => callback());
    button.on('pointerover', () => AnimationHelper.tweenCardHover(this.scene, button, true));
    button.on('pointerout', () => AnimationHelper.tweenCardHover(this.scene, button, false));
    this.elements.push(button);
    return button;
  }

  setupScroll(contentHeight) {
    this.clearScroll();

    const maxScroll = Math.max(0, contentHeight - this.collectionViewportHeight);
    this.scrollState = {
      currentY: 0,
      maxScroll,
      isDragging: false,
      lastPointerY: 0
    };

    if (maxScroll <= 0) {
      return;
    }

    this.scrollHandlers = {
      onPointerDown: (pointer) => {
        if (pointer.y >= this.collectionTop && pointer.y <= this.collectionBottom) {
          this.scrollState.isDragging = true;
          this.scrollState.lastPointerY = pointer.y;
        }
      },
      onPointerMove: (pointer) => {
        if (!this.scrollState?.isDragging) return;
        const deltaY = pointer.y - this.scrollState.lastPointerY;
        this.scrollState.lastPointerY = pointer.y;
        this.scrollState.currentY = Phaser.Math.Clamp(
          this.scrollState.currentY + deltaY,
          -this.scrollState.maxScroll,
          0
        );
        this.contentContainer.y = this.collectionTop + this.scrollState.currentY;
      },
      onPointerUp: () => {
        if (this.scrollState) {
          this.scrollState.isDragging = false;
        }
      },
      onWheel: (pointer, gameObjects, deltaX, deltaY) => {
        if (!this.scrollState) return;
        if (pointer.y < this.collectionTop || pointer.y > this.collectionBottom) return;
        this.scrollState.currentY = Phaser.Math.Clamp(
          this.scrollState.currentY - deltaY * 0.35,
          -this.scrollState.maxScroll,
          0
        );
        this.contentContainer.y = this.collectionTop + this.scrollState.currentY;
      }
    };

    this.scene.input.on('pointerdown', this.scrollHandlers.onPointerDown);
    this.scene.input.on('pointermove', this.scrollHandlers.onPointerMove);
    this.scene.input.on('pointerup', this.scrollHandlers.onPointerUp);
    this.scene.input.on('wheel', this.scrollHandlers.onWheel);
  }

  clearScroll() {
    if (!this.scrollHandlers) return;
    this.scene.input.off('pointerdown', this.scrollHandlers.onPointerDown);
    this.scene.input.off('pointermove', this.scrollHandlers.onPointerMove);
    this.scene.input.off('pointerup', this.scrollHandlers.onPointerUp);
    this.scene.input.off('wheel', this.scrollHandlers.onWheel);
    this.scrollHandlers = null;
    this.scrollState = null;
  }

  toggleDeploy(card, isMinion) {
    if (isMinion) {
      if (this.scene.minionCardManager.deployedCards.includes(card.id)) {
        this.scene.minionCardManager.undeployCard(card.id);
      } else {
        const result = this.scene.minionCardManager.deployCard(card.id);
        if (!result.success && result.reason === 'max_deploy_reached') {
          this.scene.showToast?.('随从上阵位已满');
          return;
        }
      }
    } else if (this.scene.chipCardManager.equippedCard?.id === card.id) {
      this.scene.chipCardManager.unequipCard();
    } else {
      this.scene.chipCardManager.equipCard(card.id);
    }

    this.scene.saveGameData();
    this.refresh();
  }

  showCardDetail(card, isMinion) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(Const.DEPTH.MODAL_OVERLAY);
    overlay.setAlpha(0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.closeCardDetail());
    this.overlayElements.push(overlay);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });

    const modal = this.scene.add.container(width / 2, height / 2);
    modal.setDepth(Const.DEPTH.MODAL_CONTENT);
    modal.setScale(0.5);
    modal.setAlpha(0);

    const bg = this.scene.add.graphics();
    const accentColor = isMinion ? this.getQualityColorInt(RARITY_TO_QUALITY[card.rarity] || 'N') : this.getQualityColorInt(card.quality || 'N');
    bg.fillStyle(Const.COLORS.BG_MID, 1);
    bg.lineStyle(2, accentColor, 0.8);
    bg.fillRoundedRect(-154, -244, 308, 488, Const.UI.CARD_RADIUS);
    bg.strokeRoundedRect(-154, -244, 308, 488, Const.UI.CARD_RADIUS);
    modal.add(bg);

    const closeBtn = this.scene.add.text(132, -220, 'X', {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeCardDetail());
    modal.add(closeBtn);

    if (isMinion) {
      const portrait = CardRenderer.createDetailPortrait(this.scene, {
        x: 0,
        y: -74,
        width: 252,
        height: 326,
        quality: RARITY_TO_QUALITY[card.rarity] || 'N',
        portraitKey: extractPortraitKey(card.portrait),
        element: card.element || 'water'
      });
      modal.add(portrait);

      const infoPanel = this.scene.add.graphics();
      infoPanel.fillStyle(0x0b0f18, 0.97);
      infoPanel.lineStyle(1.5, accentColor, 0.7);
      infoPanel.fillRoundedRect(-126, 112, 252, 110, 16);
      infoPanel.strokeRoundedRect(-126, 112, 252, 110, 16);
      modal.add(infoPanel);

      modal.add(this.scene.add.text(-110, 132, card.name, {
        fontSize: '16px',
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: this.getQualityColorText(RARITY_TO_QUALITY[card.rarity] || 'N')
      }).setOrigin(0, 0.5));

      modal.add(this.scene.add.text(110, 132, `Lv${card.level || 1}`, {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_EN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.CYAN
      }).setOrigin(1, 0.5));

      modal.add(this.scene.add.text(-110, 158, `HP ${card.maxHp || 0}   ATK ${card.atk || 0}   SPD ${this.getSpeedValue(card)}`, {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_EN,
        color: Const.TEXT_COLORS.PRIMARY
      }).setOrigin(0, 0.5));

      modal.add(this.scene.add.text(-110, 184, `${(ELEMENT_STYLE[card.element] || ELEMENT_STYLE.water).emoji}  能力x${this.getAbilityCount(card)}   速度 ${this.getSpeedValue(card)}`, {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0, 0.5));

      modal.add(this.scene.add.text(-110, 206, `品质 ${RARITY_TO_QUALITY[card.rarity] || 'N'}   ${'★'.repeat(Math.min(card.star || 1, 5))}`, {
        fontSize: '11px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: '#ffd166'
      }).setOrigin(0, 0.5));

      if (card.passiveSkill) {
        modal.add(this.scene.add.text(-110, 226, `被动: ${card.passiveSkill.icon || ''} ${card.passiveSkill.name || ''}`, {
          fontSize: '11px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.SUCCESS
        }).setOrigin(0, 0.5));
      }
    } else {
      const detailCard = CardRenderer.createChipCard(this.scene, {
        x: 0,
        y: -108,
        quality: card.quality || 'N',
        name: card.name,
        star: card.star,
        description: this.getChipAuraText(card),
        scale: 1,
        interactive: false
      });
      modal.add(detailCard);
    }

    modal.add(this.scene.add.text(0, isMinion ? 90 : 34, isMinion ? '立绘详情' : '芯片详情', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: isMinion ? '#ff6b6b' : '#4dabf7'
    }).setOrigin(0.5));

    let cursorY = 62;
    if (!isMinion) {
      modal.add(this.scene.add.text(-108, cursorY, this.getChipAuraText(card), {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_EN,
        color: this.getQualityColorText(card.quality || 'N')
      }).setOrigin(0, 0.5));
      cursorY += 28;

      this.getChipSkillList(card).forEach((skill) => {
        modal.add(this.scene.add.text(-108, cursorY, `${skill.icon || '•'} ${skill.name || '技能'}`, {
          fontSize: '12px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.SECONDARY
        }).setOrigin(0, 0.5));
        cursorY += 22;
      });
    }

    if ((isMinion && (card.star || 1) < 5) || (!isMinion && card.canUpgradeStar?.())) {
      const upgradeBtn = this.createActionButton(0, isMinion ? 210 : 176, '升星', Const.COLORS.PURPLE, () => {
        this.upgradeCard(card, isMinion);
      }, 88, 28);
      upgradeBtn.setDepth(Const.DEPTH.MODAL_UI);
      modal.add(upgradeBtn);
    }

    this.overlayElements.push(modal);

    this.scene.tweens.add({
      targets: modal,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 260,
      ease: 'Back.easeOut'
    });
  }

  closeCardDetail() {
    this.overlayElements.forEach((el) => {
      if (el && el.destroy) {
        el.destroy();
      }
    });
    this.overlayElements = [];
  }

  upgradeCard(card, isMinion) {
    let result;
    if (isMinion) {
      result = this.scene.minionCardManager.starUpgrade(card.id);
    } else {
      result = this.scene.chipCardManager.upgradeStar(card.id, window.gameData?.starStones || Number.MAX_SAFE_INTEGER);
    }

    if (result.success) {
      this.scene.showToast?.(`升星成功，当前 ${result.newStar} 星`);
      this.scene.saveGameData();
      this.closeCardDetail();
      this.refresh();
    } else if (result.reason === 'not_enough_stones' || result.reason === 'insufficient_star_stones') {
      this.scene.showToast?.('升星材料不足');
    } else {
      this.scene.showToast?.('升星失败');
    }
  }

  getChipAuraText(card) {
    const effective = card.getEffectiveStats?.() || {};
    if (effective.atkPercent > 0) return `ATK +${effective.atkPercent}%`;
    if (effective.hpPercent > 0) return `HP +${effective.hpPercent}%`;
    return 'Aura +0%';
  }

  getChipSkillList(card) {
    if (typeof card.getUnlockedSkills === 'function') {
      return card.getUnlockedSkills() || [];
    }
    return card.skills || [];
  }

  getChipSkillIcons(card) {
    return this.getChipSkillList(card).slice(0, 3).map((skill, index) => {
      if (skill.icon) return skill.icon;
      return `S${index + 1}`;
    });
  }

  getSpeedValue(card) {
    if (card.spd != null) return card.spd;
    if (card.baseSpd != null) return card.baseSpd;
    if (card.speed != null) return card.speed;
    return '--';
  }

  getAbilityCount(card) {
    if (Array.isArray(card.abilities)) return card.abilities.length;
    if (Array.isArray(card.forcedAbilities)) return card.forcedAbilities.length;
    if (Array.isArray(card.skillIds)) return card.skillIds.length;
    if (card.passiveSkill) return 1;
    return 0;
  }

  getQualityColorInt(quality) {
    return {
      N: 0x888888,
      R: 0x4a90d9,
      SR: 0x9b59b6,
      SSR: 0xf39c12,
      UR: 0xff4444,
      LE: 0xff00ff
    }[quality] || 0x888888;
  }

  getQualityColorText(quality) {
    return (Const.CHIP_QUALITY[quality] || Const.CHIP_QUALITY.N).textColor;
  }

  refresh() {
    this.destroy();
    this.show();
  }

  addText(x, y, text, options = {}) {
    const textObj = this.scene.add.text(x, y, text, options).setOrigin(0.5);
    textObj.setDepth(Const.DEPTH.CONTENT + 2);
    this.elements.push(textObj);
    return textObj;
  }

  destroy() {
    this.clearScroll();
    this.closeCardDetail();
    this.elements.forEach((el) => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
    this.contentContainer = null;
    this.maskGraphics = null;
  }
}
