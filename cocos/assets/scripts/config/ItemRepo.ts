import type { ItemConfig } from '../data';
import { BaseRepo } from './BaseRepo';

export class ItemRepo extends BaseRepo<ItemConfig> {
  constructor(records: ItemConfig[]) {
    super(records, (record) => record.item_id);
  }

  public getVisibleItems(): ItemConfig[] {
    return this.records.filter((record) => record.visible);
  }
}
