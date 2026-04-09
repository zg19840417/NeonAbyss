import { _decorator, Component } from 'cc';
import { AppSession, SceneName, SceneNavigator } from '../core';
import type { AppContext } from '../core';
import { BottomNavBar, TopResourceBar } from '../ui';

const { ccclass, property } = _decorator;

@ccclass('BaseSceneController')
export class BaseSceneController extends Component {
  @property(TopResourceBar)
  public topResourceBar: TopResourceBar | null = null;

  @property(BottomNavBar)
  public bottomNavBar: BottomNavBar | null = null;

  protected get app(): AppContext {
    return AppSession.getContext();
  }

  protected refreshCommonChrome(): void {
    this.app.managers.resources.recoverStaminaIfNeeded();
    this.topResourceBar?.refresh();
  }

  protected setActiveTab(tab: 'shelter' | 'team' | 'map' | 'shop' | 'settings'): void {
    this.bottomNavBar?.setActiveTab(tab);
  }

  protected async saveProgress(): Promise<void> {
    await this.app.managers.save.save();
  }

  protected async navigateTo(sceneName: SceneName): Promise<void> {
    await SceneNavigator.goTo(sceneName);
  }
}
