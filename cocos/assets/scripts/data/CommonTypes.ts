export type Quality = 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LE';

export type FragmentQuality = 'R' | 'SR' | 'SSR' | 'UR';

export type ElementType = 'water' | 'fire' | 'wind';

export type ProfessionType = 'support' | 'dps' | 'tank';

export type GrowthStatType = 'hp' | 'atk' | 'spd' | 'all';

export type CurrencyType =
  | 'mycelium'
  | 'source_core'
  | 'star_coin'
  | 'stamina'
  | 'water_point'
  | 'fire_point'
  | 'wind_point';

export type ShopTabType = 'basic' | 'element' | 'event';

export type ValueType = 'int' | 'float' | 'string' | 'bool' | 'json';

export type StageUnlockCondition = 'default_open' | `clear:${string}`;

export interface FixedDropEntry {
  item_id: string;
  count: number;
}

export interface WeightedDropEntry {
  item_id: string;
  count: number;
  weight: number;
}

export interface RuntimeStatBlock {
  hp: number;
  atk: number;
  spd: number;
}
