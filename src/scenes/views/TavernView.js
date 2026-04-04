export default class TavernView {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
  }

  show() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const { t } = this.scene;
    const { Const } = this.scene;

    this.addText(width / 2, 110, t('tavern_welcome'), {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    });

    this.addCard(width/2 - Const.LAYOUT.CARD_WIDTH/2, 140, Const.LAYOUT.CARD_WIDTH, Const.LAYOUT.CARD_HEIGHT, Const.COLORS.PURPLE);
    
    this.addText(width / 2, 190, '🍺', { fontSize: Const.FONT.SIZE_ICON_LARGE });
    
    this.addText(width / 2, 250, t('bartender'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    });
    
    this.addText(width / 2, 280, t('ready_tip'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    });

    this.scene.createActionButton(width / 2, 360, t('enter_dungeon'), () => {
      this.scene.tryEnterDungeon();
    });

    this.addText(width / 2, height - 130, t('tavern_hint'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
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
