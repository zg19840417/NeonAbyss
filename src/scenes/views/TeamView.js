export default class TeamView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const { t } = this.scene;
    const { Const } = this.scene;

    this.addText(width / 2, 110, '管理你的队伍', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    const teamMembers = this.scene.baseSystem.getTeamMembers();

    if (teamMembers.length === 0) {
      this.addCard(width/2 - Const.LAYOUT.CARD_WIDTH/2, 160, Const.LAYOUT.CARD_WIDTH, 140, Const.COLORS.PURPLE);
      
      this.addText(width / 2, 210, '👥', { fontSize: Const.FONT.SIZE_ICON_MEDIUM });
      
      this.addText(width / 2, 260, '还没有队员', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.PINK
      });
      
      this.addText(width / 2, 280, '去商店招募新伙伴', {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SECONDARY
      });
    } else {
      const startY = 130;
      teamMembers.forEach((member, index) => {
        const y = startY + index * Const.LAYOUT.CARD_SPACING;
        this.createTeamMemberCard(width / 2, y, member);
      });
    }

    this.addText(width / 2, height - 130, t('team_count', { count: this.scene.baseSystem.getTeamMemberCount() }), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });
  }

  createTeamMemberCard(x, y, character) {
    const { Const } = this.scene;
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-140, -28, 280, 56, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(2, Const.COLORS.PURPLE, 0.5);
    bg.strokeRoundedRect(-140, -28, 280, 56, Const.UI.CARD_RADIUS_SMALL);
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
      fontSize: Const.FONT.SIZE_NORMAL,
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

    const removeBtn = this.scene.add.text(110, 0, '移除', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5).setInteractive();
    removeBtn.on('pointerdown', () => {
      this.scene.baseSystem.removeFromTeam(character.id);
      this.scene.saveGameData();
      this.scene.showView('team');
    });
    container.add(removeBtn);

    container.setSize(280, 56);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 280, 56), Phaser.Geom.Rectangle.Contains);

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
