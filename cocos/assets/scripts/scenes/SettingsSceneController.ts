import { _decorator } from 'cc';
import { SceneNames } from '../core';
import { BaseSceneController } from './BaseSceneController';

const { ccclass } = _decorator;

@ccclass('SettingsSceneController')
export class SettingsSceneController extends BaseSceneController {
  public onEnable(): void {
    this.refreshCommonChrome();
    this.setActiveTab('settings');
  }

  public getSettingsState() {
    return {
      ...this.app.runtime.getRuntime().settings,
      accountActions: [
        { key: 'bind_account', label: '\u7ed1\u5b9a\u8d26\u53f7', enabled: false },
        { key: 'reset_account', label: '\u91cd\u7f6e\u8d26\u53f7', enabled: true },
      ],
    };
  }

  public async resetAccount(): Promise<void> {
    await this.app.managers.save.reset();
    this.refreshCommonChrome();
    await this.navigateTo(SceneNames.MainMenu);
  }
}
