import type { CurrencyType, PlayerResourceState } from '../data';
import type { ConfigBundle } from '../config';
import type { RuntimeState } from '../runtime';

const RESOURCE_FIELD_MAP: Record<CurrencyType, keyof PlayerResourceState> = {
  mycelium: 'mycelium',
  source_core: 'source_core',
  star_coin: 'star_coin',
  stamina: 'stamina',
  water_point: 'water_point',
  fire_point: 'fire_point',
  wind_point: 'wind_point',
};

export class ResourceManager {
  constructor(
    private readonly configBundle: ConfigBundle,
    private readonly runtimeState: RuntimeState,
  ) {}

  public getResources(): PlayerResourceState {
    return this.runtimeState.getRuntime().resources;
  }

  public getAmount(currency: CurrencyType): number {
    return this.getResources()[RESOURCE_FIELD_MAP[currency]];
  }

  public add(currency: CurrencyType, amount: number): number {
    const resources = this.getResources();
    const key = RESOURCE_FIELD_MAP[currency];
    resources[key] += amount;
    this.runtimeState.touch();
    return resources[key];
  }

  public canAfford(currency: CurrencyType, amount: number): boolean {
    return this.getAmount(currency) >= amount;
  }

  public spend(currency: CurrencyType, amount: number): boolean {
    if (!this.canAfford(currency, amount)) {
      return false;
    }

    const resources = this.getResources();
    const key = RESOURCE_FIELD_MAP[currency];
    resources[key] -= amount;
    this.runtimeState.touch();
    return true;
  }

  public spendStamina(amount: number): boolean {
    return this.spend('stamina', amount);
  }

  public refillStaminaToMax(): number {
    const resources = this.getResources();
    resources.stamina = this.configBundle.globalConfig.requireNumber('max_stamina');
    resources.stamina_last_recover_at = Date.now();
    this.runtimeState.touch();
    return resources.stamina;
  }

  public recoverStaminaIfNeeded(now = Date.now()): number {
    const resources = this.getResources();
    const maxStamina = this.configBundle.globalConfig.requireNumber('max_stamina');

    if (resources.stamina >= maxStamina) {
      resources.stamina_last_recover_at = now;
      return resources.stamina;
    }

    const recoverMinutes = this.configBundle.globalConfig.requireNumber('stamina_recover_minutes');
    const recoverMs = recoverMinutes * 60 * 1000;
    const elapsed = now - resources.stamina_last_recover_at;
    const recoverCount = Math.floor(elapsed / recoverMs);

    if (recoverCount <= 0) {
      return resources.stamina;
    }

    resources.stamina = Math.min(maxStamina, resources.stamina + recoverCount);
    resources.stamina_last_recover_at += recoverCount * recoverMs;
    this.runtimeState.touch();
    return resources.stamina;
  }
}
