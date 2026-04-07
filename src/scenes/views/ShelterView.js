export default class ShelterView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const { t } = this.scene;
    const { Const } = this.scene;

    this.addText(width / 2, 90, t('sanctuary_welcome'), {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });

    this.addText(width / 2, 120, '🍺', { fontSize: Const.FONT.SIZE_ICON_LARGE });

    this.renderRecruitSection(width);

    this.addText(width / 2, height - 130, t('sanctuary_hint'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    });
  }

  renderRecruitSection(width) {
    this.scene.baseSystem.refreshRecruits();
    const recruits = this.scene.baseSystem.availableRecruits || [];
    const slots = this.scene.baseSystem.getRecruitmentSlots();

    this.addText(width / 2, 170, '─ 可招募角色 ─', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    });

    this.addText(width / 2, 192, `(${recruits.length}/${slots} 槽位)`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    if (recruits.length === 0) {
      this.addText(width / 2, 250, '暂无可招募角色', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      const startY = 220;
      recruits.forEach((char, index) => {
        const y = startY + index * 85;
        this.createRecruitCard(width / 2, y, char, index);
      });
    }

    this.renderRefreshButton(width);
  }

  createRecruitCard(x, y, character, index) {
    const cardWidth = 300;
    const cardHeight = 75;
    const container = this.scene.add.container(x, y);

    const qualityColors = {
      common: Const.TEXT_COLORS.SECONDARY,
      rare: Const.TEXT_COLORS.CYAN,
      epic: Const.TEXT_COLORS.PINK,
      legendary: Const.TEXT_COLORS.YELLOW,
      mythic: '#ff00ff'
    };

    const qualityColor = qualityColors[character.quality] || Const.TEXT_COLORS.SECONDARY;

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS);
    bg.lineStyle(2, parseInt(qualityColor.replace('#', '0x')), 0.8);
    bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, Const.UI.CARD_RADIUS);
    container.add(bg);

    const className = character.charClass?.name || '未知职业';
    const charName = character.name || '未命名';

    const nameText = this.scene.add.text(-cardWidth/2 + 20, -15, `${charName}`, {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityColor
    }).setOrigin(0, 0.5);
    container.add(nameText);

    const qualityBadge = this.scene.add.text(-cardWidth/2 + 130, -15, `[${character.quality}]`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: qualityColor
    }).setOrigin(0, 0.5);
    container.add(qualityBadge);

    const classText = this.scene.add.text(-cardWidth/2 + 20, 12, `职业: ${className}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5);
    container.add(classText);

    const statsText = this.scene.add.text(-cardWidth/2 + 20, 28, `生命: ${character.maxHp} 攻击: ${character.atk}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0, 0.5);
    container.add(statsText);

    const recruitBtn = this.scene.add.container(cardWidth/2 - 50, 0);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(Const.COLORS.BUTTON_PRIMARY, 1);
    btnBg.fillRoundedRect(-25, -14, 50, 28, 8);
    recruitBtn.add(btnBg);

    const btnText = this.scene.add.text(0, 0, '招募', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    recruitBtn.add(btnText);

    recruitBtn.setSize(50, 28);
    recruitBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 50, 28), Phaser.Geom.Rectangle.Contains);
    recruitBtn.on('pointerdown', () => this.recruitCharacter(index));
    recruitBtn.on('pointerover', () => btnBg.clear().fillStyle(Const.COLORS.BUTTON_HOVER, 1).fillRoundedRect(-25, -14, 50, 28, 8));
    recruitBtn.on('pointerout', () => btnBg.clear().fillStyle(Const.COLORS.BUTTON_PRIMARY, 1).fillRoundedRect(-25, -14, 50, 28, 8));
    container.add(recruitBtn);

    const costText = this.scene.add.text(cardWidth/2 - 115, 0, '200💰', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.YELLOW
    }).setOrigin(0.5);
    container.add(costText);

    container.setSize(cardWidth, cardHeight);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', () => this.showCharacterDetail(character));

    this.elements.push(container);
    return container;
  }

  renderRefreshButton(width) {
    const y = 520;
    const container = this.scene.add.container(width / 2, y);

    const recruits = this.scene.baseSystem.availableRecruits || [];
    if (recruits.length === 0) {
      const text = this.scene.add.text(0, 0, '暂无角色，请刷新', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5);
      container.add(text);
      this.elements.push(container);
      return;
    }

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BUTTON_SECONDARY, 0.8);
    bg.fillRoundedRect(-60, -16, 120, 32, Const.UI.BUTTON_RADIUS);
    container.add(bg);

    const text = this.scene.add.text(0, 0, '🔄 刷新角色', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5);
    container.add(text);

    container.setSize(120, 32);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 120, 32), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', () => {
      this.scene.saveGameData();
      this.destroy();
      this.show();
    });
    container.on('pointerover', () => bg.clear().fillStyle(Const.COLORS.BUTTON_HOVER, 0.8).fillRoundedRect(-60, -16, 120, 32, Const.UI.BUTTON_RADIUS));
    container.on('pointerout', () => bg.clear().fillStyle(Const.COLORS.BUTTON_SECONDARY, 0.8).fillRoundedRect(-60, -16, 120, 32, Const.UI.BUTTON_RADIUS));

    this.elements.push(container);
  }

  recruitCharacter(index) {
    const result = this.scene.baseSystem.recruitCharacter(index);

    if (!result.success) {
      if (result.reason === 'not_enough_currency') {
        this.scene.showToast?.('金币不足！需要 200 金币');
      } else if (result.reason === 'character_full') {
        this.scene.showToast?.('角色已达上限！');
      } else {
        this.scene.showToast?.('招募失败');
      }
      return;
    }

    this.scene.showToast?.(`成功招募 ${result.character.name}！`);
    this.scene.saveGameData();
    this.destroy();
    this.show();
  }

  showCharacterDetail(character) {
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

    const modalWidth = 280;
    const modalHeight = 380;
    const modal = this.scene.add.container(width / 2, height / 2);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 1);
    bg.fillRoundedRect(-modalWidth/2, -modalHeight/2, modalWidth, modalHeight, Const.UI.CARD_RADIUS);
    modal.add(bg);

    const qualityColors = {
      common: Const.TEXT_COLORS.SECONDARY,
      rare: Const.TEXT_COLORS.CYAN,
      epic: Const.TEXT_COLORS.PINK,
      legendary: Const.TEXT_COLORS.YELLOW,
      mythic: '#ff00ff'
    };
    const qualityColor = qualityColors[character.quality] || Const.TEXT_COLORS.SECONDARY;

    const borderGlow = this.scene.add.graphics();
    borderGlow.setBlendMode(Phaser.BlendModes.ADD);
    borderGlow.fillStyle(parseInt(qualityColor.replace('#', '0x')), 0.1);
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

    const nameText = this.scene.add.text(0, -modalHeight/2 + 50, character.name, {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityColor
    }).setOrigin(0.5);
    modal.add(nameText);

    const qualityText = this.scene.add.text(0, -modalHeight/2 + 80, `[${character.quality.toUpperCase()}]`, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: qualityColor
    }).setOrigin(0.5);
    modal.add(qualityText);

    const className = character.charClass?.name || '未知职业';
    const classText = this.scene.add.text(-modalWidth/2 + 20, -modalHeight/2 + 110, `职业: ${className}`, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    modal.add(classText);

    const statsTitle = this.scene.add.text(-modalWidth/2 + 20, -modalHeight/2 + 145, '基础属性', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5);
    modal.add(statsTitle);

    const statsLines = [
      `生命值: ${character.maxHp}`,
      `攻击力: ${character.atk}`,
      `暴击率: ${((character.critRate || 0.1) * 100).toFixed(0)}%`,
      `闪避率: ${((character.dodgeRate || 0.05) * 100).toFixed(0)}%`,
      `等级: ${character.level || 1}`
    ];

    let statY = -modalHeight/2 + 170;
    statsLines.forEach(line => {
      const statText = this.scene.add.text(-modalWidth/2 + 20, statY, line, {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0, 0);
      modal.add(statText);
      statY += 22;
    });

    const recruitBtn = this.scene.add.container(0, modalHeight/2 - 40).setDepth(1002);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(Const.COLORS.BUTTON_PRIMARY, 1);
    btnBg.fillRoundedRect(-70, -18, 140, 36, Const.UI.BUTTON_RADIUS);
    recruitBtn.add(btnBg);

    const btnText = this.scene.add.text(0, 0, '招募 (200💰)', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    recruitBtn.add(btnText);

    recruitBtn.setSize(140, 36);
    recruitBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 140, 36), Phaser.Geom.Rectangle.Contains);
    recruitBtn.on('pointerdown', () => {
      const index = this.scene.baseSystem.availableRecruits.indexOf(character);
      if (index >= 0) {
        this.destroy();
        this.show();
        setTimeout(() => this.recruitCharacter(index), 100);
      }
    });
    modal.add(recruitBtn);
    this.elements.push(recruitBtn);

    modal.setDepth(1000);
    this.elements.push(modal);
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  }

  addText(x, y, text, options = {}) {
    const textObj = this.scene.add.text(x, y, text, options).setOrigin(0.5);
    this.elements.push(textObj);
    return textObj;
  }

  addCard(x, y, width, height, borderColor) {
    const card = this.scene.add.graphics();
    card.fillStyle(Const.COLORS.BG_MID, 0.9);
    card.fillRoundedRect(x, y, width, height, Const.UI.CARD_RADIUS);
    card.lineStyle(2, borderColor, 0.5);
    card.strokeRoundedRect(x, y, width, height, Const.UI.CARD_RADIUS);
    this.elements.push(card);
    return card;
  }

  destroy() {
    this.elements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.elements = [];
  }
}
