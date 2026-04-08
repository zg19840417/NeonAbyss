import BaseSystem from '../game/systems/BaseSystem.js';
import Lang, { t, getLanguage, setLanguage } from '../game/data/Lang.js';
import Const from '../game/data/Const.js';
import ChipView from './views/ChipView.js';
import ShopView from './views/ShopView.js';
import TeamView from './views/TeamView.js';
import WildStageView from './views/WildStageView.js';
import ChipCardManager from '../game/systems/ChipCardManager.js';
import ReputationSystem from '../game/systems/ReputationSystem.js';
import FusionGirlManager from '../game/systems/FusionGirlManager.js';
import { syncFusionGirlProgress } from '../game/systems/FusionGirlProgressSync.js';
import StageManager from '../game/systems/StageManager.js';
import { ensureGlobalGameData, resetGameData, syncRuntimeGameData } from '../game/data/GameData.js';

export default class BaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BaseScene' });
    this.baseSystem = null;
    this.chipView = null;
    this.shopView = null;
    this.teamView = null;
    this.wildStageView = null;
    this.currentTab = 'sanctuary';
    this.tabButtons = {};
    this.modalOpen = false;
    this._transitioning = false;
    this._persistGameData = null;
    this._persistOnVisibilityChange = null;
  }

  createCenteredHitArea(width, height) {
    return new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
  }

  init(data = {}) {
    this.initialTab = data.initialTab || 'sanctuary';
  }

  ensureChromeOnTop() {
    this.titleText?.setDepth(Const.DEPTH.NAV);
    this.myceliumDisplay?.setDepth(Const.DEPTH.NAV);
    this.sourceCoreDisplay?.setDepth(Const.DEPTH.NAV);
    this.coinDisplay?.setDepth(Const.DEPTH.NAV);
    this.navBg?.setDepth(Const.DEPTH.NAV);

    Object.values(this.tabButtons).forEach(tab => {
      tab.container?.setDepth(Const.DEPTH.NAV + 1);
      tab.hitZone?.setDepth(Const.DEPTH.NAV + 2);
    });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 初始化 DOM UI 管理器
    if (!window.domUI) {
      import('./../game/ui/DOMUIManager.js').then(module => {
        window.domUI = new module.default(this.game);
      });
    }

    this.t = t;
    this.getLanguage = getLanguage;
    this.setLanguage = setLanguage;

    this.initializeBaseSystem();
    this.setupPersistenceGuards();
    this.createBackground(width, height);
    this.createHeader(width);
    this.createBottomNav(width, height);
    this.showView(this.initialTab || 'sanctuary');

    this.time.addEvent({
      delay: Const.GAME.SAVE_DELAY,
      callback: () => this.updateUI(),
      loop: true
    });
  }

  initializeBaseSystem() {
    ensureGlobalGameData();
    this.baseSystem = new BaseSystem(window.gameData.base);

    this.chipCardManager = new ChipCardManager(window.gameData.chipCardManager);
    this.stageManager = new StageManager();
    this.reputationSystem = new ReputationSystem(window.gameData.reputation);
    this.fusionGirlManager = FusionGirlManager.fromJSON(window.gameData.fusionGirlManager);
    this.fusionGirlManager = syncFusionGirlProgress(window.gameData);
  }

  createBackground(width, height) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(Const.COLORS.BG_DARK, Const.COLORS.BG_DARK, Const.COLORS.BG_LIGHT, Const.COLORS.BG_LIGHT, 1);
    bg.fillRect(0, 0, width, height);

    this.bgElements = [];
  }

  createAtmosphereBg(viewKey) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.bgElements.forEach(el => el.destroy());
    this.bgElements = [];

    const centerGlow = this.add.graphics();
    centerGlow.setBlendMode(Phaser.BlendModes.ADD);

    const glowColors = {
      sanctuary: { color: Const.COLORS.PURPLE, alpha: 0.06 },
      tavern: { color: Const.COLORS.PURPLE, alpha: 0.08 },
      team: { color: Const.COLORS.CYAN, alpha: 0.06 },
      equipment: { color: Const.COLORS.YELLOW, alpha: 0.08 },
      dungeon: { color: Const.COLORS.MAGENTA, alpha: 0.08 },
      shop: { color: Const.COLORS.PINK, alpha: 0.06 },
      settings: { color: Const.COLORS.CYAN, alpha: 0.05 }
    };

    const glow = glowColors[viewKey] || glowColors.sanctuary;

    for (let i = 0; i < 3; i++) {
      centerGlow.fillStyle(glow.color, glow.alpha / (i + 1));
      centerGlow.fillCircle(width / 2, height / 2 - 50, 150 + i * 80);
    }
    this.bgElements.push(centerGlow);

    const grid = this.add.graphics();
    grid.setAlpha(Const.ALPHA.GRID);
    grid.lineStyle(1, Const.COLORS.CYAN, 0.3);
    for (let x = 0; x < width; x += Const.LAYOUT.GRID_SPACING) {
      grid.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += Const.LAYOUT.GRID_SPACING) {
      grid.lineBetween(0, y, width, y);
    }
    this.bgElements.push(grid);

    const decor = this.add.graphics();
    decor.setAlpha(Const.ALPHA.DECOR);

    decor.lineStyle(2, Const.COLORS.PURPLE, 0.5);
    decor.lineBetween(Const.LAYOUT.MARGIN_SMALL, Const.LAYOUT.MARGIN_LARGE, Const.LAYOUT.MARGIN_MEDIUM, Const.LAYOUT.MARGIN_LARGE);
    decor.lineBetween(Const.LAYOUT.MARGIN_SMALL, Const.LAYOUT.MARGIN_LARGE, Const.LAYOUT.MARGIN_SMALL, 110);

    decor.lineStyle(2, Const.COLORS.MAGENTA, 0.5);
    decor.lineBetween(width - Const.LAYOUT.MARGIN_SMALL, Const.LAYOUT.MARGIN_LARGE, width - Const.LAYOUT.MARGIN_MEDIUM, Const.LAYOUT.MARGIN_LARGE);
    decor.lineBetween(width - Const.LAYOUT.MARGIN_SMALL, Const.LAYOUT.MARGIN_LARGE, width - Const.LAYOUT.MARGIN_SMALL, 110);

    decor.lineStyle(2, Const.COLORS.CYAN, 0.3);
    decor.lineBetween(Const.LAYOUT.MARGIN_SMALL, height - 130, Const.LAYOUT.MARGIN_MEDIUM, height - 130);
    decor.lineBetween(Const.LAYOUT.MARGIN_SMALL, height - 130, Const.LAYOUT.MARGIN_SMALL, height - 100);

    decor.lineStyle(2, Const.COLORS.PINK, 0.3);
    decor.lineBetween(width - Const.LAYOUT.MARGIN_SMALL, height - 130, width - Const.LAYOUT.MARGIN_MEDIUM, height - 130);
    decor.lineBetween(width - Const.LAYOUT.MARGIN_SMALL, height - 130, width - Const.LAYOUT.MARGIN_SMALL, height - 100);

    this.bgElements.push(decor);

    const particles = this.add.graphics();
    const pColors = [Const.COLORS.CYAN, Const.COLORS.MAGENTA, Const.COLORS.PINK, Const.COLORS.PURPLE, Const.COLORS.YELLOW];
    for (let i = 0; i < Const.LAYOUT.PARTICLE_COUNT; i++) {
      const color = pColors[Math.floor(Math.random() * pColors.length)];
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(100, height - 150);
      const size = Phaser.Math.Between(Const.LAYOUT.PARTICLE_SIZE_MIN, Const.LAYOUT.PARTICLE_SIZE_MAX);
      particles.fillStyle(color, Phaser.Math.FloatBetween(Const.ALPHA.PARTICLE_MIN, Const.ALPHA.PARTICLE_MAX));
      particles.fillCircle(x, y, size);
    }
    this.bgElements.push(particles);
  }

  createHeader(width) {
    this.titleText = this.add.text(width / 2, Const.UI.TITLE_Y, t('sanctuary'), {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    }).setOrigin(0.5).setDepth(Const.DEPTH.NAV);

    this.myceliumDisplay = this.add.text(width / 2 - 100, Const.UI.COIN_Y, '🍄 菌丝: 0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#51cf66'
    }).setOrigin(0.5).setDepth(Const.DEPTH.NAV);

    this.sourceCoreDisplay = this.add.text(width / 2, Const.UI.COIN_Y, '💎 源核: 0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#4dabf7'
    }).setOrigin(0.5).setDepth(Const.DEPTH.NAV);

    this.coinDisplay = this.add.text(width / 2 + 100, Const.UI.COIN_Y, '⭐ 星币: 0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5).setDepth(Const.DEPTH.NAV);
  }

  setupPersistenceGuards() {
    if (!this._persistGameData) {
      this._persistGameData = () => {
        try {
          this.saveGameData();
        } catch (error) {
          console.warn('Failed to persist save data before page exit:', error);
        }
      };
    }

    if (!this._persistOnVisibilityChange) {
      this._persistOnVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          this._persistGameData();
        }
      };
    }

    window.addEventListener('beforeunload', this._persistGameData);
    window.addEventListener('pagehide', this._persistGameData);
    document.addEventListener('visibilitychange', this._persistOnVisibilityChange);
  }

  createBottomNav(width, height) {
    const navHeight = Const.UI.NAV_HEIGHT;
    const navY = height - navHeight;

    const navBg = this.add.graphics();
    navBg.fillStyle(Const.COLORS.BG_LIGHT, 0.98);
    navBg.fillRect(0, navY, width, navHeight);
    navBg.lineStyle(1, Const.COLORS.BUTTON_SECONDARY, 0.5);
    navBg.lineBetween(0, navY, width, navY);
    navBg.setDepth(Const.DEPTH.NAV);
    this.navBg = navBg;

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

      const tabContainer = this.add.container(x, navY + navHeight / 2);

      const tabBg = this.add.graphics();
      if (isActive) {
        tabBg.fillStyle(Const.COLORS.PURPLE, 0.3);
        tabBg.fillRoundedRect(-tabWidth / 2 + 4, -navHeight / 2 + 6, tabWidth - 8, navHeight - 10, 8);
      }
      tabContainer.add(tabBg);

      const iconText = this.add.text(0, -8, `[${tab.icon}]`, {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_EN,
        color: isActive ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5);
      tabContainer.add(iconText);

      const labelText = this.add.text(0, 14, tab.label, {
        fontSize: Const.FONT.SIZE_TINY,
        fontFamily: Const.FONT.FAMILY_CN,
        color: isActive ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE
      }).setOrigin(0.5);
      tabContainer.add(labelText);

      tabContainer.setSize(tabWidth, navHeight);
      const hitZone = this.add.rectangle(x, navY + navHeight / 2, tabWidth, navHeight, 0x000000, 0.001);
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

    this.ensureChromeOnTop();
  }

  switchTab(key) {
    if (this.currentTab === key) return;

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
    this.showView(key);
  }

  showView(key) {
    // 正在做淡出切换时，忽略重复切页请求。
    if (this._transitioning) return;

    // 顶栏与底部导航常驻，不参与内容区切换。
    const preserved = [this.coinDisplay, this.myceliumDisplay, this.sourceCoreDisplay, this.titleText];
    Object.values(this.tabButtons).forEach(tab => {
      if (tab.container) preserved.push(tab.container);
      if (tab.hitZone) preserved.push(tab.hitZone);
    });

    // 其余元素视为内容区，先淡出再重建。
    const contentElements = this.children.list.filter(child => {
      return !preserved.includes(child);
    });

    // 有内容时先淡出，完成后再次进入 showView 真正重建。
    if (contentElements.length > 0) {
      this._transitioning = true;
      this.tweens.add({
        targets: contentElements,
        alpha: 0,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          this.clearContent();
          this._transitioning = false;
          this.showView(key);
        }
      });
      return;
    }

    this.clearContent();
    this.createAtmosphereBg(key);

    const titles = {
      sanctuary: t('sanctuary'),
      team: t('team'),
      wild: t('adventure'),
      dungeon: t('dungeon'),
      shop: t('shop'),
      settings: t('settings')
    };

    if (this.titleText) {
      this.titleText.setText(titles[key] || t('sanctuary'));
    }

    switch (key) {
      case 'sanctuary':
        this.showTavernContent();
        break;
      case 'team':
        this.showTeamContent();
        break;
      case 'wild':
        this.showWildContent();
        break;
      case 'shop':
        this.showShopContent();
        break;
      case 'settings':
        this.showSettingsContent();
        break;
    }

    this.ensureChromeOnTop();
  }

  showTavernContent() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const banner = this.add.text(width / 2, 110, t('sanctuary_welcome'), {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    }).setOrigin(0.5);

    const card = this.add.graphics();
    card.fillStyle(Const.COLORS.BG_MID, 0.9);
    card.fillRoundedRect(width/2 - Const.LAYOUT.CARD_WIDTH/2, 140, Const.LAYOUT.CARD_WIDTH, Const.LAYOUT.CARD_HEIGHT, Const.UI.CARD_RADIUS);
    card.lineStyle(2, Const.COLORS.PURPLE, 0.5);
    card.strokeRoundedRect(width/2 - Const.LAYOUT.CARD_WIDTH/2, 140, Const.LAYOUT.CARD_WIDTH, Const.LAYOUT.CARD_HEIGHT, Const.UI.CARD_RADIUS);

    const bartenderIcon = this.add.text(width / 2, 190, '🍺', {
      fontSize: Const.FONT.SIZE_ICON_LARGE
    }).setOrigin(0.5);

    const bartenderName = this.add.text(width / 2, 250, t('admin_ada'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5);

    const tipText = this.add.text(width / 2, 280, t('ready_tip'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);

    const startBtn = this.createActionButton(width / 2, 360, t('enter_dungeon'), () => {
      this.tryEnterDungeon();
    });

    const hint = this.add.text(width / 2, height - 130, t('sanctuary_hint'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.INACTIVE
    }).setOrigin(0.5);
  }

  showTeamContent() {
    if (this.teamView) {
      this.teamView.destroy();
    }
    this.teamView = new TeamView(this);
    this.teamView.show();
  }

  showWildContent() {
    if (this.wildStageView) {
      this.wildStageView.destroy();
    }
    this.wildStageView = new WildStageView(this, this.cameras.main.width, this.cameras.main.height, {
      contentTop: 100,
      contentBottom: this.cameras.main.height - Const.UI.NAV_HEIGHT - 8
    });
  }

  showShopContent() {
    if (this.shopView) {
      this.shopView.destroy();
    }
    this.shopView = new ShopView(this);
    this.shopView.show();
  }

  showSettingsContent() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.text(width / 2, 138, '账号', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5);

    const bindCard = this.add.container(width / 2, 210);
    const bindBg = this.add.graphics();
    bindBg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bindBg.fillRoundedRect(-140, -38, 280, 76, Const.UI.CARD_RADIUS);
    bindBg.lineStyle(1.5, Const.COLORS.BUTTON_CYAN, 0.65);
    bindBg.strokeRoundedRect(-140, -38, 280, 76, Const.UI.CARD_RADIUS);
    bindCard.add(bindBg);

    bindCard.add(this.add.text(-116, -10, '绑定账号', {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5));

    bindCard.add(this.add.text(-116, 16, '功能预留，后续接入账号 SDK', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5));

    const bindBtn = this.add.container(92, 0);
    const bindBtnBg = this.add.graphics();
    bindBtnBg.fillStyle(Const.COLORS.BUTTON_SECONDARY, 1);
    bindBtnBg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.9);
    bindBtnBg.fillRoundedRect(-42, -16, 84, 32, Const.UI.BUTTON_RADIUS);
    bindBtnBg.strokeRoundedRect(-42, -16, 84, 32, Const.UI.BUTTON_RADIUS);
    bindBtn.add(bindBtnBg);
    bindBtn.add(this.add.text(0, 0, '敬请期待', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5));
    bindBtn.setSize(84, 32);
    bindBtn.setInteractive(this.createCenteredHitArea(84, 32), Phaser.Geom.Rectangle.Contains);
    bindBtn.on('pointerdown', () => {
      this.showToast('账号绑定功能暂未接入 SDK');
    });
    bindCard.add(bindBtn);

    this.add.text(width / 2, 300, '危险操作', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5);

    const resetBtn = this.add.container(width / 2, 352);
    const resetGlow = this.add.graphics();
    resetGlow.fillStyle(Const.COLORS.MAGENTA, 0.15);
    resetGlow.fillRoundedRect(-75, -20, 150, 40, Const.UI.CARD_RADIUS_SMALL);
    resetGlow.setBlendMode(Phaser.BlendModes.ADD);
    resetGlow.setAlpha(0.5);

    const resetBg = this.add.graphics();
    resetBg.fillStyle(Const.COLORS.BG_DANGER, 1);
    resetBg.fillRoundedRect(-70, -16, 140, 32, Const.UI.BUTTON_RADIUS);
    resetBg.lineStyle(1, Const.COLORS.BUTTON_DANGER_BORDER, 0.8);
    resetBg.strokeRoundedRect(-70, -16, 140, 32, Const.UI.BUTTON_RADIUS);

    const resetLabel = this.add.text(0, 0, '重置账号', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5);

    resetBtn.add([resetGlow, resetBg, resetLabel]);
    resetBtn.setSize(140, 32);
    resetBtn.setInteractive(this.createCenteredHitArea(140, 32), Phaser.Geom.Rectangle.Contains);
    resetBtn.on('pointerover', () => {
      this.tweens.add({ targets: resetGlow, alpha: 0.8, duration: 150 });
      resetLabel.setColor(Const.TEXT_COLORS.PRIMARY);
    });
    resetBtn.on('pointerout', () => {
      this.tweens.add({ targets: resetGlow, alpha: 0.5, duration: 150 });
      resetLabel.setColor(Const.TEXT_COLORS.DANGER);
    });
    resetBtn.on('pointerdown', () => {
      this.showResetConfirm(1);
    });

    this.add.text(width / 2, height - 130, t('game_title_zh') + ' v1.0.0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#6666aa'
    }).setOrigin(0.5);
  }

  showResetConfirm(step = 1) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(1000);

    const modal = this.add.graphics();
    modal.setDepth(1001);
    modal.fillStyle(Const.COLORS.BG_MID, 1);
    modal.fillRoundedRect(width / 2 - 130, height / 2 - 80, 260, 160, Const.UI.CARD_RADIUS);
    modal.lineStyle(2, Const.COLORS.BUTTON_DANGER_BORDER, 0.8);
    modal.strokeRoundedRect(width / 2 - 130, height / 2 - 80, 260, 160, Const.UI.CARD_RADIUS);

    const title = this.add.text(width / 2, height / 2 - 50, step === 1 ? '确认重置账号' : '二次确认', {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5).setDepth(1002);

    const desc = this.add.text(width / 2, height / 2 - 10, step === 1
      ? '将清空当前账号的全部游戏内进度，操作后需要重新开始。'
      : '此操作不可恢复。确认继续后，将立即清空本地游戏数据。', {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY,
      align: 'center',
      wordWrap: { width: 220 }
    }).setOrigin(0.5).setDepth(1002);

    const cleanup = () => {
      overlay.destroy();
      modal.destroy();
      title.destroy();
      desc.destroy();
      cancelBtn.destroy();
      confirmBtn.destroy();
    };

    const cancelBtn = this.add.container(width / 2 - 60, height / 2 + 40).setDepth(1002);
    const cancelBg = this.add.graphics();
    cancelBg.fillStyle(Const.COLORS.BUTTON_SECONDARY, 1);
    cancelBg.fillRoundedRect(-45, -14, 90, 28, Const.UI.BUTTON_RADIUS);
    const cancelLabel = this.add.text(0, 0, t('cancel'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5);
    cancelBtn.add([cancelBg, cancelLabel]);
    cancelBtn.setSize(90, 28);
    cancelBtn.setInteractive(this.createCenteredHitArea(90, 28), Phaser.Geom.Rectangle.Contains);
    cancelBtn.on('pointerdown', cleanup);

    const confirmBtn = this.add.container(width / 2 + 60, height / 2 + 40).setDepth(1002);
    const confirmBg = this.add.graphics();
    confirmBg.fillStyle(Const.COLORS.BG_DANGER, 1);
    confirmBg.fillRoundedRect(-45, -14, 90, 28, Const.UI.BUTTON_RADIUS);
    const confirmLabel = this.add.text(0, 0, step === 1 ? '继续' : t('confirm'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5);
    confirmBtn.add([confirmBg, confirmLabel]);
    confirmBtn.setSize(90, 28);
    confirmBtn.setInteractive(this.createCenteredHitArea(90, 28), Phaser.Geom.Rectangle.Contains);
    confirmBtn.on('pointerdown', () => {
      cleanup();

      if (step === 1) {
        this.showResetConfirm(2);
        return;
      }

      window.gameData = resetGameData();
      this.showToast('账号进度已重置');
      this.scene.restart();
    });
  }
  showChipContent() {
    if (this.chipView) {
      this.chipView.destroy();
    }
    this.chipView = new ChipView(this);
    this.chipView.show();
  }

  tryEnterDungeon() {
    const teamCount = this.fusionGirlManager?.getDeployedGirls?.().length || 0;

    if (teamCount === 0) {
      this.showTeamEmptyAlert();
    } else if (teamCount < Const.GAME.MAX_TEAM_SIZE) {
      this.showTeamNotFullConfirm();
    } else {
      this.scene.start('DungeonScene');
    }
  }

  showModal(config) {
    if (this.modalOpen) return;
    this.modalOpen = true;

    const { title, desc, buttons, borderColor, titleColor } = config;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const elements = [];

    const overlay = this.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(1000);
    elements.push(overlay);

    const modal = this.add.graphics();
    modal.setDepth(1001);
    modal.fillStyle(Const.COLORS.BG_MID, 1);
    modal.fillRoundedRect(width/2 - 130, height/2 - 80, 260, 160, Const.UI.CARD_RADIUS);
    modal.lineStyle(2, borderColor, 0.8);
    modal.strokeRoundedRect(width/2 - 130, height/2 - 80, 260, 160, Const.UI.CARD_RADIUS);
    elements.push(modal);

    const titleText = this.add.text(width/2, height/2 - 50, title, {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: titleColor
    }).setOrigin(0.5).setDepth(1002);
    elements.push(titleText);

    const descText = this.add.text(width/2, height/2 - 15, desc, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY,
      align: 'center'
    }).setOrigin(0.5).setDepth(1002);
    elements.push(descText);

    const closeModal = (callback) => {
      if (!this.modalOpen) return;
      this.modalOpen = false;
      elements.forEach(el => {
        if (el && el.destroy) el.destroy();
      });
      if (callback) callback();
    };

    buttons.forEach((btn) => {
      const btnContainer = this.add.container(width/2 + btn.offsetX, height/2 + 40).setDepth(1002);
      const btnBg = this.add.graphics();
      btnBg.fillStyle(btn.bgColor, 1);
      btnBg.fillRoundedRect(-btn.width/2, -14, btn.width, 28, Const.UI.BUTTON_RADIUS);
      const btnLabel = this.add.text(0, 0, btn.text, {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: btn.textColor
      }).setOrigin(0.5);
      btnContainer.add([btnBg, btnLabel]);
      btnContainer.setSize(btn.width, 28);
      btnContainer.setInteractive(this.createCenteredHitArea(btn.width, 28), Phaser.Geom.Rectangle.Contains);
      btnContainer.on('pointerdown', () => closeModal(btn.callback));
      elements.push(btnContainer);
    });
  }

  showTeamEmptyAlert() {
    this.showModal({
      title: t('team_empty'),
      desc: t('team_empty_desc'),
      borderColor: Const.COLORS.BUTTON_DANGER_BORDER,
      titleColor: Const.TEXT_COLORS.DANGER,
      buttons: [
        {
          text: t('go_to_shop'),
          offsetX: 0,
          width: 120,
          bgColor: Const.COLORS.BUTTON_PRIMARY,
          textColor: Const.TEXT_COLORS.DARK,
          callback: () => this.switchTab('shop')
        }
      ]
    });
  }

  showTeamNotFullConfirm() {
    this.showModal({
      title: t('team_not_full'),
      desc: t('team_not_full_desc'),
      borderColor: Const.COLORS.PURPLE,
      titleColor: Const.TEXT_COLORS.PINK,
      buttons: [
        {
          text: t('go_to_team'),
          offsetX: -60,
          width: 90,
          bgColor: Const.COLORS.BUTTON_SECONDARY,
          textColor: Const.TEXT_COLORS.PRIMARY,
          callback: () => this.switchTab('team')
        },
        {
          text: t('continue'),
          offsetX: 60,
          width: 90,
          bgColor: Const.COLORS.BUTTON_PRIMARY,
          textColor: Const.TEXT_COLORS.DARK,
          callback: () => this.scene.start('DungeonScene')
        }
      ]
    });
  }

  createActionButton(x, y, text, callback) {
    const container = this.add.container(x, y);

    const glowBg = this.add.graphics();
    glowBg.fillStyle(Const.COLORS.CYAN, 0.1);
    glowBg.fillRoundedRect(-55, -20, 110, 40, Const.UI.CARD_RADIUS_SMALL);
    glowBg.setBlendMode(Phaser.BlendModes.ADD);
    glowBg.setAlpha(0.5);

    const bg = this.add.graphics();
    bg.fillStyle(Const.COLORS.BUTTON_PRIMARY, 1);
    bg.fillRoundedRect(-50, -16, 100, 32, Const.UI.BUTTON_RADIUS);

    const label = this.add.text(0, 0, text, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);

    container.add([glowBg, bg, label]);
    container.setSize(100, 32);
    container.setInteractive(this.createCenteredHitArea(100, 32), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      this.tweens.add({ targets: glowBg, alpha: 0.8, duration: 150 });
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 150 });
    });

    container.on('pointerout', () => {
      this.tweens.add({ targets: glowBg, alpha: 0.5, duration: 150 });
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150 });
    });

    container.on('pointerdown', () => {
      if (callback) callback.call(this);
    });

    return container;
  }

  clearContent() {
    const preserved = [this.coinDisplay, this.myceliumDisplay, this.sourceCoreDisplay, this.titleText];
    Object.values(this.tabButtons).forEach(tab => {
      if (tab.container) preserved.push(tab.container);
      if (tab.hitZone) preserved.push(tab.hitZone);
    });

    if (this.chipView) {
      this.chipView.destroy();
      this.chipView = null;
    }
    if (this.shopView) {
      this.shopView.destroy();
      this.shopView = null;
    }
    if (this.teamView) {
      this.teamView.destroy();
      this.teamView = null;
    }
    if (this.wildStageView) {
      this.wildStageView.destroy();
      this.wildStageView = null;
    }

    const childrenToDestroy = this.children.list.filter(child => {
      return !preserved.includes(child);
    });

    childrenToDestroy.forEach(child => {
      if (child.destroy && typeof child.destroy === 'function') {
        child.destroy();
      }
    });
  }

  updateUI() {
    const mycelium = window.gameData?.base?.mycelium || 0;
    const sourceCore = window.gameData?.base?.sourceCore || 0;
    const coins = this.baseSystem.starCoin || 0;

    if (this.myceliumDisplay) {
      this.myceliumDisplay.setText(`🍄 菌丝: ${mycelium.toLocaleString()}`);
    }
    if (this.sourceCoreDisplay) {
      this.sourceCoreDisplay.setText(`💎 源核: ${sourceCore.toLocaleString()}`);
    }
    if (this.coinDisplay) {
      this.coinDisplay.setText(`⭐ 星币: ${coins.toLocaleString()}`);
    }
  }

  saveGameData() {
    syncRuntimeGameData({
      baseSystem: this.baseSystem,
      chipCardManager: this.chipCardManager,
      fusionGirlManager: this.fusionGirlManager,
      reputationSystem: this.reputationSystem
    });
  }

  // 统一的轻提示入口，供各个 View 直接调用。
  showToast(message, duration = 2000) {
    if (this._toastText) this._toastText.destroy();
    const width = this.cameras.main.width;
    const toastBg = this.add.rectangle(width / 2, 120, Math.min(message.length * 16 + 40, width - 40), 36, 0x2a2520, 0.9).setStrokeStyle(1, 0xa8d8a8).setDepth(2000);
    this._toastText = this.add.text(width / 2, 120, message, {
      fontSize: '14px', fontFamily: 'Noto Sans SC', color: '#d4ccc0',
      wordWrap: { width: width - 60 }
    }).setOrigin(0.5).setDepth(2001);
    this.tweens.add({
      targets: [toastBg, this._toastText],
      alpha: 0, delay: duration, duration: 300,
      onComplete: () => { toastBg.destroy(); if (this._toastText) { this._toastText.destroy(); this._toastText = null; } }
    });
  }

  shutdown() {
    if (this._persistGameData) {
      window.removeEventListener('beforeunload', this._persistGameData);
      window.removeEventListener('pagehide', this._persistGameData);
    }
    if (this._persistOnVisibilityChange) {
      document.removeEventListener('visibilitychange', this._persistOnVisibilityChange);
    }
    this.saveGameData();
    this.tweens.killAll();
  }
}

