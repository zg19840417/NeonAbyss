import Const from '../../game/data/Const.js';
import AnimationHelper from '../../game/utils/AnimationHelper.js';
import CardRenderer from '../../game/utils/CardRenderer.js';
import { extractPortraitKey } from '../../game/utils/PortraitRegistry.js';
import { RoleType } from '../../game/data/CharacterClass.js';
import {
  getFusionGirlById,
  getPortraitSetById,
  getPortraitSetsByFusionGirlId,
  FUSION_GIRL_QUALITY_ORDER,
  getFusionGirlCombatStats
} from '../../game/data/FusionGirlData.js';

const RARITY_TO_QUALITY = {
  common: 'N',
  rare: 'R',
  epic: 'SR',
  legendary: 'SSR'
};

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

const PROFESSION_ROLE_MAP = {
  tank: RoleType.TANK,
  dps: RoleType.DPS,
  support: RoleType.SUPPORT,
  healer: RoleType.HEALER
};

export default class TeamView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this.overlayElements = [];
    this.detailScrollCleanup = null;
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

  hasFusionGirls() {
    return (this.scene.fusionGirlManager?.getAllGirls?.() || []).length > 0;
  }

  getAvailableFusionGirls() {
    return this.getFusionBattleCards(this.scene.fusionGirlManager?.getAvailableGirls?.() || []);
  }

  getFusionBattleCards(girls) {
    return (girls || []).map((girl) => this.createFusionBattleCard(girl)).filter(Boolean);
  }

  createFusionBattleCard(girl) {
    const fusionData = getFusionGirlById(girl.id);
    if (!fusionData) return null;

    const portraitSet = this.getActivePortraitSet(girl, fusionData);
    const combatStats = getFusionGirlCombatStats(girl, fusionData);

    return {
      id: girl.id,
      fusionGirlId: girl.id,
      name: fusionData.name,
      title: fusionData.title,
      quality: girl.quality,
      level: combatStats.level,
      element: fusionData.element,
      charClass: PROFESSION_ROLE_MAP[fusionData.profession] || RoleType.DPS,
      profession: fusionData.profession,
      portrait: portraitSet?.coverPortrait || null,
      portraitSetId: portraitSet?.id || fusionData.defaultPortraitSetId || null,
      portraitSetName: portraitSet?.setName || '默认立绘',
      maxHp: combatStats.maxHp,
      currentHp: combatStats.maxHp,
      atk: combatStats.atk,
      spd: combatStats.spd,
      abilities: this.getFusionAbilityList(fusionData, girl),
      moduleSlots: this.getFusionModuleSlotCount(fusionData, girl),
      fragmentBonuses: girl.fragmentBonuses || {},
      portraitProgress: girl.portraitProgress || {},
      pendingQualityUpgrades: girl.pendingQualityUpgrades || 0,
      completedPortraitSetIds: girl.completedPortraitSetIds || [],
      isFusionGirl: true,
      rawRecord: girl,
      rawData: fusionData
    };
  }

  getActivePortraitSet(girl, fusionData) {
    const allSets = getPortraitSetsByFusionGirlId(girl.id);
    if (!allSets.length) return null;
    const completedIds = new Set(girl.completedPortraitSetIds || []);
    return allSets.find((set) => completedIds.has(set.id))
      || allSets.find((set) => set.id === fusionData.defaultPortraitSetId)
      || allSets[0];
  }

  getFusionAbilityList(fusionData, girl) {
    return [
      fusionData.activeSkill1Id,
      fusionData.activeSkill2Id,
      fusionData.activeSkill3Id
    ].filter(Boolean).filter((skillId, index) => this.isFusionSkillUnlocked(girl, index));
  }

  isFusionSkillUnlocked(girl, index) {
    const qualityIndex = FUSION_GIRL_QUALITY_ORDER.indexOf(girl.quality || 'N');
    if (index === 0) return true;
    if (index === 1) return qualityIndex >= FUSION_GIRL_QUALITY_ORDER.indexOf('R');
    return qualityIndex >= FUSION_GIRL_QUALITY_ORDER.indexOf('SSR');
  }

  getFusionModuleSlotCount(fusionData, girl) {
    const plan = fusionData.moduleSlotPlan || {};
    return Number(plan[girl.quality] || plan.N || 0);
  }

  getQualityStageBonus(quality) {
    const index = FUSION_GIRL_QUALITY_ORDER.indexOf(quality || 'N');
    return Math.max(0, index) * 0.08;
  }

  renderFormation(width, contentTop) {
    this.addText(width / 2, contentTop + 10, '上阵阵容', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN,
      fontStyle: 'bold'
    });

    const deployedMinions = this.getFusionBattleCards(this.scene.fusionGirlManager?.getDeployedGirls?.() || []);
    const cardY = contentTop + 120;
    const spacing = 112;
    const cardXs = [width / 2 - spacing, width / 2, width / 2 + spacing];

    for (let index = 0; index < 3; index++) {
      const card = deployedMinions[index];
      if (card) {
        this.renderDeployedFusionGirlCard(cardXs[index], cardY, card);
      } else {
        this.renderEmptySlot(cardXs[index], cardY, `空位 ${index + 1}`);
      }
    }

    this.renderChipAura(width / 2, contentTop + 268, width - 24);
    this.formationBottom = contentTop + 312;
  }

  renderDeployedFusionGirlCard(x, y, card) {
    const quality = card.isFusionGirl ? (card.quality || 'N') : (RARITY_TO_QUALITY[card.rarity] || 'N');
    const cardContainer = CardRenderer.createBattleUnitCard(this.scene, {
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

    const action = this.createActionButton(x, y + 98, '卸下', Const.COLORS.BUTTON_SECONDARY, () => {
      this.toggleDeploy(card, true);
    }, 50, 22);
    action.setDepth(Const.DEPTH.CONTENT + 2);
  }

  renderEmptySlot(x, y, label) {
    const width = 96;
    const height = 145;
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.45);
    bg.lineStyle(1.5, Const.COLORS.BUTTON_SECONDARY, 0.7);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 0);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 0);
    bg.lineStyle(1, Const.COLORS.BUTTON_SECONDARY, 0.25);
    bg.strokeRoundedRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, 0);
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
      bg.fillRoundedRect(-width / 2, -36, width, 72, 0);
      bg.strokeRoundedRect(-width / 2, -36, width, 72, 0);
      bg.lineStyle(1, Const.COLORS.BUTTON_SECONDARY, 0.25);
      bg.strokeRoundedRect(-width / 2 + 8, -28, width - 16, 56, 0);
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
    tag.fillRoundedRect(right - 82, headerY - 12, 82, 24, 0);
    tag.strokeRoundedRect(right - 82, headerY - 12, 82, 24, 0);
    tag.setDepth(Const.DEPTH.CONTENT + 2);
    this.elements.push(tag);

    const count = this.getAvailableFusionGirls().length;
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
    const availableMinions = this.getAvailableFusionGirls();
    const allChips = this.scene.chipCardManager?.getAllCards?.() || [];
    const equippedId = this.scene.chipCardManager?.equippedCard?.id;
    const reserveChips = allChips.filter(card => card.id !== equippedId);
    let y = 0;

    if (availableMinions.length === 0) {
      this.contentContainer.add(this.scene.add.text(width / 2, 24, '暂无待命融合姬', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5));
      y += 52;
    } else {
      availableMinions.forEach((card) => {
        const row = this.createCompactFusionGirlRow(width / 2, y + 38, width - 30, card);
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

  createCompactUnitRow(x, y, width, card) {
    const row = CardRenderer.createCompactUnitRow(this.scene, {
      x,
      y,
      width,
      card,
      portraitKey: extractPortraitKey(card.portrait),
      onClick: () => this.showCardDetail(card, true)
    });

    this.contentContainer.add(row);
    return row;
  }

  createCompactFusionGirlRow(x, y, width, card) {
    const row = this.scene.add.container(x, y);
    const rowWidth = width;
    const rowHeight = 78;
    const quality = card.quality || 'N';
    const color = this.getQualityColorInt(quality);
    const portraitKey = extractPortraitKey(card.portrait);
    const elementStyle = ELEMENT_STYLE[card.element] || ELEMENT_STYLE.water;
    const roleStyle = ROLE_STYLE[card.charClass] || ROLE_STYLE[RoleType.DPS];
    const portraitSetName = this.getPortraitSetDisplayName(card.portraitSetId);
    const progressSummary = this.getFusionRowProgressSummary(card);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0d111d, 0.94);
    bg.lineStyle(1.5, color, 0.78);
    bg.fillRoundedRect(-rowWidth / 2, -rowHeight / 2, rowWidth, rowHeight, 0);
    bg.strokeRoundedRect(-rowWidth / 2, -rowHeight / 2, rowWidth, rowHeight, 0);
    bg.lineStyle(1, color, 0.22);
    bg.strokeRoundedRect(-rowWidth / 2 + 5, -rowHeight / 2 + 5, rowWidth - 10, rowHeight - 10, 0);
    row.add(bg);

    const portraitBox = this.scene.add.graphics();
    portraitBox.fillStyle(0xf2f4f8, 1);
    portraitBox.lineStyle(1, color, 0.7);
    portraitBox.fillRoundedRect(-rowWidth / 2 + 10, -28, 56, 56, 0);
    portraitBox.strokeRoundedRect(-rowWidth / 2 + 10, -28, 56, 56, 0);
    row.add(portraitBox);

    if (portraitKey && this.scene.textures.exists(portraitKey)) {
      const portrait = this.scene.add.image(-rowWidth / 2 + 38, 0, portraitKey);
      const frame = this.scene.textures.getFrame(portraitKey, '__BASE');
      const fitScale = Math.min(48 / (frame?.width || 48), 48 / (frame?.height || 48));
      portrait.setScale(fitScale);
      row.add(portrait);
    } else {
      row.add(this.scene.add.text(-rowWidth / 2 + 38, 0, elementStyle.emoji, {
        fontSize: '24px'
      }).setOrigin(0.5));
    }

    const title = this.scene.add.text(-rowWidth / 2 + 78, -18, card.name || '未命名融合姬', {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    title.setWordWrapWidth(rowWidth - 190);
    row.add(title);

    row.add(this.scene.add.text(rowWidth / 2 - 86, -18, `${quality}  Lv${card.level || 1}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: this.getQualityColorText(quality)
    }).setOrigin(0, 0.5));

    row.add(this.createMiniBadge(-rowWidth / 2 + 88, 6, 20, 18, elementStyle.color, elementStyle.label));
    row.add(this.createMiniBadge(-rowWidth / 2 + 114, 6, 20, 18, roleStyle.color, roleStyle.label));

    row.add(this.scene.add.text(-rowWidth / 2 + 140, 6, portraitSetName, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5));

    row.add(this.scene.add.text(-rowWidth / 2 + 78, 28, progressSummary, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5));

    row.setSize(rowWidth, rowHeight);
    row.setInteractive(new Phaser.Geom.Rectangle(-rowWidth / 2, -rowHeight / 2, rowWidth, rowHeight), Phaser.Geom.Rectangle.Contains);
    row.__baseScaleX = 1;
    row.__baseScaleY = 1;
    row.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      this.showCardDetail(card, true);
    });
    row.on('pointerover', () => AnimationHelper.tweenCardHover(this.scene, row, true));
    row.on('pointerout', () => AnimationHelper.tweenCardHover(this.scene, row, false));

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
    bg.fillRoundedRect(-rowWidth / 2, -rowHeight / 2, rowWidth, rowHeight, 0);
    bg.strokeRoundedRect(-rowWidth / 2, -rowHeight / 2, rowWidth, rowHeight, 0);
    row.add(bg);

    const coreBg = this.scene.add.graphics();
    coreBg.fillStyle(color, 0.18);
    coreBg.lineStyle(1, color, 0.9);
    coreBg.fillRoundedRect(-rowWidth / 2 + 10, -18, 48, 36, 0);
    coreBg.strokeRoundedRect(-rowWidth / 2 + 10, -18, 48, 36, 0);
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

    row.setSize(rowWidth, rowHeight);
    row.setInteractive(new Phaser.Geom.Rectangle(-rowWidth / 2, -rowHeight / 2, rowWidth, rowHeight), Phaser.Geom.Rectangle.Contains);
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
    glow.fillRoundedRect(-width / 2, -height / 2, width, height, 0);
    glow.fillRoundedRect(-width / 2 + 14, -height / 2 - 10, 72, 20, 0);
    glow.fillRoundedRect(width / 2 - 86, -height / 2 - 10, 72, 20, 0);
    container.add(glow);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.96);
    bg.lineStyle(2, color, 0.85);
    bg.fillRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 0);
    bg.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 0);
    bg.lineStyle(1, color, 0.25);
    bg.strokeRoundedRect(-width / 2 + 10, -height / 2 + 10, width - 20, height - 20, 0);
    container.add(bg);

    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(color, 0.18);
    iconBg.lineStyle(1, color, 0.9);
    iconBg.fillRoundedRect(-width / 2 + 14, -20, 54, 40, 0);
    iconBg.strokeRoundedRect(-width / 2 + 14, -20, 54, 40, 0);
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

    if (interactive) {
      container.setSize(width, height);
      container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
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
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 0);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 0);
    container.add(bg);

    container.add(this.scene.add.text(0, 0, label, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5));

    return container;
  }

  createOutlinedBadge(x, y, size, color, label, fontSize = '10px') {
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f1522, 0.98);
    bg.lineStyle(1, color, 0.95);
    bg.fillRoundedRect(-size / 2, -size / 2, size, size, 0);
    bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 0);
    container.add(bg);

    container.add(this.scene.add.text(0, 0, label, {
      fontSize,
      fontFamily: Const.FONT.FAMILY_CN,
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
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
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
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
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
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    button.add(bg);

    button.add(this.scene.add.text(0, 0, label, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.PRIMARY,
      fontStyle: 'bold'
    }).setOrigin(0.5));

    const hitZone = this.scene.add.zone(0, 0, width + 12, height + 10).setOrigin(0.5);
    hitZone.setInteractive(new Phaser.Geom.Rectangle(-(width + 12) / 2, -(height + 10) / 2, width + 12, height + 10), Phaser.Geom.Rectangle.Contains);
    button.add(hitZone);

    button.setSize(width, height);
    hitZone.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      callback();
    });
    hitZone.on('pointerover', () => AnimationHelper.tweenCardHover(this.scene, button, true));
    hitZone.on('pointerout', () => AnimationHelper.tweenCardHover(this.scene, button, false));
    this.elements.push(button);
    return button;
  }


  createModalActionButton(x, y, label, color, callback, width = 52, height = 24) {
    const button = this.scene.add.container(x, y);
    const bg = this.scene.add.graphics();
    bg.fillStyle(color, 1);
    bg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.75);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    button.add(bg);

    button.add(this.scene.add.text(0, 0, label, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.PRIMARY,
      fontStyle: 'bold'
    }).setOrigin(0.5));

    const hitZone = this.scene.add.zone(0, 0, width + 12, height + 10).setOrigin(0.5);
    hitZone.setInteractive(new Phaser.Geom.Rectangle(-(width + 12) / 2, -(height + 10) / 2, width + 12, height + 10), Phaser.Geom.Rectangle.Contains);
    button.add(hitZone);

    button.setSize(width, height);
    hitZone.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      callback();
    });
    hitZone.on('pointerover', () => AnimationHelper.tweenCardHover(this.scene, button, true));
    hitZone.on('pointerout', () => AnimationHelper.tweenCardHover(this.scene, button, false));
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
    if (card?.isFusionGirl) {
      const isDeployed = this.scene.fusionGirlManager?.deployedGirlIds?.includes(card.id);
      const result = isDeployed
        ? this.scene.fusionGirlManager.undeployGirl(card.id)
        : this.scene.fusionGirlManager.deployGirl(card.id);

      if (!result.success) {
        const message = {
          girl_not_found: '未找到该融合姬',
          already_deployed: '该融合姬已在阵容中',
          max_deploy_reached: '融合姬上阵位已满',
          not_deployed: '该融合姬当前未上阵'
        }[result.reason] || '操作失败';
        this.scene.showToast?.(message);
        return;
      }

      this.scene.showToast?.(isDeployed ? '已卸下融合姬' : '已上阵融合姬');
      this.scene.saveGameData();
      this.refresh();
      return;
    }

    if (isMinion) {
      this.scene.showToast?.('旧随从卡入口已停用');
      return;
    } else if (this.scene.chipCardManager.equippedCard?.id === card.id) {
      const result = this.scene.chipCardManager.unequipCard();
      if (!result.success) {
        this.scene.showToast?.('卸下芯片失败');
        return;
      }
      this.scene.showToast?.('已卸下芯片');
    } else {
      const result = this.scene.chipCardManager.equipCard(card.id);
      if (!result.success) {
        this.scene.showToast?.('装备芯片失败');
        return;
      }
      this.scene.showToast?.('已装备芯片');
    }

    this.scene.saveGameData();
    this.refresh();
  }

  showCardDetail(card, isMinion) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const modalWidth = Math.min(width - 12, 360);
    const isFusionGirl = !!card?.isFusionGirl;
    const modalHeight = isFusionGirl && isMinion ? Math.min(height - 20, 760) : 524;
    const displayQuality = isFusionGirl ? (card.quality || 'N') : (RARITY_TO_QUALITY[card.rarity] || 'N');

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(Const.DEPTH.MODAL_OVERLAY);
    overlay.setAlpha(0);
    this.overlayElements.push(overlay);

    const closeZone = this.scene.add.zone(width / 2, height / 2, width, height);
    closeZone.setDepth(Const.DEPTH.MODAL_OVERLAY);
    closeZone.setInteractive();
    closeZone.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      this.closeCardDetail();
    });
    this.overlayElements.push(closeZone);

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

    const modalBlocker = this.scene.add.zone(0, 0, modalWidth, modalHeight + 76);
    modalBlocker.setInteractive();
    modalBlocker.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
    });
    modal.add(modalBlocker);

    const bg = this.scene.add.graphics();
    const accentColor = this.getQualityColorInt(isMinion ? displayQuality : (card.quality || 'N'));
    bg.fillStyle(0x0b0f18, 0.98);
    bg.fillRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 0);
    modal.add(bg);

    if (isMinion) {
      const deployed = this.scene.fusionGirlManager?.deployedGirlIds?.includes(card.id);
      const portraitKey = extractPortraitKey(card.portrait);
      const portraitFrame = portraitKey ? this.scene.textures.getFrame(portraitKey, '__BASE') : null;
      const portraitWidth = modalWidth - 12;
      const portraitHeight = Math.min(
        Math.floor(portraitWidth * ((portraitFrame?.height || 1536) / (portraitFrame?.width || 1024))),
        360
      );
      const portraitTop = -modalHeight / 2 + 8;
      const portraitCenterY = portraitTop + portraitHeight / 2;
      const detailTop = portraitTop + portraitHeight + 8;
      const detailHeight = 196;
      const tabHeaderHeight = 30;
      const contentTop = detailTop + tabHeaderHeight + 6;
      const descriptionHeight = 44;
      const descriptionTop = detailTop + detailHeight - descriptionHeight - 8;
      const contentHeight = descriptionTop - contentTop - 6;
      const footerY = modalHeight / 2 - 28;

      const portraitBg = this.scene.add.graphics();
      portraitBg.fillStyle(0x05080f, 0.98);
      portraitBg.fillRoundedRect(-portraitWidth / 2, portraitTop, portraitWidth, portraitHeight, 0);
      modal.add(portraitBg);

      const portrait = CardRenderer.createDetailPortrait(this.scene, {
        x: 0,
        y: portraitCenterY,
        width: portraitWidth,
        height: portraitHeight,
        quality: displayQuality,
        portraitKey,
        element: card.element || 'water',
        showFrame: false
      });
      modal.add(portrait);

      const professionLabel = this.getProfessionLabel(card.profession || card.rawData?.profession);
      const elementLabel = this.getElementLabel(card.element);
      const activeSkills = this.getFusionActiveSkillEntries(card);
      const abilityEntries = this.getFusionDetailAbilities(card);
      const roleStyle = ROLE_STYLE[card.charClass] || ROLE_STYLE[RoleType.DPS];
      const elementStyle = ELEMENT_STYLE[card.element] || ELEMENT_STYLE.water;
      const roleGlyphMap = {
        [RoleType.TANK]: '⛨',
        [RoleType.DPS]: '✦',
        [RoleType.SUPPORT]: '✣',
        [RoleType.HEALER]: '✚'
      };
      const detailPanel = this.scene.add.graphics();
      detailPanel.fillStyle(0x0f1522, 0.98);
      detailPanel.lineStyle(1, accentColor, 0.35);
      detailPanel.fillRoundedRect(-(modalWidth - 20) / 2, detailTop, modalWidth - 20, detailHeight, 0);
      detailPanel.strokeRoundedRect(-(modalWidth - 20) / 2, detailTop, modalWidth - 20, detailHeight, 0);
      modal.add(detailPanel);

      const tabButtonWidth = 84;
      const tabSpacing = 10;
      const tabY = detailTop + 16;
      const tabCenters = [
        -tabButtonWidth - tabSpacing,
        0,
        tabButtonWidth + tabSpacing
      ];
      const tabButtons = [];
      const tabLabels = ['基础', '技能', '能力'];

      const contentContainer = this.scene.add.container(0, contentTop);
      modal.add(contentContainer);

      const descPanel = this.scene.add.graphics();
      descPanel.fillStyle(0x11192a, 0.98);
      descPanel.lineStyle(1, accentColor, 0.24);
      descPanel.fillRoundedRect(-(modalWidth - 28) / 2, descriptionTop, modalWidth - 28, descriptionHeight, 0);
      descPanel.strokeRoundedRect(-(modalWidth - 28) / 2, descriptionTop, modalWidth - 28, descriptionHeight, 0);
      modal.add(descPanel);

      const descText = this.scene.add.text(0, descriptionTop + descriptionHeight / 2, '', {
        fontSize: '11px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SECONDARY,
        align: 'left',
        wordWrap: { width: modalWidth - 44 }
      }).setOrigin(0.5);
      modal.add(descText);

      const setDescriptionVisible = (visible) => {
        descPanel.setVisible(visible);
        descText.setVisible(visible);
      };

      const setDescription = (text) => {
        descText.setText(text || '');
      };

      const renderBaseTab = () => {
        contentContainer.removeAll(true);
        const panelWidth = modalWidth - 34;
        const leftX = -panelWidth / 2;
        const rightX = panelWidth / 2;
        const topLineY = 2;
        const hpLineY = 34;
        const statLineY = 68;
        const qualityGlyphMap = {
          N: '◇',
          R: '◈',
          SR: '✦',
          SSR: '✶',
          UR: '✹',
          LE: '✷'
        };

        const titleName = `${card.title || card.rawData?.title || ''} ${card.name || ''}`.trim();
        const levelText = `Lv${card.level || 1}`;
        contentContainer.add(this.scene.add.text(leftX + 2, topLineY, levelText, {
          fontSize: '13px',
          fontFamily: Const.FONT.FAMILY_EN,
          fontStyle: 'bold',
          color: Const.TEXT_COLORS.CYAN
        }).setOrigin(0, 0.5));
        contentContainer.add(this.createOutlinedBadge(leftX + 28, topLineY, 18, accentColor, qualityGlyphMap[displayQuality] || '◇', '10px'));
        contentContainer.add(this.scene.add.text(leftX + 42, topLineY, titleName, {
          fontSize: '16px',
          fontFamily: Const.FONT.FAMILY_CN,
          fontStyle: 'bold',
          color: this.getQualityColorText(displayQuality)
        }).setOrigin(0, 0.5));

        const professionText = this.scene.add.text(0, topLineY, professionLabel, {
          fontSize: '11px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.PRIMARY
        }).setOrigin(1, 0.5);
        const elementText = this.scene.add.text(0, topLineY, elementLabel, {
          fontSize: '11px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.PRIMARY
        }).setOrigin(1, 0.5);
        const elementGroupRight = rightX;
        const elementTextWidth = elementText.width;
        const professionTextWidth = professionText.width;
        contentContainer.add(this.createOutlinedBadge(elementGroupRight - elementTextWidth - 10, topLineY, 18, elementStyle.color, elementStyle.emoji || '✦', '10px'));
        elementText.setX(elementGroupRight);
        contentContainer.add(elementText);
        contentContainer.add(this.createOutlinedBadge(elementGroupRight - elementTextWidth - 54 - professionTextWidth, topLineY, 18, roleStyle.color, roleGlyphMap[card.charClass] || '✦', '10px'));
        professionText.setX(elementGroupRight - elementTextWidth - 14);
        contentContainer.add(professionText);

        const hpText = `${Math.max(0, Math.floor(card.currentHp ?? card.maxHp ?? 0))}/${Math.max(0, Math.floor(card.maxHp ?? 0))}`;
        const hpBarWidth = panelWidth - 42;
        const hpRatio = Math.max(0, Math.min(1, (card.currentHp ?? card.maxHp ?? 0) / Math.max(1, card.maxHp ?? 1)));
        contentContainer.add(this.createOutlinedBadge(leftX + 12, hpLineY, 20, 0xe85d75, '♥', '11px'));
        const hpTrack = this.scene.add.graphics();
        hpTrack.fillStyle(0x1a2233, 1);
        hpTrack.fillRoundedRect(leftX + 28, hpLineY - 9, hpBarWidth, 18, 0);
        hpTrack.fillStyle(Const.BATTLE.COLORS.HP_RED, 1);
        hpTrack.fillRoundedRect(leftX + 28, hpLineY - 9, hpBarWidth * hpRatio, 18, 0);
        contentContainer.add(hpTrack);
        const hpValueText = this.scene.add.text(leftX + 28 + hpBarWidth / 2, hpLineY, hpText, {
          fontSize: '11px',
          fontFamily: Const.FONT.FAMILY_EN,
          fontStyle: 'bold',
          color: '#ffffff'
        }).setOrigin(0.5);
        hpValueText.setStroke('#09101a', 3);
        contentContainer.add(hpValueText);

        const statWidth = (panelWidth - 8) / 2;
        [
          { x: leftX, icon: '⚔', label: '攻击', value: `${card.atk || 0}` },
          { x: leftX + statWidth + 10, icon: '↯', label: '速度', value: `${this.getSpeedValue(card)}` }
        ].forEach((stat) => {
          const statBg = this.scene.add.graphics();
          statBg.fillStyle(0x11192a, 0.98);
          statBg.lineStyle(1, accentColor, 0.22);
          statBg.fillRoundedRect(stat.x, statLineY - 12, statWidth, 24, 0);
          statBg.strokeRoundedRect(stat.x, statLineY - 12, statWidth, 24, 0);
          contentContainer.add(statBg);
          contentContainer.add(this.createOutlinedBadge(stat.x + 10, statLineY, 18, accentColor, stat.icon, '10px'));
          contentContainer.add(this.scene.add.text(stat.x + 28, statLineY, stat.label, {
            fontSize: '9px',
            fontFamily: Const.FONT.FAMILY_CN,
            color: Const.TEXT_COLORS.SECONDARY
          }).setOrigin(0, 0.5));
          contentContainer.add(this.scene.add.text(stat.x + statWidth - 10, statLineY, stat.value, {
            fontSize: '10px',
            fontFamily: Const.FONT.FAMILY_EN,
            fontStyle: 'bold',
            color: Const.TEXT_COLORS.PRIMARY
          }).setOrigin(1, 0.5));
        });

        setDescriptionVisible(false);
        setDescription('');
      };

      const renderSkillTab = () => {
        contentContainer.removeAll(true);
        setDescriptionVisible(true);
        const iconSize = 48;
        const labelY = 64;
        const skillStartX = -iconSize - 8;

        activeSkills.forEach((skill, index) => {
          const skillX = skillStartX + index * (iconSize + 8);
          const skillCard = this.scene.add.container(skillX, 28);
          const skillBg = this.scene.add.graphics();
          skillBg.fillStyle(0x11192a, 0.98);
          skillBg.lineStyle(1, skill.unlocked ? Const.COLORS.BUTTON_CYAN : 0x4a5670, 0.7);
          skillBg.fillRoundedRect(-iconSize / 2, -iconSize / 2, iconSize, iconSize, 0);
          skillBg.strokeRoundedRect(-iconSize / 2, -iconSize / 2, iconSize, iconSize, 0);
          skillCard.add(skillBg);
          skillCard.add(this.scene.add.text(0, -6, `${index + 1}`, {
            fontSize: '13px',
            fontFamily: Const.FONT.FAMILY_EN,
            fontStyle: 'bold',
            color: skill.unlocked ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.INACTIVE
          }).setOrigin(0.5));
          skillCard.add(this.scene.add.text(0, 12, '技', {
            fontSize: '12px',
            fontFamily: Const.FONT.FAMILY_CN,
            fontStyle: 'bold',
            color: skill.unlocked ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE
          }).setOrigin(0.5));
          skillCard.setSize(iconSize, iconSize);
          skillCard.setInteractive(new Phaser.Geom.Rectangle(-iconSize / 2, -iconSize / 2, iconSize, iconSize), Phaser.Geom.Rectangle.Contains);
          skillCard.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
            setDescription(skill.unlocked
              ? skill.name
              : `${skill.name}\n未解锁`);
          });
          contentContainer.add(skillCard);

          contentContainer.add(this.scene.add.text(skillX, labelY, skill.name, {
            fontSize: '10px',
            fontFamily: Const.FONT.FAMILY_CN,
            color: skill.unlocked ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE,
            align: 'center',
            wordWrap: { width: iconSize + 6 }
          }).setOrigin(0.5, 0));
        });

        setDescription(activeSkills[0]?.unlocked
          ? activeSkills[0].name
          : `${activeSkills[0]?.name || '主动技能 1'}\n未解锁`);
      };

      const renderAbilityTab = () => {
        contentContainer.removeAll(true);
        setDescriptionVisible(true);
        const columns = 4;
        const cellGap = 6;
        const cellSize = 34;
        const totalRowWidth = cellSize * columns + cellGap * (columns - 1);

        abilityEntries.slice(0, 8).forEach((ability, index) => {
          const col = index % columns;
          const row = Math.floor(index / columns);
          const x = -totalRowWidth / 2 + cellSize / 2 + col * (cellSize + cellGap);
          const y = 12 + row * (cellSize + 6);
          const abilityCell = this.scene.add.container(x, y);
          const cellBg = this.scene.add.graphics();
          cellBg.fillStyle(ability.unlocked ? 0x121f30 : 0x111520, 0.98);
          cellBg.lineStyle(1, ability.unlocked ? accentColor : 0x4a5670, ability.unlocked ? 0.4 : 0.25);
          cellBg.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 0);
          cellBg.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 0);
          abilityCell.add(cellBg);
          abilityCell.add(this.scene.add.text(0, -3, `${index + 1}`, {
            fontSize: '10px',
            fontFamily: Const.FONT.FAMILY_EN,
            fontStyle: 'bold',
            color: ability.unlocked ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.INACTIVE
          }).setOrigin(0.5));
          abilityCell.add(this.scene.add.text(0, 11, '能', {
            fontSize: '9px',
            fontFamily: Const.FONT.FAMILY_CN,
            fontStyle: ability.unlocked ? 'bold' : 'normal',
            color: ability.unlocked ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE
          }).setOrigin(0.5));
          abilityCell.setSize(cellSize, cellSize);
          abilityCell.setInteractive(new Phaser.Geom.Rectangle(-cellSize / 2, -cellSize / 2, cellSize, cellSize), Phaser.Geom.Rectangle.Contains);
          abilityCell.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
            setDescription(ability.unlocked
              ? ability.name
              : `${ability.name}\n未配置`);
          });
          contentContainer.add(abilityCell);
        });

        setDescription(abilityEntries[0]?.unlocked
          ? abilityEntries[0].name
          : `${abilityEntries[0]?.name || '能力槽 01'}\n未配置`);
      };

      const setActiveTab = (tabKey) => {
        tabButtons.forEach(({ key, bg, label }) => {
          const active = key === tabKey;
          bg.clear();
          bg.fillStyle(active ? accentColor : 0x11192a, active ? 0.95 : 0.98);
          bg.lineStyle(1, active ? accentColor : 0x4a5670, active ? 0.9 : 0.35);
          bg.fillRoundedRect(-tabButtonWidth / 2, -12, tabButtonWidth, 24, 0);
          bg.strokeRoundedRect(-tabButtonWidth / 2, -12, tabButtonWidth, 24, 0);
          label.setColor(active ? Const.TEXT_COLORS.DARK : Const.TEXT_COLORS.PRIMARY);
        });

        if (tabKey === 'base') renderBaseTab();
        else if (tabKey === 'skills') renderSkillTab();
        else renderAbilityTab();
      };

      tabLabels.forEach((tabLabel, index) => {
        const key = ['base', 'skills', 'abilities'][index];
        const tab = this.scene.add.container(tabCenters[index], tabY);
        const tabBg = this.scene.add.graphics();
        const tabText = this.scene.add.text(0, 0, tabLabel, {
          fontSize: '11px',
          fontFamily: Const.FONT.FAMILY_CN,
          fontStyle: 'bold',
          color: Const.TEXT_COLORS.PRIMARY
        }).setOrigin(0.5);
        tab.add(tabBg);
        tab.add(tabText);
        tab.setSize(tabButtonWidth, 24);
        tab.setInteractive(new Phaser.Geom.Rectangle(-tabButtonWidth / 2, -12, tabButtonWidth, 24), Phaser.Geom.Rectangle.Contains);
        tab.on('pointerdown', (pointer) => {
          pointer.event?.stopPropagation?.();
          setActiveTab(key);
        });
        modal.add(tab);
        tabButtons.push({ key, bg: tabBg, label: tabText });
      });

      setActiveTab('base');

      const actionButtons = [];
      const actionLabel = deployed ? '卸下' : '上阵';
      const actionColor = deployed ? Const.COLORS.BUTTON_SECONDARY : Const.COLORS.BUTTON_CYAN;
      actionButtons.push(this.createModalActionButton(0, footerY, actionLabel, actionColor, () => {
        this.closeCardDetail();
        this.toggleDeploy(card, true);
      }, 92, 34));

      if (this.scene.fusionGirlManager?.canLevelUp?.(card.id)) {
        actionButtons.push(this.createModalActionButton(0, footerY, `升级 ${this.scene.fusionGirlManager.getLevelUpCost(card.id)}`, Const.COLORS.BUTTON_PRIMARY, () => {
          this.levelUpFusionGirl(card);
        }, 108, 34));
      }

      if ((card.pendingQualityUpgrades || 0) > 0) {
        actionButtons.push(this.createModalActionButton(0, footerY, '升品质', Const.COLORS.PURPLE, () => {
          this.upgradeCard(card, true);
        }, 92, 34));
      }

      const totalButtonsWidth = actionButtons.reduce((sum, btn) => sum + (btn.width || btn.displayWidth || 92), 0);
      const gap = 10;
      const totalWidth = totalButtonsWidth + gap * Math.max(0, actionButtons.length - 1);
      let cursorX = -totalWidth / 2;
      actionButtons.forEach((button) => {
        const btnWidth = button.width || button.displayWidth || 92;
        button.x = cursorX + btnWidth / 2;
        button.setDepth(Const.DEPTH.MODAL_UI);
        modal.add(button);
        cursorX += btnWidth + gap;
      });
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
      const isEquipped = this.scene.chipCardManager?.equippedCard?.id === card.id;
      let cursorY = 62;
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

      const chipAction = this.createModalActionButton(0, 176, isEquipped ? '卸下' : '装备', isEquipped ? Const.COLORS.BUTTON_SECONDARY : Const.COLORS.BUTTON_CYAN, () => {
        this.closeCardDetail();
        this.toggleDeploy(card, false);
      }, 112, 30);
      chipAction.setDepth(Const.DEPTH.MODAL_UI);
      modal.add(chipAction);
    }

    if ((isMinion && isFusionGirl && (card.pendingQualityUpgrades || 0) > 0)
      || (!isMinion && card.canUpgradeStar?.())) {
      const label = isFusionGirl ? '升品质' : '升星';
      const upgradeY = isMinion ? (modalHeight / 2 - 34) : 176;
      const upgradeBtn = this.createModalActionButton(isMinion ? 102 : -64, upgradeY, label, Const.COLORS.PURPLE, () => {
        this.upgradeCard(card, isMinion);
      }, isMinion ? 92 : 84, isMinion ? 34 : 30);
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
    this.clearDetailAbilityScroll();
    this.overlayElements.forEach((el) => {
      if (el && el.destroy) {
        el.destroy();
      }
    });
    this.overlayElements = [];
  }

  upgradeCard(card, isMinion) {
    if (isMinion && card?.isFusionGirl) {
      this.showFusionQualityPreview(card);
      return;
    }

    let result;
    if (!isMinion) {
      const starStones = window.gameData?.starStones || 0;
      const upgradeCost = card.upgradeCost || 0;
      if (starStones < upgradeCost) {
        this.scene.showToast?.('升星材料不足');
        return;
      }
      window.gameData.starStones = starStones - upgradeCost;
      result = this.scene.chipCardManager.upgradeStar(card.id, upgradeCost);
    } else {
      this.scene.showToast?.('旧随从卡升星已停用');
      return;
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

  levelUpFusionGirl(card) {
    const cost = this.scene.fusionGirlManager?.getLevelUpCost?.(card.id) || 0;
    const mycelium = window.gameData?.base?.mycelium || 0;

    if (!this.scene.fusionGirlManager?.canLevelUp?.(card.id)) {
      this.scene.showToast?.('已达到当前最高等级');
      return;
    }

    if (mycelium < cost) {
      this.scene.showToast?.('菌丝不足，无法升级');
      return;
    }

    const spendResult = this.scene.baseSystem?.spendCurrency?.('mycelium', cost);
    if (!spendResult?.success) {
      this.scene.showToast?.('菌丝不足，无法升级');
      return;
    }

    const result = this.scene.fusionGirlManager.levelUpGirl(card.id);
    if (!result.success) {
      this.scene.baseSystem?.addCurrency?.('mycelium', cost);
      this.scene.showToast?.('升级失败');
      return;
    }

    this.scene.saveGameData();
    this.closeCardDetail();
    this.scene.showToast?.(`升级成功，当前 Lv${result.newLevel}`);
    this.refresh();
  }

  showFusionQualityPreview(card) {
    const currentQuality = card.quality || 'N';
    const nextQuality = this.scene.fusionGirlManager?.getNextQuality?.(currentQuality);
    if (!nextQuality) {
      this.scene.showToast?.('已达到最高品质');
      return;
    }

    this.closeCardDetail();

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(Const.DEPTH.MODAL_OVERLAY);
    this.overlayElements.push(overlay);

    const closeZone = this.scene.add.zone(width / 2, height / 2, width, height);
    closeZone.setDepth(Const.DEPTH.MODAL_OVERLAY);
    closeZone.setInteractive();
    closeZone.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      this.closeCardDetail();
    });
    this.overlayElements.push(closeZone);

    const modal = this.scene.add.container(width / 2, height / 2);
    modal.setDepth(Const.DEPTH.MODAL_CONTENT);
    const modalWidth = Math.min(width - 24, 324);
    const modalHeight = 320;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0b0f18, 0.98);
    bg.lineStyle(2, this.getQualityColorInt(nextQuality), 0.9);
    bg.fillRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 0);
    bg.strokeRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 0);
    modal.add(bg);

    modal.add(this.scene.add.text(0, -118, '品质提升预览', {
      fontSize: '20px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    }).setOrigin(0.5));

    modal.add(this.scene.add.text(0, -78, `${card.name}  ${currentQuality} → ${nextQuality}`, {
      fontSize: '16px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: this.getQualityColorText(nextQuality)
    }).setOrigin(0.5));

    const nextPreviewSetName = this.getFusionPreviewSetName(card);
    const unlockLines = [
      `立绘预览：${nextPreviewSetName}`,
      `模组槽位：${card.moduleSlots || 0} → ${this.getFusionNextModuleSlots(card)}`,
      `技能解锁：${this.getFusionNextUnlockText(currentQuality, nextQuality)}`
    ];

    modal.add(this.scene.add.text(0, -12, unlockLines.join('\n'), {
      fontSize: '13px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5));

    const cancelBtn = this.createModalActionButton(-66, 106, '取消', Const.COLORS.BUTTON_SECONDARY, () => {
      this.closeCardDetail();
    }, 96, 32);
    const confirmBtn = this.createModalActionButton(66, 106, '确认提升', Const.COLORS.PURPLE, () => {
      const result = this.scene.fusionGirlManager.upgradeQuality(card.id);
      if (!result.success) {
        this.scene.showToast?.('当前无法提升品质');
        this.closeCardDetail();
        return;
      }
      this.scene.saveGameData();
      this.closeCardDetail();
      this.scene.showToast?.(`品质提升成功，当前 ${result.newQuality}`);
      this.refresh();
    }, 112, 32);
    modal.add(cancelBtn);
    modal.add(confirmBtn);

    this.overlayElements.push(modal);
  }

  getFusionPreviewSetName(card) {
    const completedIds = new Set(card.completedPortraitSetIds || []);
    const portraitSets = getPortraitSetsByFusionGirlId(card.id);
    const nextCompleted = portraitSets.find((set) => completedIds.has(set.id) && set.id !== card.portraitSetId);
    if (nextCompleted) {
      return this.getPortraitSetDisplayName(nextCompleted.id);
    }
    return this.getPortraitSetDisplayName(card.portraitSetId);
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
    if (card?.isFusionGirl && Array.isArray(card.abilities)) return card.abilities.length;
    if (Array.isArray(card.abilities)) return card.abilities.length;
    if (Array.isArray(card.forcedAbilities)) return card.forcedAbilities.length;
    if (Array.isArray(card.skillIds)) return card.skillIds.length;
    if (card.passiveSkill) return 1;
    return 0;
  }

  getProfessionLabel(profession) {
    const labels = {
      tank: '坦克',
      dps: '输出',
      support: '辅助',
      healer: '治疗'
    };
    return labels[profession] || '未定义';
  }

  getElementLabel(element) {
    const labels = {
      water: '水',
      fire: '火',
      wind: '风',
      light: '光',
      dark: '暗'
    };
    return labels[element] || '未知';
  }

  getFusionActiveSkillEntries(card) {
    const skillIds = [
      card?.rawData?.activeSkill1Id,
      card?.rawData?.activeSkill2Id,
      card?.rawData?.activeSkill3Id
    ];
    return skillIds.map((skillId, index) => ({
      id: skillId || `skill_${index + 1}`,
      name: this.getFusionSkillDisplayName(skillId, index),
      unlocked: this.isFusionSkillUnlocked(card.rawRecord || card, index)
    }));
  }

  getFusionSkillDisplayName(skillId, index) {
    if (!skillId) {
      return `主动技能 ${index + 1}`;
    }
    const prettyName = skillId
      .replace(/^SKILL_/, '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return prettyName || `主动技能 ${index + 1}`;
  }

  getFusionDetailAbilities(card) {
    const rawAbilities = Array.isArray(card?.rawData?.abilityIds)
      ? card.rawData.abilityIds
      : Array.isArray(card?.abilities)
        ? card.abilities
        : [];
    const entries = Array.from({ length: 8 }, (_, index) => {
      const abilityId = rawAbilities[index] || null;
      return {
        id: abilityId || `slot_${index + 1}`,
        name: abilityId
          ? this.getFusionSkillDisplayName(abilityId, index)
          : `能力槽 ${String(index + 1).padStart(2, '0')}`,
        unlocked: !!abilityId
      };
    });
    return entries;
  }

  setupDetailAbilityScroll(container, viewport) {
    this.clearDetailAbilityScroll();
    if (!viewport || viewport.maxScroll <= 0) {
      return;
    }

    const state = {
      currentY: 0,
      maxScroll: viewport.maxScroll
    };

    const baseY = container.y;
    const wheelHandler = (pointer, gameObjects, deltaX, deltaY) => {
      const withinX = pointer.x >= viewport.left && pointer.x <= viewport.left + viewport.width;
      const withinY = pointer.y >= viewport.top && pointer.y <= viewport.top + viewport.height;
      if (!withinX || !withinY) {
        return;
      }
      state.currentY = Phaser.Math.Clamp(state.currentY - deltaY * 0.35, -state.maxScroll, 0);
      container.y = baseY + state.currentY;
    };

    this.scene.input.on('wheel', wheelHandler);
    this.detailScrollCleanup = () => {
      this.scene.input.off('wheel', wheelHandler);
      this.detailScrollCleanup = null;
    };
  }

  clearDetailAbilityScroll() {
    if (typeof this.detailScrollCleanup === 'function') {
      this.detailScrollCleanup();
    }
  }

  getFusionProgressSummary(card) {
    const progress = Object.values(card.portraitProgress || {});
    if (!progress.length) {
      return ['暂无立绘碎片进度'];
    }

    return progress.map((setProgress) => {
      const fragments = Object.values(setProgress.fragmentProgress || {});
      const completed = fragments.filter((fragment) => (fragment.effectiveCount || 0) >= (fragment.requiredCount || 0)).length;
      return `${this.getPortraitSetDisplayName(setProgress.portraitSetId)}: ${completed}/${fragments.length} 碎片达标`;
    });
  }

  getFusionRowProgressSummary(card) {
    const progress = Object.values(card.portraitProgress || {});
    const completedSets = progress.filter((setProgress) => !!setProgress.completed).length;
    const totalSets = progress.length;
    const pending = card.pendingQualityUpgrades || 0;
    const bonusText = this.getFusionRowBonusSummary(card.fragmentBonuses || {});
    const pendingText = pending > 0 ? ' 可升品质' : '';
    return `套装 ${completedSets}/${totalSets}  ${bonusText}${pendingText}`;
  }

  getFusionRowBonusSummary(fragmentBonuses) {
    const allPct = Number(fragmentBonuses.all_pct || 0);
    const hp = Math.round((Number(fragmentBonuses.hp_pct || 0) + allPct) * 100);
    const atk = Math.round((Number(fragmentBonuses.atk_pct || 0) + allPct) * 100);
    const spd = Math.round((Number(fragmentBonuses.spd_pct || 0) + allPct) * 100);
    return `HP+${hp}% ATK+${atk}% SPD+${spd}%`;
  }

  createFusionFragmentPanel(card, width) {
    const container = this.scene.add.container(0, 0);
    const setProgressList = Object.values(card.portraitProgress || {}).slice(0, 2);
    const rowHeight = 92;
    const panelHeight = setProgressList.length > 0 ? 40 + setProgressList.length * rowHeight : 108;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f1522, 0.98);
    bg.lineStyle(1, this.getQualityColorInt(card.quality || 'N'), 0.32);
    bg.fillRoundedRect(-width / 2, -panelHeight / 2, width, panelHeight, 16);
    bg.strokeRoundedRect(-width / 2, -panelHeight / 2, width, panelHeight, 16);
    container.add(bg);

    container.add(this.scene.add.text(-width / 2 + 14, -panelHeight / 2 + 16, '立绘碎片进度', {
      fontSize: '12px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0, 0.5));

    if (setProgressList.length === 0) {
      container.add(this.scene.add.text(0, 10, '暂无碎片进度', {
        fontSize: '11px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5));
      return container;
    }

    setProgressList.forEach((setProgress, setIndex) => {
      const rowTop = -panelHeight / 2 + 34 + setIndex * rowHeight;
      const fragments = Object.values(setProgress.fragmentProgress || {});
      const completedCount = fragments.filter((fragment) => (fragment.effectiveCount || 0) >= (fragment.requiredCount || 0)).length;
      const setName = this.getPortraitSetDisplayName(setProgress.portraitSetId);
      const statusText = setProgress.completed ? '已完成' : `${completedCount}/${fragments.length} 达标`;

      container.add(this.scene.add.text(-width / 2 + 14, rowTop, setName, {
        fontSize: '11px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.PRIMARY
      }).setOrigin(0, 0.5));

      container.add(this.scene.add.text(width / 2 - 14, rowTop, statusText, {
        fontSize: '10px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: setProgress.completed ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.SECONDARY
      }).setOrigin(1, 0.5));

      fragments.slice(0, 4).forEach((fragment, fragmentIndex) => {
        const baseY = rowTop + 18 + fragmentIndex * 16;
        const current = fragment.ownedCount || 0;
        const effective = fragment.effectiveCount || 0;
        const required = fragment.requiredCount || 0;
        const cappedBonus = effective * Number(fragment.bonusValue || 0);

        container.add(this.scene.add.text(-width / 2 + 18, baseY, `${this.getFragmentQualityShortText(fragment)} 碎片`, {
          fontSize: '9px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: this.getQualityColorText(this.getFragmentQualityShortText(fragment))
        }).setOrigin(0, 0.5));

        container.add(this.scene.add.text(-width / 2 + 68, baseY, `${Math.min(effective, required)}/${required}`, {
          fontSize: '9px',
          fontFamily: Const.FONT.FAMILY_EN,
          color: Const.TEXT_COLORS.PRIMARY
        }).setOrigin(0, 0.5));

        const barX = -width / 2 + 110;
        const barWidth = 78;
        const ratio = required > 0 ? Phaser.Math.Clamp(effective / required, 0, 1) : 0;
        const track = this.scene.add.graphics();
        track.fillStyle(0x1a2233, 1);
        track.fillRoundedRect(barX, baseY - 4, barWidth, 8, 4);
        track.fillStyle(this.getQualityColorInt(this.getFragmentQualityShortText(fragment)), 0.95);
        track.fillRoundedRect(barX, baseY - 4, Math.max(4, barWidth * ratio), 8, 4);
        container.add(track);

        container.add(this.scene.add.text(width / 2 - 14, baseY, this.getFragmentBonusGainText(fragment, cappedBonus, current > effective), {
          fontSize: '9px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.SECONDARY
        }).setOrigin(1, 0.5));
      });
    });

    return container;
  }

  getPortraitSetDisplayName(portraitSetId) {
    const portraitSet = getPortraitSetById(portraitSetId);
    const rawName = portraitSet?.setName || '';
    if (this.looksReadableText(rawName)) {
      return rawName;
    }

    const order = Number(portraitSet?.setOrder || String(portraitSetId || '').match(/_(\d+)$/)?.[1] || 1);
    return `立绘套装 ${order}`;
  }

  looksReadableText(text) {
    if (!text) return false;
    return !/[�鍒濋]/.test(text);
  }

  getFragmentQualityShortText(fragment) {
    const fragmentId = fragment.fragmentId || '';
    if (fragmentId.includes('_UR') || fragment.requiredCount <= 2) return 'UR';
    if (fragmentId.includes('_SSR') || fragment.bonusType === 'spd_pct') return 'SSR';
    if (fragmentId.includes('_SR') || fragment.bonusType === 'atk_pct') return 'SR';
    return 'R';
  }

  getFragmentBonusShortText(fragment) {
    const bonusValue = Number(fragment.bonusValue || 0);
    switch (fragment.bonusType) {
      case 'hp_pct':
        return `HP+${Math.round(bonusValue * 100)}%`;
      case 'atk_pct':
        return `ATK+${Math.round(bonusValue * 100)}%`;
      case 'spd_pct':
        return `SPD+${Math.round(bonusValue * 100)}%`;
      case 'all_pct':
        return `ALL+${Math.round(bonusValue * 100)}%`;
      default:
        return '';
    }
  }

  getFragmentBonusGainText(fragment, cappedBonus, hasOverflow = false) {
    const roundedPct = `${Math.round(cappedBonus * 100)}%`;
    const overflowText = hasOverflow ? ' 已溢出' : '';
    switch (fragment.bonusType) {
      case 'hp_pct':
        return `生命 +${roundedPct}${overflowText}`;
      case 'atk_pct':
        return `攻击 +${roundedPct}${overflowText}`;
      case 'spd_pct':
        return `速度 +${roundedPct}${overflowText}`;
      case 'all_pct':
        return `全属性 +${roundedPct}${overflowText}`;
      default:
        return overflowText.trim();
    }
  }

  getFusionNextModuleSlots(card) {
    const data = card.rawData || getFusionGirlById(card.id);
    const nextQuality = this.scene.fusionGirlManager?.getNextQuality?.(card.quality || 'N');
    if (!data || !nextQuality) {
      return card.moduleSlots || 0;
    }
    return Number(data.moduleSlotPlan?.[nextQuality] || card.moduleSlots || 0);
  }

  getFusionNextUnlockText(currentQuality, nextQuality) {
    if (currentQuality === 'N' && nextQuality === 'R') return '解锁第二主动技能';
    if (['R', 'SR'].includes(currentQuality) && ['SSR', 'UR', 'LE'].includes(nextQuality)) return '解锁第三主动技能 / 新模组槽';
    if (nextQuality === 'UR') return '解锁宠物槽位';
    if (nextQuality === 'LE') return '解锁终阶展示内容';
    return '属性成长提升';
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



