import { _decorator, Component, Label } from 'cc';
import { AppSession } from '../core';

const { ccclass, property } = _decorator;

@ccclass('TopResourceBar')
export class TopResourceBar extends Component {
  @property(Label)
  public myceliumLabel: Label | null = null;

  @property(Label)
  public sourceCoreLabel: Label | null = null;

  @property(Label)
  public starCoinLabel: Label | null = null;

  @property(Label)
  public staminaLabel: Label | null = null;

  public onEnable(): void {
    this.refresh();
  }

  public refresh(): void {
    if (!AppSession.hasContext()) {
      return;
    }

    const app = AppSession.getContext();
    app.managers.resources.recoverStaminaIfNeeded();
    const resources = app.runtime.getRuntime().resources;
    const maxStamina = app.config.globalConfig.requireNumber('max_stamina');

    if (this.myceliumLabel) {
      this.myceliumLabel.string = `\u83cc\u4e1d ${resources.mycelium}`;
    }
    if (this.sourceCoreLabel) {
      this.sourceCoreLabel.string = `\u6e90\u6838 ${resources.source_core}`;
    }
    if (this.starCoinLabel) {
      this.starCoinLabel.string = `\u661f\u5e01 ${resources.star_coin}`;
    }
    if (this.staminaLabel) {
      this.staminaLabel.string = `\u4f53\u529b ${resources.stamina}/${maxStamina}`;
    }
  }
}
