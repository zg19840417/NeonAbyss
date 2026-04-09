import type { ShopItemConfig, ShopTabType } from '../data';
import { BaseRepo } from './BaseRepo';

export class ShopRepo extends BaseRepo<ShopItemConfig> {
  constructor(records: ShopItemConfig[]) {
    super(
      [...records].sort((a, b) => a.sort_order - b.sort_order),
      (record) => record.shop_item_id,
    );
  }

  public getByTab(tab: ShopTabType): ShopItemConfig[] {
    return this.records.filter((record) => record.shop_tab === tab && record.is_active);
  }
}
