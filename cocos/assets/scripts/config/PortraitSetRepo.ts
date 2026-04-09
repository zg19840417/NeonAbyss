import type { PortraitSetConfig } from '../data';
import { BaseRepo } from './BaseRepo';

export class PortraitSetRepo extends BaseRepo<PortraitSetConfig> {
  constructor(records: PortraitSetConfig[]) {
    super(records, (record) => record.portrait_set_id);
  }

  public getByGirlId(fusionGirlId: string): PortraitSetConfig[] {
    return this.records
      .filter((record) => record.fusion_girl_id === fusionGirlId)
      .sort((a, b) => a.set_index - b.set_index);
  }
}
