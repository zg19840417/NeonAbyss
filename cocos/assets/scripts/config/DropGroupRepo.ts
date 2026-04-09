import type { DropGroupConfig } from '../data';
import { BaseRepo } from './BaseRepo';

export class DropGroupRepo extends BaseRepo<DropGroupConfig> {
  constructor(records: DropGroupConfig[]) {
    super(records, (record) => record.drop_group_id);
  }
}
