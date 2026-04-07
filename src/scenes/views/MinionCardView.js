import { t } from '../../game/data/Lang.js';
import Const from '../../game/data/Const.js';
import MinionCard from '../../game/entities/MinionCard.js';
import CardRenderer from '../../game/utils/CardRenderer.js'; // [CardRenderer UPGRADE]

// [CardRenderer UPGRADE] 品质映射：rarity -> CardRenderer quality
const RARITY_TO_QUALITY = { common: 'N', rare: 'R', epic: 'SR', legendary: 'SSR' };

// [PORTRAIT FIX] 中文文件名 -> ASCII key 映射
const PORTRAIT_KEY_MAP = { '辐射圣女残影': 'boss_radiant_saint' };

/**
 * [PORTRAIT FIX] 从 card.portrait 路径中提取 Phaser 纹理 key
 * @param {string|null} portraitPath - 如 "characters/fusion/ComfyUI_temp_axxiq_00077_.png"
 * @returns {string|null} 纹理 key，如 "ComfyUI_temp_axxiq_00077_"
 */
function extractPortraitKey(portraitPath) {
  if (!portraitPath) return null;
  const fileName = portraitPath.split('/').pop().replace('.png', '');
  return PORTRAIT_KEY_MAP[fileName] || fileName;
}

