import type {
  CurrencyType,
  ElementType,
  FixedDropEntry,
  FragmentQuality,
  GrowthStatType,
  ProfessionType,
  Quality,
  ShopTabType,
  StageUnlockCondition,
  ValueType,
  WeightedDropEntry,
} from './CommonTypes';

export interface FusionGirlConfig {
  fusion_girl_id: string;
  name: string;
  title: string;
  profession: ProfessionType;
  element: ElementType;
  initial_quality: Quality;
  initial_level: number;
  portrait_key: string;
  is_initial: boolean;
  sort_order: number;
  notes: string | null;
}

export interface PortraitSetConfig {
  portrait_set_id: string;
  fusion_girl_id: string;
  set_name: string;
  set_index: number;
  is_active: boolean;
  preview_key: string;
  notes: string | null;
}

export interface PortraitFragmentConfig {
  fragment_id: string;
  fusion_girl_id: string;
  portrait_set_id: string;
  fragment_quality: FragmentQuality;
  required_count: number;
  growth_stat_type: GrowthStatType;
  growth_value: number;
  overflow_element_type: ElementType;
  item_id: string;
  notes: string | null;
}

export interface StageConfig {
  stage_id: string;
  chapter_id: string;
  stage_name: string;
  stage_index: number;
  stamina_cost: number;
  star_round_limit: number;
  enemy_group_id: string;
  first_clear_1star_drop_group: string;
  first_clear_2star_drop_group: string;
  first_clear_3star_drop_group: string;
  repeat_drop_group: string;
  unlock_condition: StageUnlockCondition;
  notes: string | null;
}

export interface EnemyGroupConfig {
  enemy_group_id: string;
  group_name: string;
  slot1_enemy_id: string;
  slot1_level: number;
  slot2_enemy_id: string;
  slot2_level: number;
  slot3_enemy_id: string;
  slot3_level: number;
  notes: string | null;
}

export interface EnemyConfig {
  enemy_id: string;
  enemy_name: string;
  title: string;
  profession: ProfessionType;
  element: ElementType;
  quality: Quality;
  portrait_key: string;
  base_hp: number;
  base_atk: number;
  base_spd: number;
  skills_json: Array<Record<string, unknown>>;
  abilities_json: Array<Record<string, unknown>>;
  notes: string | null;
}

export interface DropGroupConfig {
  drop_group_id: string;
  fixed_drop_json: FixedDropEntry[];
  random_drop_json: WeightedDropEntry[];
  notes: string | null;
}

export interface ItemConfig {
  item_id: string;
  item_name: string;
  item_type: string;
  sub_type: string;
  quality: Quality;
  auto_use: boolean;
  visible: boolean;
  effect_type: string;
  effect_params: Record<string, unknown> | null;
  icon_key: string;
  notes: string | null;
}

export interface GlobalConfigRecord {
  config_key: string;
  value_type: ValueType;
  config_value: string | number | boolean | Record<string, unknown> | null;
  notes: string | null;
}

export interface GlobalConfigMap {
  initial_mycelium: number;
  initial_source_core: number;
  initial_star_coin: number;
  initial_stamina: number;
  max_stamina: number;
  stamina_recover_minutes: number;
  battle_speed_slow: number;
  battle_speed_normal: number;
  default_chapter_id: string;
  [key: string]: string | number | boolean | Record<string, unknown> | null;
}

export interface ShopItemConfig {
  shop_item_id: string;
  shop_tab: ShopTabType;
  item_id: string;
  price_currency_type: CurrencyType;
  price_value: number;
  effect_type: string;
  effect_params: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  notes: string | null;
}
