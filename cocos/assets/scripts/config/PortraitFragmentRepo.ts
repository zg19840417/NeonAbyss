import type { PortraitFragmentConfig } from '../data';
import { BaseRepo } from './BaseRepo';

const FRAGMENT_ORDER = {
  R: 1,
  SR: 2,
  SSR: 3,
  UR: 4,
} as const;

export class PortraitFragmentRepo extends BaseRepo<PortraitFragmentConfig> {
  constructor(records: PortraitFragmentConfig[]) {
    super(records, (record) => record.fragment_id);
  }

  public getByPortraitSetId(portraitSetId: string): PortraitFragmentConfig[] {
    return this.records
      .filter((record) => record.portrait_set_id === portraitSetId)
      .sort((a, b) => FRAGMENT_ORDER[a.fragment_quality] - FRAGMENT_ORDER[b.fragment_quality]);
  }

  public getByGirlId(fusionGirlId: string): PortraitFragmentConfig[] {
    return this.records.filter((record) => record.fusion_girl_id === fusionGirlId);
  }
}
