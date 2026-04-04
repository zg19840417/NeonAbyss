export default class DungeonView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const { t } = this.scene;
    const { Const } = this.scene;

    this.addText(width / 2, 110, '禁区入口', {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });

    this.addCard(width/2 - 120, 150, 240, 200, Const.COLORS.MAGENTA);

    const floor = window.gameData?.dungeon?.currentFloor || 1;
    this.addText(width / 2, 200, t('current_floor', { floor }), {
      fontSize: Const.FONT.SIZE_ICON_SMALL,
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });

    this.addText(width / 2, 250, t('auto_battle'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    const teamCount = this.scene.baseSystem.getTeamMemberCount();
    if (teamCount === 0) {
      this.addText(width / 2, 300, t('team_empty'), {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.DANGER
      });

      this.scene.createActionButton(width / 2, 340, t('go_to_shop'), () => {
        this.scene.switchTab('shop');
      });
    } else {
      this.scene.createActionButton(width / 2, 340, t('start_explore'), () => {
        this.scene.tryEnterDungeon();
      });
    }

    this.addText(width / 2, height - 130, t('team_count', { count: teamCount }), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });
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
