import { t } from '../data/Lang.js';
import Const from '../data/Const.js';

/**
 * 顶栏 UI 组件（标题 + 货币显示）
 * 从 BaseScene 中提取
 */
export default class TopBar {
  constructor(scene) {
    this.scene = scene;
    this.titleText = null;
    this.myceliumDisplay = null;
    this.sourceCoreDisplay = null;
    this.coinDisplay = null;
  }

  create(width) {
    this.titleText = this.scene.add.text(width / 2, Const.UI.TITLE_Y, t('sanctuary'), {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    }).setOrigin(0.5).setDepth(Const.DEPTH.NAV);

    this.myceliumDisplay = this.scene.add.text(width / 2 - 100, Const.UI.COIN_Y, '🍄 菌丝: 0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#51cf66'
    }).setOrigin(0.5).setDepth(Const.DEPTH.NAV);

    this.sourceCoreDisplay = this.scene.add.text(width / 2, Const.UI.COIN_Y, '💎 源核: 0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#4dabf7'
    }).setOrigin(0.5).setDepth(Const.DEPTH.NAV);

    this.coinDisplay = this.scene.add.text(width / 2 + 100, Const.UI.COIN_Y, '⭐ 星币: 0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5).setDepth(Const.DEPTH.NAV);
  }

  setTitle(text) {
    if (this.titleText) this.titleText.setText(text);
  }

  updateCurrencies(mycelium, sourceCore, starCoin) {
    if (this.myceliumDisplay) this.myceliumDisplay.setText(`🍄 菌丝: ${mycelium.toLocaleString()}`);
    if (this.sourceCoreDisplay) this.sourceCoreDisplay.setText(`💎 源核: ${sourceCore.toLocaleString()}`);
    if (this.coinDisplay) this.coinDisplay.setText(`⭐ 星币: ${starCoin.toLocaleString()}`);
  }

  ensureOnTop() {
    this.titleText?.setDepth(Const.DEPTH.NAV);
    this.myceliumDisplay?.setDepth(Const.DEPTH.NAV);
    this.sourceCoreDisplay?.setDepth(Const.DEPTH.NAV);
    this.coinDisplay?.setDepth(Const.DEPTH.NAV);
  }

  /** 返回需要保留（不参与内容区切换）的元素列表 */
  getPreservedElements() {
    return [this.coinDisplay, this.myceliumDisplay, this.sourceCoreDisplay, this.titleText];
  }
}
