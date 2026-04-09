export abstract class BaseRepo<TRecord, TId extends string = string> {
  protected readonly records: TRecord[];
  protected readonly byId: Map<TId, TRecord>;

  constructor(records: TRecord[], getId: (record: TRecord) => TId) {
    this.records = records;
    this.byId = new Map(records.map((record) => [getId(record), record]));
  }

  public getAll(): TRecord[] {
    return [...this.records];
  }

  public getById(id: TId): TRecord | null {
    return this.byId.get(id) ?? null;
  }

  public requireById(id: TId, label = 'record'): TRecord {
    const record = this.getById(id);
    if (!record) {
      throw new Error(`Missing ${label}: ${id}`);
    }
    return record;
  }

  public has(id: TId): boolean {
    return this.byId.has(id);
  }
}
