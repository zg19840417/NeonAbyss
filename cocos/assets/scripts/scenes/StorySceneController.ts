import { _decorator } from 'cc';
import { SceneNames } from '../core';
import { OPENING_STORY_PAGES } from '../story/OpeningStoryScript';
import { BaseSceneController } from './BaseSceneController';

const { ccclass } = _decorator;

@ccclass('StorySceneController')
export class StorySceneController extends BaseSceneController {
  public onEnable(): void {
    this.refreshCommonChrome();
  }

  public getOpeningStoryState() {
    return {
      storyId: 'opening_story',
      canComplete: !this.app.managers.story.isOpeningStoryCompleted(),
      pages: OPENING_STORY_PAGES,
      rewardPreview: this.app.config.fusionGirls.getInitialGirls().map((girl) => ({
        fusionGirlId: girl.fusion_girl_id,
        name: girl.name,
        title: girl.title,
        portraitKey: girl.portrait_key,
      })),
    };
  }

  public async completeOpeningStory(): Promise<void> {
    this.app.managers.story.completeOpeningStory();
    await this.saveProgress();
    await this.navigateTo(SceneNames.Shelter);
  }
}
