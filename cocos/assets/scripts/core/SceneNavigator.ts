import { director } from 'cc';
import type { SceneName } from './SceneNames';

export class SceneNavigator {
  public static async goTo(sceneName: SceneName): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      director.loadScene(sceneName, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
