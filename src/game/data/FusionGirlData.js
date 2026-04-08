import fusionGirlsData from '../../../assets/data/json/fusionGirls.json';
import portraitSetsData from '../../../assets/data/json/portraitSets.json';
import portraitFragmentsData from '../../../assets/data/json/portraitFragments.json';
import elementPointShopData from '../../../assets/data/json/elementPointShop.json';
import levelUpData from '../../../assets/data/json/levelUp.json';

export const FUSION_GIRL_QUALITY_ORDER = ['N', 'R', 'SR', 'SSR', 'UR', 'LE'];
export const FRAGMENT_QUALITY_ORDER = ['R', 'SR', 'SSR', 'UR'];
export const FRAGMENT_BONUS_TYPES = ['hp_pct', 'atk_pct', 'spd_pct', 'all_pct'];
export const ELEMENT_POINT_TYPES = ['water', 'fire', 'wind'];

export const fusionGirls = fusionGirlsData;
export const portraitSets = portraitSetsData;
export const portraitFragments = portraitFragmentsData;
export const elementPointShopItems = elementPointShopData;
export const levelUpCurve = levelUpData;

export function getFusionGirlById(id) {
  return fusionGirls.find((item) => item.id === id) || null;
}

export function getPortraitSetsByFusionGirlId(fusionGirlId) {
  return portraitSets.filter((item) => item.fusionGirlId === fusionGirlId);
}

export function getPortraitSetById(portraitSetId) {
  return portraitSets.find((item) => item.id === portraitSetId) || null;
}

export function getPortraitFragmentsBySetId(portraitSetId) {
  return portraitFragments.filter((item) => item.portraitSetId === portraitSetId);
}

export function getPortraitFragmentById(fragmentId) {
  return portraitFragments.find((item) => item.id === fragmentId) || null;
}

export function createDefaultFragmentProgress(fragment) {
  return {
    fragmentId: fragment.id,
    ownedCount: 0,
    effectiveCount: 0,
    requiredCount: fragment.requiredCount || 0,
    bonusType: fragment.bonusType || 'hp_pct',
    bonusValue: Number(fragment.bonusValue) || 0,
    overflowElement: fragment.overflowElement || 'water'
  };
}

export function createDefaultPortraitSetProgress(portraitSet) {
  const fragments = getPortraitFragmentsBySetId(portraitSet.id);
  const fragmentProgress = {};

  fragments.forEach((fragment) => {
    fragmentProgress[fragment.id] = createDefaultFragmentProgress(fragment);
  });

  return {
    portraitSetId: portraitSet.id,
    completed: false,
    fragmentProgress
  };
}

export function createDefaultFusionGirlRecord(fusionGirlId) {
  const fusionGirl = getFusionGirlById(fusionGirlId);
  const sets = getPortraitSetsByFusionGirlId(fusionGirlId);
  const portraitProgress = {};

  sets.forEach((set) => {
    portraitProgress[set.id] = createDefaultPortraitSetProgress(set);
  });

  return {
    id: fusionGirlId,
    name: fusionGirl?.name || fusionGirlId,
    element: fusionGirl?.element || null,
    profession: fusionGirl?.profession || null,
    level: 1,
    exp: 0,
    quality: fusionGirl?.initialQuality || 'N',
    deployed: false,
    summonUnlocked: !!fusionGirl?.isStarterSummonUnlocked,
    completedPortraitSetIds: [],
    pendingQualityUpgrades: 0,
    fragmentBonuses: {
      hp_pct: 0,
      atk_pct: 0,
      spd_pct: 0,
      all_pct: 0
    },
    portraitProgress,
    moduleSlots: [],
    pet: null
  };
}

export function getStarterFusionGirls() {
  return fusionGirls.filter((girl) => girl.isStarter);
}

export function getStarterFusionGirlIds() {
  return getStarterFusionGirls().map((girl) => girl.id);
}

export function getLevelUpEntry(level) {
  return levelUpCurve.find((entry) => Number(entry.level) === Number(level)) || null;
}

export function getMaxFusionGirlLevel() {
  return Math.max(...levelUpCurve.map((entry) => Number(entry.level) || 1), 1);
}

