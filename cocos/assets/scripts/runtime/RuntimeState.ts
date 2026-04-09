import type { ConfigBundle } from '../config';
import type { GameRuntimeState, SaveData } from '../data';
import { createDefaultSaveData, createDefaultRuntimeState } from './DefaultRuntimeFactory';

export class RuntimeState {
  private saveData: SaveData;

  constructor(private readonly configBundle: ConfigBundle) {
    this.saveData = createDefaultSaveData(configBundle);
  }

  public getSaveData(): SaveData {
    return this.saveData;
  }

  public getRuntime(): GameRuntimeState {
    return this.saveData.runtime;
  }

  public replaceSaveData(saveData: SaveData): void {
    this.saveData = saveData;
  }

  public resetToDefault(): SaveData {
    this.saveData = createDefaultSaveData(this.configBundle);
    return this.saveData;
  }

  public resetRuntimeOnly(): GameRuntimeState {
    this.saveData.runtime = createDefaultRuntimeState(this.configBundle);
    this.saveData.meta.updated_at = Date.now();
    return this.saveData.runtime;
  }

  public touch(): void {
    this.saveData.meta.updated_at = Date.now();
  }
}
