import { sys } from 'cc';
import type { SaveStorageAdapter } from '../managers';

export class LocalStorageSaveAdapter implements SaveStorageAdapter {
  constructor(private readonly saveKey: string) {}

  public async load(): Promise<string | null> {
    return sys.localStorage.getItem(this.saveKey);
  }

  public async save(content: string): Promise<void> {
    sys.localStorage.setItem(this.saveKey, content);
  }

  public async clear(): Promise<void> {
    sys.localStorage.removeItem(this.saveKey);
  }
}
