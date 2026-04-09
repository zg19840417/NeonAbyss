import type { EnemyConfig } from '../data';
import { BaseRepo } from './BaseRepo';

export class EnemyRepo extends BaseRepo<EnemyConfig> {
  constructor(records: EnemyConfig[]) {
    super(records, (record) => record.enemy_id);
  }
}
