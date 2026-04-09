import { _decorator } from 'cc';
import { BaseSceneController } from './BaseSceneController';

const { ccclass } = _decorator;

@ccclass('TeamSceneController')
export class TeamSceneController extends BaseSceneController {
  public onEnable(): void {
    this.refreshCommonChrome();
    this.setActiveTab('team');
  }

  public getPageState() {
    return {
      resources: this.app.runtime.getRuntime().resources,
      unlockedGirls: this.app.managers.fusionGirls.getUnlockedGirls(),
      deployedGirls: this.app.managers.fusionGirls.getDeployedGirls(),
    };
  }

  public getGirlDetailState(fusionGirlId: string) {
    const girlConfig = this.app.config.fusionGirls.requireById(fusionGirlId, 'fusion girl');
    const girlState = this.app.managers.fusionGirls.requireState(fusionGirlId);
    const portraitSets = this.app.config.portraitSets.getByGirlId(fusionGirlId);
    const fragmentSets = portraitSets.map((setConfig) => ({
      setConfig,
      fragments: this.app.config.portraitFragments.getByPortraitSetId(setConfig.portrait_set_id).map((fragmentConfig) => ({
        fragmentConfig,
        progress: girlState.fragment_sets[setConfig.portrait_set_id]?.fragment_progress[fragmentConfig.fragment_id] ?? null,
      })),
      completed: girlState.fragment_sets[setConfig.portrait_set_id]?.completed ?? false,
    }));

    return {
      girlConfig,
      girlState,
      fragmentSets,
      qualityUpPreview: this.app.managers.fusionGirls.getQualityUpPreview(fusionGirlId),
    };
  }

  public async deployGirl(fusionGirlId: string, slot: number): Promise<void> {
    this.app.managers.fusionGirls.deployGirl(fusionGirlId, slot);
    await this.saveProgress();
    this.refreshCommonChrome();
  }

  public async undeployGirl(fusionGirlId: string): Promise<void> {
    this.app.managers.fusionGirls.undeployGirl(fusionGirlId);
    await this.saveProgress();
    this.refreshCommonChrome();
  }

  public async qualityUpGirl(fusionGirlId: string): Promise<boolean> {
    const result = this.app.managers.fusionGirls.qualityUpOnce(fusionGirlId);
    if (!result) {
      return false;
    }

    await this.saveProgress();
    this.refreshCommonChrome();
    return true;
  }
}
