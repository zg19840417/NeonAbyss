import StageData from '../../game/data/StageData.js';

export default class WildStageView {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.container = scene.add.container(0, 60);
    this._buildMapList();
  }

  _buildMapList() {
    const maps = StageData.getAllMaps();
    const stageManager = this.scene.stageManager;
    const clearedIds = stageManager.getClearedStageIds();
    const playerLevel = window.gameData?.reputationSystem?.level || 1;

    let y = 0;
    maps.forEach(map => {
      // 地图标题
      const titleBg = this.scene.add.graphics();
      titleBg.fillStyle(0x3d3530, 1);
      titleBg.fillRoundedRect(10, y, this.width - 20, 36, 6);

      this.scene.add.text(20, y + 18, `${map.mapName} (${map.totalStages}关)`, {
        fontSize: '14px', color: '#d4a574', fontFamily: 'Arial'
      });

      if (map.unlockZoneId) {
        const unlocked = clearedIds.some(id => {
          const s = StageData.getStageById(id);
          return s && s.unlockZoneId === map.unlockZoneId;
        });
        this.scene.add.text(this.width - 20, y + 18, unlocked ? '已解锁禁区' : '', {
          fontSize: '10px', color: '#4dabf7', fontFamily: 'Arial'
        }).setOrigin(1, 0.5);
      }

      y += 42;

      // 该地图的关卡列表（最多显示已解锁的）
      const stages = StageData.getStagesByMap(map.mapId);
      stages.forEach(stage => {
        const check = StageData.checkRequirements(stage.stageId, playerLevel, clearedIds);
        const cleared = clearedIds.includes(stage.stageId);
        const canEnter = check.canEnter;

        const stageBg = this.scene.add.graphics();
        const bgColor = cleared ? 0x2a4a2a : (canEnter ? 0x3d3530 : 0x2a2a2a);
        stageBg.fillStyle(bgColor, 0.8);
        stageBg.fillRoundedRect(30, y, this.width - 60, 32, 4);

        const textColor = cleared ? '#66bb6a' : (canEnter ? '#e0e0e0' : '#666666');
        const statusText = cleared ? '✓' : (canEnter ? '▶' : '🔒');

        this.scene.add.text(40, y + 16, `${statusText} ${stage.stageIndex}关`, {
          fontSize: '12px', color: textColor, fontFamily: 'Arial'
        });

        if (!cleared && canEnter) {
          const stageText = this.scene.add.text(40, y + 16, `${statusText} ${stage.stageIndex}关`, {
            fontSize: '12px', color: textColor, fontFamily: 'Arial'
          }).setInteractive({ useHandCursor: true });

          stageText.on('pointerdown', () => {
            this._enterStage(stage.stageId);
          });

          stageText.on('pointerover', () => {
            stageText.setColor('#d4a574');
          });
          stageText.on('pointerout', () => {
            stageText.setColor(textColor);
          });
        }

        y += 36;
      });

      y += 10;
    });

    // 滚动容器
    this.container.setSize(this.width, y);
    this.scene.add.existing(this.container);
  }

  _enterStage(stageId) {
    const enemies = this.scene.stageManager.getStageEnemies(stageId);
    if (enemies.length === 0) return;

    this.scene.scene.start('BattleScene', {
      enemies,
      stageId,
      onVictory: (data) => {
        const result = this.scene.stageManager.clearStage(stageId);
        // TODO: 显示奖励弹窗
        this.scene.scene.start('WildStageScene');
      },
      onDefeat: () => {
        this.scene.scene.start('WildStageScene');
      }
    });
  }
}