export default class MinionCardView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  t(key, params = {}) {
    return t(key, params);
  }

  show() {
    this.initManager();
    this.render();
  }

  initManager() {
    if (!window.gameData.minionCardManager) {
      window.gameData.minionCardManager = {
        ownedCards: [],
        deployedCards: [],
        maxDeploy: 3
      };
      for (let i = 0; i < 3; i++) {
        this.scene.minionCardManager.generateRandomCard();
      }
    }
    this.cardManager = this.scene.minionCardManager;
  }

  render() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.addText(width / 2, 90, '随从卡', {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });

    this.renderDeployedSection(width);
    this.renderOwnedSection(width);

    const hint = this.scene.add.text(width / 2, height - 130, '点击卡片部署或查看详情', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0.5);
    this.elements.push(hint);
  }

  renderDeployedSection(width) {
    this.addText(width / 2, 140, '─ 已部署 ─', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    });

    const deployedCards = this.cardManager.getDeployedCards();
    const maxDeploy = this.cardManager.maxDeploy;

    if (deployedCards.length === 0) {
      this.addText(width / 2, 175, '暂无部署的随从', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      deployedCards.forEach((card, index) => {
        const cardContainer = this.createDeployedCard(width / 2, 170 + index * 85, card);
        // [CardRenderer UPGRADE] 使用 CardRenderer.animateEntry 替换原来的 alpha tween
        cardContainer.setAlpha(0);
        CardRenderer.animateEntry(this.scene, cardContainer, index * 80);
      });
    }

    this.addText(width / 2, 350, `(${deployedCards.length}/${maxDeploy})`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });
  }

  renderOwnedSection(width) {
    this.addText(width / 2, 380, '─ 我的随从 ─', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    });

    const ownedCards = this.cardManager.getAvailableCards();

    if (ownedCards.length === 0) {
      this.addText(width / 2, 420, '暂无随从卡', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      const startY = 410;
      const maxDisplay = Math.min(ownedCards.length, 4);
      for (let i = 0; i < maxDisplay; i++) {
        const card = ownedCards[i];
        const cardContainer = this.createOwnedCard(width / 2, startY + i * 80, card, i);
        // [CardRenderer UPGRADE] 使用 CardRenderer.animateEntry 替换原来的 alpha tween
        cardContainer.setAlpha(0);
        CardRenderer.animateEntry(this.scene, cardContainer, i * 80);
      }
      if (ownedCards.length > 4) {
        this.addText(width / 2, startY + 4 * 80 + 10, `还有 ${ownedCards.length - 4} 张...`, {
          fontSize: Const.FONT.SIZE_TINY,
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.INACTIVE
        });
      }
    }
  }

  createDeployedCard(x, y, card) {
    // [CardRenderer UPGRADE] 使用 CardRenderer.createMinionCard 替换原来的 Graphics+Text 扁平色块
    const quality = RARITY_TO_QUALITY[card.rarity] || 'N';
    const cardContainer = CardRenderer.createMinionCard(this.scene, {
      x, y, quality,
      name: card.name,
      star: card.star,
      hp: card.maxHp,
      atk: card.atk,
      element: card.element || 'water',
      scale: 0.55,
      interactive: true,
      onClick: () => this.showCardDetail(card),
      portraitKey: extractPortraitKey(card.portrait)  // [PORTRAIT FIX]
    });

    // [CardRenderer UPGRADE] 添加卸下按钮（覆盖在卡片右侧）
    const undeployBtn = this.scene.add.text(x + 75, y, '[-]', {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5).setInteractive().setDepth(10);
    undeployBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.cardManager.undeployCard(card.id);
      this.scene.saveGameData();
      this.refresh();
    });
    this.elements.push(undeployBtn);

    this.elements.push(cardContainer);
    return cardContainer;
  }

  createOwnedCard(x, y, card, index) {
    // [CardRenderer UPGRADE] 使用 CardRenderer.createMinionCard 替换原来的 Graphics+Text 扁平色块
    const quality = RARITY_TO_QUALITY[card.rarity] || 'N';
    const cardContainer = CardRenderer.createMinionCard(this.scene, {
      x, y, quality,
      name: card.name,
      star: card.star,
      hp: card.maxHp,
      atk: card.atk,
      element: card.element || 'water',
      scale: 0.55,
      interactive: true,
      onClick: () => this.showCardDetail(card),
      portraitKey: extractPortraitKey(card.portrait)  // [PORTRAIT FIX]
    });

    // [CardRenderer UPGRADE] 添加部署按钮（覆盖在卡片右侧）
    const deployBtn = this.scene.add.text(x + 75, y, '[+]', {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5).setInteractive().setDepth(10);
    deployBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      const result = this.cardManager.deployCard(card.id);
      if (!result.success) {
        if (result.reason === 'max_deploy_reached') {
          this.scene.showToast?.('部署位置已满！');
        }
      } else {
        this.scene.saveGameData();
        this.refresh();
      }
    });
    this.elements.push(deployBtn);

    this.elements.push(cardContainer);
    return cardContainer;
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
    overlay.on('pointerdown', () => { this.destroy(); this.show(); });
    this.elements.push(overlay);

    const modalWidth = 300;
    const modalHeight = 480;
    const modal = this.scene.add.container(width / 2, height / 2);

    // [CardRenderer UPGRADE] 弹窗入场动画
    modal.setScale(0.5);
    modal.setAlpha(0);
    this.scene.tweens.add({
      targets: modal,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 1);
    bg.fillRoundedRect(-modalWidth/2, -modalHeight/2, modalWidth, modalHeight, Const.UI.CARD_RADIUS);
    modal.add(bg);

    const qualityConfig = this.getQualityConfig(card.rarity);
    const borderGlow = this.scene.add.graphics();
    borderGlow.setBlendMode(Phaser.BlendModes.ADD);
    borderGlow.fillStyle(parseInt(qualityConfig.color.replace('#', '0x')), 0.1);
    borderGlow.fillCircle(0, -modalHeight/2 + 50, 50);
    modal.add(borderGlow);
    this.elements.push(borderGlow);

    const closeBtn = this.scene.add.text(modalWidth/2 - 20, -modalHeight/2 + 20, '✕', {
      fontSize: '20px',
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5).setInteractive().setDepth(1002);
    closeBtn.on('pointerdown', () => { this.destroy(); this.show(); });
    modal.add(closeBtn);
    this.elements.push(closeBtn);

    // [CardRenderer UPGRADE] 弹窗中使用 CardRenderer.createMinionCard 渲染大卡片
    const detailQuality = RARITY_TO_QUALITY[card.rarity] || 'N';
    const detailCard = CardRenderer.createMinionCard(this.scene, {
      x: 0, y: -modalHeight/2 + 70,
      quality: detailQuality,
      name: card.name,
      star: card.star,
      hp: card.maxHp,
      atk: card.atk,
      element: card.element || 'water',
      scale: 0.85,
      interactive: false,
      portraitKey: extractPortraitKey(card.portrait)  // [PORTRAIT FIX]
    });
    modal.add(detailCard);

    const raceConfig = card.getRaceConfig();
    const raceText = this.scene.add.text(0, -modalHeight/2 + 155, `${raceConfig.icon} ${raceConfig.name}`, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
    modal.add(raceText);

    const statsTitle = this.scene.add.text(-modalWidth/2 + 20, -modalHeight/2 + 185, '基础属性', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    modal.add(statsTitle);

    const statsLines = [
      `生命值: ${card.maxHp}`,
      `攻击力: ${card.atk}`,
      `暴击率: ${((card.critRate || 0.1) * 100).toFixed(0)}%`,
      `闪避率: ${((card.dodgeRate || 0.05) * 100).toFixed(0)}%`
    ];

    let statY = -modalHeight/2 + 210;
    statsLines.forEach(line => {
      const statText = this.scene.add.text(-modalWidth/2 + 20, statY, line, {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0, 0);
      modal.add(statText);
      statY += 20;
    });

    const skillsTitle = this.scene.add.text(-modalWidth/2 + 20, -modalHeight/2 + 295, '技能', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    modal.add(skillsTitle);

    let skillY = -modalHeight/2 + 320;

    if (card.skills && card.skills.length > 0) {
      const activeSkill = card.skills[0];
      const activeText = this.scene.add.text(-modalWidth/2 + 20, skillY, `主动: ${activeSkill.name}`, {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: '#9b59b6'
      }).setOrigin(0, 0);
      modal.add(activeText);
      skillY += 18;
    }

    if (card.passiveSkill) {
      const passiveText = this.scene.add.text(-modalWidth/2 + 20, skillY,
        `被动: ${card.passiveSkill.icon} ${card.passiveSkill.name}`, {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: '#27ae60'
      }).setOrigin(0, 0);
      modal.add(passiveText);
      skillY += 25;
    }

    const btnY = modalHeight/2 - 40;
    const isDeployed = this.cardManager.deployedCards.includes(card.id);

    const deployBtn = this.scene.add.container(0, btnY).setDepth(1002);
    const deployBg = this.scene.add.graphics();
    deployBg.fillStyle(isDeployed ? Const.COLORS.BUTTON_SECONDARY : Const.COLORS.BUTTON_PRIMARY, 1);
    deployBg.fillRoundedRect(-60, -16, 120, 32, Const.UI.BUTTON_RADIUS);
    const deployBtnText = this.scene.add.text(0, 0, isDeployed ? '卸下' : '部署', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    deployBtn.add([deployBg, deployBtnText]);
    deployBtn.setSize(120, 32);
    deployBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 120, 32), Phaser.Geom.Rectangle.Contains);
    deployBtn.on('pointerdown', () => {
      if (isDeployed) {
        this.cardManager.undeployCard(card.id);
      } else {
        const result = this.cardManager.deployCard(card.id);
        if (!result.success) {
          if (result.reason === 'max_deploy_reached') {
            this.scene.showToast?.('部署位置已满！');
          }
        }
      }
      this.scene.saveGameData();
      this.destroy();
      this.show();
    });
    modal.add(deployBtn);
    this.elements.push(deployBtn);

    if (card.star < 5) {
      const upgradeBtn = this.scene.add.container(-80, btnY).setDepth(1002);
      const upgradeBg = this.scene.add.graphics();
      upgradeBg.fillStyle(Const.COLORS.PURPLE, 1);
      upgradeBg.fillRoundedRect(-35, -14, 70, 28, Const.UI.BUTTON_RADIUS);
      const upgradeText = this.scene.add.text(0, 0, '升星', {
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

    const title = this.scene.add.text(0, -panelHeight/2 + 30, '升星', {
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
    const minionStones = window.gameData.minionStones || 0;

    const materialText = this.scene.add.text(0, -panelHeight/2 + 110, `升星石: ${materialCost}`, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
    panel.add(materialText);

    const ownedText = this.scene.add.text(0, -panelHeight/2 + 135, `(拥有: ${minionStones})`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: minionStones >= materialCost ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5);
    panel.add(ownedText);

    const mergeCandidates = this.cardManager.getMergeCandidates(card);
    const mergeAvailable = mergeCandidates.length >= 2;

    const mergeText = this.scene.add.text(0, -panelHeight/2 + 170, `合成: 3张${currentStar}★ → 1张${nextStar}★`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
    panel.add(mergeText);

    const canUpgrade = minionStones >= materialCost || mergeAvailable;

    const confirmBtn = this.scene.add.container(0, panelHeight/2 - 50).setDepth(1002);
    const confirmBg = this.scene.add.graphics();
    confirmBg.fillStyle(canUpgrade ? Const.COLORS.BUTTON_PRIMARY : Const.COLORS.BUTTON_SECONDARY, 1);
    confirmBg.fillRoundedRect(-70, -18, 140, 36, Const.UI.BUTTON_RADIUS);
    const confirmText = this.scene.add.text(0, 0, canUpgrade ? '升星' : '材料不足', {
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
        if (mergeAvailable) {
          const result = this.cardManager.mergeUpgrade(card.id, mergeCandidates[0].id, mergeCandidates[1].id);
          if (result.success) {
            this.scene.showToast?.(`升星成功！现在是${result.newStar}★`);
          }
        } else {
          const result = this.cardManager.starUpgrade(card.id);
          if (result.success) {
            this.scene.showToast?.(`升星成功！现在是${result.newStar}★`);
          }
        }
        this.scene.saveGameData();
        this.destroy();
        this.show();
      });
    }
    panel.add(confirmBtn);
    this.elements.push(confirmBtn);

    const cancelBtn = this.scene.add.container(0, panelHeight/2 - 15).setDepth(1002);
    const cancelBg = this.scene.add.graphics();
    cancelBg.fillStyle(Const.COLORS.BUTTON_SECONDARY, 0.5);
    cancelBg.fillRoundedRect(-50, -14, 100, 28, Const.UI.BUTTON_RADIUS);
    const cancelText = this.scene.add.text(0, 0, '取消', {
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

  getQualityConfig(rarity) {
    const configs = {
      common: { name: '普通', color: '#8a7a6a', textColor: '#8a7a6a' },
      rare: { name: '稀有', color: '#4dabf7', textColor: '#4dabf7' },
      epic: { name: '史诗', color: '#9775fa', textColor: '#9775fa' },
      legendary: { name: '传说', color: '#ffd700', textColor: '#ffd700' }
    };
    return configs[rarity] || configs.common;
  }

  getStarDisplay(star) {
    return '★'.repeat(star || 1);
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
