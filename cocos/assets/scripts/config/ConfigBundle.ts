import type { RawConfigBundle } from './ConfigTypes';
import { validateRawConfigBundle } from './ConfigValidator';
import { DropGroupRepo } from './DropGroupRepo';
import { EnemyRepo } from './EnemyRepo';
import { EnemyGroupRepo } from './EnemyGroupRepo';
import { FusionGirlRepo } from './FusionGirlRepo';
import { GlobalConfigRepo } from './GlobalConfigRepo';
import { ItemRepo } from './ItemRepo';
import { PortraitFragmentRepo } from './PortraitFragmentRepo';
import { PortraitSetRepo } from './PortraitSetRepo';
import { ShopRepo } from './ShopRepo';
import { StageRepo } from './StageRepo';

export class ConfigBundle {
  public readonly fusionGirls: FusionGirlRepo;
  public readonly portraitSets: PortraitSetRepo;
  public readonly portraitFragments: PortraitFragmentRepo;
  public readonly stages: StageRepo;
  public readonly enemies: EnemyRepo;
  public readonly enemyGroups: EnemyGroupRepo;
  public readonly dropGroups: DropGroupRepo;
  public readonly items: ItemRepo;
  public readonly globalConfig: GlobalConfigRepo;
  public readonly shop: ShopRepo;

  constructor(rawBundle: RawConfigBundle) {
    validateRawConfigBundle(rawBundle);

    this.fusionGirls = new FusionGirlRepo(rawBundle.fusionGirls);
    this.portraitSets = new PortraitSetRepo(rawBundle.portraitSets);
    this.portraitFragments = new PortraitFragmentRepo(rawBundle.portraitFragments);
    this.stages = new StageRepo(rawBundle.stages);
    this.enemies = new EnemyRepo(rawBundle.enemies);
    this.enemyGroups = new EnemyGroupRepo(rawBundle.enemyGroups);
    this.dropGroups = new DropGroupRepo(rawBundle.dropGroups);
    this.items = new ItemRepo(rawBundle.items);
    this.globalConfig = new GlobalConfigRepo(rawBundle.globalConfig);
    this.shop = new ShopRepo(rawBundle.shopItems);
  }
}
