export const CONFIG_ASSET_PATHS = {
  fusionGirls: 'data/json/fusion_girls',
  portraitSets: 'data/json/portrait_sets',
  portraitFragments: 'data/json/portrait_fragments',
  stages: 'data/json/stages',
  enemies: 'data/json/enemies',
  enemyGroups: 'data/json/enemy_groups',
  dropGroups: 'data/json/drop_groups',
  items: 'data/json/items',
  globalConfig: 'data/json/global_config',
  shopItems: 'data/json/shop_items',
} as const;

export type ConfigAssetKey = keyof typeof CONFIG_ASSET_PATHS;
