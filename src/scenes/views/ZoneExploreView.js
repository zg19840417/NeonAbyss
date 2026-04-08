import Const from '../../game/data/Const.js';
import ZoneData from '../../game/data/ZoneData.js';
import EventManager from '../../game/systems/EventManager.js';
import { t } from '../../game/data/Lang.js';

export default class ZoneExploreView {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.eventManager = new EventManager(scene);
    this.container = scene.add.container(0, 60);
    this._buildLayerView();
  }

  _buildLayerView() {
    const zm = this.scene.zoneManager;
    const zoneInfo = zm.getZoneInfo();
    if (!zoneInfo) return;

    // 层数进度条
    const progressText = t('stage_progress', { current: zm.currentLayer, total: zoneInfo.totalLayers });
    this.scene.add.text(this.width / 2, 10, progressText, {
      fontSize: '14px', color: Const.BATTLE.COLORS.TEXT_PRIMARY, fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 当前层事件
    const currentEvent = zm.getCurrentEvent();
    if (!currentEvent) return;

    if (currentEvent.type === 'boss') {
      this._showBossEvent(currentEvent);
    } else {
      this._showNormalEvent(currentEvent);
    }
  }

  _showBossEvent(eventData) {
    const y = 40;
    this.scene.add.text(this.width / 2, y, t('challenge_boss'), {
      fontSize: '18px', color: Const.TEXT_COLORS.DANGER, fontFamily: 'Arial'
    }).setOrigin(0.5);

    const bossName = eventData.result?.enemies?.[0]?.name || 'Unknown Boss';
    this.scene.add.text(this.width / 2, y + 30, bossName, {
      fontSize: '14px', color: Const.TEXT_COLORS.SECONDARY, fontFamily: 'Arial'
    }).setOrigin(0.5);

    const fightBtn = this.scene.add.text(this.width / 2, y + 70, t('challenge_boss'), {
      fontSize: '16px', color: '#ffffff', backgroundColor: '#cc3333',
      padding: { x: 20, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    fightBtn.on('pointerdown', () => {
      this._enterBattle(eventData.result.enemies);
    });
  }

  _showNormalEvent(eventData) {
    const y = 40;
    const branches = this.scene.zoneManager.getBranches();

    if (branches <= 1) {
      // 无分支，直接处理事件
      this._processAndShow(eventData, y);
    } else {
      // 有分支，显示选择
      this._showBranchSelection(eventData, y, branches);
    }
  }

  _showBranchSelection(eventData, y, branchCount) {
    this.scene.add.text(this.width / 2, y, t('select_path', { count: branchCount }), {
      fontSize: '14px', color: Const.BATTLE.COLORS.TEXT_PRIMARY, fontFamily: 'Arial'
    }).setOrigin(0.5);

    const btnWidth = Math.min(120, (this.width - 40) / branchCount - 10);
    const startX = (this.width - (btnWidth * branchCount + 10 * (branchCount - 1))) / 2;

    for (let i = 0; i < branchCount; i++) {
      const bx = startX + i * (btnWidth + 10);
      const btn = this.scene.add.text(bx + btnWidth / 2, y + 40, `路径 ${i + 1}`, {
        fontSize: '13px', color: '#ffffff', backgroundColor: '#4a6a4a',
        padding: { x: 10, y: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const capturedEvent = eventData; // 闭包捕获
      btn.on('pointerdown', () => {
        this.container.removeAll();
        this._processAndShow(capturedEvent, y);
      });
    }
  }

  _processAndShow(eventData, y) {
    const processed = this.eventManager.processEvent(eventData.event || eventData);
    const result = processed.result;

    switch (processed.type) {
      case 'battle':
        this.scene.add.text(this.width / 2, y + 30, t('encounter_enemy'), {
          fontSize: '14px', color: '#ff6b6b', fontFamily: 'Arial'
        }).setOrigin(0.5);
        const fightBtn = this.scene.add.text(this.width / 2, y + 70, t('battle'), {
          fontSize: '14px', color: '#ffffff', backgroundColor: '#cc3333',
          padding: { x: 20, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        fightBtn.on('pointerdown', () => {
          this._enterBattle(result.enemies);
        });
        break;

      case 'story':
        this.scene.add.text(this.width / 2, y + 20, result.content, {
          fontSize: '13px', color: Const.TEXT_COLORS.SECONDARY, fontFamily: 'Arial',
          wordWrap: { width: this.width - 40 }, align: 'center'
        }).setOrigin(0.5, 0);
        this._showContinueButton(y + 100, result.rewards);
        break;

      case 'trade':
        this.scene.add.text(this.width / 2, y + 30, t('found_merchant'), {
          fontSize: '14px', color: Const.TEXT_COLORS.CYAN, fontFamily: 'Arial'
        }).setOrigin(0.5);
        this._showContinueButton(y + 70, result.rewards);
        break;

      case 'random':
        this.scene.add.text(this.width / 2, y + 30, result.content, {
          fontSize: '13px', color: Const.TEXT_COLORS.YELLOW, fontFamily: 'Arial',
          wordWrap: { width: this.width - 40 }, align: 'center'
        }).setOrigin(0.5, 0);
        this._showContinueButton(y + 100, result.rewards);
        break;
    }
  }

  _showContinueButton(y, rewards) {
    const btn = this.scene.add.text(this.width / 2, y, t('continue_forward'), {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#4a6a4a',
      padding: { x: 20, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      // 分发奖励
      if (rewards && rewards.length > 0) {
        this.scene.zoneManager.rewardManager.distributeRewards(rewards);
      }
      // 推进层数
      if (this.scene.zoneManager.isZoneComplete()) {
        this.scene.zoneManager.completeZone();
        this.scene.saveZoneData();
        this.scene.scene.start(Const.SCENES.WILD_STAGE);
      } else {
        this.scene.zoneManager.advanceLayer();
        this.scene.scene.restart({ zoneId: this.scene.zoneId });
      }
    });
  }

  _enterBattle(enemies) {
    if (!enemies || enemies.length === 0) return;
    this.scene.scene.start(Const.SCENES.BATTLE, {
      enemies,
      zoneId: this.scene.zoneId,
      onVictory: () => {
        // 推进层数
        if (this.scene.zoneManager.isZoneComplete()) {
          this.scene.zoneManager.completeZone();
          this.scene.saveZoneData();
          this.scene.scene.start(Const.SCENES.WILD_STAGE);
        } else {
          this.scene.zoneManager.advanceLayer();
          this.scene.scene.restart({ zoneId: this.scene.zoneId });
        }
      },
      onDefeat: () => {
        this.scene.scene.restart({ zoneId: this.scene.zoneId });
      }
    });
  }
}
