import { JsonAsset, resources } from 'cc';
import type { ConfigAssetLoader } from '../config';

export const cocosJsonAssetLoader: ConfigAssetLoader = async <T>(assetPath: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    resources.load(assetPath, JsonAsset, (error, asset) => {
      if (error || !asset) {
        reject(error ?? new Error(`Failed to load JsonAsset: ${assetPath}`));
        return;
      }

      resolve(asset.json as T);
    });
  });
};
