/**
 * 卡牌渲染工厂
 * 
 * 当前为统一入口，负责所有卡牌类型的渲染。
 * 未来拆分计划：
 *   - BattleCardRenderer: 战斗单位卡 (createBattleUnitCard)
 *   - ChipCardRenderer: 芯片卡 (createChipCard)
 *   - CharacterRowRenderer: 紧凑角色行 (createCompactUnitRow)
 *   - PortraitRenderer: 大头像展示 (createDetailPortrait)
 *   - ButtonRenderer: 通用按钮 (createInlineButton)
 * 
 * 拆分时机：当某个渲染器需要独立迭代或超过 200 行时
 */

import AnimationHelper from './AnimationHelper.js';
import Const from '../data/Const.js';
import { getMainRole, RoleType } from '../data/CharacterClass.js';

const QUALITY_COLOR_MAP = {
  N: 0x888888,
  R: 0x4a90d9,
  SR: 0x9b59b6,
  SSR: 0xf39c12,
  UR: 0xff4444,
  LE: 0xff00ff
};

const ELEMENT_STYLE = {
  water: { label: 'W', icon: '💧', color: 0x3d8bfd },
  fire: { label: 'F', icon: '🔥', color: 0xff6b6b },
  wind: { label: 'A', icon: '🍃', color: 0x51cf66 },
  light: { label: 'L', icon: '✨', color: 0xf7b801 },
  dark: { label: 'D', icon: '🌑', color: 0x845ef7 }
};

const ROLE_STYLE = {
  [RoleType.TANK]: { label: 'T', color: 0x4dabf7 },
  [RoleType.DPS]: { label: 'D', color: 0xff922b },
  [RoleType.SUPPORT]: { label: 'S', color: 0x20c997 },
  [RoleType.HEALER]: { label: 'H', color: 0xff6bcb }
};

export default class CardRenderer {
  static createBattleUnitCard(scene, options = {}) {
    const {
      x = 0,
      y = 0,
      width = Const.BATTLE.LAYOUT.CARD_WIDTH,
      height = Const.BATTLE.LAYOUT.CARD_HEIGHT,
      quality = 'N',
      name = '???',
      hp = 0,
      maxHp = hp,
      atk = 0,
      spd = '--',
      element = 'water',
      charClass = null,
      portraitKey = null,
      skillCooldowns = [0, 0, 0],
      interactive = false,
      onClick = null,
      scale = 1
    } = options;

    const colorInt = this.getQualityColorInt(quality);
    const qualityText = this.getQualityColorText(quality);
    const elementStyle = this.getElementStyle(element);
    const roleStyle = this.getRoleStyle(charClass);
    const infoHeight = 40;
    const portraitInset = 6;
    const portraitWidth = width - portraitInset * 2;
    const portraitHeight = height - infoHeight - 10;
    const container = scene.add.container(x, y);

    container.setSize(width, height + 14);

    const outerGlow = scene.add.graphics();
    outerGlow.fillStyle(colorInt, 0.14);
    outerGlow.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 14);
    container.add(outerGlow);

