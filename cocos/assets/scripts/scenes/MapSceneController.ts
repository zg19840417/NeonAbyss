import { _decorator } from 'cc';
import { SceneNames } from '../core';
import { BaseSceneController } from './BaseSceneController';

const { ccclass } = _decorator;

@ccclass('MapSceneController')
export class MapSceneController extends BaseSceneController {
  public onEnable(): void {
    this.refreshCommonChrome();
    this.setActiveTab('map');
  }

  public getChapterMapState() {
    const runtime = this.app.runtime.getRuntime();
    const chapter = Object.values(runtime.chapters)[0] ?? null;
    const stageNodes = chapter ? this.app.managers.stages.getChapterStageNodes(chapter.chapter_id) : [];

    return {
      resources: runtime.resources,
      chapter,
      stages: stageNodes,
    };
  }

  public getStageDetailState(stageId: string) {
    const stage = this.app.config.stages.getById(stageId);
    const progress = this.app.managers.stages.getStageProgress(stageId);
    const enemyGroup = stage ? this.app.config.enemyGroups.getById(stage.enemy_group_id) : null;
    const enemyPreview =
      enemyGroup ?
        [
          { slot: 1, enemyId: enemyGroup.slot1_enemy_id, level: enemyGroup.slot1_level },
          { slot: 2, enemyId: enemyGroup.slot2_enemy_id, level: enemyGroup.slot2_level },
          { slot: 3, enemyId: enemyGroup.slot3_enemy_id, level: enemyGroup.slot3_level },
        ]
          .filter((entry) => Boolean(entry.enemyId))
          .map((entry) => ({
            ...entry,
            enemy: this.app.config.enemies.getById(entry.enemyId),
          }))
      : [];
    const enterCheck = this.app.managers.stages.canEnterStage(stageId);
    const rewardPreview =
      stage ?
        {
          firstClear: {
            star1: this.resolveDropPreview(stage.first_clear_1star_drop_group),
            star2: this.resolveDropPreview(stage.first_clear_2star_drop_group),
            star3: this.resolveDropPreview(stage.first_clear_3star_drop_group),
          },
          repeat: this.resolveDropPreview(stage.repeat_drop_group),
        }
      : null;

    return {
      stage,
      progress,
      enemyGroup,
      enemyPreview,
      enterCheck,
      rewardPreview,
    };
  }

  public canEnterStage(stageId: string) {
    return this.app.managers.stages.canEnterStage(stageId);
  }

  public async tryStartStage(stageId: string): Promise<{ ok: boolean; reason: string }> {
    const result = this.app.managers.stages.canEnterStage(stageId);
    if (!result.ok || !result.stage) {
      return { ok: false, reason: result.reason };
    }

    const consumed = this.app.managers.stages.consumeStageCost(stageId);
    if (!consumed) {
      return { ok: false, reason: 'stamina_not_enough' };
    }

    this.app.battleSession.setPendingBattle({
      stageId: result.stage.stage_id,
      chapterId: result.stage.chapter_id,
      stageName: result.stage.stage_name,
      starRoundLimit: result.stage.star_round_limit,
      enemyGroupId: result.stage.enemy_group_id,
    });

    await this.saveProgress();
    this.refreshCommonChrome();
    await this.navigateTo(SceneNames.Battle);
    return { ok: true, reason: 'ok' };
  }

  private resolveDropPreview(dropGroupId: string) {
    return this.app.managers.rewards.getDropPreview(dropGroupId);
  }
}
