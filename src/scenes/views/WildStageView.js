import Const from '../../game/data/Const.js';
import WorldMapData from '../../game/data/WorldMapData.js';
import { t } from '../../game/data/Lang.js';

export default class WildStageView {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.elements = [];
    this.viewLevel = 0;
    this.currentRegion = null;
    this.container = scene.add.container(0, 70);
    scene.add.existing(this.container);
    
    this.showWorldMap();
  }

  destroy() {
    this.elements.forEach(el => el.destroy());
    this.elements = [];
  }

  showWorldMap() {
    this.destroy();
    this.viewLevel = 0;
    this.currentRegion = null;

    const titleBg = this.scene.add.graphics();
    titleBg.fillStyle(Const.COLORS.BG_DARK, 0.9);
    titleBg.fillRect(0, -70, this.width, 50);
    this.elements.push(titleBg);

    const title = this.scene.add.text(this.width / 2, -50, t('explore'), {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5);
    this.elements.push(title);

    const regions = WorldMapData.getAllRegions();
    let y = 10;
    const lineHeight = 90;

    regions.forEach((region, index) => {
      const isUnlocked = WorldMapData.isRegionUnlocked(region.regionId);
      const progress = WorldMapData.getRegionProgress(region.regionId);
      
      const regionContainer = this.scene.add.container(0, y);
      this.elements.push(regionContainer);

      const bgColor = isUnlocked ? Const.COLORS.BG_MID : 0x1a1a1a;
      const borderColor = isUnlocked ? Const.COLORS.BUTTON_CYAN : Const.COLORS.BUTTON_INACTIVE;

      const bg = this.scene.add.graphics();
      bg.fillStyle(bgColor, 0.9);
      bg.fillRoundedRect(15, 0, this.width - 30, lineHeight - 10, 10);
      bg.lineStyle(2, borderColor, isUnlocked ? 0.8 : 0.3);
      bg.strokeRoundedRect(15, 0, this.width - 30, lineHeight - 10, 10);
      regionContainer.add(bg);

      const regionName = WorldMapData.getRegionName(region.regionId);
      const nameText = this.scene.add.text(30, 18, regionName, {
        fontSize: '16px',
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: isUnlocked ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE
      });
      regionContainer.add(nameText);

      const progressText = this.scene.add.text(30, 45, `进度: ${progress.cleared}/${progress.total}`, {
        fontSize: '12px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: isUnlocked ? Const.TEXT_COLORS.CYAN : Const.TEXT_COLORS.INACTIVE
      });
      regionContainer.add(progressText);

      const orderText = this.scene.add.text(this.width - 30, 40, `#${region.order}`, {
        fontSize: '24px',
        fontFamily: Const.FONT.FAMILY_EN,
        color: isUnlocked ? Const.COLORS.PURPLE : Const.COLORS.INACTIVE
      }).setOrigin(1, 0.5);
      regionContainer.add(orderText);

      if (isUnlocked) {
        const arrow = this.scene.add.text(this.width - 60, 40, '▶', {
          fontSize: '16px',
          fontFamily: Const.FONT.FAMILY_EN,
          color: Const.TEXT_COLORS.CYAN
        }).setOrigin(0.5);
        regionContainer.add(arrow);

        regionContainer.setSize(this.width - 30, lineHeight - 10);
        regionContainer.setInteractive(new Phaser.Geom.Rectangle(15, 0, this.width - 30, lineHeight - 10), Phaser.Geom.Rectangle.Contains);
        
        regionContainer.on('pointerdown', () => {
          this.showRegionDetail(region);
        });

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
        const lockText = this.scene.add.text(this.width - 30, 40, '🔒', {
          fontSize: '16px'
        }).setOrigin(0.5);
        regionContainer.add(lockText);
      }

      if (index < regions.length - 1) {
        const connector = this.scene.add.graphics();
        connector.lineStyle(2, isUnlocked ? Const.COLORS.BUTTON_CYAN : Const.COLORS.BUTTON_INACTIVE, 0.4);
        connector.lineBetween(this.width / 2, lineHeight - 10, this.width / 2, lineHeight);
        this.elements.push(connector);
      }

      y += lineHeight;
    });

    this.container.setSize(this.width, y + 50);
    this.scene.children.bringToTop(this.container);
  }

  showRegionDetail(region) {
    this.destroy();
    this.viewLevel = 1;
    this.currentRegion = region;

    const titleBg = this.scene.add.graphics();
    titleBg.fillStyle(Const.COLORS.BG_DARK, 0.9);
    titleBg.fillRect(0, -70, this.width, 50);
    this.elements.push(titleBg);

    const backBtn = this.scene.add.text(20, -50, '← ' + t('back'), {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.CYAN
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    this.elements.push(backBtn);
    
    backBtn.on('pointerdown', () => {
      this.showWorldMap();
    });

    const title = this.scene.add.text(this.width / 2, -50, WorldMapData.getRegionName(region.regionId), {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5);
    this.elements.push(title);

    const descText = this.scene.add.text(this.width / 2, -15, WorldMapData.getRegionDescription(region.regionId), {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
    this.elements.push(descText);

    let y = 20;

    const sectionTitle = this.scene.add.text(25, y, '主线关卡', {
      fontSize: '14px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    });
    this.elements.push(sectionTitle);
    y += 30;

    region.mainStages.forEach((stage, index) => {
      const isCleared = WorldMapData.isStageCleared(stage.stageId);
      const isUnlocked = WorldMapData.isStageUnlocked(region.regionId, stage.stageIndex);

      const stageContainer = this.scene.add.container(0, y);
      this.elements.push(stageContainer);

      const bg = this.scene.add.graphics();
      const bgColor = isCleared ? 0x1a3a1a : (isUnlocked ? Const.COLORS.BG_MID : 0x1a1a1a);
      const borderColor = stage.isBoss ? Const.COLORS.MAGENTA : (isUnlocked ? Const.COLORS.BUTTON_CYAN : Const.COLORS.BUTTON_INACTIVE);
      
      bg.fillStyle(bgColor, 0.8);
      bg.fillRoundedRect(15, 0, this.width - 30, 50, 8);
      bg.lineStyle(stage.isBoss ? 3 : 1, borderColor, isUnlocked ? 0.8 : 0.3);
      bg.strokeRoundedRect(15, 0, this.width - 30, 50, 8);
      stageContainer.add(bg);

      const statusIcon = isCleared ? '✓' : (isUnlocked ? (stage.isBoss ? '👑' : '▶') : '🔒');
      const textColor = isCleared ? Const.TEXT_COLORS.SUCCESS : (isUnlocked ? Const.TEXT_COLORS.PRIMARY : Const.TEXT_COLORS.INACTIVE);

      const nameText = this.scene.add.text(30, 15, `${stage.stageIndex}. ${WorldMapData.getStageName(stage)}`, {
        fontSize: '14px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: textColor
      });
      stageContainer.add(nameText);

      const levelText = this.scene.add.text(30, 35, stage.isBoss ? 'Boss关卡' : `第${stage.stageIndex}关`, {
        fontSize: '11px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: isUnlocked ? Const.TEXT_COLORS.SECONDARY : Const.TEXT_COLORS.INACTIVE
      });
      stageContainer.add(levelText);

      const statusText = this.scene.add.text(this.width - 30, 25, statusIcon, {
        fontSize: '18px'
      }).setOrigin(0.5);
      stageContainer.add(statusText);

      if (isUnlocked && !isCleared) {
        stageContainer.setSize(this.width - 30, 50);
        stageContainer.setInteractive(new Phaser.Geom.Rectangle(15, 0, this.width - 30, 50), Phaser.Geom.Rectangle.Contains);

        stageContainer.on('pointerdown', () => {
          this.showStagePreview(stage, region);
        });

        stageContainer.on('pointerover', () => {
          bg.clear();
          bg.fillStyle(Const.COLORS.BG_HOVER, 0.9);
          bg.fillRoundedRect(15, 0, this.width - 30, 50, 8);
          bg.lineStyle(stage.isBoss ? 3 : 1, Const.COLORS.BUTTON_HOVER, 1);
          bg.strokeRoundedRect(15, 0, this.width - 30, 50, 8);
        });

        stageContainer.on('pointerout', () => {
          bg.clear();
          bg.fillStyle(Const.COLORS.BG_MID, 0.8);
          bg.fillRoundedRect(15, 0, this.width - 30, 50, 8);
          bg.lineStyle(stage.isBoss ? 3 : 1, borderColor, 0.8);
          bg.strokeRoundedRect(15, 0, this.width - 30, 50, 8);
        });
      }

      y += 58;
    });

    const progress = WorldMapData.getRegionProgress(region.regionId);
    if (progress.cleared >= region.mainStages.length && region.dungeonEntries.length > 0) {
      y += 15;
      const dungeonTitle = this.scene.add.text(25, y, '禁区入口', {
        fontSize: '14px',
        fontFamily: Const.FONT.FAMILY_CN,
        fontStyle: 'bold',
        color: Const.TEXT_COLORS.MAGENTA
      });
      this.elements.push(dungeonTitle);
      y += 35;

      region.dungeonEntries.forEach(dungeon => {
        const dungeonContainer = this.scene.add.container(0, y);
        this.elements.push(dungeonContainer);

        const bg = this.scene.add.graphics();
        bg.fillStyle(Const.COLORS.BG_DARK, 0.9);
        bg.fillRoundedRect(15, 0, this.width - 30, 60, 10);
        bg.lineStyle(2, Const.COLORS.MAGENTA, 0.8);
        bg.strokeRoundedRect(15, 0, this.width - 30, 60, 10);
        dungeonContainer.add(bg);

        const iconText = this.scene.add.text(40, 30, dungeon.icon, {
          fontSize: '28px'
        }).setOrigin(0.5);
        dungeonContainer.add(iconText);

        const nameText = this.scene.add.text(80, 20, WorldMapData.getDungeonName(dungeon), {
          fontSize: '15px',
          fontFamily: Const.FONT.FAMILY_CN,
          fontStyle: 'bold',
          color: Const.TEXT_COLORS.MAGENTA
        });
        dungeonContainer.add(nameText);

        const descText = this.scene.add.text(80, 42, '完成区域主线后解锁', {
          fontSize: '11px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.SECONDARY
        });
        dungeonContainer.add(descText);

        const enterText = this.scene.add.text(this.width - 40, 30, '▶', {
          fontSize: '18px',
          color: Const.TEXT_COLORS.MAGENTA
        }).setOrigin(0.5);
        dungeonContainer.add(enterText);

        dungeonContainer.setSize(this.width - 30, 60);
        dungeonContainer.setInteractive(new Phaser.Geom.Rectangle(15, 0, this.width - 30, 60), Phaser.Geom.Rectangle.Contains);

        dungeonContainer.on('pointerdown', () => {
          this.enterDungeon(dungeon, region);
        });

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

    this.container.setSize(this.width, y + 80);
    this.scene.children.bringToTop(this.container);
  }

  showStagePreview(stage, region) {
    const modalWidth = this.width - 60;
    const modalHeight = 280;
    const modalX = 30;
    const modalY = (this.height - modalHeight) / 2 - 50;

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, this.width, this.height);
    this.elements.push(overlay);

    const modal = this.scene.add.container(0, 0);
    this.elements.push(modal);

    const modalBg = this.scene.add.graphics();
    modalBg.fillStyle(Const.COLORS.BG_MID, 1);
    modalBg.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 15);
    modalBg.lineStyle(2, Const.COLORS.BUTTON_CYAN, 0.8);
    modalBg.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 15);
    modal.add(modalBg);

    const stageName = WorldMapData.getStageName(stage);
    const title = this.scene.add.text(this.width / 2, modalY + 30, stageName, {
      fontSize: '18px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0.5);
    modal.add(title);

    const infoText = this.scene.add.text(this.width / 2, modalY + 65, `${stage.isBoss ? 'Boss关卡' : '普通关卡'} - 第${stage.stageIndex}关`, {
      fontSize: '12px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0.5);
    modal.add(infoText);

    const startBtn = this.scene.add.container(this.width / 2, modalY + 150);
    const startBg = this.scene.add.graphics();
    startBg.fillStyle(Const.COLORS.BUTTON_CYAN, 1);
    startBg.fillRoundedRect(-60, -22, 120, 44, 10);
    startBtn.add(startBg);

    const startText = this.scene.add.text(0, 0, t('enter_dungeon'), {
      fontSize: '16px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: '#000000'
    }).setOrigin(0.5);
    startBtn.add(startText);

    startBtn.setSize(120, 44);
    startBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -22, 120, 44), Phaser.Geom.Rectangle.Contains);
    
    startBtn.on('pointerdown', () => {
      this.enterStage(stage, region);
    });

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
    modal.add(closeBtn);

    closeBtn.on('pointerdown', () => {
      this.destroy();
      this.showRegionDetail(region);
    });

    this.container.setAlpha(0.3);
  }

  enterStage(stage, region) {
    this.destroy();
    
    const stageManager = this.scene.stageManager;
    const enemies = stageManager.getStageEnemies(stage.stageId);
    
    if (enemies.length === 0) {
      console.warn('No enemies found for stage:', stage.stageId);
      return;
    }

    this.scene.scene.start('BattleScene', {
      enemies,
      stageId: stage.stageId,
      onVictory: (data) => {
        const result = stageManager.clearStage(stage.stageId);
        if (!window.gameData.progress) window.gameData.progress = {};
        if (!window.gameData.progress.clearedStages) window.gameData.progress.clearedStages = [];
        if (!window.gameData.progress.clearedStages.includes(stage.stageId)) {
          window.gameData.progress.clearedStages.push(stage.stageId);
        }
        this.scene.scene.start('WildStageScene');
      },
      onDefeat: () => {
        this.scene.scene.start('WildStageScene');
      }
    });
  }

  enterDungeon(dungeon, region) {
    this.destroy();
    console.log('Entering dungeon:', dungeon.dungeonId, WorldMapData.getDungeonName(dungeon));
    this.scene.scene.start('DungeonScene');
  }
}
