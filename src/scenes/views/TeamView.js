import Const from '../../game/data/Const.js';
import AnimationHelper from '../../game/utils/AnimationHelper.js';

export default class TeamView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    this._detailModal = null;
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

    const hint = this.addText(width / 2, height - 100, '点击左侧查看详情，右侧进行上阵', {
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

    this.addText(width / 2, 155, `(${deployedMinions.length}/3) 随从上阵`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    if (deployedMinions.length === 0) {
      this.addText(width / 2, 195, '暂无上阵随从', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      deployedMinions.forEach((card, index) => {
        this.createCard(width / 2, 185 + index * 75, card, true);
      });
    }
  }

  renderOwnedSection(width) {
    this.addText(width / 2, 400, '─ 我的随从 ─', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    });

    const ownedMinions = this.scene.minionCardManager.getAvailableCards?.() || [];

    if (ownedMinions.length === 0) {
      this.addText(width / 2, 440, '暂无随从，去商店购买吧！', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      const maxDisplay = Math.min(ownedMinions.length, 4);
      for (let i = 0; i < maxDisplay; i++) {
        this.createCard(width / 2, 425 + i * 75, ownedMinions[i], false);
      }
      if (ownedMinions.length > 4) {
        this.addText(width / 2, 425 + 4 * 75 + 5, `还有 ${ownedMinions.length - 4} 张...`, {
          fontSize: Const.FONT.SIZE_TINY,
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.INACTIVE
        });
      }
    }
  }

  createCard(x, y, card, isDeployed) {
    const cardWidth = 300;
    const cardHeight = 65;
    const qualityConfig = this.getMinionQualityConfig(card.rarity);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(2, parseInt(qualityConfig.color.replace('#', '0x')), 0.7);
    bg.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS_SMALL);
    this.elements.push(bg);

    const elementConfig = card.getElementConfig?.();
    const icon = this.scene.add.text(x - cardWidth/2 + 30, y, elementConfig?.icon || '🐺', { fontSize: '28px' }).setOrigin(0.5);
    this.elements.push(icon);

    const nameText = this.scene.add.text(x - cardWidth/2 + 60, y - 10, card.name, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityConfig.textColor
    }).setOrigin(0, 0.5);
    this.elements.push(nameText);

    const starText = this.scene.add.text(x - cardWidth/2 + 60, y + 10, '★'.repeat(card.star || 1), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.YELLOW
    }).setOrigin(0, 0.5);
    this.elements.push(starText);

    const statsText = `HP:${card.maxHp} ATK:${card.atk}`;
    const statsDisplay = this.scene.add.text(x - cardWidth/2 + 115, y + 10, statsText, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0, 0.5);
    this.elements.push(statsDisplay);

    const deployBtnBg = this.scene.add.graphics();
    deployBtnBg.fillStyle(Const.COLORS.BG_DARK, 0.8);
    deployBtnBg.fillRoundedRect(x + cardWidth/2 - 45, y - 15, 40, 30, 5);
    deployBtnBg.lineStyle(1, Const.COLORS.CYAN, 0.5);
    deployBtnBg.strokeRoundedRect(x + cardWidth/2 - 45, y - 15, 40, 30, 5);
    this.elements.push(deployBtnBg);

    const deployBtn = this.scene.add.text(x + cardWidth/2 - 25, y, isDeployed ? '[-]' : '[+]', {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_EN,
      color: isDeployed ? Const.TEXT_COLORS.DANGER : Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5);
    this.elements.push(deployBtn);

    const hitArea = this.scene.add.rectangle(x, y, cardWidth, cardHeight, 0x000000, 0);
    hitArea.setDepth(100);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      AnimationHelper.tweenCardHover(this.scene, hitArea, true);
    });

    hitArea.on('pointerout', () => {
      AnimationHelper.tweenCardHover(this.scene, hitArea, false);
    });

    hitArea.on('pointerdown', (pointer, localX, localY) => {
      AnimationHelper.tweenPulse(this.scene, hitArea, 0.95);
      if (localX > cardWidth/2 - 50) {
        this.toggleDeploy(card);
      } else {
        this.showCardDetail(card);
      }
    });
    this.elements.push(hitArea);
  }

  toggleDeploy(card) {
    if (this.scene.minionCardManager.deployedCards.includes(card.id)) {
      this.scene.minionCardManager.undeployCard(card.id);
    } else {
      const result = this.scene.minionCardManager.deployCard(card.id);
      if (!result.success && result.reason === 'max_deploy_reached') {
        this.scene.showToast?.('随从上阵位置已满！');
      }
    }
    this.scene.saveGameData();
    this.refresh();
  }

  showCardDetail(card) {
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
      upgradeBtn.on('pointerdown', () => this.upgradeCard(card));
      upgradeBtn.on('pointerover', () => AnimationHelper.tweenCardHover(this.scene, upgradeBtn, true));
      upgradeBtn.on('pointerout', () => AnimationHelper.tweenCardHover(this.scene, upgradeBtn, false));
      modal.add(upgradeBtn);
      this.elements.push(upgradeBtn);
    }

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
    const overlay = this.elements.find(el => el.type === 'Graphics' && el.depth === 999);
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
          this._detailModal = null;
        }
      });
      this._detailModal = null;
    }
  }

  upgradeCard(card) {
    const result = this.scene.minionCardManager.starUpgrade(card.id);

    if (result.success) {
      this.scene.showToast?.(`升星成功！现在是${result.newStar}★`);
      this.scene.saveGameData();
      this.closeCardDetail();
      this.scene.time.delayedCall(300, () => this.refresh());
    } else {
      if (result.reason === 'not_enough_stones') {
        this.scene.showToast?.('升星石不足！');
      } else {
        this.scene.showToast?.('升星失败！');
      }
    }
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
    this._detailModal = null;
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
  }
}
