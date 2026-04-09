import type { GlobalConfigMap } from '../data';

export class GlobalConfigRepo {
  constructor(private readonly config: GlobalConfigMap) {}

  public getAll(): GlobalConfigMap {
    return { ...this.config };
  }

  public get<K extends keyof GlobalConfigMap>(key: K): GlobalConfigMap[K] {
    return this.config[key];
  }

  public requireNumber(key: keyof GlobalConfigMap): number {
    const value = this.config[key];
    if (typeof value !== 'number') {
      throw new Error(`Global config "${String(key)}" is not a number.`);
    }
    return value;
  }

  public requireString(key: keyof GlobalConfigMap): string {
    const value = this.config[key];
    if (typeof value !== 'string') {
      throw new Error(`Global config "${String(key)}" is not a string.`);
    }
    return value;
  }
}