    const cardFrame = scene.add.graphics();
    cardFrame.fillStyle(0x0a1020, 0.98);
    cardFrame.lineStyle(2, colorInt, 0.92);
    cardFrame.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    cardFrame.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    cardFrame.lineStyle(1, colorInt, 0.22);
    cardFrame.strokeRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, 10);
    container.add(cardFrame);

    const portraitY = -height / 2 + portraitInset;
    const portraitBg = scene.add.graphics();
    portraitBg.fillStyle(0x111826, 1);
    portraitBg.lineStyle(1, colorInt, 0.24);
    portraitBg.fillRoundedRect(-portraitWidth / 2, portraitY, portraitWidth, portraitHeight, 10);
    portraitBg.strokeRoundedRect(-portraitWidth / 2, portraitY, portraitWidth, portraitHeight, 10);
    container.add(portraitBg);

    const portraitContainer = scene.add.container(0, portraitY + portraitHeight / 2);
    const resolvedPortraitKey = this.resolvePortraitTextureKey(scene, portraitKey, element);
    if (resolvedPortraitKey) {
      const image = scene.add.image(0, 0, resolvedPortraitKey);
      const frame = scene.textures.getFrame(resolvedPortraitKey, '__BASE');
      const sourceWidth = frame?.width || portraitWidth;
      const sourceHeight = frame?.height || portraitHeight;
      const fitScale = Math.min(portraitWidth / sourceWidth, portraitHeight / sourceHeight);
      image.setScale(fitScale);
      portraitContainer.add(image);
    } else {
      portraitContainer.add(scene.add.text(0, 0, elementStyle.icon, {
        fontSize: `${Math.floor(portraitHeight * 0.42)}px`
      }).setOrigin(0.5));
    }
    container.add(portraitContainer);

    const infoY = height / 2 - infoHeight;
    const infoPanel = scene.add.graphics();
    infoPanel.fillStyle(0x09101a, 0.98);
    infoPanel.lineStyle(1, colorInt, 0.7);
    infoPanel.fillRoundedRect(-width / 2 + 4, infoY, width - 8, infoHeight - 4, 10);
    infoPanel.strokeRoundedRect(-width / 2 + 4, infoY, width - 8, infoHeight - 4, 10);
    container.add(infoPanel);

    const nameText = scene.add.text(-width / 2 + 7, infoY + 7, name, {
      fontSize: '8px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityText
    }).setOrigin(0, 0.5);
    nameText.setWordWrapWidth(width - 30);
    container.add(nameText);

    container.add(this.createBadge(scene, width / 2 - 18, infoY + 7, 12, 8, elementStyle.color, elementStyle.label));
    container.add(this.createBadge(scene, width / 2 - 6, infoY + 7, 12, 8, roleStyle.color, roleStyle.label));

    const hpBarBg = scene.add.graphics();
    const hpBarFill = scene.add.graphics();
    const hpBarWidth = width - 18;
    const hpBarHeight = 8;
    const hpBarX = -hpBarWidth / 2;
    const hpBarY = infoY + 13;
    hpBarBg.fillStyle(0x101826, 1);
    hpBarBg.fillRoundedRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight, 4);
    container.add(hpBarBg);
    container.add(hpBarFill);

    const hpText = scene.add.text(0, hpBarY + hpBarHeight / 2, '', {
      fontSize: '6px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(hpText);

    container.setData('hpBarFill', hpBarFill);
    container.setData('hpBarText', hpText);
    container.setData('hpBarWidth', hpBarWidth - 2);
    container.setData('hpBarX', hpBarX + 1);
    container.setData('hpBarY', hpBarY + 1);
    container.setData('hpBarHeight', hpBarHeight - 2);
    this.updateHpBar(container, hp, maxHp, true);

    const rowY = infoY + 29;
    const slots = [-width / 2 + 10, -width / 2 + 26, -width / 2 + 42, -width / 2 + 58, -width / 2 + 74];
    container.add(this.createBattleToken(scene, slots[0], rowY, 13, `${atk}`, '⚔'));
    const cooldowns = [...skillCooldowns, 0, 0, 0].slice(0, 3);
    cooldowns.forEach((cooldown, index) => {
      container.add(this.createBattleToken(scene, slots[index + 1], rowY, 13, `${cooldown}`, `${index + 1}`));
    });
    container.add(this.createBattleToken(scene, slots[4], rowY, 13, `${spd}`, '↯'));

    const buffStrip = scene.add.container(0, height / 2 + 8);
    container.add(buffStrip);
    container.setData('buffStrip', buffStrip);

    container.setScale(scale);
    container.__baseScaleX = scale;
    container.__baseScaleY = scale;

    if (interactive) {
      this.addInteraction(scene, container, onClick);
    }

    return container;
  }

  static createCompactUnitRow(scene, options = {}) {
    const {
      x = 0,
      y = 0,
      width = 340,
      card,
      portraitKey = null,
      onClick = null,
      onAction = null
    } = options;

    const quality = this.normalizeQuality(card?.quality || card?.rarity);
    const color = this.getQualityColorInt(quality);
    const role = this.getRoleStyle(card?.charClass);
    const element = this.getElementStyle(card?.element);
    const rowHeight = 76;
    const container = scene.add.container(x, y);
    container.setSize(width, rowHeight);

    const bg = scene.add.graphics();
    bg.fillStyle(0x0d111d, 0.94);
    bg.lineStyle(1.5, color, 0.75);
    bg.fillRoundedRect(-width / 2, -rowHeight / 2, width, rowHeight, 14);
    bg.strokeRoundedRect(-width / 2, -rowHeight / 2, width, rowHeight, 14);
    bg.lineStyle(1, color, 0.2);
    bg.strokeRoundedRect(-width / 2 + 5, -rowHeight / 2 + 5, width - 10, rowHeight - 10, 10);
    container.add(bg);

    const portraitBox = scene.add.graphics();
    portraitBox.fillStyle(0xf2f4f8, 1);
    portraitBox.lineStyle(1, color, 0.7);
    portraitBox.fillRoundedRect(-width / 2 + 10, -28, 56, 56, 12);
    portraitBox.strokeRoundedRect(-width / 2 + 10, -28, 56, 56, 12);
    container.add(portraitBox);

    const resolvedPortraitKey = this.resolvePortraitTextureKey(scene, portraitKey, card?.element);
    if (resolvedPortraitKey) {
      const portrait = scene.add.image(-width / 2 + 38, 0, resolvedPortraitKey);
      const frame = scene.textures.getFrame(resolvedPortraitKey, '__BASE');
      const fitScale = Math.min(48 / (frame?.width || 48), 48 / (frame?.height || 48));
      portrait.setScale(fitScale);
      container.add(portrait);
    } else {
      container.add(scene.add.text(-width / 2 + 38, 0, element.icon, {
        fontSize: '24px'
      }).setOrigin(0.5));
    }

    const title = scene.add.text(-width / 2 + 78, -18, card?.name || '未知', {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    title.setWordWrapWidth(width - 178);
    container.add(title);

    container.add(scene.add.text(width / 2 - 86, -18, `${quality}  Lv${card?.level || 1}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: this.getQualityColorText(quality)
    }).setOrigin(0, 0.5));

    container.add(this.createBadge(scene, -width / 2 + 88, 6, 20, 18, element.color, element.label));
    container.add(this.createBadge(scene, -width / 2 + 114, 6, 20, 18, role.color, role.label));

    container.add(scene.add.text(-width / 2 + 140, 6, `能力x${this.getAbilityCount(card)}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5));

    container.add(scene.add.text(-width / 2 + 78, 28, `HP ${card?.maxHp || card?.hp || 0}   ATK ${card?.atk || 0}   SPD ${card?.spd ?? card?.baseSpd ?? '--'}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5));

    container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -rowHeight / 2, width, rowHeight), Phaser.Geom.Rectangle.Contains);
    container.__baseScaleX = 1;
    container.__baseScaleY = 1;
    container.on('pointerdown', () => {
      if (typeof onClick === 'function') {
        onClick(card);
      }
    });
    container.on('pointerover', () => AnimationHelper.tweenCardHover(scene, container, true));
    container.on('pointerout', () => AnimationHelper.tweenCardHover(scene, container, false));

    return container;
  }

  static createChipCard(scene, options = {}) {
    const {
      x = 0,
      y = 0,
      quality = 'N',
      name = '???',
      star = 1,
      description = '',
      element = null,
      chipIconKey = null,
      interactive = false,
      onClick = null,
      scale = 1
    } = options;

    const cardW = 120;
    const cardH = 160;
    const colorInt = this.getQualityColorInt(quality);
    const qualityText = this.getQualityColorText(quality);
    const container = scene.add.container(x, y);
    container.setSize(cardW, cardH);

    const glow = this.createQualityGlow(scene, cardW, cardH, quality);
    container.add(glow);

    const frame = scene.add.graphics();
    frame.fillStyle(0x11131f, 0.96);
    frame.lineStyle(2, colorInt, 0.9);
    frame.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
    frame.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
    container.add(frame);

    const iconBox = scene.add.graphics();
    iconBox.fillStyle(0x161b28, 1);
    iconBox.lineStyle(1, colorInt, 0.45);
    iconBox.fillRoundedRect(-48, -62, 96, 84, 12);
    iconBox.strokeRoundedRect(-48, -62, 96, 84, 12);
    container.add(iconBox);

    if (chipIconKey && scene.textures.exists(chipIconKey)) {
      const icon = scene.add.image(0, -20, chipIconKey);
      const texture = scene.textures.get(chipIconKey)?.getSourceImage();
      const fitScale = Math.min(72 / (texture?.width || 72), 72 / (texture?.height || 72));
      icon.setScale(fitScale);
      container.add(icon);
    } else {
      container.add(scene.add.text(0, -20, element ? this.getElementStyle(element).icon : 'CORE', {
        fontSize: '28px',
        fontFamily: Const.FONT.FAMILY_EN,
        fontStyle: 'bold',
        color: qualityText
      }).setOrigin(0.5));
    }

    const infoPanel = scene.add.graphics();
    infoPanel.fillStyle(0x0b0f18, 0.92);
    infoPanel.lineStyle(1.2, colorInt, 0.75);
    infoPanel.fillRoundedRect(-52, 28, 104, 52, 12);
    infoPanel.strokeRoundedRect(-52, 28, 104, 52, 12);
    container.add(infoPanel);

    const starStr = '★'.repeat(Math.min(star, 5));
    const nameText = scene.add.text(-44, 38, `${starStr} ${name}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityText
    }).setOrigin(0, 0);
    nameText.setWordWrapWidth(88);
    container.add(nameText);

    if (description) {
      const descText = scene.add.text(-44, 58, description, {
        fontSize: '9px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0, 0);
      descText.setWordWrapWidth(88);
      container.add(descText);
    }

    container.setScale(scale);
    container.__baseScaleX = scale;
    container.__baseScaleY = scale;

    if (interactive) {
      this.addInteraction(scene, container, onClick);
    }

    return container;
  }

  static createDetailPortrait(scene, options = {}) {
    const {
      x = 0,
      y = 0,
      width = 240,
      height = 276,
      quality = 'N',
      portraitKey = null,
      element = 'water'
    } = options;

    const container = scene.add.container(x, y);
    const color = this.getQualityColorInt(quality);

    const bg = scene.add.graphics();
    bg.fillStyle(0xf2f4f8, 0.98);
    bg.lineStyle(1.5, color, 0.5);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
    container.add(bg);

    const resolvedPortraitKey = this.resolvePortraitTextureKey(scene, portraitKey, element);
    if (resolvedPortraitKey) {
      const frame = scene.textures.getFrame(resolvedPortraitKey, '__BASE');
      const image = scene.add.image(0, 0, resolvedPortraitKey);
      const fitScale = Math.min(
        width / (frame?.width || width),
        height / (frame?.height || height)
      );
      image.setScale(fitScale);
      container.add(image);
    } else {
      container.add(scene.add.text(0, 0, this.getElementStyle(element).icon, {
        fontSize: '72px'
      }).setOrigin(0.5));
    }

    return container;
  }

  static updateHpBar(container, currentHp, maxHp, isPlayer = true) {
    const fill = container.getData('hpBarFill');
    const text = container.getData('hpBarText');
    if (!fill || !text) return;

    const barWidth = container.getData('hpBarWidth') || 0;
    const barX = container.getData('hpBarX') || 0;
    const barY = container.getData('hpBarY') || 0;
    const barHeight = container.getData('hpBarHeight') || 0;
    const ratio = maxHp > 0 ? Phaser.Math.Clamp(currentHp / maxHp, 0, 1) : 0;

    fill.clear();
    fill.fillStyle(isPlayer ? Const.BATTLE.COLORS.HP_GREEN : Const.BATTLE.COLORS.HP_RED, 1);
    fill.fillRoundedRect(barX, barY, barWidth * ratio, barHeight, 3);
    text.setText(`${Math.max(0, Math.floor(currentHp))}/${Math.max(0, Math.floor(maxHp))}`);
  }

  static createInlineButton(scene, x, y, label, callback, width = 48, height = 22) {
    const button = scene.add.container(x, y);
    const bg = scene.add.graphics();
    bg.fillStyle(Const.COLORS.BUTTON_SECONDARY, 1);
    bg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    button.add(bg);

    button.add(scene.add.text(0, 0, label, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5));

    button.setSize(width, height);
    button.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      if (typeof callback === 'function') {
        callback();
      }
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

  static animateEntry(scene, card, delay = 0) {
    AnimationHelper.tweenScaleIn(scene, card, 300, delay);
  }

  static addInteraction(scene, card, onClick) {
    card.__baseScaleX = card.__baseScaleX ?? card.scaleX ?? 1;
    card.__baseScaleY = card.__baseScaleY ?? card.scaleY ?? 1;
    card.setInteractive();
    card.on('pointerover', () => AnimationHelper.tweenCardHover(scene, card, true));
    card.on('pointerout', () => AnimationHelper.tweenCardHover(scene, card, false));
    card.on('pointerdown', () => {
      AnimationHelper.tweenPulse(scene, card, 1.03, 90);
      if (typeof onClick === 'function') {
        onClick(card);
      }
    });
  }

  static createQualityGlow(scene, width, height, quality) {
    const qualityConfig = Const.CHIP_QUALITY[quality] || Const.CHIP_QUALITY.N;
    const colorInt = this.getQualityColorInt(quality);
    const glowAlpha = qualityConfig.glow * 0.28;
    const padding = 6;
    const graphics = scene.add.graphics();
    graphics.fillStyle(colorInt, glowAlpha);
    graphics.fillRoundedRect(
      -(width / 2) - padding,
      -(height / 2) - padding,
      width + padding * 2,
      height + padding * 2,
      Const.UI.CARD_RADIUS + 2
    );

    if (['SSR', 'UR', 'LE'].includes(quality)) {
      scene.tweens.add({
        targets: graphics,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    return graphics;
  }

  static createBadge(scene, x, y, width, height, color, label) {
    const container = scene.add.container(x, y);
    const bg = scene.add.graphics();
    bg.fillStyle(color, 0.18);
    bg.lineStyle(1, color, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 5);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 5);
    container.add(bg);
    container.add(scene.add.text(0, 0, label, {
      fontSize: '8px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5));
    return container;
  }

  static createBattleToken(scene, x, y, size, value, label) {
    const container = scene.add.container(x, y);
    const bg = scene.add.graphics();
    bg.fillStyle(0x11192a, 1);
    bg.lineStyle(1, 0x6eb7ff, 0.7);
    bg.fillRoundedRect(-size / 2, -size / 2, size, size, 5);
    bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 5);
    container.add(bg);
    container.add(scene.add.text(0, -1.5, label, {
      fontSize: '6px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: '#b5d9ff'
    }).setOrigin(0.5));
    container.add(scene.add.text(0, 4, value, {
      fontSize: '6px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5));
    return container;
  }

  static getQualityColorInt(quality) {
    return QUALITY_COLOR_MAP[quality] || QUALITY_COLOR_MAP.N;
  }

  static getQualityColorText(quality) {
    return (Const.CHIP_QUALITY[quality] || Const.CHIP_QUALITY.N).textColor;
  }

  static getElementStyle(element) {
    return ELEMENT_STYLE[element] || ELEMENT_STYLE.water;
  }

  static getRoleStyle(charClass) {
    const role = getMainRole(charClass) || RoleType.DPS;
    return ROLE_STYLE[role] || ROLE_STYLE[RoleType.DPS];
  }

  static getAbilityCount(card) {
    if (Array.isArray(card?.abilities)) return card.abilities.length;
    if (Array.isArray(card?.abilityIds)) return card.abilityIds.length;
    if (Array.isArray(card?.forcedAbilities)) return card.forcedAbilities.length;
    if (card?.passiveSkill) return 1;
    return 0;
  }

  static normalizeQuality(input) {
    if (!input) return 'N';
    if (['N', 'R', 'SR', 'SSR', 'UR', 'LE'].includes(input)) return input;
    return { common: 'N', rare: 'R', epic: 'SR', legendary: 'SSR' }[input] || 'N';
  }
  static resolvePortraitTextureKey(scene, portraitKey, element) {
    if (portraitKey && scene.textures.exists(portraitKey)) {
      return portraitKey;
    }
    const placeholderKey = `portrait-placeholder-${element || 'water'}`;
    if (scene.textures.exists(placeholderKey)) {
      return placeholderKey;
    }
    return null;
  }
}

