import { _decorator } from 'cc';
import { SceneNames } from '../core';
import { BaseSceneController } from './BaseSceneController';

const { ccclass } = _decorator;

@ccclass('MainMenuSceneController')
export class MainMenuSceneController extends BaseSceneController {
  public onEnable(): void {
    this.refreshCommonChrome();
  }

  public getMenuState() {
    return {
      openingStoryCompleted: this.app.managers.story.isOpeningStoryCompleted(),
      unlockedGirlCount: this.app.managers.fusionGirls.getUnlockedGirls().length,
    };
  }

  public async startGame(): Promise<void> {
    if (this.app.managers.story.isOpeningStoryCompleted()) {
      await this.navigateTo(SceneNames.Shelter);
      return;
    }

    await this.navigateTo(SceneNames.Story);
  }
}
