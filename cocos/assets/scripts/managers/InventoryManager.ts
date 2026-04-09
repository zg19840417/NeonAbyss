import type { InventoryEntryState, ItemConfig } from '../data';
import type { ConfigBundle } from '../config';
import type { RuntimeState } from '../runtime';

export class InventoryManager {
  constructor(
    private readonly configBundle: ConfigBundle,
    private readonly runtimeState: RuntimeState,
  ) {}

  public getEntry(itemId: string): InventoryEntryState | null {
    return this.runtimeState.getRuntime().inventory.entries[itemId] ?? null;
  }

  public getCount(itemId: string): number {
    return this.getEntry(itemId)?.count ?? 0;
  }

  public addItem(itemId: string, count: number): InventoryEntryState {
    this.configBundle.items.requireById(itemId, 'item');
    const inventory = this.runtimeState.getRuntime().inventory;

    if (!inventory.entries[itemId]) {
      inventory.entries[itemId] = {
        item_id: itemId,
        count: 0,
      };
    }

    inventory.entries[itemId].count += count;
    this.runtimeState.touch();
    return inventory.entries[itemId];
  }

  public consumeItem(itemId: string, count: number): boolean {
    const entry = this.getEntry(itemId);
    if (!entry || entry.count < count) {
      return false;
    }

    entry.count -= count;
    if (entry.count <= 0) {
      delete this.runtimeState.getRuntime().inventory.entries[itemId];
    }

    this.runtimeState.touch();
    return true;
  }

  public getVisibleItems(): Array<{ item: ItemConfig; count: number }> {
    const inventory = this.runtimeState.getRuntime().inventory.entries;
    return Object.values(inventory)
      .map((entry) => ({
        item: this.configBundle.items.requireById(entry.item_id, 'item'),
        count: entry.count,
      }))
      .filter(({ item, count }) => item.visible && count > 0);
  }
}
