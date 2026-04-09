import type { ConfigBundle } from '../config';
import type { DropGroupConfig, ItemConfig, WeightedDropEntry } from '../data';
import type { RuntimeState } from '../runtime';
import { FusionGirlManager } from './FusionGirlManager';
import { InventoryManager } from './InventoryManager';
import { ResourceManager } from './ResourceManager';

export interface RewardGrantSummary {
  item_id: string;
  item_name: string;
  count: number;
  auto_used: boolean;
}

export interface DropResolutionResult {
  drop_group_id: string;
  grants: RewardGrantSummary[];
}

export interface RewardPreviewEntry {
  kind: 'fixed' | 'random';
  item_id: string;
  item_name: string;
  item_type: string;
  sub_type: string;
  quality: ItemConfig['quality'];
  icon_key: string;
  count: number;
  weight: number | null;
  auto_use: boolean;
  visible: boolean;
}

export class RewardManager {
  constructor(
    private readonly configBundle: ConfigBundle,
    private readonly runtimeState: RuntimeState,
    private readonly resourceManager: ResourceManager,
    private readonly fusionGirlManager: FusionGirlManager,
    private readonly inventoryManager: InventoryManager,
  ) {}

  public applyDropGroup(dropGroupId: string): DropResolutionResult {
    const dropGroup = this.configBundle.dropGroups.requireById(dropGroupId, 'drop group');
    const grants: RewardGrantSummary[] = [];

    dropGroup.fixed_drop_json.forEach((entry) => {
      grants.push(this.applyDropEntry(entry.item_id, entry.count));
    });

    const randomGrants = this.resolveRandomDrops(dropGroup);
    randomGrants.forEach((entry) => {
      grants.push(this.applyDropEntry(entry.item_id, entry.count));
    });

    this.runtimeState.touch();

    return {
      drop_group_id: dropGroupId,
      grants,
    };
  }

  public getDropPreview(dropGroupId: string): RewardPreviewEntry[] {
    const dropGroup = this.configBundle.dropGroups.getById(dropGroupId);
    if (!dropGroup) {
      return [];
    }

    const fixed = dropGroup.fixed_drop_json.map((entry) => this.toPreviewEntry('fixed', entry.item_id, entry.count, null));
    const random = dropGroup.random_drop_json.map((entry) =>
      this.toPreviewEntry('random', entry.item_id, entry.count, entry.weight),
    );

    return [...fixed, ...random];
  }

  private resolveRandomDrops(dropGroup: DropGroupConfig): WeightedDropEntry[] {
    if (!dropGroup.random_drop_json.length) {
      return [];
    }

    const totalWeight = dropGroup.random_drop_json.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight <= 0) {
      return [];
    }

    const roll = Math.random() * totalWeight;
    let cursor = 0;

    for (const entry of dropGroup.random_drop_json) {
      cursor += entry.weight;
      if (roll <= cursor) {
        return [entry];
      }
    }

    return [dropGroup.random_drop_json[dropGroup.random_drop_json.length - 1]];
  }

  private applyDropEntry(itemId: string, count: number): RewardGrantSummary {
    const item = this.configBundle.items.requireById(itemId, 'item');

    if (item.auto_use) {
      this.applyItemEffect(item, count);
      return {
        item_id: item.item_id,
        item_name: item.item_name,
        count,
        auto_used: true,
      };
    }

    this.inventoryManager.addItem(itemId, count);

    return {
      item_id: item.item_id,
      item_name: item.item_name,
      count,
      auto_used: false,
    };
  }

  private toPreviewEntry(
    kind: RewardPreviewEntry['kind'],
    itemId: string,
    count: number,
    weight: number | null,
  ): RewardPreviewEntry {
    const item = this.configBundle.items.requireById(itemId, 'item');

    return {
      kind,
      item_id: item.item_id,
      item_name: item.item_name,
      item_type: item.item_type,
      sub_type: item.sub_type,
      quality: item.quality,
      icon_key: item.icon_key,
      count,
      weight,
      auto_use: item.auto_use,
      visible: item.visible,
    };
  }

  private applyItemEffect(item: ItemConfig, count: number): void {
    const params = item.effect_params ?? {};

    switch (item.effect_type) {
      case 'unlock_fusion_girl': {
        const fusionGirlId = String(params.fusion_girl_id ?? '');
        if (!fusionGirlId) {
          throw new Error(`Missing fusion_girl_id in item effect: ${item.item_id}`);
        }
        this.fusionGirlManager.unlockGirl(fusionGirlId);
        break;
      }
      case 'add_fragment': {
        const fragmentId = String(params.fragment_id ?? '');
        const fragmentCount = Number(params.count ?? count ?? 1);
        this.fusionGirlManager.addFragment(fragmentId, fragmentCount);
        break;
      }
      case 'add_currency': {
        const currency = String(params.currency ?? '') as Parameters<ResourceManager['add']>[0];
        const amount = Number(params.amount ?? 0) * count;
        this.resourceManager.add(currency, amount);
        break;
      }
      case 'fill_stamina': {
        this.resourceManager.refillStaminaToMax();
        break;
      }
      default:
        throw new Error(`Unsupported item effect type: ${item.effect_type}`);
    }
  }
}
