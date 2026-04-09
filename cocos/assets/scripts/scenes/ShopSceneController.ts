import { _decorator } from 'cc';
import { BaseSceneController } from './BaseSceneController';

const { ccclass } = _decorator;

@ccclass('ShopSceneController')
export class ShopSceneController extends BaseSceneController {
  public onEnable(): void {
    this.refreshCommonChrome();
    this.setActiveTab('shop');
  }

  public getShopState() {
    const resources = this.app.runtime.getRuntime().resources;
    const maxStamina = this.app.config.globalConfig.requireNumber('max_stamina');
    const basicItems = this.app.managers.shop.getActiveItemsByTab('basic').map((shopItem) => {
      const item = this.app.config.items.requireById(shopItem.item_id, 'shop item');
      return {
        shopItem,
        itemPreview: {
          item_id: item.item_id,
          item_name: item.item_name,
          item_type: item.item_type,
          sub_type: item.sub_type,
          quality: item.quality,
          icon_key: item.icon_key,
          auto_use: item.auto_use,
          visible: item.visible,
        },
      };
    });

    return {
      resources,
      tabs: [
        { tab: 'basic', unlocked: true, label: '\u57fa\u7840\u5546\u5e97' },
        { tab: 'element', unlocked: false, label: '\u5143\u7d20\u70b9\u5546\u5e97' },
        { tab: 'event', unlocked: false, label: '\u6d3b\u52a8\u5546\u5e97' },
      ],
      basicItems,
      staminaRefillPreview: {
        current: resources.stamina,
        max: maxStamina,
        missing: Math.max(0, maxStamina - resources.stamina),
      },
    };
  }

  public async purchase(shopItemId: string) {
    const result = this.app.managers.shop.purchase(shopItemId);
    if (result.ok) {
      await this.saveProgress();
    }
    this.refreshCommonChrome();
    return result;
  }
}
