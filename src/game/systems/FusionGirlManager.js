import {
  FUSION_GIRL_QUALITY_ORDER,
  getFusionGirlById,
  getPortraitFragmentsBySetId,
  createDefaultFusionGirlManagerData,
  createDefaultFusionGirlRecord,
  normalizeFusionGirlManagerData,
  getFusionGirlLevelUpCost,
  getMaxFusionGirlLevel
} from '../data/FusionGirlData.js';

export default class FusionGirlManager {
  constructor(data = {}) {
    const normalized = normalizeFusionGirlManagerData(data);
    this.ownedGirls = normalized.ownedGirls;
    this.deployedGirlIds = normalized.deployedGirlIds;
    this.maxDeploy = normalized.maxDeploy;
    this.summonUnlockedGirlIds = normalized.summonUnlockedGirlIds;
  }

  getGirlById(fusionGirlId) {
    return this.ownedGirls.find((girl) => girl.id === fusionGirlId) || null;
  }

  ensureGirl(fusionGirlId) {
    let girl = this.getGirlById(fusionGirlId);
    if (!girl) {
      girl = createDefaultFusionGirlRecord(fusionGirlId);
      this.ownedGirls.push(girl);
    }
    return girl;
  }

  unlockGirl(fusionGirlId, { unlockSummon = false } = {}) {
    const girl = this.ensureGirl(fusionGirlId);
    if (unlockSummon && !this.summonUnlockedGirlIds.includes(fusionGirlId)) {
      this.summonUnlockedGirlIds.push(fusionGirlId);
    }
    return girl;
  }

  unlockSummonForGirl(fusionGirlId) {
    if (!this.summonUnlockedGirlIds.includes(fusionGirlId)) {
      this.summonUnlockedGirlIds.push(fusionGirlId);
    }
  }

  isSummonUnlocked(fusionGirlId) {
    return this.summonUnlockedGirlIds.includes(fusionGirlId);
  }

  getSummonUnlockedGirlIds() {
    return [...this.summonUnlockedGirlIds];
  }

  getCompletedSetCount(girl) {
    return Array.isArray(girl.completedPortraitSetIds) ? girl.completedPortraitSetIds.length : 0;
  }

  getAllGirls() {
    return this.ownedGirls;
  }

  getDeployedGirls() {
    return this.deployedGirlIds
      .map((id) => this.getGirlById(id))
      .filter(Boolean);
  }

  getAvailableGirls() {
    const deployed = new Set(this.deployedGirlIds);
    return this.ownedGirls.filter((girl) => !deployed.has(girl.id));
  }

  canDeploy() {
    return this.deployedGirlIds.length < this.maxDeploy;
  }

  deployGirl(fusionGirlId) {
    const girl = this.getGirlById(fusionGirlId);
    if (!girl) {
      return { success: false, reason: 'girl_not_found' };
    }
    if (this.deployedGirlIds.includes(fusionGirlId)) {
      return { success: false, reason: 'already_deployed' };
    }
    if (!this.canDeploy()) {
      return { success: false, reason: 'max_deploy_reached' };
    }

    this.deployedGirlIds.push(fusionGirlId);
    girl.deployed = true;
    return { success: true, fusionGirl: girl };
  }

  undeployGirl(fusionGirlId) {
    const index = this.deployedGirlIds.indexOf(fusionGirlId);
    if (index === -1) {
      return { success: false, reason: 'not_deployed' };
    }

    this.deployedGirlIds.splice(index, 1);
    const girl = this.getGirlById(fusionGirlId);
    if (girl) {
      girl.deployed = false;
    }
    return { success: true, fusionGirl: girl };
  }

  getCurrentQualityProgress(fusionGirlId) {
    const girl = this.getGirlById(fusionGirlId);
    if (!girl) return [];

    return Object.values(girl.portraitProgress || {}).map((setProgress) => ({
      portraitSetId: setProgress.portraitSetId,
      completed: !!setProgress.completed,
      fragments: Object.values(setProgress.fragmentProgress || {})
    }));
  }

  getNextQuality(currentQuality) {
    const currentIndex = FUSION_GIRL_QUALITY_ORDER.indexOf(currentQuality);
    if (currentIndex < 0 || currentIndex >= FUSION_GIRL_QUALITY_ORDER.length - 1) {
      return null;
    }
    return FUSION_GIRL_QUALITY_ORDER[currentIndex + 1];
  }

  canUpgradeQuality(fusionGirlId) {
    const girl = this.getGirlById(fusionGirlId);
    if (!girl) return false;
    if (girl.quality === 'LE') return false;
    return (girl.pendingQualityUpgrades || 0) > 0;
  }

  getLevelUpCost(fusionGirlId) {
    const girl = this.getGirlById(fusionGirlId);
    if (!girl) return 0;
    return getFusionGirlLevelUpCost(girl.level || 1);
  }

