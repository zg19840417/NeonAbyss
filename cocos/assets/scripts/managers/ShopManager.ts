import type { ConfigBundle } from '../config';
import type { ShopItemConfig } from '../data';
import type { RuntimeState } from '../runtime';
import { InventoryManager } from './InventoryManager';
import { ResourceManager } from './ResourceManager';

export interface ShopPurchaseResult {
  ok: boolean;
  reason:
    | 'ok'
    | 'shop_item_not_found'
    | 'shop_item_inactive'
    | 'currency_not_enough'
    | 'unsupported_effect';
  shopItem: ShopItemConfig | null;
}

export class ShopManager {
  constructor(
    private readonly configBundle: ConfigBundle,
    private readonly runtimeState: RuntimeState,
    private readonly resourceManager: ResourceManager,
    private readonly inventoryManager: InventoryManager,
  ) {}

  public getActiveItemsByTab(tab: ShopItemConfig['shop_tab']): ShopItemConfig[] {
    return this.configBundle.shop.getByTab(tab);
  }

  public purchase(shopItemId: string): ShopPurchaseResult {
    const shopItem = this.configBundle.shop.getById(shopItemId);
    if (!shopItem) {
      return { ok: false, reason: 'shop_item_not_found', shopItem: null };
    }

    if (!shopItem.is_active) {
      return { ok: false, reason: 'shop_item_inactive', shopItem };
    }

    if (!this.resourceManager.canAfford(shopItem.price_currency_type, shopItem.price_value)) {
      return { ok: false, reason: 'currency_not_enough', shopItem };
    }

    if (!this.resourceManager.spend(shopItem.price_currency_type, shopItem.price_value)) {
      return { ok: false, reason: 'currency_not_enough', shopItem };
    }

    const item = this.configBundle.items.requireById(shopItem.item_id, 'shop item target');
    if (item.auto_use) {
      switch (item.effect_type) {
        case 'fill_stamina':
          this.resourceManager.refillStaminaToMax();
          break;
        default:
          return { ok: false, reason: 'unsupported_effect', shopItem };
      }
    } else {
      this.inventoryManager.addItem(item.item_id, 1);
    }

    this.runtimeState.getRuntime().shop.purchased_count_by_shop_item_id[shopItemId] =
      (this.runtimeState.getRuntime().shop.purchased_count_by_shop_item_id[shopItemId] ?? 0) + 1;
    this.runtimeState.touch();

    return { ok: true, reason: 'ok', shopItem };
  }
}
