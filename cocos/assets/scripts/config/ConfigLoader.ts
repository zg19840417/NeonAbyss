import type { RawConfigBundle } from './ConfigTypes';
import { ConfigBundle } from './ConfigBundle';

export type ConfigAssetLoader = <T>(path: string) => Promise<T>;

export async function loadConfigBundle(
  loader: ConfigAssetLoader,
  paths: {
    fusionGirls: string;
    portraitSets: string;
    portraitFragments: string;
    stages: string;
    enemies: string;
    enemyGroups: string;
    dropGroups: string;
    items: string;
    globalConfig: string;
    shopItems: string;
  },
): Promise<ConfigBundle> {
  const rawBundle: RawConfigBundle = {
    fusionGirls: await loader(paths.fusionGirls),
    portraitSets: await loader(paths.portraitSets),
    portraitFragments: await loader(paths.portraitFragments),
    stages: await loader(paths.stages),
    enemies: await loader(paths.enemies),
    enemyGroups: await loader(paths.enemyGroups),
    dropGroups: await loader(paths.dropGroups),
    items: await loader(paths.items),
    globalConfig: await loader(paths.globalConfig),
    shopItems: await loader(paths.shopItems),
  };

  return new ConfigBundle(rawBundle);
}
