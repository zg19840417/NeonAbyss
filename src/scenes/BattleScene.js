import BattleSystem, { BattlePhase, Enemy } from '../game/systems/BattleSystem.js';
import EventBus from '../game/EventBus.js';
import MinionCard from '../game/entities/MinionCard.js';
import Const from '../game/data/Const.js';

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    this.config = this.initConfig();
  }

  initConfig() {
    return {
      colors: {
        bgDark: Const.BATTLE.COLORS.BG_DARK,
        bgMid: Const.BATTLE.COLORS.BG_MID,
        border: Const.BATTLE.COLORS.BORDER,
        amber: Const.BATTLE.COLORS.AMBER,
        sacred: Const.BATTLE.COLORS.SACRED,
        corrupt: Const.BATTLE.COLORS.CORRUPT,
        textPrimary: Const.BATTLE.COLORS.TEXT_PRIMARY,
        textSecondary: Const.BATTLE.COLORS.TEXT_SECONDARY,
        hpGreen: Const.BATTLE.COLORS.HP_GREEN,
        hpRed: Const.BATTLE.COLORS.HP_RED
      },
      layout: {
        cardWidth: Const.BATTLE.LAYOUT.CARD_WIDTH,
        cardHeight: Const.BATTLE.LAYOUT.CARD_HEIGHT,
        enemyCardWidth: Const.BATTLE.LAYOUT.ENEMY_CARD_WIDTH,
        enemyCardHeight: Const.BATTLE.LAYOUT.ENEMY_CARD_HEIGHT
      },
      animation: {
        attackDuration: Const.BATTLE.LAYOUT.ATTACK_DURATION,
        returnDuration: Const.BATTLE.LAYOUT.RETURN_DURATION
      }
    };
  }

  init(data) {
    this.currentFloor = data.floor || 1;
    this.currentDimension = data.dimension || 1;
    this.enemies = data.enemies || [];
    this.minions = data.minions || [];
    this.equipmentCard = data.equipmentCard || null;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.initializeBattle();
    this.createBackground(width, height);
    this.createHeader(width, height);
    this.createEnemyArea(width, height);
    this.createPlayerArea(width, height);
    this.createBattleLog(width, height);
    this.createBottomPanel(width, height);

    this.setupBattleSystem();
    this.startBattle();
  }

  initializeBattle() {
    if (this.enemies.length === 0) {
      this.enemies = [
        { id: 1, name: '机械猎犬', hp: 80, maxHp: 80, atk: 15, level: 1, isBoss: false }
      ];
    }

    if (this.minions.length === 0) {
      const minionManager = window.gameData?.minionCardManager;
      if (minionManager?.deployedCards) {
        minionManager.deployedCards.forEach(id => {
          const cardData = minionManager.ownedCards?.find(c => c.id === id);
          if (cardData) {
            this.minions.push(MinionCard.fromJSON(cardData));
          }
        });
      }
    }

    if (this.minions.length === 0) {
      this.minions = [
        { id: 'temp_1', name: '炎魔卫士', hp: 150, maxHp: 150, atk: 25, isMinionCard: true, rarity: 'N', race: 'plant', passiveSkill: null },
        { id: 'temp_2', name: '寒冰射手', hp: 100, maxHp: 100, atk: 30, isMinionCard: true, rarity: 'R', race: 'plant', passiveSkill: null }
      ].map(m => MinionCard.fromJSON ? MinionCard.fromJSON(m) : new MinionCard(m));
    }

    if (!window.gameData.chipCardManager && this.equipmentCard) {
      window.gameData.chipCardManager = {
        ownedCards: [this.equipmentCard],
        equippedCardId: this.equipmentCard.id
      };
    }

    this.isPaused = false;
    this.battleEnded = false;
  }

  createBackground(width, height) {
    this.add.graphics()
      .fillGradientStyle(
        this.config.colors.bgDark, this.config.colors.bgDark,
        0x2d2824, 0x2d2824,
        1
      )
      .fillRect(0, 0, width, height);
  }

  createHeader(width, height) {
    const headerY = 50;

    const bossLabel = this.currentFloor % 10 === 0 ? ' BOSS' : '';
    this.floorText = this.add.text(width / 2, headerY - 10, `第 ${this.currentFloor} 层${bossLabel}`, {
      fontSize: Const.BATTLE.FONT.SIZE_FLOOR_TITLE,
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: this.config.colors.amber
    }).setOrigin(0.5);

    this.dimensionText = this.add.text(width / 2, headerY + 15, `次元 ${this.currentDimension}`, {
      fontSize: Const.BATTLE.FONT.SIZE_DIMENSION,
      fontFamily: 'Noto Sans SC',
      color: this.config.colors.textSecondary
    }).setOrigin(0.5);

    this.backButton = this.createCircleButton(30, 40, '←', () => {
      this.returnToBase();
    });
  }

  createCircleButton(x, y, text, callback) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x2a2520, 0.8);
    bg.fillCircle(0, 0, 18);
    bg.lineStyle(1, this.config.colors.border, 0.5);
    bg.strokeCircle(0, 0, 18);

    const label = this.add.text(0, 0, text, {
      fontSize: Const.BATTLE.FONT.SIZE_CIRCLE_BTN,
      fontFamily: 'Arial',
      color: this.config.colors.textSecondary
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, 18), Phaser.Geom.Circle.Contains);

    container.on('pointerover', () => {
      label.setColor('#d4a574');
      bg.clear()
        .fillStyle(0x3a3530, 0.9)
        .fillCircle(0, 0, 18)
        .lineStyle(1, this.config.colors.amber, 0.7)
        .strokeCircle(0, 0, 18);
    });
    
    container.on('pointerout', () => {
      label.setColor(this.config.colors.textSecondary);
      bg.clear()
        .fillStyle(0x2a2520, 0.8)
        .fillCircle(0, 0, 18)
        .lineStyle(1, this.config.colors.border, 0.5)
        .strokeCircle(0, 0, 18);
    });
    
    container.on('pointerdown', callback);

    return container;
  }

  createEnemyArea(width, height) {
    const areaY = 160;

    this.add.text(width / 2, areaY - 30, '敌方', {
      fontSize: Const.BATTLE.FONT.SIZE_AREA_LABEL,
      fontFamily: 'Noto Sans SC',
      color: this.config.colors.textSecondary
    }).setOrigin(0.5);

    this.enemyCards = [];
    const cardWidth = this.config.layout.enemyCardWidth;
    const totalWidth = this.enemies.length * cardWidth + (this.enemies.length - 1) * 20;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;

    this.enemies.forEach((enemy, index) => {
      const x = startX + index * (cardWidth + 20);
      const card = this.createEnemyCard(x, areaY + 40, enemy);
      this.enemyCards.push(card);
    });
  }

  createEnemyCard(x, y, enemy) {
    const container = this.add.container(x, y);
    const { colors, layout } = this.config;
    const cardWidth = layout.enemyCardWidth;
    const cardHeight = layout.enemyCardHeight;

    const bg = this.add.graphics();
    bg.fillStyle(0x2a2520, 0.95);
    bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);
    bg.lineStyle(2, enemy.isBoss ? colors.corrupt : colors.border, 0.8);
    bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);

    const nameText = this.add.text(0, -cardHeight / 2 + 20, enemy.name, {
      fontSize: Const.BATTLE.FONT.SIZE_ENEMY_NAME,
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: colors.textPrimary
    }).setOrigin(0.5);

    const levelText = this.add.text(0, -cardHeight / 2 + 40, `Lv.${enemy.level || 1}`, {
      fontSize: Const.BATTLE.FONT.SIZE_ENEMY_LEVEL,
      fontFamily: 'Noto Sans SC',
      color: colors.textSecondary
    }).setOrigin(0.5);

    const portraitBg = this.add.graphics();
    portraitBg.fillStyle(0x1a1815, 1);
    portraitBg.fillRect(-cardWidth / 2 + 10, -cardHeight / 2 + 55, cardWidth - 20, 80);
    portraitBg.lineStyle(1, colors.border, 0.3);
    portraitBg.strokeRect(-cardWidth / 2 + 10, -cardHeight / 2 + 55, cardWidth - 20, 80);

    const portraitPlaceholder = this.add.text(0, -cardHeight / 2 + 95, enemy.isBoss ? '👹' : '🤖', {
      fontSize: Const.BATTLE.FONT.SIZE_ENEMY_PORTRAIT
    }).setOrigin(0.5);

    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x1a1815, 1);
    hpBarBg.fillRect(-cardWidth / 2 + 10, cardHeight / 2 - 45, cardWidth - 20, 16);

    const hpBar = this.add.graphics();
    const hpPercent = enemy.hp / enemy.maxHp;
    hpBar.fillStyle(colors.hpRed, 1);
    hpBar.fillRect(-cardWidth / 2 + 11, cardHeight / 2 - 44, (cardWidth - 22) * hpPercent, 14);

    const hpText = this.add.text(0, cardHeight / 2 - 37, `${enemy.hp}/${enemy.maxHp}`, {
      fontSize: Const.BATTLE.FONT.SIZE_ENEMY_HP,
      fontFamily: 'Noto Sans SC',
      color: '#ffffff'
    }).setOrigin(0.5);

    const atkText = this.add.text(0, cardHeight / 2 - 20, `⚔️ ${enemy.atk || 15}`, {
      fontSize: Const.BATTLE.FONT.SIZE_ENEMY_ATK,
      fontFamily: 'Noto Sans SC',
      color: colors.textSecondary
    }).setOrigin(0.5);

    container.add([bg, nameText, levelText, portraitBg, portraitPlaceholder, hpBarBg, hpBar, hpText, atkText]);
    container.setData('enemy', enemy);
    container.setData('hpBar', hpBar);
    container.setData('hpText', hpText);
    container.setData('hpBarBg', hpBarBg);

    return container;
  }

  createPlayerArea(width, height) {
    const areaY = 420;

    this.add.text(width / 2, areaY - 20, '我方', {
      fontSize: Const.BATTLE.FONT.SIZE_AREA_LABEL,
      fontFamily: 'Noto Sans SC',
      color: this.config.colors.textSecondary
    }).setOrigin(0.5);

    this.playerCards = [];
    const cardWidth = this.config.layout.cardWidth;
    const totalWidth = this.minions.length * cardWidth + (this.minions.length - 1) * 15;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;

    this.minions.forEach((minion, index) => {
      const x = startX + index * (cardWidth + 15);
      const card = this.createPlayerCard(x, areaY + 50, minion);
      this.playerCards.push({ container: card, minion });
    });
  }

  createPlayerCard(x, y, minion) {
    const container = this.add.container(x, y);
    const { colors, layout } = this.config;
    const cardWidth = layout.cardWidth;
    const cardHeight = layout.cardHeight;

    const bg = this.add.graphics();
    bg.fillStyle(0x2a2520, 0.95);
    bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 6);
    bg.lineStyle(2, colors.sacred, 0.5);
    bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 6);

    const nameText = this.add.text(0, -cardHeight / 2 + 15, minion.name, {
      fontSize: Const.BATTLE.FONT.SIZE_PLAYER_NAME,
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: colors.textPrimary
    }).setOrigin(0.5);

    const levelText = this.add.text(0, -cardHeight / 2 + 30, `Lv.${minion.level || 1}`, {
      fontSize: Const.BATTLE.FONT.SIZE_PLAYER_LEVEL,
      fontFamily: 'Noto Sans SC',
      color: colors.textSecondary
    }).setOrigin(0.5);

    const portraitBg = this.add.graphics();
    portraitBg.fillStyle(0x1a1815, 1);
    portraitBg.fillRect(-cardWidth / 2 + 8, -cardHeight / 2 + 40, cardWidth - 16, 45);
    portraitBg.lineStyle(1, colors.border, 0.3);
    portraitBg.strokeRect(-cardWidth / 2 + 8, -cardHeight / 2 + 40, cardWidth - 16, 45);

    const portraitPlaceholder = this.add.text(0, -cardHeight / 2 + 62, '🧑', {
      fontSize: Const.BATTLE.FONT.SIZE_PLAYER_PORTRAIT
    }).setOrigin(0.5);

    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x1a1815, 1);
    hpBarBg.fillRect(-cardWidth / 2 + 8, cardHeight / 2 - 30, cardWidth - 16, 12);

    const hpBar = this.add.graphics();
    const hpPercent = minion.hp / minion.maxHp;
    hpBar.fillStyle(colors.hpGreen, 1);
    hpBar.fillRect(-cardWidth / 2 + 9, cardHeight / 2 - 29, (cardWidth - 18) * hpPercent, 10);

    const hpText = this.add.text(0, cardHeight / 2 - 23, `${minion.hp}/${minion.maxHp}`, {
      fontSize: Const.BATTLE.FONT.SIZE_PLAYER_HP,
      fontFamily: 'Noto Sans SC',
      color: '#ffffff'
    }).setOrigin(0.5);

    const atkText = this.add.text(0, cardHeight / 2 - 10, `⚔️${minion.atk || 20}`, {
      fontSize: Const.BATTLE.FONT.SIZE_PLAYER_ATK,
      fontFamily: 'Noto Sans SC',
      color: colors.textSecondary
    }).setOrigin(0.5);

    container.add([bg, nameText, levelText, portraitBg, portraitPlaceholder, hpBarBg, hpBar, hpText, atkText]);
    container.setData('player', minion);
    container.setData('hpBar', hpBar);
    container.setData('hpText', hpText);
    container.setData('hpBarBg', hpBarBg);

    return container;
  }

  createBattleLog(width, height) {
    const logY = 560;
    const logHeight = 100;

    const logBg = this.add.graphics();
    logBg.fillStyle(0x1a1815, 0.8);
    logBg.fillRoundedRect(20, logY, width - 40, logHeight, 6);
    logBg.lineStyle(1, this.config.colors.border, 0.3);
    logBg.strokeRoundedRect(20, logY, width - 40, logHeight, 6);

    this.battleLogTexts = [];
    for (let i = 0; i < 3; i++) {
      const text = this.add.text(30, logY + 12 + i * 28, '', {
        fontSize: Const.BATTLE.FONT.SIZE_LOG,
        fontFamily: 'Noto Sans SC',
        color: this.config.colors.textSecondary,
        wordWrap: { width: width - 60 }
      });
      this.battleLogTexts.push(text);
    }
  }

  createBottomPanel(width, height) {
    const panelY = 700;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a1815, 0.9);
    panelBg.fillRect(0, panelY - 30, width, 100);

    this.pauseButton = this.createCircleButton(width / 2 - 60, panelY + 20, '⏸', () => {
      this.togglePause();
    });

    this.returnButton = this.createActionButton(width / 2 + 60, panelY + 20, '返回基地', () => {
      this.returnToBase();
    });
  }

  createActionButton(x, y, text, callback) {
    const container = this.add.container(x, y);
    const btnWidth = 100;
    const btnHeight = 36;

    const bg = this.add.graphics();
    bg.fillStyle(0x3a3530, 0.9);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
    bg.lineStyle(1, this.config.colors.border, 0.5);
    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);

    const label = this.add.text(0, 0, text, {
      fontSize: Const.BATTLE.FONT.SIZE_BUTTON,
      fontFamily: 'Noto Sans SC',
      color: this.config.colors.textPrimary
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear()
        .fillStyle(0x4a4540, 0.9)
        .fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6)
        .lineStyle(1, this.config.colors.amber, 0.7)
        .strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
      label.setColor(this.config.colors.amber);
    });
    
    container.on('pointerout', () => {
      bg.clear()
        .fillStyle(0x3a3530, 0.9)
        .fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6)
        .lineStyle(1, this.config.colors.border, 0.5)
        .strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
      label.setColor(this.config.colors.textPrimary);
    });
    
    container.on('pointerdown', callback);

    return container;
  }

  setupBattleSystem() {
    this.battleSystem = new BattleSystem(this, { battleSpeed: 1 });

    this.battleSystem.setPlayerTeam(this.minions.map(m => ({
      id: m.id,
      name: m.name,
      hp: m.hp,
      maxHp: m.maxHp,
      atk: m.atk || 20,
      critRate: m.critRate || 0.15,
      def: m.def || 5,
      isMinionCard: m.isMinionCard || true,
      rarity: m.rarity,
      race: m.race,
      passiveSkill: m.passiveSkill,
      element: m.element
    })));
    
    this.battleSystem.setEnemyTeam(this.enemies.map(e => new Enemy({
      id: e.id,
      name: e.name,
      hp: e.hp,
      maxHp: e.maxHp,
      atk: e.atk || 15,
      critRate: 0.1,
      def: 5,
      level: e.level,
      isBoss: e.isBoss
    })));

    this._battleListeners = {
      onAttack: (data) => this.updateHPDisplay(data.target),
      onDamage: (data) => { if (data.isCrit) this.showDamageNumber(data.target, data.damage, true); },
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

  onAttackAnimation(attacker, target, isCrit, onComplete) {
    const isPlayer = this.minions.some(m => m.name === attacker.name);
    const targetCards = isPlayer ? this.enemyCards : this.playerCards;
    
    const targetCard = targetCards.find(card => {
      const entity = card.container.getData(isPlayer ? 'enemy' : 'player');
      return entity && entity.name === target.name;
    });

    if (targetCard) {
      const originalX = targetCard.container.x;
      const shakeX = isPlayer ? originalX - 10 : originalX + 10;
      
      this.tweens.add({
        targets: targetCard.container,
        x: shakeX,
        duration: this.config.animation.attackDuration / 2,
        ease: 'Power2',
        yoyo: true,
        onComplete: () => {
          if (isCrit) {
            this.showCritEffect(targetCard.container);
          }
          onComplete();
        }
      });
    } else {
      onComplete();
    }
  }

  showCritEffect(container) {
    const critText = this.add.text(container.x, container.y - 60, '暴击!', {
      fontSize: Const.BATTLE.FONT.SIZE_CRIT_LABEL,
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: Const.BATTLE.COLORS.CRIT_GOLD
    }).setOrigin(0.5);

    this.tweens.add({
      targets: critText,
      y: critText.y - 30,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => critText.destroy()
    });
  }

  onSkillAnimation(character, targets, skill, onComplete) {
    const isPlayer = this.minions.some(m => m.name === character.name);
    const skillText = this.add.text(this.cameras.main.width / 2, 120, `${character.name} 使用技能`, {
      fontSize: Const.BATTLE.FONT.SIZE_SKILL_DESC,
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: Const.BATTLE.COLORS.SKILL_PURPLE
    }).setOrigin(0.5);

    const skillLabel = this.add.text(this.cameras.main.width / 2, 150, skill.name, {
      fontSize: Const.BATTLE.FONT.SIZE_SKILL_NAME,
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: Const.BATTLE.COLORS.SKILL_PURPLE
    }).setOrigin(0.5);

    this.tweens.add({
      targets: skillLabel,
      alpha: 0,
      scale: 1.2,
      duration: 800,
      ease: 'Power2',
      onComplete: () => skillLabel.destroy()
    });

    for (const target of targets) {
      const targetCards = isPlayer ? this.enemyCards : this.playerCards;
      const targetCard = targetCards.find(card => {
        const entity = card.container.getData(isPlayer ? 'enemy' : 'player');
        return entity && entity.name === target.name;
      });

      if (targetCard) {
        const particle = this.add.graphics();
        particle.fillStyle(0x9b59b6, 0.8);
        particle.fillCircle(0, 0, 15);
        particle.x = targetCard.container.x;
        particle.y = targetCard.container.y;

        this.tweens.add({
          targets: particle,
          alpha: 0,
          scale: 2,
          duration: 500,
          ease: 'Power2',
          onComplete: () => particle.destroy()
        });
      }
    }

    onComplete();
  }

  showDamageNumber(target, damage, isCrit, isHeal) {
    const isPlayer = this.minions.some(m => m.name === target.name);
    const targetCards = isPlayer ? this.playerCards : this.enemyCards;

    const targetCard = targetCards.find(card => {
      const entity = card.container.getData(isPlayer ? 'player' : 'enemy');
      return entity && entity.name === target.name;
    });

    if (targetCard) {
      const prefix = isHeal ? '+' : '-';
      const color = isHeal ? '#44ff44' : (isCrit ? '#ff4444' : '#ffffff');
      const fontSize = isHeal ? Const.BATTLE.FONT.SIZE_DAMAGE_HEAL
        : (isCrit ? Const.BATTLE.FONT.SIZE_DAMAGE_CRIT : Const.BATTLE.FONT.SIZE_DAMAGE_NORMAL);

      const damageText = this.add.text(targetCard.container.x, targetCard.container.y - 40, `${prefix}${damage}`, {
        fontSize: fontSize,
        fontFamily: 'Noto Sans SC',
        fontStyle: 'bold',
        color: color
      }).setOrigin(0.5).setScale(0.5).setAlpha(0);

      // 弹跳动画：放大到1.3再缩回1.0，同时alpha→1
      this.tweens.add({
        targets: damageText,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 1,
        duration: 100,
        ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: damageText,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 100,
            ease: 'Power2',
            onComplete: () => {
              // 上浮+淡出
              this.tweens.add({
                targets: damageText,
                y: damageText.y - 30,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => damageText.destroy()
              });
            }
          });
        }
      });
    }
  }

  playDeathAnimation(character) {
    const isPlayer = this.playerTeam?.includes(character);
    const cards = isPlayer ? this.playerCards : this.enemyCards;
    const card = cards?.find(c => {
      const entity = c.container?.getData(isPlayer ? 'player' : 'enemy');
      return entity === character;
    });
    if (card?.container) {
      this.tweens.add({
        targets: card.container,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        angle: 15,
        duration: 600,
        ease: 'Power2'
      });
    }
  }

  updateHPDisplay(entity) {
    const isPlayer = this.minions.some(m => m.name === entity.name);

    if (isPlayer) {
      const minion = this.minions.find(m => m.name === entity.name);
      if (minion) {
        minion.currentHp = entity.currentHp;
        const card = this.playerCards.find(c => c.minion?.name === entity.name);
        if (card) {
          this.redrawHPBar(card.container, entity.currentHp, entity.maxHp, true);
        }
      }
    } else {
      const enemy = this.enemies.find(e => e.name === entity.name);
      if (enemy) {
        enemy.hp = entity.currentHp;
        const card = this.enemyCards.find(c => c.getData('enemy').name === entity.name);
        if (card) {
          this.redrawHPBar(card, entity.currentHp, entity.maxHp, false);
        }
      }
    }
  }

  redrawHPBar(container, currentHp, maxHp, isPlayer) {
    const { colors, layout } = this.config;
    const cardWidth = isPlayer ? layout.cardWidth : layout.enemyCardWidth;
    const hpBar = container.getData('hpBar');
    const hpText = container.getData('hpText');
    
    if (hpBar && hpText) {
      hpBar.clear();
      const hpPercent = Math.max(0, currentHp / maxHp);
      hpBar.fillStyle(isPlayer ? colors.hpGreen : colors.hpRed, 1);
      const barWidth = isPlayer ? cardWidth - 18 : cardWidth - 22;
      hpBar.fillRect(
        isPlayer ? -cardWidth / 2 + 9 : -cardWidth / 2 + 11,
        isPlayer ? layout.cardHeight / 2 - 29 : layout.enemyCardHeight / 2 - 44,
        barWidth * hpPercent,
        isPlayer ? 10 : 14
      );
      hpText.setText(`${Math.max(0, currentHp)}/${maxHp}`);
    }
  }

  addLogEntry(action, result) {
    for (let i = 0; i < this.battleLogTexts.length - 1; i++) {
      this.battleLogTexts[i].setText(this.battleLogTexts[i + 1].text);
    }
    this.battleLogTexts[this.battleLogTexts.length - 1].setText(`${action} ${result}`);
  }

  onBattleVictory(data) {
    this.battleEnded = true;
    this.showVictoryOverlay(data);
  }

  onBattleDefeat(data) {
    this.battleEnded = true;
    this.showDefeatOverlay(data);
  }

  showVictoryOverlay(data) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setAlpha(0);

    const panel = this.add.container(width / 2, height / 2);
    panel.setAlpha(0);
    panel.setScale(0.8);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x252220, 0.98);
    panelBg.fillRoundedRect(-120, -80, 240, 160, 12);
    panelBg.lineStyle(2, this.config.colors.sacred, 0.8);
    panelBg.strokeRoundedRect(-120, -80, 240, 160, 12);

    const victoryText = this.add.text(0, -50, '胜利!', {
      fontSize: Const.BATTLE.FONT.SIZE_VICTORY,
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: this.config.colors.sacred
    }).setOrigin(0.5);

    const myceliumReward = data.rewards?.mycelium || 0;
    const sourceCoreReward = data.rewards?.sourceCore || 0;
    const rewardText = this.add.text(0, -10, `获得菌丝: ${myceliumReward}` + (sourceCoreReward > 0 ? `  源核: ${sourceCoreReward}` : ''), {
      fontSize: Const.BATTLE.FONT.SIZE_REWARD,
      fontFamily: 'Noto Sans SC',
      color: this.config.colors.amber
    }).setOrigin(0.5);

    const nextButton = this.createActionButton(0, 50, '继续战斗', () => {
      overlay.destroy();
      panel.destroy();
      this.continueToNextFloor();
    });

    panel.add([panelBg, victoryText, rewardText, nextButton]);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 300
    });

    this.tweens.add({
      targets: panel,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  showDefeatOverlay(data) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setAlpha(0);

    const panel = this.add.container(width / 2, height / 2);
    panel.setAlpha(0);
    panel.setScale(0.8);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x252220, 0.98);
    panelBg.fillRoundedRect(-120, -80, 240, 160, 12);
    panelBg.lineStyle(2, this.config.colors.corrupt, 0.8);
    panelBg.strokeRoundedRect(-120, -80, 240, 160, 12);

    const defeatText = this.add.text(0, -50, '任务失败', {
      fontSize: Const.BATTLE.FONT.SIZE_DEFEAT,
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: this.config.colors.corrupt
    }).setOrigin(0.5);

    const hintText = this.add.text(0, -10, '角色将安全返回基地', {
      fontSize: Const.BATTLE.FONT.SIZE_HINT,
      fontFamily: 'Noto Sans SC',
      color: this.config.colors.textSecondary
    }).setOrigin(0.5);

    const returnButton = this.createActionButton(0, 50, '返回基地', () => {
      overlay.destroy();
      panel.destroy();
      this.returnToBase();
    });

    panel.add([panelBg, defeatText, hintText, returnButton]);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 300
    });

    this.tweens.add({
      targets: panel,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  continueToNextFloor() {
    EventBus.emit('battle:victory', { floor: this.currentFloor });
  }

  generateNewEnemies(floor) {
    const isBossFloor = floor % 10 === 0;
    const enemyCount = isBossFloor ? 1 : Math.min(3, 1 + Math.floor(floor / 15));
    const enemies = [];

    const enemyTypes = ['机械猎犬', '巡逻机甲', '变异蜘蛛', '炮台', '腐化者'];
    
    for (let i = 0; i < enemyCount; i++) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const hpScale = Math.pow(1.12, floor - 1);
      const atkScale = Math.pow(1.10, floor - 1);
      
      enemies.push({
        id: floor * 10 + i,
        name: type,
        hp: Math.floor(80 * hpScale),
        maxHp: Math.floor(80 * hpScale),
        atk: Math.floor(15 * atkScale),
        level: floor,
        isBoss: isBossFloor
      });
    }
    
    return enemies;
  }

  returnToBase() {
    if (this.battleSystem) {
      this.battleSystem.pause();
    }
    
    EventBus.emit('battle:defeat', { floor: this.currentFloor });
    
    this.scene.start('BaseScene');
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.battleSystem.pause();
      if (this.pauseButton) {
        this.pauseButton.list[1].setText('▶');
      }
    } else {
      this.battleSystem.resume();
      if (this.pauseButton) {
        this.pauseButton.list[1].setText('⏸');
      }
    }
  }

  shutdown() {
    if (this.battleSystem) {
      if (this._battleListeners) {
        Object.entries(this._battleListeners).forEach(([event, callback]) => {
          this.battleSystem.off(event, callback);
        });
        this._battleListeners = null;
      }
      this.battleSystem.pause();
    }
    this.tweens.killAll();
  }
}
