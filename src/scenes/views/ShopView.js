export default class ShopView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const { Const } = this.scene;

    this.addText(width / 2, 110, '招募伙伴或购买道具', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    const recruits = this.scene.baseSystem.availableRecruits || [];

    if (recruits.length === 0) {
      this.addCard(width/2 - Const.LAYOUT.CARD_WIDTH/2, 160, Const.LAYOUT.CARD_WIDTH, 140, Const.COLORS.PURPLE);
      
      this.addText(width / 2, 210, '✦', {
        fontSize: Const.FONT.SIZE_ICON_MEDIUM,
        color: Const.TEXT_COLORS.PURPLE
      });
      
      this.addText(width / 2, 260, '暂无可招募角色', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.PINK
      });
      
      this.addText(width / 2, 280, '请稍后再来', {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SECONDARY
      });
    } else {
      const startY = 140;
      recruits.forEach((recruit, index) => {
        const y = startY + index * Const.LAYOUT.CARD_SPACING;
        this.createRecruitCard(width / 2, y, recruit, index);
      });
    }

    this.addText(width / 2, height - 130, '点击角色可招募', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });
  }

  createRecruitCard(x, y, character, index) {
    const { Const, t } = this.scene;
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-140, -32, 280, 64, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(2, Const.COLORS.PURPLE, 0.5);
    bg.strokeRoundedRect(-140, -32, 280, 64, Const.UI.CARD_RADIUS_SMALL);
    container.add(bg);

    const qualityColors = {
      common: Const.TEXT_COLORS.PRIMARY,
      rare: Const.TEXT_COLORS.CYAN,
      epic: Const.TEXT_COLORS.PINK,
      legendary: Const.TEXT_COLORS.YELLOW,
      mythic: Const.TEXT_COLORS.MAGENTA
    };
    const qualityColor = qualityColors[character.quality] || Const.TEXT_COLORS.PRIMARY;

    const nameLabel = this.scene.add.text(-120, -8, character.name, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityColor
    }).setOrigin(0, 0.5);
    container.add(nameLabel);

    const classLabel = this.scene.add.text(-120, 12, (character.charClass?.name || '未知') + ' Lv.' + character.level, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5);
    container.add(classLabel);

    const recruitBtn = this.scene.add.container(105, 0);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(Const.COLORS.BUTTON_PRIMARY, 1);
    btnBg.fillRoundedRect(-30, -14, 60, 28, Const.UI.BUTTON_RADIUS);
    const btnText = this.scene.add.text(0, 0, t('recruit'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    recruitBtn.add([btnBg, btnText]);
    recruitBtn.setSize(60, 28);
    recruitBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 60, 28), Phaser.Geom.Rectangle.Contains);

    recruitBtn.on('pointerdown', () => {
      const result = this.scene.baseSystem.recruitCharacter(index);
      if (result.success) {
        this.scene.saveGameData();
        this.scene.showView('shop');
      }
    });

    container.add(recruitBtn);
    this.elements.push(container);
    return container;
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
    this.elements.forEach(el => el.destroy());
    this.elements = [];
  }
}
