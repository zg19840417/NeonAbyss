import type { EnemyGroupConfig } from '../data';
import { BaseRepo } from './BaseRepo';

export class EnemyGroupRepo extends BaseRepo<EnemyGroupConfig> {
  constructor(records: EnemyGroupConfig[]) {
    super(records, (record) => record.enemy_group_id);
  }
}
