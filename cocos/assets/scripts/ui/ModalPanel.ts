import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ModalPanel')
export class ModalPanel extends Component {
  @property(Node)
  public blocker: Node | null = null;

  @property(Node)
  public contentRoot: Node | null = null;

  private closeHandler: (() => void) | null = null;

  public onLoad(): void {
    this.blocker?.on(Node.EventType.TOUCH_END, this.handleClose, this);
    this.contentRoot?.on(Node.EventType.TOUCH_END, this.stopPropagation, this, true);
  }

  public onDestroy(): void {
    this.blocker?.off(Node.EventType.TOUCH_END, this.handleClose, this);
    this.contentRoot?.off(Node.EventType.TOUCH_END, this.stopPropagation, this, true);
  }

  public setCloseHandler(handler: (() => void) | null): void {
    this.closeHandler = handler;
  }

  private handleClose(event?: Event): void {
    event?.stopPropagation?.();
    this.closeHandler?.();
  }

  private stopPropagation(event?: Event): void {
    event?.stopPropagation?.();
  }
}
