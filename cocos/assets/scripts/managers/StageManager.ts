import type { ConfigBundle } from '../config';
import type { StageConfig, StageProgressState } from '../data';
import type { RuntimeState } from '../runtime';
import { ResourceManager } from './ResourceManager';

export interface StageEnterCheckResult {
  ok: boolean;
  reason: 'ok' | 'stage_not_found' | 'stage_locked' | 'stamina_not_enough';
  stage: StageConfig | null;
}

export interface StageSettlementInput {
  stageId: string;
  star: 1 | 2 | 3;
  win: boolean;
}

export interface StageSettlementResult {
  stageId: string;
  firstClear: boolean;
  bestStarUpdated: boolean;
  unlockedNextStageId: string | null;
  rewardDropGroupIds: string[];
}

export interface StageNodeState {
  stage: StageConfig;
  progress: StageProgressState | null;
  isCurrent: boolean;
  isUnlocked: boolean;
  isCleared: boolean;
  bestStar: number;
}

export class StageManager {
  constructor(
    private readonly configBundle: ConfigBundle,
    private readonly runtimeState: RuntimeState,
    private readonly resourceManager: ResourceManager,
  ) {}

  public getStageConfig(stageId: string): StageConfig | null {
    return this.configBundle.stages.getById(stageId);
  }

  public getStageProgress(stageId: string): StageProgressState | null {
    const chapterId = this.getStageConfig(stageId)?.chapter_id;
    if (!chapterId) {
      return null;
    }
    return this.runtimeState.getRuntime().chapters[chapterId]?.stage_progress[stageId] ?? null;
  }

  public canEnterStage(stageId: string): StageEnterCheckResult {
    const stage = this.getStageConfig(stageId);
    if (!stage) {
      return { ok: false, reason: 'stage_not_found', stage: null };
    }

    const progress = this.getStageProgress(stageId);
    if (!progress?.unlocked) {
      return { ok: false, reason: 'stage_locked', stage };
    }

    if (!this.resourceManager.canAfford('stamina', stage.stamina_cost)) {
      return { ok: false, reason: 'stamina_not_enough', stage };
    }

    return { ok: true, reason: 'ok', stage };
  }

  public getChapterStageNodes(chapterId: string): StageNodeState[] {
    const runtime = this.runtimeState.getRuntime();
    const chapter = runtime.chapters[chapterId];
    const currentStageId = chapter?.current_stage_id ?? null;

    return this.configBundle.stages.getByChapterId(chapterId).map((stage) => {
      const progress = chapter?.stage_progress[stage.stage_id] ?? null;
      return {
        stage,
        progress,
        isCurrent: currentStageId === stage.stage_id,
        isUnlocked: Boolean(progress?.unlocked),
        isCleared: Boolean(progress?.cleared),
        bestStar: progress?.best_star ?? 0,
      };
    });
  }

  public consumeStageCost(stageId: string): boolean {
    const stage = this.configBundle.stages.requireById(stageId, 'stage');
    return this.resourceManager.spendStamina(stage.stamina_cost);
  }

  public settleStage(input: StageSettlementInput): StageSettlementResult {
    const stage = this.configBundle.stages.requireById(input.stageId, 'stage');
    const progress = this.getStageProgress(input.stageId);
    if (!progress) {
      throw new Error(`Missing stage progress: ${input.stageId}`);
    }

    if (!input.win) {
      return {
        stageId: input.stageId,
        firstClear: false,
        bestStarUpdated: false,
        unlockedNextStageId: null,
        rewardDropGroupIds: [],
      };
    }

    const firstClear = !progress.cleared;
    progress.cleared = true;

    const oldBestStar = progress.best_star;
    if (input.star > progress.best_star) {
      progress.best_star = input.star;
    }

    const rewardDropGroupIds: string[] = [];

    if (firstClear) {
      for (let star = 1; star <= input.star; star += 1) {
        if (!progress.claimed_first_clear_star_rewards.includes(star)) {
          progress.claimed_first_clear_star_rewards.push(star);
          rewardDropGroupIds.push(this.getFirstClearDropGroup(stage, star as 1 | 2 | 3));
        }
      }
    } else {
      rewardDropGroupIds.push(stage.repeat_drop_group);
    }

    const unlockedNextStageId = this.unlockNextStage(stage);
    const chapter = this.runtimeState.getRuntime().chapters[stage.chapter_id];
    if (chapter) {
      chapter.current_stage_id = unlockedNextStageId ?? stage.stage_id;
    }
    this.runtimeState.touch();

    return {
      stageId: input.stageId,
      firstClear,
      bestStarUpdated: progress.best_star !== oldBestStar,
      unlockedNextStageId,
      rewardDropGroupIds,
    };
  }

  private getFirstClearDropGroup(stage: StageConfig, star: 1 | 2 | 3): string {
    switch (star) {
      case 1:
        return stage.first_clear_1star_drop_group;
      case 2:
        return stage.first_clear_2star_drop_group;
      case 3:
        return stage.first_clear_3star_drop_group;
    }
  }

  private unlockNextStage(stage: StageConfig): string | null {
    const chapterStages = this.configBundle.stages.getByChapterId(stage.chapter_id);
    const nextStage = chapterStages.find((candidate) => candidate.stage_index === stage.stage_index + 1);
    if (!nextStage) {
      return null;
    }

    const nextProgress = this.getStageProgress(nextStage.stage_id);
    if (!nextProgress) {
      return null;
    }

    nextProgress.unlocked = true;
    return nextStage.stage_id;
  }
}
