import { _decorator, Button, Color, Component, Label, Node, Sprite } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CommonButton')
export class CommonButton extends Component {
  @property(Button)
  public button: Button | null = null;

  @property(Label)
  public label: Label | null = null;

  @property(Sprite)
  public background: Sprite | null = null;

  @property
  public normalLabel = '\u6309\u94ae';

  @property(Color)
  public normalColor: Color = new Color(34, 54, 82, 255);

  @property(Color)
  public activeColor: Color = new Color(36, 200, 255, 255);

  private clickHandler: (() => void) | null = null;
  private selected = false;

  public onLoad(): void {
    this.refreshLabel();
    this.applyVisual(false);
    this.node.on(Node.EventType.MOUSE_ENTER, this.handleHoverIn, this);
    this.node.on(Node.EventType.MOUSE_LEAVE, this.handleHoverOut, this);
    this.node.on(Node.EventType.TOUCH_END, this.handleClick, this);
  }

  public onDestroy(): void {
    this.node.off(Node.EventType.MOUSE_ENTER, this.handleHoverIn, this);
    this.node.off(Node.EventType.MOUSE_LEAVE, this.handleHoverOut, this);
    this.node.off(Node.EventType.TOUCH_END, this.handleClick, this);
  }

  public setLabel(text: string): void {
    this.normalLabel = text;
    this.refreshLabel();
  }

  public setClickHandler(handler: (() => void) | null): void {
    this.clickHandler = handler;
  }

  public setInteractable(interactable: boolean): void {
    if (this.button) {
      this.button.interactable = interactable;
    }
    this.node.pauseSystemEvents(!interactable);
    this.applyVisual(this.selected);
  }

  public setSelected(selected: boolean): void {
    this.selected = selected;
    this.applyVisual(this.selected);
  }

  private refreshLabel(): void {
    if (this.label) {
      this.label.string = this.normalLabel;
    }
  }

  private applyVisual(active: boolean): void {
    if (this.background) {
      this.background.color = active ? this.activeColor : this.normalColor;
    }
  }

  private handleHoverIn(): void {
    this.applyVisual(true);
  }

  private handleHoverOut(): void {
    this.applyVisual(this.selected);
  }

  private handleClick(): void {
    this.clickHandler?.();
  }
}
