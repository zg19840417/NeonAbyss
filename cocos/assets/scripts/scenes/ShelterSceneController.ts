import { _decorator } from 'cc';
import { SceneNames } from '../core';
import { BaseSceneController } from './BaseSceneController';

const { ccclass } = _decorator;

@ccclass('ShelterSceneController')
export class ShelterSceneController extends BaseSceneController {
  public onEnable(): void {
    this.refreshCommonChrome();
    this.setActiveTab('shelter');
  }

  public getHomeSummary() {
    const runtime = this.app.runtime.getRuntime();
    const chapter = Object.values(runtime.chapters)[0] ?? null;
    const selectedHomeGirl =
      runtime.profile.selected_home_girl_id ?
        this.app.config.fusionGirls.getById(runtime.profile.selected_home_girl_id)
      : null;
    const currentStage =
      chapter?.current_stage_id ? this.app.config.stages.getById(chapter.current_stage_id) : null;
    const currentStageProgress =
      chapter?.current_stage_id ? this.app.managers.stages.getStageProgress(chapter.current_stage_id) : null;

    return {
      selectedHomeGirlId: runtime.profile.selected_home_girl_id,
      selectedHomeGirl,
      selectedHomeGirlState:
        runtime.profile.selected_home_girl_id ?
          this.app.managers.fusionGirls.getState(runtime.profile.selected_home_girl_id)
        : null,
      chapterId: chapter?.chapter_id ?? null,
      currentStageId: chapter?.current_stage_id ?? null,
      currentStage,
      currentStageProgress,
      canContinueMainline: Boolean(currentStage),
      resources: runtime.resources,
      reservedEntries: [
        { key: 'event', label: '\u6d3b\u52a8\u5165\u53e3', unlocked: false },
      ],
    };
  }

  public async openTeam(): Promise<void> {
    await this.navigateTo(SceneNames.Team);
  }

  public async openMap(): Promise<void> {
    await this.navigateTo(SceneNames.Map);
  }

  public async openShop(): Promise<void> {
    await this.navigateTo(SceneNames.Shop);
  }

  public async openSettings(): Promise<void> {
    await this.navigateTo(SceneNames.Settings);
  }
}
