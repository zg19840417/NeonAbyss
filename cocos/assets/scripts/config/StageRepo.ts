import type { StageConfig } from '../data';
import { BaseRepo } from './BaseRepo';

export class StageRepo extends BaseRepo<StageConfig> {
  constructor(records: StageConfig[]) {
    super(records, (record) => record.stage_id);
  }

  public getByChapterId(chapterId: string): StageConfig[] {
    return this.records
      .filter((record) => record.chapter_id === chapterId)
      .sort((a, b) => a.stage_index - b.stage_index);
  }
}
