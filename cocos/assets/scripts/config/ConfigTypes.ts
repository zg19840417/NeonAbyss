import type {
  DropGroupConfig,
  EnemyConfig,
  EnemyGroupConfig,
  FusionGirlConfig,
  GlobalConfigMap,
  ItemConfig,
  PortraitFragmentConfig,
  PortraitSetConfig,
  ShopItemConfig,
  StageConfig,
} from '../data';

export interface RawConfigBundle {
  fusionGirls: FusionGirlConfig[];
  portraitSets: PortraitSetConfig[];
  portraitFragments: PortraitFragmentConfig[];
  stages: StageConfig[];
  enemies: EnemyConfig[];
  enemyGroups: EnemyGroupConfig[];
  dropGroups: DropGroupConfig[];
  items: ItemConfig[];
  globalConfig: GlobalConfigMap;
  shopItems: ShopItemConfig[];
}
