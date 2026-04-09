import Const from '../../game/data/Const.js';
import WorldMapData from '../../game/data/WorldMapData.js';
import { t } from '../../game/data/Lang.js';
import {
  getFusionGirlById,
  getPortraitSetsByFusionGirlId,
  getFusionGirlCombatStats
} from '../../game/data/FusionGirlData.js';

export default class WildStageView {
  constructor(scene, width, height, layout = {}) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.contentTop = layout.contentTop ?? 50;
    this.contentBottom = layout.contentBottom ?? (height - 70);
    this.viewportHeight = this.contentBottom - this.contentTop;

    this.frameElements = [];
    this.overlayElements = [];
    this.scrollHandlers = null;
    this.scrollState = null;
    this.viewLevel = 0;
    this.currentRegion = null;

    this.container = scene.add.container(0, this.contentTop);
    this.frameElements.push(this.container);

    this.maskGraphics = scene.add.graphics();
    this.maskGraphics.fillStyle(0xffffff, 1);
    this.maskGraphics.fillRect(0, this.contentTop, width, this.viewportHeight);
    this.maskGraphics.setVisible(false);
    this.container.setMask(this.maskGraphics.createGeometryMask());
    this.frameElements.push(this.maskGraphics);

    this.showWorldMap();
  }

  createLocalHitArea(x, y, width, height) {
    return new Phaser.Geom.Rectangle(x, y, width, height);
  }

  clearScroll() {
    if (!this.scrollHandlers) return;

    this.scene.input.off('pointerdown', this.scrollHandlers.onPointerDown);
    this.scene.input.off('pointermove', this.scrollHandlers.onPointerMove);
    this.scene.input.off('pointerup', this.scrollHandlers.onPointerUp);
    this.scene.input.off('wheel', this.scrollHandlers.onWheel);
    this.scrollHandlers = null;
    this.scrollState = null;
  }

  clearView() {
    this.clearScroll();
    this.container.removeAll(true);
    this.container.y = this.contentTop;
    this.container.setAlpha(1);

    this.overlayElements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.overlayElements = [];
  }

  destroy() {
    this.clearView();
    this.frameElements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this.frameElements = [];
  }

  setupScroll(contentHeight) {
    const maxScroll = Math.max(0, contentHeight - this.viewportHeight);
    this.scrollState = {
      currentY: 0,
      maxScroll,
      isDragging: false,
      lastPointerY: 0
    };

    if (maxScroll <= 0) {
      return;
    }

    this.scrollHandlers = {
      onPointerDown: (pointer) => {
        if (pointer.y >= this.contentTop && pointer.y <= this.contentBottom) {
          this.scrollState.isDragging = true;
          this.scrollState.lastPointerY = pointer.y;
        }
      },
      onPointerMove: (pointer) => {
        if (!this.scrollState?.isDragging) return;

        const deltaY = pointer.y - this.scrollState.lastPointerY;
        this.scrollState.lastPointerY = pointer.y;
        this.scrollState.currentY = Phaser.Math.Clamp(
          this.scrollState.currentY + deltaY,
          -this.scrollState.maxScroll,
          0
        );
        this.container.y = this.contentTop + this.scrollState.currentY;
      },
      onPointerUp: () => {
        if (this.scrollState) {
          this.scrollState.isDragging = false;
        }
      },
      onWheel: (pointer, gameObjects, deltaX, deltaY) => {
        if (!this.scrollState) return;
        if (pointer.y < this.contentTop || pointer.y > this.contentBottom) return;

        this.scrollState.currentY = Phaser.Math.Clamp(
          this.scrollState.currentY - deltaY * 0.35,
          -this.scrollState.maxScroll,
          0
        );
        this.container.y = this.contentTop + this.scrollState.currentY;
      }
    };

    this.scene.input.on('pointerdown', this.scrollHandlers.onPointerDown);
    this.scene.input.on('pointermove', this.scrollHandlers.onPointerMove);
    this.scene.input.on('pointerup', this.scrollHandlers.onPointerUp);
    this.scene.input.on('wheel', this.scrollHandlers.onWheel);
  }

  showWorldMap() {
    this.clearView();
    this.viewLevel = 0;
    this.currentRegion = null;

    const regions = WorldMapData.getAllRegions();
    let y = 10;
    const lineHeight = 90;

    regions.forEach((region, index) => {
      const isUnlocked = WorldMapData.isRegionUnlocked(region.regionId);
      const progress = WorldMapData.getRegionProgress(region.regionId);

      const regionContainer = this.scene.add.container(0, y);
      this.container.add(regionContainer);

      const bgColor = isUnlocked ? Const.COLORS.BG_MID : 0x1a1a1a;
      const borderColor = isUnlocked ? Const.COLORS.BUTTON_CYAN : Const.COLORS.BUTTON_INACTIVE;

      const bg = this.scene.add.graphics();
      bg.fillStyle(bgColor, 0.9);
      bg.fillRoundedRect(15, 0, this.width - 30, lineHeight - 10, 10);
      bg.lineStyle(2, borderColor, isUnlocked ? 0.8 : 0.3);
      bg.strokeRoundedRect(15, 0, this.width - 30, lineHeight - 10, 10);
      regionContainer.add(bg);

      const regionName = WorldMapData.getRegionName(region.regionId);
      regionContainer.add(this.scene.add.text(30, 18, regionName, {
        fontSize: '16px',
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: isUnlocked ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE
      }));

      regionContainer.add(this.scene.add.text(30, 45, `进度: ${progress.cleared}/${progress.total}`, {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: isUnlocked ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.INACTIVE
      }));

      regionContainer.add(this.scene.add.text(this.width - 30, 40, `#${region.order}`, {
        fontSize: '24px',
        fontFamily: Const.FONT.FAMILY_EN,
        color: isUnlocked ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.INACTIVE
      }).setOrigin(1, 0.5));

      if (isUnlocked) {
        regionContainer.add(this.scene.add.text(this.width - 60, 40, '▶', {
          fontSize: '16px',
          fontFamily: Const.FONT.FAMILY_EN,
          color: Const.TEXT_COLORS.CYAN
        }).setOrigin(0.5));

        regionContainer.setSize(this.width - 30, lineHeight - 10);
        regionContainer.setInteractive(this.createLocalHitArea(15, 0, this.width - 30, lineHeight - 10), Phaser.Geom.Rectangle.Contains);
        regionContainer.on('pointerdown', () => this.showRegionDetail(region));
        regionContainer.on('pointerover', () => {
          bg.clear();
          bg.fillStyle(Const.COLORS.BG_HOVER, 0.9);
          bg.fillRoundedRect(15, 0, this.width - 30, lineHeight - 10, 10);
          bg.lineStyle(2, Const.COLORS.BUTTON_HOVER, 1);
          bg.strokeRoundedRect(15, 0, this.width - 30, lineHeight - 10, 10);
        });
        regionContainer.on('pointerout', () => {
          bg.clear();
          bg.fillStyle(Const.COLORS.BG_MID, 0.9);
          bg.fillRoundedRect(15, 0, this.width - 30, lineHeight - 10, 10);
          bg.lineStyle(2, Const.COLORS.BUTTON_CYAN, 0.8);
          bg.strokeRoundedRect(15, 0, this.width - 30, lineHeight - 10, 10);
        });
      } else {
        regionContainer.add(this.scene.add.text(this.width - 30, 40, '🔒', {
          fontSize: '16px'
        }).setOrigin(0.5));
      }

      if (index < regions.length - 1) {
        const connector = this.scene.add.graphics();
        connector.lineStyle(2, borderColor, 0.35);
        connector.lineBetween(this.width / 2, y + lineHeight - 10, this.width / 2, y + lineHeight);
        this.container.add(connector);
      }

      y += lineHeight;
    });

    this.setupScroll(y + 20);
  }

  showRegionDetail(region) {
    this.clearView();
    this.viewLevel = 1;
    this.currentRegion = region;

    const backBtn = this.scene.add.text(20, 0, `← ${t('back')}`, {
      fontSize: '12px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.showWorldMap());
    this.container.add(backBtn);

    this.container.add(this.scene.add.text(this.width / 2, 0, WorldMapData.getRegionName(region.regionId), {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5));

    this.container.add(this.scene.add.text(this.width / 2, 25, WorldMapData.getRegionDescription(region.regionId), {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5));

    let y = 45;

    this.container.add(this.scene.add.text(25, y, '主线关卡', {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }));
    y += 30;

    region.mainStages.forEach((stage) => {
      const isCleared = WorldMapData.isStageCleared(stage.stageId);
      const isUnlocked = WorldMapData.isStageUnlocked(region.regionId, stage.stageIndex);
      const stageContainer = this.scene.add.container(0, y);
      this.container.add(stageContainer);

      const bg = this.scene.add.graphics();
      const bgColor = isCleared ? 0x1a3a1a : (isUnlocked ? Const.COLORS.BG_MID : 0x1a1a1a);
      const borderColor = stage.isBoss ? Const.COLORS.MAGENTA : (isUnlocked ? Const.COLORS.BUTTON_CYAN : Const.COLORS.BUTTON_INACTIVE);
      bg.fillStyle(bgColor, 0.85);
      bg.fillRoundedRect(15, 0, this.width - 30, 50, 8);
      bg.lineStyle(stage.isBoss ? 3 : 1, borderColor, isUnlocked ? 0.8 : 0.3);
      bg.strokeRoundedRect(15, 0, this.width - 30, 50, 8);
      stageContainer.add(bg);

      const statusIcon = isCleared ? '✓' : (isUnlocked ? (stage.isBoss ? '⚔' : '▶') : '🔒');
      const textColor = isCleared ? Const.TEXT_COLORS.SUCCESS : (isUnlocked ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE);

      stageContainer.add(this.scene.add.text(30, 15, `${stage.stageIndex}. ${WorldMapData.getStageName(stage)}`, {
        fontSize: '14px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: textColor
      }));

      stageContainer.add(this.scene.add.text(30, 35, stage.isBoss ? 'Boss关卡' : `第 ${stage.stageIndex} 关`, {
        fontSize: '11px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: isUnlocked ? Const.TEXT_COLORS.SECONDARY : Const.TEXT_COLORS.INACTIVE
      }));

      stageContainer.add(this.scene.add.text(this.width - 30, 25, statusIcon, {
        fontSize: '18px',
        color: textColor
      }).setOrigin(0.5));

      if (isUnlocked) {
        stageContainer.setSize(this.width - 30, 50);
        stageContainer.setInteractive(this.createLocalHitArea(15, 0, this.width - 30, 50), Phaser.Geom.Rectangle.Contains);
        stageContainer.on('pointerdown', () => this.showStagePreview(stage, region));
        stageContainer.on('pointerover', () => {
          bg.clear();
          bg.fillStyle(Const.COLORS.BG_HOVER, 0.9);
          bg.fillRoundedRect(15, 0, this.width - 30, 50, 8);
          bg.lineStyle(stage.isBoss ? 3 : 1, Const.COLORS.BUTTON_HOVER, 1);
          bg.strokeRoundedRect(15, 0, this.width - 30, 50, 8);
        });
        stageContainer.on('pointerout', () => {
          bg.clear();
          bg.fillStyle(bgColor, 0.85);
          bg.fillRoundedRect(15, 0, this.width - 30, 50, 8);
          bg.lineStyle(stage.isBoss ? 3 : 1, borderColor, isUnlocked ? 0.8 : 0.3);
          bg.strokeRoundedRect(15, 0, this.width - 30, 50, 8);
        });
      }

      y += 58;
    });

    const progress = WorldMapData.getRegionProgress(region.regionId);
    if (progress.cleared >= region.mainStages.length && region.dungeonEntries.length > 0) {
      y += 15;
      this.container.add(this.scene.add.text(25, y, '禁区入口', {
        fontSize: '14px',
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.MAGENTA
      }));
      y += 35;

      region.dungeonEntries.forEach((dungeon) => {
        const dungeonContainer = this.scene.add.container(0, y);
        this.container.add(dungeonContainer);

        const bg = this.scene.add.graphics();
        bg.fillStyle(Const.COLORS.BG_DARK, 0.9);
        bg.fillRoundedRect(15, 0, this.width - 30, 60, 10);
        bg.lineStyle(2, Const.COLORS.MAGENTA, 0.8);
        bg.strokeRoundedRect(15, 0, this.width - 30, 60, 10);
        dungeonContainer.add(bg);

        dungeonContainer.add(this.scene.add.text(40, 30, dungeon.icon, {
          fontSize: '28px'
        }).setOrigin(0.5));

        dungeonContainer.add(this.scene.add.text(80, 20, WorldMapData.getDungeonName(dungeon), {
          fontSize: '15px',
          fontFamily: Const.FONT.FAMILY_CN,
          fontStyle: 'bold',
          color: Const.TEXT_COLORS.MAGENTA
        }));

        dungeonContainer.add(this.scene.add.text(80, 42, '完成区域主线后解锁', {
          fontSize: '11px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.SECONDARY
        }));

        dungeonContainer.add(this.scene.add.text(this.width - 40, 30, '▶', {
          fontSize: '18px',
          color: Const.TEXT_COLORS.MAGENTA
        }).setOrigin(0.5));

        dungeonContainer.setSize(this.width - 30, 60);
        dungeonContainer.setInteractive(this.createLocalHitArea(15, 0, this.width - 30, 60), Phaser.Geom.Rectangle.Contains);
        dungeonContainer.on('pointerdown', () => this.enterDungeon(dungeon, region));
        dungeonContainer.on('pointerover', () => {
          bg.clear();
          bg.fillStyle(Const.COLORS.BG_HOVER, 0.9);
          bg.fillRoundedRect(15, 0, this.width - 30, 60, 10);
          bg.lineStyle(2, Const.COLORS.MAGENTA, 1);
          bg.strokeRoundedRect(15, 0, this.width - 30, 60, 10);
        });
        dungeonContainer.on('pointerout', () => {
          bg.clear();
          bg.fillStyle(Const.COLORS.BG_DARK, 0.9);
          bg.fillRoundedRect(15, 0, this.width - 30, 60, 10);
          bg.lineStyle(2, Const.COLORS.MAGENTA, 0.8);
          bg.strokeRoundedRect(15, 0, this.width - 30, 60, 10);
        });

        y += 68;
      });
    }

    this.setupScroll(y + 80);
  }

  showStagePreview(stage, region) {
    const modalWidth = this.width - 60;
    const modalHeight = 280;
    const modalX = 30;
    const modalY = (this.height - modalHeight) / 2 - 50;

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, this.width, this.height);
    this.overlayElements.push(overlay);

    const modal = this.scene.add.container(0, 0);
    this.overlayElements.push(modal);

    const modalBg = this.scene.add.graphics();
    modalBg.fillStyle(Const.COLORS.BG_MID, 1);
    modalBg.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 15);
    modalBg.lineStyle(2, Const.COLORS.BUTTON_CYAN, 0.8);
    modalBg.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 15);
    modal.add(modalBg);

    modal.add(this.scene.add.text(this.width / 2, modalY + 30, WorldMapData.getStageName(stage), {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5));

    modal.add(this.scene.add.text(this.width / 2, modalY + 65, `${stage.isBoss ? 'Boss关卡' : '普通关卡'} - 第 ${stage.stageIndex} 关`, {
      fontSize: '12px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5));

    const cleared = WorldMapData.isStageCleared(stage.stageId);
    if (cleared) {
      modal.add(this.scene.add.text(this.width / 2, modalY + 92, '已通关，可重复挑战', {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SUCCESS
      }).setOrigin(0.5));
    }

    const startBtn = this.scene.add.container(this.width / 2, modalY + 150);
    const startBg = this.scene.add.graphics();
    startBg.fillStyle(Const.COLORS.BUTTON_CYAN, 1);
    startBg.fillRoundedRect(-60, -22, 120, 44, 10);
    startBtn.add(startBg);
    startBtn.add(this.scene.add.text(0, 0, t('enter_dungeon'), {
      fontSize: '16px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#000000'
    }).setOrigin(0.5));
    startBtn.setSize(120, 44);
    startBtn.setInteractive(this.createLocalHitArea(-60, -22, 120, 44), Phaser.Geom.Rectangle.Contains);
    startBtn.on('pointerdown', () => this.enterStage(stage, region));
    startBtn.on('pointerover', () => {
      startBg.clear();
      startBg.fillStyle(Const.COLORS.BUTTON_HOVER, 1);
      startBg.fillRoundedRect(-60, -22, 120, 44, 10);
    });
    startBtn.on('pointerout', () => {
      startBg.clear();
      startBg.fillStyle(Const.COLORS.BUTTON_CYAN, 1);
      startBg.fillRoundedRect(-60, -22, 120, 44, 10);
    });
    modal.add(startBtn);

    const closeBtn = this.scene.add.text(this.width / 2, modalY + modalHeight - 30, t('close'), {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      this.overlayElements.forEach(el => {
        if (el && el.destroy) el.destroy();
      });
      this.overlayElements = [];
      this.container.setAlpha(1);
    });
    modal.add(closeBtn);

    this.container.setAlpha(0.3);
  }

  enterStage(stage, region) {
    this.destroy();

    const stageManager = this.scene.stageManager;
    const enemies = stageManager.getStageEnemies(stage.stageId);
    const minions = this.getDeployedFusionGirls();
    const equipmentCard = this.scene.chipCardManager?.equippedCard
      ? this.scene.chipCardManager.equippedCard.toJSON()
      : null;

    if (enemies.length === 0) {
      console.warn('No enemies found for stage:', stage.stageId);
      return;
    }

    if (minions.length === 0) {
      this.scene.showToast?.('请先在队伍页上阵融合姬');
      this.scene.scene.start('BaseScene', { initialTab: 'team' });
      return;
    }

    this.scene.scene.start('BattleScene', {
      enemies,
      stageId: stage.stageId,
      stageName: WorldMapData.getStageName(stage),
      minions,
      equipmentCard,
      onVictory: () => {
        stageManager.clearStage(stage.stageId);
        this.scene.scene.start('BaseScene', { initialTab: 'wild' });
      },
      onDefeat: () => {
        this.scene.scene.start('BaseScene', { initialTab: 'wild' });
      }
    });
  }

  enterDungeon(dungeon, region) {
    this.destroy();
    console.log('Entering dungeon:', dungeon.dungeonId, WorldMapData.getDungeonName(dungeon));
    this.scene.scene.start('DungeonScene');
  }

  getDeployedFusionGirls() {
    const girls = this.scene.fusionGirlManager?.getDeployedGirls?.() || [];
    return girls.map((girl) => {
      const fusionData = getFusionGirlById(girl.id);
      const portraitSets = getPortraitSetsByFusionGirlId(girl.id);
      const activeSet = portraitSets.find((set) => (girl.completedPortraitSetIds || []).includes(set.id))
        || portraitSets.find((set) => set.id === fusionData?.defaultPortraitSetId)
        || portraitSets[0];
      const combatStats = getFusionGirlCombatStats(girl, fusionData);

      return {
        id: girl.id,
        fusionGirlId: girl.id,
        name: fusionData?.name || girl.name || girl.id,
        hp: combatStats.maxHp,
        maxHp: combatStats.maxHp,
        atk: combatStats.atk,
        spd: combatStats.spd,
        level: combatStats.level,
        element: fusionData?.element || 'water',
        quality: girl.quality || 'N',
        portrait: activeSet?.coverPortrait || null,
        isFusionGirl: true
      };
    });
  }
}
