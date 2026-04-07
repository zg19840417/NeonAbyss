import { t } from '../../game/data/Lang.js';
import Const from '../../game/data/Const.js';
import AnimationHelper from '../../game/utils/AnimationHelper.js';
import CardRenderer from '../../game/utils/CardRenderer.js'; // [CardRenderer UPGRADE]

// [CardRenderer UPGRADE] 品质映射：rarity -> CardRenderer quality
const RARITY_TO_QUALITY = { common: 'N', rare: 'R', epic: 'SR', legendary: 'SSR' };

export default class TeamView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const title = this.addText(width / 2, 90, '卡组管理', {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });
    title.setDepth(100);

    this.renderDeployedSection(width);
    this.renderOwnedSection(width);

    const hint = this.addText(width / 2, height - 100, '点击卡片进入培养模式', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    });
    hint.setDepth(100);
  }

  renderDeployedSection(width) {
    this.addText(width / 2, 130, '─ 已上阵 ─', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    });

    const deployedMinions = this.scene.minionCardManager.getDeployedCards?.() || [];
    const equippedCard = this.scene.chipCardManager?.equippedCard;
    const deployedCards = [];

    if (equippedCard) {
      deployedCards.push({ ...equippedCard, cardType: 'equipment' });
    }
    deployedCards.push(...deployedMinions.map(m => ({ ...m, cardType: 'minion' })));

    this.addText(width / 2, 155, `(${deployedCards.length}/4) 随从3+装备1`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    if (deployedCards.length === 0) {
      this.addText(width / 2, 195, '暂无上阵卡牌', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      deployedCards.forEach((card, index) => {
        this.createCard(width / 2, 185 + index * 75, card, true);
      });
    }
  }

  renderOwnedSection(width) {
    this.addText(width / 2, 400, '─ 我的卡牌 ─', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    });

    const ownedMinions = this.scene.minionCardManager.getAvailableCards?.() || [];
    const allEquipments = this.scene.chipCardManager?.getAllCards?.() || [];
    const equippedId = this.scene.chipCardManager?.equippedCard?.id;
    const availableEquipments = allEquipments.filter(e => e.id !== equippedId);
    const allOwned = [
      ...ownedMinions.map(m => ({ ...m, cardType: 'minion' })),
      ...availableEquipments.map(e => ({ ...e, cardType: 'equipment' }))
    ];

    if (allOwned.length === 0) {
      this.addText(width / 2, 440, '暂无卡牌', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      const maxDisplay = Math.min(allOwned.length, 4);
      for (let i = 0; i < maxDisplay; i++) {
        this.createCard(width / 2, 425 + i * 75, allOwned[i], false);
      }
      if (allOwned.length > 4) {
        this.addText(width / 2, 425 + 4 * 75 + 5, `还有 ${allOwned.length - 4} 张...`, {
          fontSize: Const.FONT.SIZE_TINY,
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.INACTIVE
        });
      }
    }
  }

  createCard(x, y, card, isDeployed) {
    // [CardRenderer UPGRADE] 区分随从卡和装备卡，使用不同的 CardRenderer 方法
    const isMinion = card.cardType === 'minion';
    let cardContainer;

    if (isMinion) {
      const quality = RARITY_TO_QUALITY[card.rarity] || 'N';
      cardContainer = CardRenderer.createMinionCard(this.scene, {
        x, y, quality,
        name: card.name,
        star: card.star,
        hp: card.maxHp,
        atk: card.atk,
        element: card.element || 'water',
        scale: 0.55,
        interactive: false
      });
    } else {
      cardContainer = CardRenderer.createChipCard(this.scene, {
        x, y,
        quality: card.quality || 'N',
        name: card.name,
        star: card.star,
        description: this.getEquipmentStats(card),
        scale: 0.7,
        interactive: false
      });
    }

    // [CardRenderer UPGRADE] 出场动画
    CardRenderer.animateEntry(this.scene, cardContainer, 0);

    // [CardRenderer UPGRADE] 使用 CardRenderer.addInteraction 替换原来的手动交互
    CardRenderer.addInteraction(this.scene, cardContainer, (clickedCard) => {
      this.showCardDetail(card, isMinion);
    });

    // [CardRenderer UPGRADE] 部署/卸下按钮（覆盖在卡片右侧）
    const deployBtn = this.scene.add.text(x + 75, y, isDeployed ? '[-]' : '[+]', {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_EN,
      color: isDeployed ? Const.TEXT_COLORS.DANGER : Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5).setInteractive().setDepth(10);
    deployBtn.on('pointerdown', (e) => {
      e.stopPropagation();
      this.toggleDeploy(card, isMinion);
    });
    this.elements.push(deployBtn);

    this.elements.push(cardContainer);
  }

  toggleDeploy(card, isMinion) {
    if (isMinion) {
      if (this.scene.minionCardManager.deployedCards.includes(card.id)) {
        this.scene.minionCardManager.undeployCard(card.id);
      } else {
        const result = this.scene.minionCardManager.deployCard(card.id);
        if (!result.success && result.reason === 'max_deploy_reached') {
          this.scene.showToast?.('随从上阵位置已满！');
        }
      }
    } else {
      if (this.scene.chipCardManager.equippedCard?.id === card.id) {
        this.scene.chipCardManager.unequipCard();
      } else {
        this.scene.chipCardManager.equipCard(card.id);
      }
    }
    this.scene.saveGameData();
    this.refresh();
  }

  showCardDetail(card, isMinion) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    this.destroy();

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(999);
    overlay.setAlpha(0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.closeCardDetail());
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
    const qualityConfig = isMinion
      ? this.getMinionQualityConfig(card.rarity)
      : this.getEquipmentQualityConfig(card.quality);

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

    // [CardRenderer UPGRADE] 详情弹窗中使用 CardRenderer 渲染卡片
    if (isMinion) {
      const detailQuality = RARITY_TO_QUALITY[card.rarity] || 'N';
      const detailCard = CardRenderer.createMinionCard(this.scene, {
        x: 0, y: -120,
        quality: detailQuality,
        name: card.name,
        star: card.star,
        hp: card.maxHp,
        atk: card.atk,
        element: card.element || 'water',
        scale: 0.8,
        interactive: false
      });
      modal.add(detailCard);
    } else {
      const detailCard = CardRenderer.createChipCard(this.scene, {
        x: 0, y: -120,
        quality: card.quality || 'N',
        name: card.name,
        star: card.star,
        description: this.getEquipmentStats(card),
        scale: 1.0,
        interactive: false
      });
      modal.add(detailCard);
    }

    const typeLabel = this.scene.add.text(0, -35, isMinion ? '随从卡' : '装备卡', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: isMinion ? '#ff6b6b' : '#4dabf7'
    }).setOrigin(0.5);
    modal.add(typeLabel);

    // [CardRenderer UPGRADE] 名称和星级已由 CardRenderer 在卡片中渲染，此处不再重复显示
    let y = -15;

    if (isMinion) {
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
    } else {
      const equipStats = this.scene.add.text(-100, y, this.getEquipmentStats(card), {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.CYAN
      }).setOrigin(0, 0.5);
      modal.add(equipStats);
      y += 25;

      if (card.skills && card.skills.length > 0) {
        card.skills.forEach(skill => {
          const skillText = this.scene.add.text(-100, y, `技能: ${skill.name}`, {
            fontSize: Const.FONT.SIZE_TINY,
            fontFamily: Const.FONT.FAMILY_CN,
            color: '#9b59b6'
          }).setOrigin(0, 0.5);
          modal.add(skillText);
          y += 20;
        });
      }
    }

    const btnY = 150;

    if (card.star < 5) {
      const upgradeBtn = this.scene.add.container(0, btnY);
      upgradeBtn.setDepth(1002);
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(Const.COLORS.PURPLE, 1);
      btnBg.fillRoundedRect(-50, -14, 100, 28, Const.UI.BUTTON_RADIUS);
      upgradeBtn.add(btnBg);
      const upgradeText = this.scene.add.text(0, 0, '升星', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.PRIMARY
      }).setOrigin(0.5);
      upgradeBtn.add(upgradeText);
      upgradeBtn.setSize(100, 28);
      upgradeBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 28), Phaser.Geom.Rectangle.Contains);
      upgradeBtn.on('pointerdown', () => this.upgradeCard(card, isMinion));
      modal.add(upgradeBtn);
      this.elements.push(upgradeBtn);

      upgradeBtn.on('pointerover', () => AnimationHelper.tweenCardHover(this.scene, upgradeBtn, true));
      upgradeBtn.on('pointerout', () => AnimationHelper.tweenCardHover(this.scene, upgradeBtn, false));
    }

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
    const modal = this.elements.find(el => el.type === 'Container' && el.scaleX !== 1);
    const overlay = this.elements.find(el => el.type === 'Graphics' && el.depth === 999);

    if (overlay) {
      this.scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 150,
        ease: 'Power2'
      });
    }

    if (modal) {
      this.scene.tweens.add({
        targets: modal,
        scaleX: 0.5,
        scaleY: 0.5,
        alpha: 0,
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => this.refresh()
      });
    } else {
      this.refresh();
    }
  }

  upgradeCard(card, isMinion) {
    let result;
    if (isMinion) {
      result = this.scene.minionCardManager.starUpgrade(card.id);
    } else {
      result = this.scene.chipCardManager.upgradeStar(card.id);
    }

    if (result.success) {
      this.scene.showToast?.(`升星成功！现在是${result.newStar}★`);
      this.scene.saveGameData();
      this.refresh();
    } else {
      if (result.reason === 'not_enough_stones') {
        this.scene.showToast?.('升星石不足！');
      } else {
        this.scene.showToast?.('升星失败！');
      }
    }
  }

  getMinionQualityConfig(quality) {
    return this.getQualityConfig(quality);
  }

  getEquipmentQualityConfig(quality) {
    // [U05 FIX] 对齐 CHIP_QUALITY 6级品质体系，补充 UR 和 LE
    const configs = {
      N: { name: '普通', color: '#888888', textColor: '#888888', icon: '🔧' },
      R: { name: '稀有', color: '#4a90d9', textColor: '#4a90d9', icon: '⚔️' },
      SR: { name: '精良', color: '#9b59b6', textColor: '#9b59b6', icon: '🗡️' },
      SSR: { name: '史诗', color: '#f39c12', textColor: '#f39c12', icon: '🔥' },
      UR: { name: '传说', color: '#e74c3c', textColor: '#e74c3c', icon: '💎' },
      LE: { name: '神话', color: '#ff4444', textColor: '#ff4444', icon: '👑' }
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
