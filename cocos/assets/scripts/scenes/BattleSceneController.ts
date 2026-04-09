import { _decorator } from 'cc';
import { calculateBattleSettlement } from '../battle/BattleResultCalculator';
import { SceneNames } from '../core';
import { BaseSceneController } from './BaseSceneController';

const { ccclass } = _decorator;

@ccclass('BattleSceneController')
export class BattleSceneController extends BaseSceneController {
  public onEnable(): void {
    this.refreshCommonChrome();
  }

  public getBattleContext() {
    const pendingBattle = this.app.battleSession.getPendingBattle();
    const enemyGroup =
      pendingBattle ? this.app.config.enemyGroups.getById(pendingBattle.enemyGroupId) : null;
    const enemies =
      enemyGroup ?
        [
          { enemyId: enemyGroup.slot1_enemy_id, level: enemyGroup.slot1_level, slot: 1 },
          { enemyId: enemyGroup.slot2_enemy_id, level: enemyGroup.slot2_level, slot: 2 },
          { enemyId: enemyGroup.slot3_enemy_id, level: enemyGroup.slot3_level, slot: 3 },
        ]
          .filter((entry) => Boolean(entry.enemyId))
          .map((entry) => ({
            ...entry,
            enemy: this.app.config.enemies.getById(entry.enemyId),
          }))
          .filter((entry) => Boolean(entry.enemy))
      : [];

    return {
      pendingBattle,
      enemyGroup,
      enemies,
      resources: this.app.runtime.getRuntime().resources,
      deployedGirls: this.app.managers.fusionGirls.getDeployedGirls(),
      battleSpeed: {
        slow: this.app.config.globalConfig.requireNumber('battle_speed_slow'),
        normal: this.app.config.globalConfig.requireNumber('battle_speed_normal'),
      },
      starRules: {
        oneStar: '\u6218\u6597\u80dc\u5229',
        twoStar: '\u6211\u65b9\u65e0\u9635\u4ea1',
        threeStar: `\u9650\u5b9a${pendingBattle?.starRoundLimit ?? 0}\u56de\u5408\u5185\u80dc\u5229`,
      },
    };
  }

  public settleMockBattle(params: { win: boolean; rounds: number; allyDeaths: number }) {
    const pendingBattle = this.app.battleSession.getPendingBattle();
    if (!pendingBattle) {
      return { ok: false, settlement: null, rewardSummaries: [] as Array<{ drop_group_id: string; grants: Array<{ item_id: string; item_name: string; count: number; auto_used: boolean }> }> };
    }

    const preview = calculateBattleSettlement({
      win: params.win,
      rounds: params.rounds,
      allyDeaths: params.allyDeaths,
      roundLimit: pendingBattle.starRoundLimit,
    });

    if (!preview.win) {
      this.app.battleSession.clearPendingBattle();
      return {
        ok: true,
        settlement: {
          firstClear: false,
          bestStarUpdated: false,
          unlockedNextStageId: null,
          star: 0,
          rounds: params.rounds,
          noAllyDeath: preview.noAllyDeath,
          withinRoundLimit: preview.withinRoundLimit,
        },
        rewardSummaries: [],
      };
    }

    const result = this.settleBattle({ win: true, star: preview.star as 1 | 2 | 3 });
    return {
      ...result,
      settlement:
        result.settlement ?
          {
            ...result.settlement,
            star: preview.star,
            rounds: params.rounds,
            noAllyDeath: preview.noAllyDeath,
            withinRoundLimit: preview.withinRoundLimit,
          }
        : null,
    };
  }

  public settleBattle(params: { win: boolean; star: 1 | 2 | 3 }): {
    ok: boolean;
    settlement: null | {
      firstClear: boolean;
      bestStarUpdated: boolean;
      unlockedNextStageId: string | null;
    };
    rewardSummaries: Array<{ drop_group_id: string; grants: Array<{ item_id: string; item_name: string; count: number; auto_used: boolean }> }>;
  } {
    const pendingBattle = this.app.battleSession.getPendingBattle();
    if (!pendingBattle) {
      return { ok: false, settlement: null, rewardSummaries: [] };
    }

    const settlement = this.app.managers.stages.settleStage({
      stageId: pendingBattle.stageId,
      star: params.star,
      win: params.win,
    });

    const rewardSummaries = settlement.rewardDropGroupIds.map((dropGroupId) =>
      this.app.managers.rewards.applyDropGroup(dropGroupId),
    );

    this.app.battleSession.clearPendingBattle();
    this.refreshCommonChrome();

    return {
      ok: true,
      settlement: {
        firstClear: settlement.firstClear,
        bestStarUpdated: settlement.bestStarUpdated,
        unlockedNextStageId: settlement.unlockedNextStageId,
      },
      rewardSummaries,
    };
  }

  public async finalizeBattleAndReturnToMap(): Promise<void> {
    await this.saveProgress();
    await this.navigateTo(SceneNames.Map);
  }

  public async returnToMap(): Promise<void> {
    await this.navigateTo(SceneNames.Map);
  }
}
