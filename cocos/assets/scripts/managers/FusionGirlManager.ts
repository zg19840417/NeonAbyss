import type { ConfigBundle } from '../config';
import type { FragmentProgressState, FusionGirlRuntimeState, PortraitFragmentConfig } from '../data';
import type { RuntimeState } from '../runtime';

const QUALITY_ORDER: FusionGirlRuntimeState['quality'][] = ['N', 'R', 'SR', 'SSR', 'UR', 'LE'];

export class FusionGirlManager {
  constructor(
    private readonly configBundle: ConfigBundle,
    private readonly runtimeState: RuntimeState,
  ) {}

  public getAllStates(): FusionGirlRuntimeState[] {
    return Object.values(this.runtimeState.getRuntime().fusion_girls);
  }

  public getState(fusionGirlId: string): FusionGirlRuntimeState | null {
    return this.runtimeState.getRuntime().fusion_girls[fusionGirlId] ?? null;
  }

  public requireState(fusionGirlId: string): FusionGirlRuntimeState {
    const state = this.getState(fusionGirlId);
    if (!state) {
      throw new Error(`Missing fusion girl runtime state: ${fusionGirlId}`);
    }
    return state;
  }

  public getUnlockedGirls(): FusionGirlRuntimeState[] {
    return this.getAllStates().filter((state) => state.unlocked);
  }

  public grantInitialGirls(): FusionGirlRuntimeState[] {
    const initialConfigs = this.configBundle.fusionGirls.getInitialGirls();
    const unlockedStates = initialConfigs.map((config) => this.unlockGirl(config.fusion_girl_id));

    const runtime = this.runtimeState.getRuntime();
    if (!runtime.profile.selected_home_girl_id && unlockedStates.length > 0) {
      runtime.profile.selected_home_girl_id = unlockedStates[0].fusion_girl_id;
    }

    unlockedStates.slice(0, 3).forEach((state, index) => {
      state.deployed_slot = index + 1;
    });

    this.runtimeState.touch();
    return unlockedStates;
  }

  public unlockGirl(fusionGirlId: string): FusionGirlRuntimeState {
    const state = this.requireState(fusionGirlId);
    state.unlocked = true;
    this.runtimeState.touch();
    return state;
  }

  public isUnlocked(fusionGirlId: string): boolean {
    return this.requireState(fusionGirlId).unlocked;
  }

  public deployGirl(fusionGirlId: string, slot: number): void {
    const state = this.requireState(fusionGirlId);
    if (!state.unlocked) {
      throw new Error(`Fusion girl is not unlocked: ${fusionGirlId}`);
    }

    this.getUnlockedGirls().forEach((girl) => {
      if (girl.deployed_slot === slot) {
        girl.deployed_slot = null;
      }
    });

    state.deployed_slot = slot;
    this.runtimeState.touch();
  }

  public undeployGirl(fusionGirlId: string): void {
    const state = this.requireState(fusionGirlId);
    state.deployed_slot = null;
    this.runtimeState.touch();
  }

  public getDeployedGirls(): FusionGirlRuntimeState[] {
    return this.getUnlockedGirls()
      .filter((state) => state.deployed_slot !== null)
      .sort((a, b) => (a.deployed_slot ?? 99) - (b.deployed_slot ?? 99));
  }

  public addExperience(fusionGirlId: string, amount: number): FusionGirlRuntimeState {
    const state = this.requireState(fusionGirlId);
    state.experience += amount;
    this.runtimeState.touch();
    return state;
  }

  public setLevel(fusionGirlId: string, level: number): FusionGirlRuntimeState {
    const state = this.requireState(fusionGirlId);
    state.level = Math.max(1, level);
    this.runtimeState.touch();
    return state;
  }

  public addFragment(fragmentId: string, count: number): FragmentProgressState {
    const fragmentConfig = this.configBundle.portraitFragments.requireById(fragmentId, 'portrait fragment');
    const girlState = this.requireState(fragmentConfig.fusion_girl_id);
    const setState = girlState.fragment_sets[fragmentConfig.portrait_set_id];

    if (!setState) {
      throw new Error(`Missing portrait set runtime state: ${fragmentConfig.portrait_set_id}`);
    }

    const fragmentState = setState.fragment_progress[fragmentId];
    if (!fragmentState) {
      throw new Error(`Missing fragment runtime state: ${fragmentId}`);
    }

    fragmentState.owned_count += count;
    fragmentState.effective_count = Math.min(fragmentState.owned_count, fragmentConfig.required_count);
    fragmentState.overflow_count = Math.max(0, fragmentState.owned_count - fragmentConfig.required_count);
    fragmentState.applied_growth_value = fragmentState.effective_count * fragmentConfig.growth_value;

    this.recalculateGirlGrowth(fragmentConfig.fusion_girl_id);
    this.refreshPortraitSetCompletion(fragmentConfig.fusion_girl_id, fragmentConfig.portrait_set_id);
    this.runtimeState.touch();
    return fragmentState;
  }

