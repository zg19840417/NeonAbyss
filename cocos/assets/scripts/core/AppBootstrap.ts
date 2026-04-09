import { CONFIG_ASSET_PATHS, ConfigBundle, loadConfigBundle } from '../config';
import {
  FusionGirlManager,
  InventoryManager,
  ResourceManager,
  RewardManager,
  SaveManager,
  ShopManager,
  StageManager,
  StoryManager,
} from '../managers';
import { BattleSessionState, RuntimeState } from '../runtime';
import { cocosJsonAssetLoader } from './JsonAssetLoader';
import { LocalStorageSaveAdapter } from './StorageAdapters';
import type { AppContext } from './AppContext';

const DEFAULT_SAVE_KEY = 'wasteland-era-cocos-save';

export async function bootstrapAppContext(): Promise<AppContext> {
  const config = await loadConfigBundle(cocosJsonAssetLoader, CONFIG_ASSET_PATHS);
  return createAppContext(config);
}

export async function createAppContext(config: ConfigBundle): Promise<AppContext> {
  const runtime = new RuntimeState(config);
  const battleSession = new BattleSessionState();
  const save = new SaveManager(runtime, new LocalStorageSaveAdapter(DEFAULT_SAVE_KEY));
  await save.loadOrCreateDefault();

  const resources = new ResourceManager(config, runtime);
  const fusionGirls = new FusionGirlManager(config, runtime);
  const inventory = new InventoryManager(config, runtime);
  const stages = new StageManager(config, runtime, resources);
  const rewards = new RewardManager(config, runtime, resources, fusionGirls, inventory);
  const shop = new ShopManager(config, runtime, resources, inventory);
  const story = new StoryManager(runtime, fusionGirls);

  return {
    config,
    runtime,
    battleSession,
    managers: {
      save,
      resources,
      fusionGirls,
      inventory,
      stages,
      rewards,
      shop,
      story,
    },
  };
}
