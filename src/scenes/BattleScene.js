import BattleSystem from '../game/systems/BattleSystem.js';
import EventBus from '../game/EventBus.js';
import Const from '../game/data/Const.js';
import CardRenderer from '../game/utils/CardRenderer.js';
import { extractPortraitKey } from '../game/utils/PortraitRegistry.js';
import { getFusionGirlById } from '../game/data/FusionGirlData.js';

const RARITY_TO_QUALITY = {
  common: 'N',
  rare: 'R',
  epic: 'SR',
  legendary: 'SSR'
};

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    this.logEntries = [];
    this.pauseOverlayBlocker = null;
<<<<<<< HEAD
    this.cardDetailOverlay = [];
    this.speedModes = [
      { label: '1x', value: 0.5 },
      { label: '2x', value: 1 }
    ];
    this.currentSpeedModeIndex = 0;
=======
    this._logTexts = [];
    this._logContainer = null;
    this._logShownCount = 0;
>>>>>>> 3c3392169233bc7b1f629d09a098998f2d549077
  }

  init(data) {
    this.currentFloor = data.floor || 1;
    this.currentDimension = data.dimension || 1;
    this.stageId = data.stageId || null;
    this.stageName = data.stageName || (this.stageId ? this.stageId : `禁区 第${this.currentFloor}层`);
    this.enemies = data.enemies || [];
    this.minions = data.minions || data.players || [];
    this.equipmentCard = data.equipmentCard || data.chipCard || null;
    this.onStageVictory = typeof data.onVictory === 'function' ? data.onVictory : null;
    this.onStageDefeat = typeof data.onDefeat === 'function' ? data.onDefeat : null;
    this.isPaused = false;
    this.battleEnded = false;
    this.pauseOverlay = null;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.initializeBattle();
    this.createBackground(width, height);
    this.createHeader(width);
    this.createEnemyArea(width);
    this.createCombatFocusZone(width);
    this.createPlayerArea(width);
    this.createBattleLogBar(width);
    this.createBottomPanel(width, height);

    this.setupBattleSystem();
    this.startBattle();
  }

  update() {
    if (this.roundValueText && this.battleSystem) {
      this.roundValueText.setText(`第 ${Math.max(1, this.battleSystem.turnCount || 1)} 回合`);
    }
  }

  initializeBattle() {
    if (this.enemies.length === 0) {
      this.enemies = [
        { id: 1, name: '机械猎犬', hp: 80, maxHp: 80, atk: 15, spd: 12, level: 1, isBoss: false, element: 'dark' }
      ];
    }

    if (this.minions.length === 0) {
      this.minions = [
        { id: 'temp_1', fusionGirlId: 'temp_1', name: '测试融合姬A', hp: 150, maxHp: 150, atk: 25, spd: 12, quality: 'N', element: 'fire', isFusionGirl: true },
        { id: 'temp_2', fusionGirlId: 'temp_2', name: '测试融合姬B', hp: 100, maxHp: 100, atk: 30, spd: 18, quality: 'R', element: 'water', isFusionGirl: true }
      ];
    }

    this.logEntries = ['战斗开始'];
  }

  createBackground(width, height) {
    this.add.graphics()
      .fillGradientStyle(Const.BATTLE.COLORS.BG_DARK, Const.BATTLE.COLORS.BG_DARK, 0x242032, 0x1a1624, 1)
      .fillRect(0, 0, width, height);
  }

  createHeader(width) {
    this.createCircleButton(28, 34, '←', () => this.returnToBase());

    this.roundValueText = this.add.text(width - 20, 24, '第 1 回合', {
      fontSize: '12px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_SECONDARY
    }).setOrigin(1, 0.5);

    this.add.text(width / 2, 24, this.stageName, {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.BATTLE.COLORS.AMBER
    }).setOrigin(0.5);
  }

  createEnemyArea(width) {
    this.enemyCards = [];
    this.enemyY = 184;
    this.add.text(width / 2, 92, '敌方阵列', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_SECONDARY
    }).setOrigin(0.5, 0.5);
    const positions = this.getRowPositions(width, this.enemies.length);

    this.enemies.forEach((enemy, index) => {
      const card = this.createBattleCard(positions[index], this.enemyY, enemy, false);
      this.enemyCards.push({ container: card, enemy });
    });
  }

  createPlayerArea(width) {
    this.playerCards = [];
    this.playerY = 414;
    this.add.text(width / 2, 322, '我方阵列', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_SECONDARY
    }).setOrigin(0.5, 0.5);
    const positions = this.getRowPositions(width, this.minions.length);

    this.minions.forEach((minion, index) => {
      const card = this.createBattleCard(positions[index], this.playerY, minion, true);
      this.playerCards.push({ container: card, minion });
    });
  }

  getRowPositions(width, count) {
    const cardWidth = Const.BATTLE.LAYOUT.CARD_WIDTH;
    const gap = 6;
    const totalWidth = count * cardWidth + (count - 1) * gap;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    return Array.from({ length: count }, (_, index) => startX + index * (cardWidth + gap));
  }

  createCombatFocusZone(width) {
    const focusY = 288;
    const focus = this.add.container(width / 2, focusY);
    focus.setDepth(Const.DEPTH.CONTENT + 1);

    const leftLine = this.add.graphics();
    leftLine.lineStyle(1, Const.BATTLE.COLORS.BORDER, 0.28);
    leftLine.beginPath();
    leftLine.moveTo(-132, 0);
    leftLine.lineTo(-42, 0);
    leftLine.strokePath();

    const rightLine = this.add.graphics();
    rightLine.lineStyle(1, Const.BATTLE.COLORS.BORDER, 0.28);
    rightLine.beginPath();
    rightLine.moveTo(42, 0);
    rightLine.lineTo(132, 0);
    rightLine.strokePath();

    const core = this.add.circle(0, 0, 4, 0x9b59ff, 0.7);
    const halo = this.add.circle(0, 0, 16, 0x9b59ff, 0.08);
    const label = this.add.text(0, -18, '战斗演示区', {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_SECONDARY
    }).setOrigin(0.5);

    focus.add([leftLine, rightLine, halo, core, label]);
    this.tweens.add({
      targets: halo,
      alpha: 0.02,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createBattleCard(x, y, unit, isPlayer) {
    const quality = isPlayer ? (RARITY_TO_QUALITY[unit.rarity] || 'N') : (unit.isBoss ? 'SSR' : 'N');
    const currentHp = unit.currentHp ?? unit.hp ?? unit.maxHp ?? 0;
    const maxHp = unit.maxHp ?? unit.hp ?? 0;
    const card = CardRenderer.createBattleUnitCard(this, {
      x,
      y,
      width: Const.BATTLE.LAYOUT.CARD_WIDTH,
      height: Const.BATTLE.LAYOUT.CARD_HEIGHT,
      quality,
      name: unit.name,
      hp: currentHp,
      maxHp,
      atk: unit.atk || 0,
      spd: unit.spd ?? unit.baseSpd ?? '--',
      element: unit.element || (isPlayer ? 'water' : 'dark'),
      charClass: unit.charClass,
      portraitKey: extractPortraitKey(unit.portrait),
      skillCooldowns: this.getSkillCooldowns(unit),
      interactive: true,
      onClick: () => this.openBattleCardDetail(unit),
      scale: 1
    });

    card.setData(isPlayer ? 'player' : 'enemy', unit);
    card.setData('unitId', unit.id);
    card.setData('unitName', unit.name);
    card.setDepth(Const.DEPTH.CONTENT + 2);
    CardRenderer.animateEntry(this, card, 0);
    return card;
  }

  findCardEntry(entity) {
    const matchById = (entry) => {
      const unit = entry.minion || entry.enemy || entry.container?.getData('player') || entry.container?.getData('enemy');
      return entity?.id != null && unit?.id != null && entity.id === unit.id;
    };

    const matchByName = (entry) => {
      const unit = entry.minion || entry.enemy || entry.container?.getData('player') || entry.container?.getData('enemy');
      return entity?.name && unit?.name && entity.name === unit.name;
    };

    return this.playerCards.find(matchById)
      || this.enemyCards.find(matchById)
      || this.playerCards.find(matchByName)
      || this.enemyCards.find(matchByName)
      || null;
  }

  getSkillCooldowns(unit) {
    if (Array.isArray(unit.skillCooldowns) && unit.skillCooldowns.length > 0) {
      return unit.skillCooldowns.slice(0, 3);
    }
    if (Array.isArray(unit.skills) && unit.skills.length > 0) {
      return unit.skills.slice(0, 3).map((skill) => skill.cooldownRemaining ?? skill.cooldown ?? 0);
    }
    return [0, 0, 0];
  }

  createBattleLogBar(width) {
    const y = 598;
    const h = 42;
    this.logBar = this.add.container(width / 2, y);
    this.logBar.setDepth(Const.DEPTH.CONTENT + 3);

    const bg = this.add.graphics();
    bg.fillStyle(0x11131f, 0.95);
    bg.lineStyle(1, Const.BATTLE.COLORS.BORDER, 0.6);
    bg.fillRoundedRect(-(width - 24) / 2, -h / 2, width - 24, h, 0);
    bg.strokeRoundedRect(-(width - 24) / 2, -h / 2, width - 24, h, 0);
    this.logBar.add(bg);

    this.logBarPrefix = this.add.text(-(width - 24) / 2 + 12, 0, '[战斗日志]', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_SECONDARY
    }).setOrigin(0, 0.5);
    this.logBar.add(this.logBarPrefix);

    this.logBarLabel = this.add.text(-(width - 24) / 2 + 78, 0, '战斗开始', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_PRIMARY,
      wordWrap: { width: width - 148 }
    }).setOrigin(0, 0.5);
    this.logBar.add(this.logBarLabel);

    this.logBarHint = this.add.text((width - 24) / 2 - 12, 0, '暂停', {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_SECONDARY
    }).setOrigin(1, 0.5);
    this.logBar.add(this.logBarHint);

    this.logBar.setSize(width - 24, h);
    this.logBar.setInteractive(new Phaser.Geom.Rectangle(-(width - 24) / 2, -h / 2, width - 24, h), Phaser.Geom.Rectangle.Contains);
    this.logBar.on('pointerdown', () => this.openPauseOverlay());
  }

  createBottomPanel(width, height) {
    const panelY = 654;
    this.speedButton = this.createPillButton(92, panelY, '1x', () => this.toggleSpeed(), 76, 28);
    this.pauseButton = this.createPillButton(width - 92, panelY, '暂停', () => this.openPauseOverlay(), 76, 28);
  }

  createCircleButton(x, y, label, callback) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x201d29, 0.95);
    bg.lineStyle(1, Const.BATTLE.COLORS.BORDER, 0.7);
    bg.fillCircle(0, 0, 18);
    bg.strokeCircle(0, 0, 18);
    const text = this.add.text(0, 0, label, {
      fontSize: '16px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_PRIMARY
    }).setOrigin(0.5);
    const hitZone = this.add.zone(0, 0, 44, 44).setOrigin(0.5);
    hitZone.setInteractive(new Phaser.Geom.Circle(0, 0, 22), Phaser.Geom.Circle.Contains);
    hitZone.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      callback();
    });
    container.add([bg, text, hitZone]);
    return container;
  }

  createPillButton(x, y, label, callback, width = 76, height = 28) {
    const container = this.add.container(x, y);
    container.setDepth(Const.DEPTH.CONTENT + 3);
    const bg = this.add.graphics();
    bg.fillStyle(0x1c2032, 0.96);
    bg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    const text = this.add.text(0, 0, label, {
      fontSize: '12px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5);
    const hitZone = this.add.zone(0, 0, width + 12, height + 10).setOrigin(0.5);
    hitZone.setInteractive(new Phaser.Geom.Rectangle(-(width + 12) / 2, -(height + 10) / 2, width + 12, height + 10), Phaser.Geom.Rectangle.Contains);
    container.add([bg, text, hitZone]);
    container.setSize(width, height);
    hitZone.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      callback();
    });
    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x24324a, 1);
      bg.lineStyle(1, Const.COLORS.BUTTON_HOVER, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    });
    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1c2032, 0.96);
      bg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.8);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    });
    container.label = text;
    return container;
  }

  setupBattleSystem() {
    this.battleSystem = new BattleSystem(this, { battleSpeed: this.speedModes[this.currentSpeedModeIndex].value });
    this.battleSystem.setPlayerTeam(this.minions.map((m) => ({
      id: m.id,
      name: m.name,
      hp: m.maxHp || m.hp,
      maxHp: m.maxHp || m.hp,
      atk: m.atk || 20,
      critRate: m.critRate || 0.15,
      def: m.def || 5,
      isFusionGirl: m.isFusionGirl !== false,
      rarity: m.rarity,
      race: m.race,
      passiveSkill: m.passiveSkill,
      element: m.element,
      charClass: m.charClass,
      spd: m.spd ?? m.baseSpd
    })));

    this.battleSystem.setEnemyTeam(this.enemies.map((e) => ({
      id: e.id,
      name: e.name,
      hp: e.hp,
      maxHp: e.maxHp,
      atk: e.atk || 15,
      critRate: 0.1,
      def: 5,
      level: e.level,
      isBoss: e.isBoss,
      element: e.element || 'dark',
      spd: e.spd ?? 10
    })));

    this._battleListeners = {
      onAttack: (data) => this.updateHPDisplay(data.target),
      onDamage: (data) => this.showDamageNumber(data.target, data.damage, data.isCrit, false),
      onHeal: (data) => this.showDamageNumber(data.target, data.amount || data.heal || 0, false, true),
      onBattleLog: (data) => this.addLogEntry(data.action, data.result),
      onVictory: (data) => this.onBattleVictory(data),
      onDefeat: (data) => this.onBattleDefeat(data),
      onCharacterDeath: (data) => this.playDeathAnimation(data.character)
    };

    Object.entries(this._battleListeners).forEach(([event, callback]) => {
      this.battleSystem.on(event, callback);
    });
  }

  startBattle() {
    this.battleSystem.startBattle();
  }

  toggleSpeed() {
    if (this.cardDetailOverlay.length > 0) return;
    if (!this.battleSystem) return;
    this.currentSpeedModeIndex = (this.currentSpeedModeIndex + 1) % this.speedModes.length;
    const nextMode = this.speedModes[this.currentSpeedModeIndex];
    this.battleSystem.battleSpeed = nextMode.value;
    if (this.speedButton?.label) {
      this.speedButton.label.setText(nextMode.label);
    }
  }

  openPauseOverlay() {
    if (this.pauseOverlay || this.battleEnded || this.cardDetailOverlay.length > 0) return;
    this.setPausedState(true);
    this.speedButton?.setVisible(false);
    this.pauseButton?.setVisible(false);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.pauseOverlayBlocker = this.add.zone(width / 2, height / 2, width, height);
    this.pauseOverlayBlocker.setDepth(Const.DEPTH.MODAL_OVERLAY + 9);
    this.pauseOverlayBlocker.setInteractive();
    this.pauseOverlayBlocker.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
    });

    const container = this.add.container(width / 2, 374);
    container.setDepth(Const.DEPTH.MODAL_OVERLAY + 10);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x04060c, 0.92);
    overlay.fillRect(-width / 2 + 12, -296, width - 24, 592);
    overlay.lineStyle(1.5, Const.BATTLE.COLORS.BORDER, 0.8);
    overlay.strokeRect(-width / 2 + 12, -296, width - 24, 592);
    container.add(overlay);

    container.add(this.add.text(0, -264, '战斗日志', {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.BATTLE.COLORS.AMBER
    }).setOrigin(0.5));

    const maxLines = 16;
    const shown = this.logEntries.slice(-maxLines);
    this._logContainer = this.add.container(-width / 2 + 28, -226);
    shown.forEach((entry, index) => {
      const text = this.add.text(0, index * 28, entry, {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.BATTLE.COLORS.TEXT_PRIMARY,
        wordWrap: { width: width - 56 }
      }).setOrigin(0, 0);
      this._logContainer.add(text);
      this._logTexts.push(text);
    });
    this._logShownCount = shown.length;
    container.add(this._logContainer);

    const continueBtn = this.createPillButton(-56, 256, '继续', () => this.closePauseOverlay(true), 96, 32);
    const surrenderBtn = this.createPillButton(56, 256, '投降', () => this.returnToBase(), 96, 32);
    container.add([continueBtn, surrenderBtn]);

    this.pauseOverlay = container;
  }

  closePauseOverlay(resumeBattle) {
    if (!this.pauseOverlay) return;
    this.pauseOverlay.destroy();
    this.pauseOverlay = null;
    this.pauseOverlayBlocker?.destroy();
    this.pauseOverlayBlocker = null;
    this._logContainer = null;
    this._logTexts = [];
    this._logShownCount = 0;
    this.speedButton?.setVisible(true);
    this.pauseButton?.setVisible(true);
    if (resumeBattle) {
      this.setPausedState(false);
    }
  }

  setPausedState(paused) {
    this.isPaused = paused;
    if (!this.battleSystem) return;
    if (paused) {
      this.battleSystem.pause();
    } else {
      this.battleSystem.resume();
    }
  }

  openBattleCardDetail(unit) {
    if (this.battleEnded || this.pauseOverlay || this.cardDetailOverlay.length > 0) return;

    this.setPausedState(true);
    this.speedButton?.setVisible(false);
    this.pauseButton?.setVisible(false);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const modalWidth = Math.min(width - 16, 360);
    const modalHeight = Math.min(height - 18, 760);
    const quality = unit.quality || (unit.isBoss ? 'SSR' : 'N');
    const accentColor = CardRenderer.getQualityColorInt(quality);
    const roleStyle = CardRenderer.getRoleStyle(unit.charClass);
    const elementStyle = CardRenderer.getElementStyle(unit.element || 'water');
    const portraitKey = extractPortraitKey(unit.portrait);

    const overlay = this.add.graphics();
    overlay.fillStyle(Const.COLORS.BG_DARK, 0.88);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(Const.DEPTH.MODAL_OVERLAY);

    const closeZone = this.add.zone(width / 2, height / 2, width, height);
    closeZone.setDepth(Const.DEPTH.MODAL_OVERLAY);
    closeZone.setInteractive();
    closeZone.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      this.closeBattleCardDetail(true);
    });

    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(Const.DEPTH.MODAL_CONTENT);

    const modalBlocker = this.add.zone(0, 0, modalWidth, modalHeight);
    modalBlocker.setInteractive();
    modalBlocker.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
    });
    modal.add(modalBlocker);

    const bg = this.add.graphics();
    bg.fillStyle(0x0b0f18, 0.98);
    bg.fillRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight);
    modal.add(bg);

    const portraitFrame = portraitKey ? this.textures.getFrame(portraitKey, '__BASE') : null;
    const portraitWidth = modalWidth - 12;
    const portraitHeight = Math.min(
      Math.floor(portraitWidth * ((portraitFrame?.height || 1536) / (portraitFrame?.width || 1024))),
      410
    );
    const portraitTop = -modalHeight / 2 + 8;
    const portraitCenterY = portraitTop + portraitHeight / 2;
    const infoTop = portraitTop + portraitHeight + 8;
    const tableTop = infoTop;
    const rowHeight = 26;
    const tableWidth = modalWidth - 20;
    const tableHeight = rowHeight * 5;
    const contentTop = tableTop + tableHeight;
    const contentHeight = 96;
    const footerTop = contentTop + contentHeight;

    const portraitBg = this.add.graphics();
    portraitBg.fillStyle(0x05080f, 0.98);
    portraitBg.fillRect(-portraitWidth / 2, portraitTop, portraitWidth, portraitHeight);
    modal.add(portraitBg);

    const portrait = CardRenderer.createDetailPortrait(this, {
      x: 0,
      y: portraitCenterY,
      width: portraitWidth,
      height: portraitHeight,
      quality,
      portraitKey,
      element: unit.element || 'water',
      showFrame: false
    });
    modal.add(portrait);

    const infoPanel = this.add.graphics();
    infoPanel.fillStyle(0x0f1522, 0.98);
    infoPanel.lineStyle(1, accentColor, 0.35);
    infoPanel.fillRect(-tableWidth / 2, tableTop, tableWidth, tableHeight);
    infoPanel.strokeRect(-tableWidth / 2, tableTop, tableWidth, tableHeight);
    modal.add(infoPanel);

    const fusionData = unit?.fusionGirlId ? getFusionGirlById(unit.fusionGirlId) : null;
    const titleLabel = fusionData?.title || quality;
    const professionLabel = this.getBattleProfessionLabel(roleStyle.label);
    const elementLabel = this.getBattleElementLabel(unit.element);
    const hpValue = `${Math.max(0, Math.floor(unit.currentHp ?? unit.hp ?? unit.maxHp ?? 0))}/${Math.max(0, Math.floor(unit.maxHp ?? unit.hp ?? 0))}`;

    modal.add(this.add.text(-tableWidth / 2 + 14, tableTop + 18, titleLabel, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5));

    modal.add(this.add.text(-tableWidth / 2 + 14, tableTop + 42, unit.name || '未知目标', {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: CardRenderer.getQualityColorText(quality)
    }).setOrigin(0, 0.5));

    const levelPill = this.createPillButton(tableWidth / 2 - 44, tableTop + 42, `Lv${unit.level || 1}`, () => {}, 62, 22);
    levelPill.disableInteractive?.();
    modal.add(levelPill);

    const metaY = tableTop + 72;
    const professionBadge = CardRenderer.createIconBadge(this, -tableWidth / 2 + 24, metaY, 24, 20, roleStyle.color, roleStyle.badgeIcon || roleStyle.icon, '11px');
    const elementBadge = CardRenderer.createIconBadge(this, -tableWidth / 2 + 54, metaY, 24, 20, elementStyle.color, elementStyle.badgeIcon || elementStyle.icon, '11px');
    modal.add(professionBadge);
    modal.add(elementBadge);
    modal.add(this.add.text(-tableWidth / 2 + 74, metaY, `${professionLabel} / ${elementLabel}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5));
    modal.add(this.add.text(tableWidth / 2 - 12, metaY, `品质 ${quality}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: CardRenderer.getQualityColorText(quality)
    }).setOrigin(1, 0.5));

    modal.add(this.add.text(-tableWidth / 2 + 14, tableTop + 98, '生命', {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5));
    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x101826, 1);
    hpBarBg.fillRect(-tableWidth / 2 + 44, tableTop + 92, tableWidth - 58, 12);
    modal.add(hpBarBg);
    const hpRatio = Math.max(0, Math.min(1, (unit.currentHp ?? unit.hp ?? unit.maxHp ?? 0) / Math.max(1, unit.maxHp ?? unit.hp ?? 1)));
    const hpBarFill = this.add.graphics();
    hpBarFill.fillStyle(Const.BATTLE.COLORS.HP_GREEN, 1);
    hpBarFill.fillRect(-tableWidth / 2 + 44, tableTop + 92, (tableWidth - 58) * hpRatio, 12);
    modal.add(hpBarFill);
    modal.add(this.add.text(0, tableTop + 98, hpValue, {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5));

    const statY = tableTop + 122;
    const atkBox = this.add.graphics();
    atkBox.fillStyle(0x101826, 1);
    atkBox.lineStyle(1, accentColor, 0.18);
    atkBox.fillRect(-tableWidth / 2 + 14, statY - 12, 132, 24);
    atkBox.strokeRect(-tableWidth / 2 + 14, statY - 12, 132, 24);
    modal.add(atkBox);
    modal.add(this.add.text(-tableWidth / 2 + 24, statY, `攻击  ${unit.atk || 0}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5));

    const spdBox = this.add.graphics();
    spdBox.fillStyle(0x101826, 1);
    spdBox.lineStyle(1, accentColor, 0.18);
    spdBox.fillRect(tableWidth / 2 - 146, statY - 12, 132, 24);
    spdBox.strokeRect(tableWidth / 2 - 146, statY - 12, 132, 24);
    modal.add(spdBox);
    modal.add(this.add.text(tableWidth / 2 - 136, statY, `速度  ${unit.spd ?? '--'}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5));

    modal.add(this.add.text(-tableWidth / 2 + 14, tableTop + 148, '技能 / 能力', {
      fontSize: '10px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5));
    const tabSkill = this.createPillButton(-76, tableTop + 148, '技能', () => renderContent('skills'), 60, 22);
    const tabAbility = this.createPillButton(-6, tableTop + 148, '能力', () => renderContent('abilities'), 60, 22);
    modal.add(tabSkill);
    modal.add(tabAbility);

    const contentPanel = this.add.graphics();
    contentPanel.fillStyle(0x0f1522, 0.98);
    contentPanel.lineStyle(1, accentColor, 0.3);
    contentPanel.fillRect(-tableWidth / 2, contentTop, tableWidth, contentHeight);
    contentPanel.strokeRect(-tableWidth / 2, contentTop, tableWidth, contentHeight);
    modal.add(contentPanel);

    const contentContainer = this.add.container(0, contentTop);
    modal.add(contentContainer);
    const descTitle = this.add.text(0, footerTop + 14, '技能/能力描述', {
      fontSize: '12px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0.5, 0.5);
    modal.add(descTitle);

    const descPanel = this.add.graphics();
    descPanel.fillStyle(0x0f1522, 0.98);
    descPanel.lineStyle(1, accentColor, 0.3);
    descPanel.fillRect(-tableWidth / 2, footerTop + 30, tableWidth, 56);
    descPanel.strokeRect(-tableWidth / 2, footerTop + 30, tableWidth, 56);
    modal.add(descPanel);

    const descText = this.add.text(0, footerTop + 58, '', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY,
      wordWrap: { width: tableWidth - 20 },
      align: 'center'
    }).setOrigin(0.5, 0.5);
    modal.add(descText);

    const skills = this.getBattleDetailSkills(unit);
    const abilities = this.getBattleDetailAbilities(unit);
    let currentMode = 'skills';

    const setDescription = (entry, type) => {
      if (!entry) {
        descText.setText('暂无描述');
        return;
      }
      descText.setText(type === 'skills'
        ? `${entry.name}\n战斗中会在自动释放条件满足时触发。`
        : `${entry.name}\n当前为${entry.unlocked ? '已激活' : '未配置'}状态。`);
    };

    const updateTabs = () => {
      const skillActive = currentMode === 'skills';
      const abilityActive = currentMode === 'abilities';
      tabSkill.label.setColor(skillActive ? Const.TEXT_COLORS.DARK : Const.TEXT_COLORS.PRIMARY);
      tabAbility.label.setColor(abilityActive ? Const.TEXT_COLORS.DARK : Const.TEXT_COLORS.PRIMARY);
    };

    const renderContent = (mode) => {
      currentMode = mode;
      contentContainer.removeAll(true);

      if (mode === 'skills') {
        const slotWidth = (tableWidth - 16) / 3;
        skills.forEach((skill, index) => {
          const cell = this.add.container(-tableWidth / 2 + 8 + slotWidth / 2 + index * slotWidth, 32);
          const cellBg = this.add.graphics();
          cellBg.fillStyle(0x11192a, 0.98);
          cellBg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.6);
          cellBg.fillRect(-slotWidth / 2 + 4, -24, slotWidth - 8, 48);
          cellBg.strokeRect(-slotWidth / 2 + 4, -24, slotWidth - 8, 48);
          cell.add(cellBg);
          cell.add(this.add.text(0, -10, `主动技能 ${index + 1}`, {
            fontSize: '10px',
            fontFamily: Const.FONT.FAMILY_CN,
            color: Const.TEXT_COLORS.CYAN
          }).setOrigin(0.5));
          const name = this.add.text(0, 10, skill.name, {
            fontSize: '11px',
            fontFamily: Const.FONT.FAMILY_CN,
            fontStyle: 'bold',
            color: Const.TEXT_COLORS.PRIMARY,
            align: 'center',
            wordWrap: { width: slotWidth - 18 }
          }).setOrigin(0.5);
          cell.add(name);
          cell.setSize(slotWidth - 8, 48);
          cell.setInteractive(new Phaser.Geom.Rectangle(-slotWidth / 2 + 4, -24, slotWidth - 8, 48), Phaser.Geom.Rectangle.Contains);
          cell.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
            setDescription(skill, 'skills');
          });
          contentContainer.add(cell);
        });
        setDescription(skills[0], 'skills');
      } else {
        const columns = 2;
        const cellWidth = (tableWidth - 20) / columns;
        const cellHeight = 22;
        abilities.slice(0, 8).forEach((ability, index) => {
          const col = index % columns;
          const row = Math.floor(index / columns);
          const x = -tableWidth / 2 + 10 + cellWidth / 2 + col * cellWidth;
          const y = 16 + row * (cellHeight + 6);
          const cell = this.add.container(x, y);
          const cellBg = this.add.graphics();
          cellBg.fillStyle(ability.unlocked ? 0x121f30 : 0x111520, 0.98);
          cellBg.lineStyle(1, ability.unlocked ? accentColor : 0x4a5670, ability.unlocked ? 0.4 : 0.25);
          cellBg.fillRect(-cellWidth / 2 + 2, -cellHeight / 2, cellWidth - 4, cellHeight);
          cellBg.strokeRect(-cellWidth / 2 + 2, -cellHeight / 2, cellWidth - 4, cellHeight);
          cell.add(cellBg);
          const name = this.add.text(0, 0, ability.name, {
            fontSize: '10px',
            fontFamily: Const.FONT.FAMILY_CN,
            fontStyle: ability.unlocked ? 'bold' : 'normal',
            color: ability.unlocked ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE,
            align: 'center',
            wordWrap: { width: cellWidth - 16 }
          }).setOrigin(0.5);
          cell.add(name);
          cell.setSize(cellWidth - 4, cellHeight);
          cell.setInteractive(new Phaser.Geom.Rectangle(-cellWidth / 2 + 2, -cellHeight / 2, cellWidth - 4, cellHeight), Phaser.Geom.Rectangle.Contains);
          cell.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
            setDescription(ability, 'abilities');
          });
          contentContainer.add(cell);
        });
        setDescription(abilities[0], 'abilities');
      }
      updateTabs();
    };

    renderContent('skills');

    this.cardDetailOverlay.push(overlay, closeZone, modal);
  }

  closeBattleCardDetail(resumeBattle = true) {
    this.clearBattleDetailScroll();
    this.cardDetailOverlay.forEach((item) => item?.destroy?.());
    this.cardDetailOverlay = [];
    this.speedButton?.setVisible(true);
    this.pauseButton?.setVisible(true);
    if (resumeBattle && !this.battleEnded) {
      this.setPausedState(false);
    }
  }

  getBattleDetailSkills(unit) {
    const fusionData = unit?.fusionGirlId ? getFusionGirlById(unit.fusionGirlId) : null;
    const skillIds = [
      fusionData?.activeSkill1Id || unit?.activeSkill1Id,
      fusionData?.activeSkill2Id || unit?.activeSkill2Id,
      fusionData?.activeSkill3Id || unit?.activeSkill3Id
    ];
    return skillIds.map((skillId, index) => ({
      id: skillId || `skill_${index + 1}`,
      name: skillId
        ? skillId.replace(/^SKILL_/, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
        : `主动技能 ${index + 1}`
    }));
  }

  getBattleDetailAbilities(unit) {
    const fusionData = unit?.fusionGirlId ? getFusionGirlById(unit.fusionGirlId) : null;
    const rawAbilities = Array.isArray(fusionData?.abilityIds)
      ? fusionData.abilityIds
      : Array.isArray(unit?.abilities)
        ? unit.abilities
        : [];
    return Array.from({ length: 8 }, (_, index) => {
      const abilityId = rawAbilities[index] || null;
      return {
        id: abilityId || `slot_${index + 1}`,
        name: abilityId
          ? abilityId.replace(/^ABILITY_/, '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
          : `能力槽 ${String(index + 1).padStart(2, '0')}`,
        unlocked: !!abilityId
      };
    });
  }

  setupBattleDetailScroll(container, viewport) {
    this.clearBattleDetailScroll();
    if (!viewport || viewport.maxScroll <= 0) {
      return;
    }

    const state = {
      currentY: 0,
      maxScroll: viewport.maxScroll
    };

    const baseY = container.y;
    const wheelHandler = (pointer, gameObjects, deltaX, deltaY) => {
      const withinX = pointer.x >= viewport.left && pointer.x <= viewport.left + viewport.width;
      const withinY = pointer.y >= viewport.top && pointer.y <= viewport.top + viewport.height;
      if (!withinX || !withinY) {
        return;
      }
      state.currentY = Phaser.Math.Clamp(state.currentY - deltaY * 0.35, -state.maxScroll, 0);
      container.y = baseY + state.currentY;
    };

    this.input.on('wheel', wheelHandler);
    this.battleDetailScrollCleanup = () => {
      this.input.off('wheel', wheelHandler);
      this.battleDetailScrollCleanup = null;
    };
  }

  clearBattleDetailScroll() {
    if (typeof this.battleDetailScrollCleanup === 'function') {
      this.battleDetailScrollCleanup();
    }
  }

  updateHPDisplay(entity) {
    const cardEntry = this.findCardEntry(entity);
    if (!cardEntry?.container) return;
    CardRenderer.updateHpBar(cardEntry.container, entity.currentHp, entity.maxHp, Boolean(cardEntry.minion));
  }

  addLogEntry(action, result) {
    const entry = `${action || ''} ${result || ''}`.trim();
    if (!entry) return;
    this.logEntries.push(entry);
    this.logEntries = this.logEntries.slice(-40);
    if (this.logBarLabel) {
      this.logBarLabel.setText(entry);
    }
    if (this.pauseOverlay && this._logContainer) {
      // 增量追加新日志文本，而非重建整个覆盖层
      const maxLines = 16;
      const width = this.cameras.main.width;
      const newLogText = this.add.text(0, this._logTexts.length * 28, entry, {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.BATTLE.COLORS.TEXT_PRIMARY,
        wordWrap: { width: width - 56 }
      }).setOrigin(0, 0);
      this._logContainer.add(newLogText);
      this._logTexts.push(newLogText);
      this._logShownCount++;

      // 超出最大行数时移除最早的日志文本
      while (this._logShownCount > maxLines) {
        const oldest = this._logTexts.shift();
        if (oldest) oldest.destroy();
        this._logShownCount--;
        // 重新排列剩余日志的位置
        this._logTexts.forEach((text, idx) => {
          text.setY(idx * 28);
        });
      }
    }
  }

  showDamageNumber(target, amount, isCrit = false, isHeal = false) {
    const targetCard = this.findCardEntry(target);
    if (!targetCard?.container || !amount) return;

    const prefix = isHeal ? '+' : '-';
    const color = isHeal ? '#57f287' : (isCrit ? '#ff8a65' : '#ffffff');
    const fontSize = isCrit ? '20px' : '14px';
    const damageText = this.add.text(targetCard.container.x, targetCard.container.y - 68, `${prefix}${amount}`, {
      fontSize,
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color
    }).setOrigin(0.5).setDepth(Const.DEPTH.MODAL_CONTENT);

    this.tweens.add({
      targets: damageText,
      y: damageText.y - 24,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
  }

  onAttackAnimation(attacker, target, isCrit, onComplete) {
    const attackerCard = this.findCardEntry(attacker)?.container;
    const targetCard = this.findCardEntry(target)?.container;

    if (!attackerCard || !targetCard) {
      onComplete?.();
      return;
    }

    const originalX = attackerCard.x;
    const step = attackerCard.x < targetCard.x ? 18 : -18;

    this.tweens.add({
      targets: attackerCard,
      x: originalX + step,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 120,
      yoyo: true,
      ease: 'Power2',
      onYoyo: () => {
        this.tweens.add({
          targets: targetCard,
          alpha: isCrit ? 0.28 : 0.48,
          scaleX: isCrit ? 1.04 : 1.02,
          scaleY: isCrit ? 1.04 : 1.02,
          duration: 80,
          yoyo: true,
          repeat: isCrit ? 1 : 0
        });
      },
      onComplete: () => {
        attackerCard.x = originalX;
        attackerCard.setScale(1);
        targetCard.setScale(1);
        onComplete?.();
      }
    });
  }

  onSkillAnimation(character, targets, skill, onComplete) {
    const sourceCard = this.findCardEntry(character)?.container;
    const targetCards = (targets || [])
      .map((target) => this.findCardEntry(target)?.container)
      .filter(Boolean);

    const flash = this.add.circle(
      sourceCard?.x || this.cameras.main.width / 2,
      sourceCard?.y || this.cameras.main.height / 2,
      12,
      0x9b59ff,
      0.5
    );
    flash.setDepth(Const.DEPTH.MODAL_CONTENT + 5);

    this.tweens.add({
      targets: flash,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onStart: () => {
        targetCards.forEach((card) => {
          this.tweens.add({
            targets: card,
            alpha: 0.5,
            duration: 90,
            yoyo: true
          });
        });
      },
      onComplete: () => {
        flash.destroy();
        onComplete?.();
      }
    });
  }

  playDeathAnimation(character) {
    const targetCard = this.findCardEntry(character);
    if (!targetCard?.container) return;

    const buffStrip = targetCard.container.getData('buffStrip');
    if (buffStrip) {
      buffStrip.setAlpha(0.3);
    }

    this.tweens.add({
      targets: targetCard.container,
      alpha: 0.42,
      duration: 300,
      ease: 'Power2'
    });
    targetCard.container.list.forEach((child) => {
      if (child.setTint) {
        child.setTint(0x777777);
      }
    });
  }

  onBattleVictory(data) {
    this.battleEnded = true;
    if (this.pauseOverlay) {
      this.closePauseOverlay(false);
    }
    this.showResultOverlay('胜利', data, () => this.continueToNextFloor(), Const.BATTLE.COLORS.SACRED);
  }

  onBattleDefeat(data) {
    this.battleEnded = true;
    if (this.pauseOverlay) {
      this.closePauseOverlay(false);
    }
    this.showResultOverlay('失败', data, () => this.returnToBase(), Const.BATTLE.COLORS.CORRUPT);
  }

  showResultOverlay(title, data, callback, color) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const blocker = this.add.zone(width / 2, height / 2, width, height);
    blocker.setDepth(Const.DEPTH.MODAL_OVERLAY + 19);
    blocker.setInteractive();
    blocker.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
    });

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.72);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(Const.DEPTH.MODAL_OVERLAY + 20);

    const panel = this.add.container(width / 2, height / 2);
    panel.setDepth(Const.DEPTH.MODAL_CONTENT + 20);

    const bg = this.add.graphics();
    bg.fillStyle(0x11131f, 0.98);
    bg.lineStyle(2, color, 0.85);
    bg.fillRect(-128, -82, 256, 164);
    bg.strokeRect(-128, -82, 256, 164);
    panel.add(bg);

    panel.add(this.add.text(0, -42, title, {
      fontSize: '28px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Phaser.Display.Color.IntegerToColor(color).rgba
    }).setOrigin(0.5));

    const rewardText = title === '胜利'
      ? `菌丝 ${data?.rewards?.mycelium || 0}${data?.rewards?.sourceCore ? `  源核 ${data.rewards.sourceCore}` : ''}`
      : '角色将安全返回基地';
    panel.add(this.add.text(0, -2, rewardText, {
      fontSize: '13px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_PRIMARY
    }).setOrigin(0.5));

    const button = this.createPillButton(0, 46, title === '胜利' ? '继续' : '返回', callback, 120, 36);
    panel.add(button);

    const buttonZone = this.add.zone(width / 2, height / 2 + 46, 144, 52);
    buttonZone.setDepth(Const.DEPTH.MODAL_UI + 20);
    buttonZone.setInteractive(new Phaser.Geom.Rectangle(-72, -26, 144, 52), Phaser.Geom.Rectangle.Contains);
    buttonZone.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.();
      callback();
    });
  }

  continueToNextFloor() {
    if (this.onStageVictory) {
      this.onStageVictory({
        stageId: this.stageId,
        enemies: this.enemies,
        rewards: this.battleSystem?.calculateRewards?.() || {}
      });
      return;
    }

    EventBus.emit('battle:victory', {
      floor: this.currentFloor,
      enemies: this.enemies,
      rewards: this.battleSystem?.calculateRewards?.() || {}
    });
  }

  returnToBase() {
    if (this.battleSystem) {
      this.battleSystem.pause();
    }
    if (this.onStageDefeat) {
      this.onStageDefeat({
        stageId: this.stageId,
        enemies: this.enemies
      });
      return;
    }

    EventBus.emit('battle:defeat', { floor: this.currentFloor, enemies: this.enemies });
  }

  shutdown() {
    this.closeBattleCardDetail(false);
    if (this._battleListeners && this.battleSystem) {
      Object.entries(this._battleListeners).forEach(([event, callback]) => {
        this.battleSystem.off(event, callback);
      });
    }
    this.closePauseOverlay(false);
    this.tweens.killAll();
  }
}