  public getPendingQualityUpCount(fusionGirlId: string): number {
    return this.requireState(fusionGirlId).pending_quality_up_count;
  }

  public canQualityUp(fusionGirlId: string): boolean {
    const state = this.requireState(fusionGirlId);
    return state.pending_quality_up_count > 0 && state.quality !== 'LE';
  }

  public getNextQuality(fusionGirlId: string): FusionGirlRuntimeState['quality'] | null {
    const state = this.requireState(fusionGirlId);
    const currentIndex = QUALITY_ORDER.indexOf(state.quality);
    if (currentIndex < 0 || currentIndex >= QUALITY_ORDER.length - 1) {
      return null;
    }
    return QUALITY_ORDER[currentIndex + 1];
  }

  public getQualityUpPreview(fusionGirlId: string) {
    const state = this.requireState(fusionGirlId);
    const nextQuality = this.getNextQuality(fusionGirlId);
    const completedSetIds = Object.values(state.fragment_sets)
      .filter((setState) => setState.completed)
      .map((setState) => setState.portrait_set_id);
    const nextPortraitSetId =
      completedSetIds.find((portraitSetId) => portraitSetId !== state.active_portrait_set_id) ??
      state.active_portrait_set_id;

    return {
      fusionGirlId,
      currentQuality: state.quality,
      nextQuality,
      pendingCount: state.pending_quality_up_count,
      currentPortraitSetId: state.active_portrait_set_id,
      nextPortraitSetId,
      unlockedSkillSlots: state.unlocked_skill_slots,
      unlockedAbilitySlots: state.unlocked_ability_slots,
      modSlots: state.mod_slots,
    };
  }

  public consumeOnePendingQualityUp(fusionGirlId: string): boolean {
    const state = this.requireState(fusionGirlId);
    if (state.pending_quality_up_count <= 0) {
      return false;
    }

    state.pending_quality_up_count -= 1;
    this.runtimeState.touch();
    return true;
  }

  public qualityUpOnce(fusionGirlId: string): FusionGirlRuntimeState | null {
    if (!this.canQualityUp(fusionGirlId)) {
      return null;
    }

    const state = this.requireState(fusionGirlId);
    const nextQuality = this.getNextQuality(fusionGirlId);
    if (!nextQuality) {
      return null;
    }

    state.pending_quality_up_count -= 1;
    state.quality = nextQuality;

    const completedSetIds = Object.values(state.fragment_sets)
      .filter((setState) => setState.completed)
      .map((setState) => setState.portrait_set_id);
    const nextPortraitSetId = completedSetIds.find((portraitSetId) => portraitSetId !== state.active_portrait_set_id);
    if (nextPortraitSetId) {
      state.active_portrait_set_id = nextPortraitSetId;
    }

    this.runtimeState.touch();
    return state;
  }

  private recalculateGirlGrowth(fusionGirlId: string): void {
    const state = this.requireState(fusionGirlId);
    state.fragment_growth_bonus = { hp: 0, atk: 0, spd: 0 };

    const fragments = this.configBundle.portraitFragments.getByGirlId(fusionGirlId);
    fragments.forEach((fragmentConfig: PortraitFragmentConfig) => {
      const setState = state.fragment_sets[fragmentConfig.portrait_set_id];
      const fragmentState = setState?.fragment_progress[fragmentConfig.fragment_id];
      const bonusValue = fragmentState?.applied_growth_value ?? 0;

      switch (fragmentConfig.growth_stat_type) {
        case 'hp':
          state.fragment_growth_bonus.hp += bonusValue;
          break;
        case 'atk':
          state.fragment_growth_bonus.atk += bonusValue;
          break;
        case 'spd':
          state.fragment_growth_bonus.spd += bonusValue;
          break;
        case 'all':
          state.fragment_growth_bonus.hp += bonusValue;
          state.fragment_growth_bonus.atk += bonusValue;
          state.fragment_growth_bonus.spd += bonusValue;
          break;
      }
    });
  }

  private refreshPortraitSetCompletion(fusionGirlId: string, portraitSetId: string): void {
    const state = this.requireState(fusionGirlId);
    const setState = state.fragment_sets[portraitSetId];
    if (!setState) {
      return;
    }

    const fragmentConfigs = this.configBundle.portraitFragments.getByPortraitSetId(portraitSetId);
    const allComplete = fragmentConfigs.every((fragmentConfig) => {
      const fragmentState = setState.fragment_progress[fragmentConfig.fragment_id];
      return Boolean(fragmentState) && fragmentState.effective_count >= fragmentConfig.required_count;
    });

    const wasCompleted = setState.completed;
    setState.completed = allComplete;

    if (!wasCompleted && allComplete) {
      state.pending_quality_up_count += 1;
    }
  }
}
