import type {
  ChapterProgressState,
  FragmentProgressState,
  FusionGirlRuntimeState,
  InventoryState,
  PlayerResourceState,
  RuntimeStatBlock,
  ShopRuntimeState,
  StageProgressState,
} from '../data';

export function createEmptyStatBlock(): RuntimeStatBlock {
  return {
    hp: 0,
    atk: 0,
    spd: 0,
  };
}

export function createPlayerResourceState(params: {
  mycelium: number;
  source_core: number;
  star_coin: number;
  stamina: number;
  water_point?: number;
  fire_point?: number;
  wind_point?: number;
  stamina_last_recover_at?: number;
}): PlayerResourceState {
  return {
    mycelium: params.mycelium,
    source_core: params.source_core,
    star_coin: params.star_coin,
    stamina: params.stamina,
    water_point: params.water_point ?? 0,
    fire_point: params.fire_point ?? 0,
    wind_point: params.wind_point ?? 0,
    stamina_last_recover_at: params.stamina_last_recover_at ?? Date.now(),
  };
}

export function createFragmentProgressState(fragmentId: string): FragmentProgressState {
  return {
    fragment_id: fragmentId,
    owned_count: 0,
    effective_count: 0,
    overflow_count: 0,
    applied_growth_value: 0,
  };
}

export function createInventoryState(): InventoryState {
  return {
    entries: {},
  };
}

export function createShopRuntimeState(): ShopRuntimeState {
  return {
    purchased_count_by_shop_item_id: {},
  };
}

export function createStageProgressState(stageId: string, unlocked: boolean): StageProgressState {
  return {
    stage_id: stageId,
    unlocked,
    cleared: false,
    best_star: 0,
    claimed_first_clear_star_rewards: [],
  };
}

export function createChapterProgressState(params: {
  chapterId: string;
  unlocked: boolean;
  currentStageId: string | null;
  stages: StageProgressState[];
}): ChapterProgressState {
  return {
    chapter_id: params.chapterId,
    unlocked: params.unlocked,
    current_stage_id: params.currentStageId,
    stage_progress: Object.fromEntries(
      params.stages.map((stage) => [stage.stage_id, stage]),
    ),
  };
}

export function createFusionGirlRuntimeState(params: {
  fusionGirlId: string;
  quality: FusionGirlRuntimeState['quality'];
  level: number;
  portraitSetIds: string[];
  fragmentIdsBySetId: Record<string, string[]>;
}): FusionGirlRuntimeState {
  return {
    fusion_girl_id: params.fusionGirlId,
    unlocked: false,
    quality: params.quality,
    level: params.level,
    experience: 0,
    deployed_slot: null,
    active_portrait_set_id: params.portraitSetIds[0] ?? null,
    pending_quality_up_count: 0,
    fragment_sets: Object.fromEntries(
      params.portraitSetIds.map((portraitSetId) => [
        portraitSetId,
        {
          portrait_set_id: portraitSetId,
          completed: false,
          fragment_progress: Object.fromEntries(
            (params.fragmentIdsBySetId[portraitSetId] ?? []).map((fragmentId) => [
              fragmentId,
              createFragmentProgressState(fragmentId),
            ]),
          ),
        },
      ]),
    ),
    fragment_growth_bonus: createEmptyStatBlock(),
    unlocked_skill_slots: 3,
    unlocked_ability_slots: 8,
    mod_slots: 0,
  };
}
