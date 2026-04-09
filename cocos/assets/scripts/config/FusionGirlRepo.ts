import type { FusionGirlConfig } from '../data';
import { BaseRepo } from './BaseRepo';

export class FusionGirlRepo extends BaseRepo<FusionGirlConfig> {
  constructor(records: FusionGirlConfig[]) {
    super(
      [...records].sort((a, b) => a.sort_order - b.sort_order),
      (record) => record.fusion_girl_id,
    );
  }

  public getInitialGirls(): FusionGirlConfig[] {
    return this.records.filter((record) => record.is_initial);
  }
}