  canLevelUp(fusionGirlId) {
    const girl = this.getGirlById(fusionGirlId);
    if (!girl) return false;
    return (girl.level || 1) < getMaxFusionGirlLevel();
  }

  levelUpGirl(fusionGirlId) {
    const girl = this.getGirlById(fusionGirlId);
    if (!girl) {
      return { success: false, reason: 'girl_not_found' };
    }
    if (!this.canLevelUp(fusionGirlId)) {
      return { success: false, reason: 'max_level_reached' };
    }

    const cost = this.getLevelUpCost(fusionGirlId);
    girl.level = Number(girl.level || 1) + 1;

    return {
      success: true,
      fusionGirl: girl,
      newLevel: girl.level,
      cost
    };
  }

  upgradeQuality(fusionGirlId) {
    const girl = this.getGirlById(fusionGirlId);
    if (!girl) {
      return { success: false, reason: 'girl_not_found' };
    }
    if ((girl.pendingQualityUpgrades || 0) <= 0) {
      return { success: false, reason: 'no_pending_upgrade' };
    }
    const nextQuality = this.getNextQuality(girl.quality);
    if (!nextQuality) {
      return { success: false, reason: 'max_quality_reached' };
    }

    girl.quality = nextQuality;
    girl.pendingQualityUpgrades -= 1;

    return {
      success: true,
      fusionGirl: girl,
      newQuality: nextQuality
    };
  }

  addFragment(fragmentData, amount = 1) {
    if (!fragmentData?.fusionGirlId || !fragmentData?.portraitSetId || !fragmentData?.id) {
      return { success: false, reason: 'invalid_fragment_data' };
    }

    const girl = this.ensureGirl(fragmentData.fusionGirlId);
    const setProgress = girl.portraitProgress?.[fragmentData.portraitSetId];
    if (!setProgress) {
      return { success: false, reason: 'portrait_set_not_found' };
    }

    const progress = setProgress.fragmentProgress?.[fragmentData.id];
    if (!progress) {
      return { success: false, reason: 'fragment_slot_not_found' };
    }

    const previousEffective = progress.effectiveCount || 0;
    const requiredCount = progress.requiredCount || fragmentData.requiredCount || 0;
    const previousOwned = progress.ownedCount || 0;

    progress.ownedCount = previousOwned + amount;
    progress.effectiveCount = Math.min(progress.ownedCount, requiredCount);

    const effectiveAdded = Math.max(0, progress.effectiveCount - previousEffective);
    const overflowCount = Math.max(0, progress.ownedCount - progress.effectiveCount);
    const bonusType = progress.bonusType || fragmentData.bonusType;
    const bonusValue = Number(progress.bonusValue ?? fragmentData.bonusValue) || 0;
    const bonusAdded = effectiveAdded * bonusValue;

    if (!girl.fragmentBonuses) {
      girl.fragmentBonuses = { hp_pct: 0, atk_pct: 0, spd_pct: 0, all_pct: 0 };
    }
    if (bonusType && effectiveAdded > 0) {
      girl.fragmentBonuses[bonusType] = Number((girl.fragmentBonuses[bonusType] || 0) + bonusAdded);
    }

    let completedSet = false;
    let gainedUpgradeOpportunity = false;
    const allFragments = getPortraitFragmentsBySetId(fragmentData.portraitSetId);
    const isSetCompleted = allFragments.length > 0 && allFragments.every((fragment) => {
      const entry = setProgress.fragmentProgress?.[fragment.id];
      return entry && (entry.effectiveCount || 0) >= (entry.requiredCount || fragment.requiredCount || 0);
    });

    if (isSetCompleted && !setProgress.completed) {
      setProgress.completed = true;
      completedSet = true;

      if (!Array.isArray(girl.completedPortraitSetIds)) {
        girl.completedPortraitSetIds = [];
      }
      if (!girl.completedPortraitSetIds.includes(fragmentData.portraitSetId)) {
        girl.completedPortraitSetIds.push(fragmentData.portraitSetId);
      }

      if (girl.quality !== 'LE') {
        girl.pendingQualityUpgrades = (girl.pendingQualityUpgrades || 0) + 1;
        gainedUpgradeOpportunity = true;
      }
    }

    return {
      success: true,
      fusionGirlId: fragmentData.fusionGirlId,
      portraitSetId: fragmentData.portraitSetId,
      fragmentId: fragmentData.id,
      effectiveAdded,
      overflowCount,
      bonusType,
      bonusAdded,
      overflowElement: fragmentData.overflowElement || 'water',
      completedSet,
      gainedUpgradeOpportunity,
      fusionGirl: girl
    };
  }

  toJSON() {
    return {
      ownedGirls: this.ownedGirls.map((girl) => ({ ...girl })),
      deployedGirlIds: [...this.deployedGirlIds],
      maxDeploy: this.maxDeploy,
      summonUnlockedGirlIds: [...this.summonUnlockedGirlIds]
    };
  }

  static fromJSON(data) {
    return new FusionGirlManager(data || {});
  }
}
