import type { SaveData } from '../data';
import type { RuntimeState } from '../runtime';

export interface SaveStorageAdapter {
  load(): Promise<string | null>;
  save(content: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemorySaveStorageAdapter implements SaveStorageAdapter {
  private content: string | null = null;

  public async load(): Promise<string | null> {
    return this.content;
  }

  public async save(content: string): Promise<void> {
    this.content = content;
  }

  public async clear(): Promise<void> {
    this.content = null;
  }
}

export class SaveManager {
  constructor(
    private readonly runtimeState: RuntimeState,
    private readonly storage: SaveStorageAdapter,
  ) {}

  public getCurrentSaveData(): SaveData {
    return this.runtimeState.getSaveData();
  }

  public async loadOrCreateDefault(): Promise<SaveData> {
    const raw = await this.storage.load();
    if (!raw) {
      const defaultSave = this.runtimeState.resetToDefault();
      await this.save();
      return defaultSave;
    }

    const parsed = JSON.parse(raw) as SaveData;
    this.runtimeState.replaceSaveData(parsed);
    return parsed;
  }

  public async save(): Promise<void> {
    this.runtimeState.touch();
    await this.storage.save(JSON.stringify(this.runtimeState.getSaveData(), null, 2));
  }

  public async reset(): Promise<SaveData> {
    await this.storage.clear();
    const defaultSave = this.runtimeState.resetToDefault();
    await this.save();
    return defaultSave;
  }
}