export function getFusionGirlLevelUpCost(level) {
  const entry = getLevelUpEntry(level);
  return Number(entry?.upgradeCostBase || 0);
}

export function getFusionGirlCombatStats(girlRecord, fusionGirlConfig = null) {
  const config = fusionGirlConfig || getFusionGirlById(girlRecord?.id);
  if (!config) {
    return {
      level: 1,
      maxHp: 900,
      atk: 30,
      spd: 12
    };
  }

  const level = Math.max(1, Number(girlRecord?.level || 1));
  const qualityIndex = Math.max(0, FUSION_GIRL_QUALITY_ORDER.indexOf(girlRecord?.quality || config.initialQuality || 'N'));
  const allPct = Number(girlRecord?.fragmentBonuses?.all_pct || 0);
  const hpPct = Number(girlRecord?.fragmentBonuses?.hp_pct || 0) + allPct;
  const atkPct = Number(girlRecord?.fragmentBonuses?.atk_pct || 0) + allPct;
  const spdPct = Number(girlRecord?.fragmentBonuses?.spd_pct || 0) + allPct;

  const hpGrowth = Number(config.hpGrowthPerLevel || 0);
  const atkGrowth = Number(config.atkGrowthPerLevel || 0);
  const spdGrowth = Number(config.spdGrowthPerLevel || 0);
  const qualityBonus = qualityIndex * 0.08;

  const hpScale = 1 + (level - 1) * hpGrowth + hpPct + qualityBonus;
  const atkScale = 1 + (level - 1) * atkGrowth + atkPct + qualityBonus;
  const spdScale = 1 + (level - 1) * spdGrowth + spdPct + qualityBonus;

  return {
    level,
    maxHp: Math.max(1, Math.floor(Number(config.baseHp || 900) * hpScale)),
    atk: Math.max(1, Math.floor(Number(config.baseAtk || 30) * atkScale)),
    spd: Math.max(1, Math.floor(Number(config.baseSpd || 12) * spdScale))
  };
}

export function normalizeFusionGirlManagerData(rawData = {}) {
  const starterConfigs = getStarterFusionGirls();
  const ownedGirls = Array.isArray(rawData.ownedGirls) ? rawData.ownedGirls.map((girl) => ({ ...girl })) : [];
  const ownedById = new Map(ownedGirls.map((girl) => [girl.id, girl]));

  starterConfigs.forEach((starter) => {
    if (!ownedById.has(starter.id)) {
      const record = createDefaultFusionGirlRecord(starter.id);
      record.deployed = !!starter.isStarterDeployed;
      record.summonUnlocked = !!starter.isStarterSummonUnlocked;
      ownedGirls.push(record);
      ownedById.set(starter.id, record);
    }
  });

  const deployedGirlIds = Array.isArray(rawData.deployedGirlIds) ? [...rawData.deployedGirlIds] : [];
  starterConfigs.filter((girl) => girl.isStarterDeployed).forEach((starter) => {
    if (!deployedGirlIds.includes(starter.id)) {
      deployedGirlIds.push(starter.id);
    }
  });

  const summonUnlockedGirlIds = Array.isArray(rawData.summonUnlockedGirlIds) ? [...rawData.summonUnlockedGirlIds] : [];
  starterConfigs.filter((girl) => girl.isStarterSummonUnlocked).forEach((starter) => {
    if (!summonUnlockedGirlIds.includes(starter.id)) {
      summonUnlockedGirlIds.push(starter.id);
    }
  });

  ownedGirls.forEach((girl) => {
    girl.deployed = deployedGirlIds.includes(girl.id);
    if (summonUnlockedGirlIds.includes(girl.id)) {
      girl.summonUnlocked = true;
    }
  });

  return {
    ownedGirls,
    deployedGirlIds,
    maxDeploy: Number(rawData.maxDeploy || 3),
    summonUnlockedGirlIds
  };
}

export function createDefaultFusionGirlManagerData() {
  return normalizeFusionGirlManagerData({
    ownedGirls: [],
    deployedGirlIds: [],
    maxDeploy: 3,
    summonUnlockedGirlIds: []
  });
}

export function createDefaultElementPointData() {
  return {
    water: 0,
    fire: 0,
    wind: 0
  };
}
