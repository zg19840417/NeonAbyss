import type { ConfigBundle } from '../config';
import type {
  FusionGirlConfig,
  GameRuntimeState,
  SaveData,
  SaveMeta,
  SettingsState,
  StageConfig,
} from '../data';
import {
  createChapterProgressState,
  createFusionGirlRuntimeState,
  createInventoryState,
  createPlayerResourceState,
  createShopRuntimeState,
  createStageProgressState,
} from './RuntimeHelpers';

function createDefaultSettingsState(): SettingsState {
  return {
    language: 'zh-CN',
    bgm_enabled: true,
    sfx_enabled: true,
  };
}

function buildFusionGirlState(configBundle: ConfigBundle): GameRuntimeState['fusion_girls'] {
  const girls = configBundle.fusionGirls.getAll();

  return Object.fromEntries(
    girls.map((girl: FusionGirlConfig) => {
      const portraitSets = configBundle.portraitSets.getByGirlId(girl.fusion_girl_id);
      const fragmentIdsBySetId = Object.fromEntries(
        portraitSets.map((portraitSet) => [
          portraitSet.portrait_set_id,
          configBundle.portraitFragments
            .getByPortraitSetId(portraitSet.portrait_set_id)
            .map((fragment) => fragment.fragment_id),
        ]),
      );

      return [
        girl.fusion_girl_id,
        createFusionGirlRuntimeState({
          fusionGirlId: girl.fusion_girl_id,
          quality: girl.initial_quality,
          level: girl.initial_level,
          portraitSetIds: portraitSets.map((portraitSet) => portraitSet.portrait_set_id),
          fragmentIdsBySetId,
        }),
      ];
    }),
  );
}

function buildChapterState(configBundle: ConfigBundle): GameRuntimeState['chapters'] {
  const defaultChapterId = configBundle.globalConfig.requireString('default_chapter_id');
  const chapterStages = configBundle.stages.getByChapterId(defaultChapterId);

  const stageProgress = chapterStages.map((stage: StageConfig) =>
    createStageProgressState(stage.stage_id, stage.unlock_condition === 'default_open'),
  );

  return {
    [defaultChapterId]: createChapterProgressState({
      chapterId: defaultChapterId,
      unlocked: true,
      currentStageId: chapterStages[0]?.stage_id ?? null,
      stages: stageProgress,
    }),
  };
}

export function createDefaultRuntimeState(configBundle: ConfigBundle): GameRuntimeState {
  return {
    profile: {
      player_id: 'local-player',
      opening_story_completed: false,
      selected_home_girl_id: null,
    },
    resources: createPlayerResourceState({
      mycelium: configBundle.globalConfig.requireNumber('initial_mycelium'),
      source_core: configBundle.globalConfig.requireNumber('initial_source_core'),
      star_coin: configBundle.globalConfig.requireNumber('initial_star_coin'),
      stamina: configBundle.globalConfig.requireNumber('initial_stamina'),
    }),
    fusion_girls: buildFusionGirlState(configBundle),
    inventory: createInventoryState(),
    chapters: buildChapterState(configBundle),
    shop: createShopRuntimeState(),
    settings: createDefaultSettingsState(),
  };
}

export function createDefaultSaveMeta(now = Date.now()): SaveMeta {
  return {
    version: 'cocos-v1',
    created_at: now,
    updated_at: now,
  };
}

export function createDefaultSaveData(configBundle: ConfigBundle, now = Date.now()): SaveData {
  return {
    meta: createDefaultSaveMeta(now),
    runtime: createDefaultRuntimeState(configBundle),
  };
}
