import Const from './Const.js';
import initConfigData from '../../../assets/data/json/initConfig.json';

export const SAVE_KEY = 'wasteland_year_save';

export function normalizeInitConfig(rawConfig) {
  const fallback = {
    currencies: {
      mycelium: Const.INITIAL_CURRENCY.mycelium,
      sourceCore: Const.INITIAL_CURRENCY.sourceCore,
      starCoin: Const.INITIAL_CURRENCY.starCoin
    },
    other: {
      energyDrinks: 0
    }
  };

  if (!Array.isArray(rawConfig)) {
    return fallback;
  }

  const currencies = { ...fallback.currencies };
  rawConfig.forEach((entry) => {
    if (!entry?.key) return;
    const value = Number(entry.initialValue);
    currencies[entry.key] = Number.isFinite(value) ? value : currencies[entry.key] ?? 0;
  });

  return {
    currencies,
    other: { ...fallback.other }
  };
}

export const INIT_CONFIG = normalizeInitConfig(initConfigData);

export function createDefaultBaseData() {
  return {
    mycelium: INIT_CONFIG.currencies.mycelium,
    sourceCore: INIT_CONFIG.currencies.sourceCore,
    starCoin: INIT_CONFIG.currencies.starCoin,
    energyDrinks: Array(INIT_CONFIG.other.energyDrinks).fill(null),
    inventory: {},
    dailyPurchaseRecords: {},
    lastDailyReset: null
  };
}

export function createDefaultDungeonData() {
  return {
    currentFloor: 1,
    maxReachedFloor: 1,
    currentDimension: 1,
    totalBattlesWon: 0,
    totalGoldEarned: 0,
    offlineProgress: {
      enabled: false,
      lastBattleTime: Date.now(),
      battlesWon: 0,
      goldEarned: 0
    }
  };
}

export function createDefaultSettings() {
  return {
    masterVolume: 0.8,
    bgmVolume: 0.7,
    seVolume: 0.8,
    autoBattle: true,
    autoChip: true,
    battleSpeed: 1
  };
}

export function createDefaultAchievements() {
  return {
    progress: {},
    unlocked: [],
    claimedRewards: []
  };
}

export function createDefaultChipCardData() {
  return {
    ownedCards: [],
    equippedCardId: null,
    shopCards: []
  };
}

export function createDefaultMinionCardData() {
  return {
    ownedCards: [],
    deployedCards: [],
    maxDeploy: 3,
    shopMinions: []
  };
}

export function createDefaultProgress() {
  return {
    clearedStages: []
  };
}

export function createDefaultGameData() {
  return {
    version: '3.0.0',
    base: createDefaultBaseData(),
    dungeon: createDefaultDungeonData(),
    chipCardManager: createDefaultChipCardData(),
    minionCardManager: createDefaultMinionCardData(),
    reputation: {},
    achievements: createDefaultAchievements(),
    settings: createDefaultSettings(),
    progress: createDefaultProgress(),
    gacha: {
      pityCounter: { count: 0, srCount: 0, ssrCount: 0, urCount: 0 },
      history: []
    },
    shipParts: [],
    minionStones: 0,
    starStones: 0
  };
}

export function mergeGameData(savedData = {}) {
  const defaults = createDefaultGameData();

  return {
    ...defaults,
    ...savedData,
    base: {
      ...defaults.base,
      ...(savedData.base || {})
    },
    dungeon: {
      ...defaults.dungeon,
      ...(savedData.dungeon || {}),
      offlineProgress: {
        ...defaults.dungeon.offlineProgress,
        ...(savedData.dungeon?.offlineProgress || {})
      }
    },
    chipCardManager: {
      ...defaults.chipCardManager,
      ...(savedData.chipCardManager || {})
    },
    minionCardManager: {
      ...defaults.minionCardManager,
      ...(savedData.minionCardManager || {})
    },
    reputation: {
      ...defaults.reputation,
      ...(savedData.reputation || {})
    },
    achievements: {
      ...defaults.achievements,
      ...(savedData.achievements || {})
    },
    settings: {
      ...defaults.settings,
      ...(savedData.settings || {})
    },
    gacha: {
      ...defaults.gacha,
      ...(savedData.gacha || {}),
      pityCounter: {
        ...defaults.gacha.pityCounter,
        ...(savedData.gacha?.pityCounter || {})
      },
      history: Array.isArray(savedData.gacha?.history) ? savedData.gacha.history : defaults.gacha.history
    },
    progress: {
      ...defaults.progress,
      ...(savedData.progress || {})
    },
    shipParts: Array.isArray(savedData.shipParts) ? savedData.shipParts : defaults.shipParts
  };
}

export function loadGameData() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) {
      return createDefaultGameData();
    }
    return mergeGameData(JSON.parse(saved));
  } catch (error) {
    console.warn('存档加载失败，改用默认数据。', error);
    return createDefaultGameData();
  }
}

export function saveGameData(gameData) {
  const normalized = mergeGameData(gameData);
  localStorage.setItem(SAVE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function resetGameData() {
  const freshData = createDefaultGameData();
  localStorage.removeItem(SAVE_KEY);
  localStorage.setItem(SAVE_KEY, JSON.stringify(freshData));
  return freshData;
}

export function ensureGlobalGameData() {
  const data = loadGameData();
  window.gameData = data;
  return data;
}

export function syncRuntimeGameData({
  baseSystem = null,
  chipCardManager = null,
  minionCardManager = null,
  reputationSystem = null,
  dungeonSystem = null
} = {}) {
  const current = mergeGameData(window.gameData || {});

  if (baseSystem) {
    current.base = baseSystem.toJSON();
  }
  if (chipCardManager) {
    current.chipCardManager = chipCardManager.toJSON();
  }
  if (minionCardManager) {
    current.minionCardManager = minionCardManager.toJSON();
  }
  if (reputationSystem) {
    current.reputation = reputationSystem.toJSON();
  }
  if (dungeonSystem) {
    current.dungeon = dungeonSystem.toJSON();
  }

  window.gameData = current;
  return saveGameData(current);
}

