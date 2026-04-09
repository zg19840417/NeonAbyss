import { _decorator, Component } from 'cc';
import { CommonButton } from './CommonButton';

const { ccclass, property } = _decorator;

export interface TabDefinition {
  key: string;
  label: string;
}

@ccclass('TabHeader')
export class TabHeader extends Component {
  @property([CommonButton])
  public buttons: CommonButton[] = [];

  private activeKey = '';
  private changeHandler: ((key: string) => void) | null = null;

  public bindTabs(definitions: TabDefinition[], activeKey: string, onChange: (key: string) => void): void {
    this.activeKey = activeKey;
    this.changeHandler = onChange;

    this.buttons.forEach((button, index) => {
      const def = definitions[index];
      if (!def) {
        button.node.active = false;
        return;
      }
      button.node.active = true;
      button.setLabel(def.label);
      button.setClickHandler(() => this.handleTabClick(def.key));
    });
  }

  private handleTabClick(key: string): void {
    this.activeKey = key;
    this.changeHandler?.(key);
  }
}
