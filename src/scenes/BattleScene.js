import BattleSystem from '../game/systems/BattleSystem.js';
import EventBus from '../game/EventBus.js';
import MinionCard from '../game/entities/MinionCard.js';
import Const from '../game/data/Const.js';
import CardRenderer from '../game/utils/CardRenderer.js';
import { extractPortraitKey } from '../game/utils/PortraitRegistry.js';

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
  }

  init(data) {
    this.currentFloor = data.floor || 1;
    this.currentDimension = data.dimension || 1;
    this.stageName = data.stageName || `禁区 第${this.currentFloor}层`;
    this.enemies = data.enemies || [];
    this.minions = data.minions || data.players || [];
    this.equipmentCard = data.equipmentCard || data.chipCard || null;
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
      const minionManager = window.gameData?.minionCardManager;
      if (minionManager?.deployedCards) {
        minionManager.deployedCards.forEach((id) => {
          const cardData = minionManager.ownedCards?.find((c) => c.id === id);
          if (cardData) {
            this.minions.push(MinionCard.fromJSON(cardData));
          }
        });
      }
    }

    if (this.minions.length === 0) {
      this.minions = [
        { id: 'temp_1', name: '炎魔卫士', hp: 150, maxHp: 150, atk: 25, spd: 12, isMinionCard: true, rarity: 'N', race: 'plant', element: 'fire' },
        { id: 'temp_2', name: '寒冰射手', hp: 100, maxHp: 100, atk: 30, spd: 18, isMinionCard: true, rarity: 'R', race: 'plant', element: 'water' }
      ].map((m) => (MinionCard.fromJSON ? MinionCard.fromJSON(m) : new MinionCard(m)));
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

    this.roundValueText = this.add.text(20, 24, '第 1 回合', {
      fontSize: '13px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_SECONDARY
    }).setOrigin(0, 0.5);

    this.add.text(width / 2, 24, this.stageName, {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.BATTLE.COLORS.AMBER
    }).setOrigin(0.5);
  }

  createEnemyArea(width) {
    this.enemyCards = [];
    this.enemyY = 166;
    this.add.text(24, 72, '敌方阵列', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_SECONDARY
    }).setOrigin(0, 0.5);
    const positions = this.getRowPositions(width, this.enemies.length);

    this.enemies.forEach((enemy, index) => {
      const card = this.createBattleCard(positions[index], this.enemyY, enemy, false);
      this.enemyCards.push({ container: card, enemy });
    });
  }

  createPlayerArea(width) {
    this.playerCards = [];
    this.playerY = 450;
    this.add.text(24, 356, '我方阵列', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_SECONDARY
    }).setOrigin(0, 0.5);
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

  createBattleCard(x, y, unit, isPlayer) {
    const quality = isPlayer ? (RARITY_TO_QUALITY[unit.rarity] || 'N') : (unit.isBoss ? 'SSR' : 'N');
    const currentHp = unit.currentHp ?? unit.hp ?? unit.maxHp ?? 0;
    const maxHp = unit.maxHp ?? unit.hp ?? 0;
    const card = CardRenderer.createMinionCard(this, {
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
      interactive: false,
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
    const y = 628;
    const h = 36;
    this.logBar = this.add.container(width / 2, y);
    this.logBar.setDepth(Const.DEPTH.CONTENT + 3);

    const bg = this.add.graphics();
    bg.fillStyle(0x11131f, 0.95);
    bg.lineStyle(1, Const.BATTLE.COLORS.BORDER, 0.6);
    bg.fillRoundedRect(-(width - 24) / 2, -h / 2, width - 24, h, 10);
    bg.strokeRoundedRect(-(width - 24) / 2, -h / 2, width - 24, h, 10);
    this.logBar.add(bg);

    this.logBarLabel = this.add.text(-(width - 50) / 2, 0, '[战斗日志] 战斗开始', {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.BATTLE.COLORS.TEXT_SECONDARY
    }).setOrigin(0, 0.5);
    this.logBar.add(this.logBarLabel);

    this.logBar.setSize(width - 24, h);
    this.logBar.setInteractive(new Phaser.Geom.Rectangle(-(width - 24) / 2, -h / 2, width - 24, h), Phaser.Geom.Rectangle.Contains);
    this.logBar.on('pointerdown', () => this.openPauseOverlay());
  }

  createBottomPanel(width, height) {
    const panelY = height - 34;
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
    container.add([bg, text]);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, 18), Phaser.Geom.Circle.Contains);
    container.on('pointerdown', callback);
    return container;
  }

  createPillButton(x, y, label, callback, width = 76, height = 28) {
    const container = this.add.container(x, y);
    container.setDepth(Const.DEPTH.CONTENT + 3);
    const bg = this.add.graphics();
    bg.fillStyle(0x1c2032, 0.96);
    bg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    const text = this.add.text(0, 0, label, {
      fontSize: '12px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(width, height);
    container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', callback);
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x24324a, 1);
      bg.lineStyle(1, Const.COLORS.BUTTON_HOVER, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    });
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1c2032, 0.96);
      bg.lineStyle(1, Const.COLORS.BUTTON_CYAN, 0.8);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 14);
    });
    container.label = text;
    return container;
  }

  setupBattleSystem() {
    this.battleSystem = new BattleSystem(this, { battleSpeed: 1 });
    this.battleSystem.setPlayerTeam(this.minions.map((m) => ({
      id: m.id,
      name: m.name,
      hp: m.maxHp || m.hp,
      maxHp: m.maxHp || m.hp,
      atk: m.atk || 20,
      critRate: m.critRate || 0.15,
      def: m.def || 5,
      isMinionCard: m.isMinionCard || true,
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
    if (!this.battleSystem) return;
    this.battleSystem.battleSpeed = this.battleSystem.battleSpeed === 1 ? 2 : 1;
    if (this.speedButton?.label) {
      this.speedButton.label.setText(`${this.battleSystem.battleSpeed}x`);
    }
  }

  openPauseOverlay() {
    if (this.pauseOverlay || this.battleEnded) return;
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
    overlay.fillRoundedRect(-width / 2 + 12, -296, width - 24, 592, 16);
    overlay.lineStyle(1.5, Const.BATTLE.COLORS.BORDER, 0.8);
    overlay.strokeRoundedRect(-width / 2 + 12, -296, width - 24, 592, 16);
    container.add(overlay);

    container.add(this.add.text(0, -264, '战斗日志', {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.BATTLE.COLORS.AMBER
    }).setOrigin(0.5));

    const maxLines = 16;
    const shown = this.logEntries.slice(-maxLines);
    shown.forEach((entry, index) => {
      container.add(this.add.text(-width / 2 + 28, -226 + index * 28, entry, {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.BATTLE.COLORS.TEXT_PRIMARY,
        wordWrap: { width: width - 56 }
      }).setOrigin(0, 0));
    });

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
      this.logBarLabel.setText(`[战斗日志] ${entry}`);
    }
    if (this.pauseOverlay) {
      this.closePauseOverlay(false);
      this.openPauseOverlay();
    }
  }

  showDamageNumber(target, amount, isCrit = false, isHeal = false) {
    const targetCard = this.findCardEntry(target);
    if (!targetCard?.container || !amount) return;

    const prefix = isHeal ? '+' : '-';
    const color = isHeal ? '#57f287' : (isCrit ? '#ff8a65' : '#ffffff');
    const fontSize = isCrit ? '20px' : '14px';
    const damageText = this.add.text(targetCard.container.x, targetCard.container.y - 56, `${prefix}${amount}`, {
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
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.72);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(Const.DEPTH.MODAL_OVERLAY + 20);

    const panel = this.add.container(width / 2, height / 2);
    panel.setDepth(Const.DEPTH.MODAL_CONTENT + 20);

    const bg = this.add.graphics();
    bg.fillStyle(0x11131f, 0.98);
    bg.lineStyle(2, color, 0.85);
    bg.fillRoundedRect(-128, -82, 256, 164, 16);
    bg.strokeRoundedRect(-128, -82, 256, 164, 16);
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

    const button = this.createPillButton(0, 46, title === '胜利' ? '继续' : '返回', callback, 96, 32);
    panel.add(button);
  }

  continueToNextFloor() {
    EventBus.emit('battle:victory', { floor: this.currentFloor });
  }

  returnToBase() {
    if (this.battleSystem) {
      this.battleSystem.pause();
    }
    EventBus.emit('battle:defeat', { floor: this.currentFloor });
    this.scene.start('BaseScene');
  }

  shutdown() {
    if (this._battleListeners && this.battleSystem) {
      Object.entries(this._battleListeners).forEach(([event, callback]) => {
        this.battleSystem.off(event, callback);
      });
    }
    this.closePauseOverlay(false);
    this.tweens.killAll();
  }
}

