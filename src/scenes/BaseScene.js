import BaseSystem from '../game/systems/BaseSystem.js';
import Lang, { t } from '../game/data/Lang.js';
import Const from '../game/data/Const.js';
import EquipmentView from './views/EquipmentView.js';
import ShopView from './views/ShopView.js';
import TeamView from './views/TeamView.js';
import ChipCardManager from '../game/systems/ChipCardManager.js';
import ReputationSystem from '../game/systems/ReputationSystem.js';
import MinionCardManager from '../game/systems/MinionCardManager.js';

export default class BaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BaseScene' });
    this.baseSystem = null;
    this.equipmentView = null;
    this.shopView = null;
    this.teamView = null;
    this.currentTab = 'tavern';
    this.tabButtons = {};
    this.modalOpen = false;
    this._transitioning = false;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.initializeBaseSystem();
    this.createBackground(width, height);
    this.createHeader(width);
    this.createBottomNav(width, height);
    this.showView('tavern');

    this.time.addEvent({
      delay: Const.GAME.SAVE_DELAY,
      callback: () => this.updateUI(),
      loop: true
    });
  }

  initializeBaseSystem() {
    if (!window.gameData) {
      window.gameData = {};
    }
    if (!window.gameData.base) {
      window.gameData.base = {
        coins: Const.GAME.INITIAL_COINS,
        mycelium: 0,
        sourceCore: 0,
        facilities: null,
        characters: [],
        team: [],
        availableRecruits: []
      };
    }

    // 确保新货币字段存在（兼容旧存档）
    if (window.gameData.base.mycelium === undefined) {
      window.gameData.base.mycelium = 0;
    }
    if (window.gameData.base.sourceCore === undefined) {
      window.gameData.base.sourceCore = 0;
    }

    this.baseSystem = new BaseSystem(window.gameData.base);
    this.cleanCharacterData();

    // 初始化 ChipCardManager（替代 EquipmentCardManager）
    if (!window.gameData.chipCardManager) {
      window.gameData.chipCardManager = {
        ownedCards: [],
        equippedCardId: null,
        shopCards: []
      };
    }
    this.chipCardManager = new ChipCardManager(window.gameData.chipCardManager);

    // 初始化 ReputationSystem
    if (!window.gameData.reputation) {
      window.gameData.reputation = {};
    }
    this.reputationSystem = new ReputationSystem(window.gameData.reputation);

    // 初始化 MinionCardManager
    if (!window.gameData.minionCardManager) {
      window.gameData.minionCardManager = {
        ownedCards: [],
        deployedCards: [],
        maxDeploy: 3
      };
    }
    this.minionCardManager = MinionCardManager.fromJSON(window.gameData.minionCardManager);

    // 清理旧版本存档中的 equipmentCardManager
    this.cleanLegacySaveData();
  }

  cleanCharacterData() {
    const validClasses = ['Warrior', 'Mage', 'Rogue', 'Priest', 'Tank', 'Archer', 'Paladin', 'Berserker', 'Hunter', 'Cleric'];
    const originalCount = this.baseSystem.characters.length;

    this.baseSystem.characters = this.baseSystem.characters.filter(c => {
      if (!c || !c.charClass) return false;
      const className = c.charClass.name || '';
      return validClasses.some(vc => className.includes(vc) || vc.includes(className));
    });

    const removedCount = originalCount - this.baseSystem.characters.length;
    if (removedCount > 0) {
      this.saveGameData();
    }
  }

  /**
   * 清理旧版本存档数据
   * 移除已废弃的 equipmentCardManager 相关数据
   */
  cleanLegacySaveData() {
    let needsSave = false;

    // 移除旧的 equipmentCardManager
    if (window.gameData.equipmentCardManager) {
      delete window.gameData.equipmentCardManager;
      needsSave = true;
    }

    // 移除旧的 localStorage 键
    try {
      localStorage.removeItem('equipmentCardManager');
    } catch (e) {
      // 忽略
    }

    if (needsSave) {
      this.saveGameData();
    }
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
      tavern: { color: Const.COLORS.PURPLE, alpha: 0.08 },
      team: { color: Const.COLORS.CYAN, alpha: 0.06 },
      equipment: { color: Const.COLORS.YELLOW, alpha: 0.08 },
      dungeon: { color: Const.COLORS.MAGENTA, alpha: 0.08 },
      shop: { color: Const.COLORS.PINK, alpha: 0.06 },
      settings: { color: Const.COLORS.CYAN, alpha: 0.05 }
    };

    const glow = glowColors[viewKey] || glowColors.tavern;

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
    this.titleText = this.add.text(width / 2, Const.UI.TITLE_Y, t('tavern'), {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    }).setOrigin(0.5);

    // 三种货币显示：菌丝 / 源核 / 星币
    this.myceliumDisplay = this.add.text(width / 2 - 100, Const.UI.COIN_Y, '🍄 菌丝: 0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#51cf66'
    }).setOrigin(0.5);

    this.sourceCoreDisplay = this.add.text(width / 2, Const.UI.COIN_Y, '💎 源核: 0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#4dabf7'
    }).setOrigin(0.5);

    this.coinDisplay = this.add.text(width / 2 + 100, Const.UI.COIN_Y, `⭐ 星币: 0`, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5);
  }

  createBottomNav(width, height) {
    const navHeight = Const.UI.NAV_HEIGHT;
    const navY = height - navHeight;

    const navBg = this.add.graphics();
    navBg.fillStyle(Const.COLORS.BG_LIGHT, 0.98);
    navBg.fillRect(0, navY, width, navHeight);
    navBg.lineStyle(1, Const.COLORS.BUTTON_SECONDARY, 0.5);
    navBg.lineBetween(0, navY, width, navY);

    const tabs = [
      { key: 'tavern', icon: '酒', label: t('tavern') },
      { key: 'team', icon: '队', label: t('team') },
      { key: 'dungeon', icon: '牢', label: t('dungeon') },
      { key: 'shop', icon: '店', label: t('shop') },
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
      tabContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, tabWidth, navHeight), Phaser.Geom.Rectangle.Contains);

      tabContainer.on('pointerdown', () => {
        this.switchTab(tab.key);
      });

      this.tabButtons[tab.key] = { container: tabContainer, bg: tabBg, icon: iconText, label: labelText, isActive };
    });
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
    // 如果正在过渡中，跳过
    if (this._transitioning) return;

    // 获取需要保留的元素
    const preserved = [this.coinDisplay, this.myceliumDisplay, this.sourceCoreDisplay, this.titleText];
    Object.values(this.tabButtons).forEach(tab => {
      if (tab.container) preserved.push(tab.container);
    });

    // 收集需要淡出的内容元素
    const contentElements = this.children.list.filter(child => {
      return !preserved.includes(child);
    });

    // 如果有内容元素，先淡出再切换
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
      tavern: t('tavern'),
      team: t('team'),
      dungeon: t('dungeon'),
      shop: t('shop'),
      settings: t('settings')
    };

    if (this.titleText) {
      this.titleText.setText(titles[key] || t('tavern'));
    }

    switch (key) {
      case 'tavern':
        this.showTavernContent();
        break;
      case 'team':
        this.showTeamContent();
        break;
      case 'dungeon':
        this.showDungeonContent();
        break;
      case 'shop':
        this.showShopContent();
        break;
      case 'settings':
        this.showSettingsContent();
        break;
    }
  }

  showTavernContent() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const banner = this.add.text(width / 2, 110, t('tavern_welcome'), {
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

    const bartenderName = this.add.text(width / 2, 250, t('bartender'), {
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

    const hint = this.add.text(width / 2, height - 130, t('tavern_hint'), {
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

  createTeamMemberCard(x, y, character) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-140, -28, 280, 56, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(2, Const.COLORS.PURPLE, 0.5);
    bg.strokeRoundedRect(-140, -28, 280, 56, Const.UI.CARD_RADIUS_SMALL);

    const qualityColors = {
      common: Const.TEXT_COLORS.PRIMARY,
      rare: Const.TEXT_COLORS.CYAN,
      epic: Const.TEXT_COLORS.PINK,
      legendary: Const.TEXT_COLORS.YELLOW,
      mythic: Const.TEXT_COLORS.MAGENTA
    };
    const qualityColor = qualityColors[character.quality] || Const.TEXT_COLORS.PRIMARY;

    const nameLabel = this.add.text(-120, -8, character.name, {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityColor
    }).setOrigin(0, 0.5);

    const classLabel = this.add.text(-120, 12, (character.charClass?.name || '未知') + ' Lv.' + character.level, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5);

    const removeBtn = this.add.text(110, 0, t('remove'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5).setInteractive();

    removeBtn.on('pointerdown', () => {
      this.baseSystem.removeFromTeam(character.id);
      this.saveGameData();
      this.showView('team');
    });

    container.add([bg, nameLabel, classLabel, removeBtn]);
    container.setSize(280, 56);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 280, 56), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(Const.COLORS.BG_HOVER, 1);
      bg.fillRoundedRect(-140, -28, 280, 56, Const.UI.CARD_RADIUS_SMALL);
      bg.lineStyle(2, Const.COLORS.CYAN, 0.7);
      bg.strokeRoundedRect(-140, -28, 280, 56, Const.UI.CARD_RADIUS_SMALL);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(Const.COLORS.BG_MID, 0.95);
      bg.fillRoundedRect(-140, -28, 280, 56, Const.UI.CARD_RADIUS_SMALL);
      bg.lineStyle(2, Const.COLORS.PURPLE, 0.5);
      bg.strokeRoundedRect(-140, -28, 280, 56, Const.UI.CARD_RADIUS_SMALL);
    });
  }

  showDungeonContent() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const dungeonBanner = this.add.text(width / 2, 110, '禁区入口', {
      fontSize: Const.FONT.SIZE_NORMAL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    }).setOrigin(0.5);

    const card = this.add.graphics();
    card.fillStyle(Const.COLORS.BG_MID, 0.9);
    card.fillRoundedRect(width/2 - 120, 150, 240, 200, Const.UI.CARD_RADIUS);
    card.lineStyle(2, Const.COLORS.MAGENTA, 0.5);
    card.strokeRoundedRect(width/2 - 120, 150, 240, 200, Const.UI.CARD_RADIUS);

    const floor = window.gameData?.dungeon?.currentFloor || 1;
    this.add.text(width / 2, 200, t('current_floor', { floor }), {
      fontSize: Const.FONT.SIZE_ICON_SMALL,
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PINK
    }).setOrigin(0.5);

    this.add.text(width / 2, 250, t('auto_battle'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);

    const teamCount = this.baseSystem.getTeamMemberCount();
    if (teamCount === 0) {
      this.add.text(width / 2, 300, t('team_empty'), {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.DANGER
      }).setOrigin(0.5);

      this.createActionButton(width / 2, 340, t('go_to_shop'), () => {
        this.switchTab('shop');
      });
    } else {
      this.createActionButton(width / 2, 340, t('start_explore'), () => {
        this.tryEnterDungeon();
      });
    }

    this.add.text(width / 2, height - 130, t('team_count', { count: teamCount }), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
  }

  showShopContent() {
    if (this.shopView) {
      this.shopView.destroy();
    }
    this.shopView = new ShopView(this);
    this.shopView.show();
  }

  createRecruitCard(x, y, character, index) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(Const.COLORS.BG_MID, 0.95);
    bg.fillRoundedRect(-140, -32, 280, 64, Const.UI.CARD_RADIUS_SMALL);
    bg.lineStyle(2, Const.COLORS.PURPLE, 0.5);
    bg.strokeRoundedRect(-140, -32, 280, 64, Const.UI.CARD_RADIUS_SMALL);

    const qualityColors = {
      common: Const.TEXT_COLORS.PRIMARY,
      rare: Const.TEXT_COLORS.CYAN,
      epic: Const.TEXT_COLORS.PINK,
      legendary: Const.TEXT_COLORS.YELLOW,
      mythic: Const.TEXT_COLORS.MAGENTA
    };
    const qualityColor = qualityColors[character.quality] || Const.TEXT_COLORS.PRIMARY;

    const nameLabel = this.add.text(-120, -8, character.name, {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityColor
    }).setOrigin(0, 0.5);

    const classLabel = this.add.text(-120, 12, (character.charClass?.name || '未知') + ' Lv.' + character.level, {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5);

    const recruitBtn = this.add.container(105, 0);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(Const.COLORS.BUTTON_PRIMARY, 1);
    btnBg.fillRoundedRect(-30, -14, 60, 28, Const.UI.BUTTON_RADIUS);
    const btnText = this.add.text(0, 0, t('recruit'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DARK
    }).setOrigin(0.5);
    recruitBtn.add([btnBg, btnText]);
    recruitBtn.setSize(60, 28);
    recruitBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 60, 28), Phaser.Geom.Rectangle.Contains);

    recruitBtn.on('pointerdown', () => {
      const result = this.baseSystem.recruitCharacter(index);
      if (result.success) {
        this.saveGameData();
        this.showView('shop');
      }
    });

    container.add([bg, nameLabel, classLabel, recruitBtn]);
  }

  showSettingsContent() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const settings = [
      { label: t('se_volume'), value: Math.floor((window.gameData?.settings?.seVolume || 0.8) * 100) + '%' },
      { label: t('bgm_volume'), value: Math.floor((window.gameData?.settings?.bgmVolume || 0.7) * 100) + '%' }
    ];

    const startY = 130;
    settings.forEach((setting, index) => {
      const y = startY + index * 60;

      const card = this.add.graphics();
      card.fillStyle(Const.COLORS.BG_MID, 0.9);
      card.fillRoundedRect(width/2 - 120, y - 22, 240, 44, Const.UI.CARD_RADIUS_SMALL);
      card.lineStyle(1, Const.COLORS.BUTTON_SECONDARY, 0.5);
      card.strokeRoundedRect(width/2 - 120, y - 22, 240, 44, Const.UI.CARD_RADIUS_SMALL);

      this.add.text(width/2 - 100, y, setting.label, {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.PRIMARY
      }).setOrigin(0, 0.5);

      this.add.text(width/2 + 80, y, setting.value, {
        fontSize: Const.FONT.SIZE_SMALL,
        fontFamily: Const.FONT.FAMILY_EN,
        color: Const.TEXT_COLORS.CYAN
      }).setOrigin(1, 0.5);
    });

    this.add.text(width / 2, 280, t('danger_zone'), {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5);

    const resetBtn = this.add.container(width / 2, 320);

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

    const resetLabel = this.add.text(0, 0, t('reset_progress'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5);

    resetBtn.add([resetGlow, resetBg, resetLabel]);
    resetBtn.setSize(140, 32);
    resetBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 140, 32), Phaser.Geom.Rectangle.Contains);

    resetBtn.on('pointerover', () => {
      this.tweens.add({ targets: resetGlow, alpha: 0.8, duration: 150 });
      resetLabel.setColor(Const.TEXT_COLORS.PRIMARY);
    });

    resetBtn.on('pointerout', () => {
      this.tweens.add({ targets: resetGlow, alpha: 0.5, duration: 150 });
      resetLabel.setColor(Const.TEXT_COLORS.DANGER);
    });

    resetBtn.on('pointerdown', () => {
      this.showResetConfirm();
    });

    this.add.text(width / 2, height - 130, '霓虹深渊 v1.0.0', {
      fontSize: Const.FONT.SIZE_TINY,
      fontFamily: Const.FONT.FAMILY_CN,
      color: '#6666aa'
    }).setOrigin(0.5);
  }

  showResetConfirm() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, Const.ALPHA.OVERLAY);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(1000);

    const modal = this.add.graphics();
    modal.setDepth(1001);
    modal.fillStyle(Const.COLORS.BG_MID, 1);
    modal.fillRoundedRect(width/2 - 130, height/2 - 80, 260, 160, Const.UI.CARD_RADIUS);
    modal.lineStyle(2, Const.COLORS.BUTTON_DANGER_BORDER, 0.8);
    modal.strokeRoundedRect(width/2 - 130, height/2 - 80, 260, 160, Const.UI.CARD_RADIUS);

    const title = this.add.text(width/2, height/2 - 50, t('confirm_reset'), {
      fontSize: Const.FONT.SIZE_TITLE,
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5).setDepth(1002);

    const desc = this.add.text(width/2, height/2 - 15, t('reset_desc'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY,
      align: 'center'
    }).setOrigin(0.5).setDepth(1002);

    const cancelBtn = this.add.container(width/2 - 60, height/2 + 40).setDepth(1002);
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
    cancelBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 90, 28), Phaser.Geom.Rectangle.Contains);
    cancelBtn.on('pointerdown', () => {
      overlay.destroy();
      modal.destroy();
      title.destroy();
      desc.destroy();
      cancelBtn.destroy();
      confirmBtn.destroy();
    });

    const confirmBtn = this.add.container(width/2 + 60, height/2 + 40).setDepth(1002);
    const confirmBg = this.add.graphics();
    confirmBg.fillStyle(Const.COLORS.BG_DANGER, 1);
    confirmBg.fillRoundedRect(-45, -14, 90, 28, Const.UI.BUTTON_RADIUS);
    const confirmLabel = this.add.text(0, 0, t('confirm'), {
      fontSize: Const.FONT.SIZE_SMALL,
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.DANGER
    }).setOrigin(0.5);
    confirmBtn.add([confirmBg, confirmLabel]);
    confirmBtn.setSize(90, 28);
    confirmBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 90, 28), Phaser.Geom.Rectangle.Contains);
    confirmBtn.on('pointerdown', () => {
      localStorage.removeItem('sodaDungeonSave');
      localStorage.removeItem('equipmentCardManager');
      localStorage.removeItem('chipCardManager');
      localStorage.removeItem('reputationSystem');
      window.gameData = {
        base: { coins: Const.GAME.INITIAL_COINS, mycelium: 0, sourceCore: 0, characters: [] },
        dungeon: { currentFloor: 1, highestFloor: 1 },
        achievements: [],
        settings: { seVolume: 0.8, bgmVolume: 0.7 }
      };
      this.scene.restart();
    });
  }

  showEquipmentContent() {
    if (this.equipmentView) {
      this.equipmentView.destroy();
    }
    this.equipmentView = new EquipmentView(this);
    this.equipmentView.show();
  }

  tryEnterDungeon() {
    const teamCount = this.baseSystem.getTeamMemberCount();

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
      btnContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, btn.width, 28), Phaser.Geom.Rectangle.Contains);
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
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 32), Phaser.Geom.Rectangle.Contains);

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
    });

    if (this.equipmentView) {
      this.equipmentView.destroy();
      this.equipmentView = null;
    }
    if (this.shopView) {
      this.shopView.destroy();
      this.shopView = null;
    }
    if (this.teamView) {
      this.teamView.destroy();
      this.teamView = null;
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
    window.gameData.base = this.baseSystem.toJSON();
    window.gameData.chipCardManager = {
      ownedCards: this.chipCardManager.getAllCards().map(c => c.toJSON ? c.toJSON() : c),
      equippedCardId: this.chipCardManager.equippedCard?.id || null,
      shopCards: (this.chipCardManager.shopCards || []).map(c => c.toJSON ? c.toJSON() : c)
    };
    window.gameData.reputation = this.reputationSystem.toJSON();
    if (this.minionCardManager) {
      window.gameData.minionCardManager = this.minionCardManager.toJSON();
    }
    localStorage.setItem('sodaDungeonSave', JSON.stringify(window.gameData));
  }

  shutdown() {
    this.saveGameData();
    this.tweens.killAll();
  }
}
