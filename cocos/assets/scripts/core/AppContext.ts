import type { ConfigBundle } from '../config';
import type { BattleSessionState, RuntimeState } from '../runtime';
import type {
  FusionGirlManager,
  InventoryManager,
  ResourceManager,
  RewardManager,
  SaveManager,
  ShopManager,
  StageManager,
  StoryManager,
} from '../managers';

export interface AppContext {
  config: ConfigBundle;
  runtime: RuntimeState;
  battleSession: BattleSessionState;
  managers: {
    save: SaveManager;
    resources: ResourceManager;
    fusionGirls: FusionGirlManager;
    inventory: InventoryManager;
    stages: StageManager;
    rewards: RewardManager;
    shop: ShopManager;
    story: StoryManager;
  };
}
