import { _decorator, Component } from 'cc';
import { bootstrapAppContext } from './AppBootstrap';
import { AppSession } from './AppSession';
import { SceneNames } from './SceneNames';
import { SceneNavigator } from './SceneNavigator';

const { ccclass } = _decorator;

@ccclass('BootSceneController')
export class BootSceneController extends Component {
  public async start(): Promise<void> {
    const context = await bootstrapAppContext();
    AppSession.setContext(context);

    try {
      await SceneNavigator.goTo(SceneNames.MainMenu);
    } catch (error) {
      console.warn('[BootSceneController] Failed to enter MainMenuScene.', error);
    }
  }
}
