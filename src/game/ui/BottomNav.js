import { t } from '../data/Lang.js';
import Const from '../data/Const.js';

/**
 * 底部导航栏 UI 组件
 * 从 BaseScene 中提取
 */
export default class BottomNav {
  constructor(scene) {
    this.scene = scene;
    this.navBg = null;
    this.tabButtons = {};
    this._onTabSwitch = null;
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {Function} onTabSwitch - 切换 Tab 时的回调 (tabKey) => void
   */
  create(width, height, onTabSwitch) {
    this._onTabSwitch = onTabSwitch;
    const navHeight = Const.UI.NAV_HEIGHT;
    const navY = height - navHeight;

    this.navBg = this.scene.add.graphics();
    this.navBg.fillStyle(Const.COLORS.BG_LIGHT, 0.98);
    this.navBg.fillRect(0, navY, width, navHeight);
    this.navBg.lineStyle(1, Const.COLORS.BUTTON_SECONDARY, 0.5);
    this.navBg.lineBetween(0, navY, width, navY);
    this.navBg.setDepth(Const.DEPTH.NAV);

    const tabs = [
      { key: 'sanctuary', icon: '所', label: t('sanctuary') },
      { key: 'team', icon: '队', label: t('team') },
      { key: 'wild', icon: '冒', label: t('adventure') },
      { key: 'shop', icon: '店', label: t('shop') },
      { key: 'task', icon: '务', label: t('task') },
      { key: 'settings', icon: '设', label: t('settings') }
    ];

    const tabWidth = width / tabs.length;

    tabs.forEach((tab, index) => {
      const x = tabWidth * index + tabWidth / 2;
      const isActive = index === 0;
      const tabContainer = this.scene.add.container(x, navY + navHeight / 2);

      const tabBg = this.scene.add.graphics();
      if (isActive) {
        tabBg.fillStyle(Const.COLORS.PURPLE, 0.3);
        tabBg.fillRoundedRect(-tabWidth / 2 + 4, -navHeight / 2 + 6, tabWidth - 8, navHeight - 10, 8);
      }
      tabContainer.add(tabBg);

      const iconText = this.scene.add.text(0, -8, `[${tab.icon}]`, {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_EN,
        color: isActive ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5);
      tabContainer.add(iconText);

      const labelText = this.scene.add.text(0, 14, tab.label, {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: isActive ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5);
      tabContainer.add(labelText);

      tabContainer.setSize(tabWidth, navHeight);
      const hitZone = this.scene.add.rectangle(x, navY + navHeight / 2, tabWidth, navHeight, 0x000000, 0.001);
      hitZone.setVisible(true);
      hitZone.setAlpha(0.001);
      hitZone.setDepth(Const.DEPTH.NAV + 2);
      hitZone.setInteractive();
      hitZone.on('pointerdown', () => {
        this.switchTab(tab.key);
      });

      this.tabButtons[tab.key] = {
        container: tabContainer,
        bg: tabBg,
        icon: iconText,
        label: labelText,
        hitZone,
        isActive
      };
    });

    this.ensureOnTop();
  }

  switchTab(key) {
    const oldTab = this.tabButtons[this.currentTab];
    if (oldTab) {
      oldTab.bg.clear();
      oldTab.icon.setColor('#6666aa');
      oldTab.label.setColor('#6666aa');
      oldTab.isActive = false;
    }

    const newTab = this.tabButtons[key];
    if (newTab) {
      newTab.bg.clear();
      newTab.bg.fillStyle(Const.COLORS.PURPLE, 0.3);
      const tabWidth = newTab.container.width;
      const navHeight = newTab.container.height;
      newTab.bg.fillRoundedRect(-tabWidth / 2 + 4, -navHeight / 2 + 6, tabWidth - 8, navHeight - 10, 8);
      newTab.icon.setColor(Const.TEXT_COLORS.PRIMARY);
      newTab.label.setColor(Const.TEXT_COLORS.PRIMARY);
      newTab.isActive = true;
    }

    this.currentTab = key;
    if (this._onTabSwitch) this._onTabSwitch(key);
  }

  ensureOnTop() {
    this.navBg?.setDepth(Const.DEPTH.NAV);
    Object.values(this.tabButtons).forEach(tab => {
      tab.container?.setDepth(Const.DEPTH.NAV + 1);
      tab.hitZone?.setDepth(Const.DEPTH.NAV + 2);
    });
  }

  /** 返回需要保留的元素列表 */
  getPreservedElements() {
    const elements = [];
    Object.values(this.tabButtons).forEach(tab => {
      if (tab.container) elements.push(tab.container);
      if (tab.hitZone) elements.push(tab.hitZone);
    });
    return elements;
  }
}
