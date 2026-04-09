import type { ElementType, Quality, RuntimeStatBlock } from './CommonTypes';

export interface PlayerResourceState {
  mycelium: number;
  source_core: number;
  star_coin: number;
  stamina: number;
  water_point: number;
  fire_point: number;
  wind_point: number;
  stamina_last_recover_at: number;
}

export interface FragmentProgressState {
  fragment_id: string;
  owned_count: number;
  effective_count: number;
  overflow_count: number;
  applied_growth_value: number;
}

export interface PortraitSetProgressState {
  portrait_set_id: string;
  completed: boolean;
  fragment_progress: Record<string, FragmentProgressState>;
}

export interface FusionGirlRuntimeState {
  fusion_girl_id: string;
  unlocked: boolean;
  quality: Quality;
  level: number;
  experience: number;
  deployed_slot: number | null;
  active_portrait_set_id: string | null;
  pending_quality_up_count: number;
  fragment_sets: Record<string, PortraitSetProgressState>;
  fragment_growth_bonus: RuntimeStatBlock;
  unlocked_skill_slots: number;
  unlocked_ability_slots: number;
  mod_slots: number;
}

export interface InventoryEntryState {
  item_id: string;
  count: number;
}

export interface InventoryState {
  entries: Record<string, InventoryEntryState>;
}

export interface StageProgressState {
  stage_id: string;
  unlocked: boolean;
  cleared: boolean;
  best_star: 0 | 1 | 2 | 3;
  claimed_first_clear_star_rewards: number[];
}

export interface ChapterProgressState {
  chapter_id: string;
  unlocked: boolean;
  current_stage_id: string | null;
  stage_progress: Record<string, StageProgressState>;
}

export interface ShopRuntimeState {
  purchased_count_by_shop_item_id: Record<string, number>;
}

export interface SettingsState {
  language: string;
  bgm_enabled: boolean;
  sfx_enabled: boolean;
}

export interface PlayerProfileState {
  player_id: string;
  opening_story_completed: boolean;
  selected_home_girl_id: string | null;
}

export interface GameRuntimeState {
  profile: PlayerProfileState;
  resources: PlayerResourceState;
  fusion_girls: Record<string, FusionGirlRuntimeState>;
  inventory: InventoryState;
  chapters: Record<string, ChapterProgressState>;
  shop: ShopRuntimeState;
  settings: SettingsState;
}

export interface StageRewardContext {
  stage_id: string;
  star: 1 | 2 | 3;
  first_clear: boolean;
}

export interface ElementPointGrant {
  element: ElementType;
  amount: number;
}
