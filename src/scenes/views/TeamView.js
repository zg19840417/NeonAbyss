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

    this.addText(width / 2, 100, '管理你的队伍', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    const teamMembers = this.scene.baseSystem.getTeamMembers();
    const teamCount = this.scene.baseSystem.getTeamMemberCount();
    const maxTeamSize = Const.GAME.MAX_TEAM_SIZE;

    this.addText(width / 2, 125, `队伍: ${teamCount}/${maxTeamSize}`, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.CYAN
    });

    if (teamMembers.length === 0) {
      this.addCard(width/2 - Const.LAYOUT.CARD_WIDTH/2, 150, Const.LAYOUT.CARD_WIDTH, 100, Const.COLORS.PURPLE);
      
      this.addText(width / 2, 190, '👥', { fontSize: Const.FONT.SIZE_ICON_MEDIUM });
      
      this.addText(width / 2, 230, '队伍为空', {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.PINK
      });
    } else {
      const startY = 155;
      teamMembers.forEach((member, index) => {
        const y = startY + index * 60;
        this.createTeamMemberCard(width / 2, y, member, true);
      });
    }

    const allCharacters = this.scene.baseSystem.characters || [];
    const nonTeamCharacters = allCharacters.filter(c => !this.scene.baseSystem.team.includes(c.id));

    this.addText(width / 2, 360, '─ 已招募角色 ─', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    if (nonTeamCharacters.length === 0) {
      this.addText(width / 2, 400, '暂无其他角色', {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.INACTIVE
      });
    } else {
      const startY = 395;
      const maxDisplay = Math.min(nonTeamCharacters.length, 4);
      for (let i = 0; i < maxDisplay; i++) {
        const y = startY + i * 55;
        this.createTeamMemberCard(width / 2, y, nonTeamCharacters[i], false);
      }
      
      if (nonTeamCharacters.length > 4) {
        this.addText(width / 2, startY + 4 * 55 + 10, `还有 ${nonTeamCharacters.length - 4} 名角色...`, {
          fontSize: Const.FONT.SIZE_TINY,
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.INACTIVE
        });
      }
    }

    this.addText(width / 2, height - 130, '点击 [+] 添加到队伍，[-] 移出队伍', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });
  }

  createTeamMemberCard(x, y, character, inTeam) {
    const { Const } = this.scene;
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-150, -24, 300, 48, Const.UI.CARD_RADIUS_SMALL);
    
    const borderColor = inTeam ? Const.COLORS.CYAN : Const.COLORS.PURPLE;
    bg.lineStyle(2, borderColor, 0.5);
    bg.strokeRoundedRect(-150, -24, 300, 48, Const.UI.CARD_RADIUS_SMALL);
    container.add(bg);

    const qualityColors = {
      common: Const.TEXT_COLORS.PRIMARY,
      rare: Const.TEXT_COLORS.CYAN,
      epic: Const.TEXT_COLORS.PINK,
      legendary: Const.TEXT_COLORS.YELLOW,
      mythic: Const.TEXT_COLORS.MAGENTA
    };
    const qualityColor = qualityColors[character.quality] || Const.TEXT_COLORS.PRIMARY;

    const nameLabel = this.scene.add.text(-130, -6, character.name, {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityColor
    }).setOrigin(0, 0.5);
    container.add(nameLabel);

    const classInfo = character.charClass?.name || '未知';
    const levelInfo = 'Lv.' + (character.level || 1);
    const classLabel = this.scene.add.text(-130, 10, `${classInfo} ${levelInfo}`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5);
    container.add(classLabel);

    const statusLabel = this.scene.add.text(60, 0, inTeam ? '队伍中' : '待命', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: inTeam ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0.5);
    container.add(statusLabel);

    const actionBtn = this.scene.add.text(120, 0, inTeam ? '[-]' : '[+]', {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_EN,
      color: inTeam ? Const.TEXT_COLORS.DANGER : Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5).setInteractive();
    
    actionBtn.on('pointerdown', () => {
      if (inTeam) {
        this.scene.baseSystem.removeFromTeam(character.id);
      } else {
        const result = this.scene.baseSystem.addToTeam(character.id);
        if (!result.success) {
          console.log('添加失败:', result.reason);
        }
      }
      this.scene.saveGameData();
      this.scene.showView('team');
    });
    container.add(actionBtn);

    container.setSize(300, 48);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 300, 48), Phaser.Geom.Rectangle.Contains);

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
