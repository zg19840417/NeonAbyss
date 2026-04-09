import type { RuntimeState } from '../runtime';
import { FusionGirlManager } from './FusionGirlManager';

export class StoryManager {
  constructor(
    private readonly runtimeState: RuntimeState,
    private readonly fusionGirlManager: FusionGirlManager,
  ) {}

  public isOpeningStoryCompleted(): boolean {
    return this.runtimeState.getRuntime().profile.opening_story_completed;
  }

  public completeOpeningStory(): void {
    const runtime = this.runtimeState.getRuntime();
    if (runtime.profile.opening_story_completed) {
      return;
    }

    runtime.profile.opening_story_completed = true;
    this.fusionGirlManager.grantInitialGirls();
    this.runtimeState.touch();
  }
}
