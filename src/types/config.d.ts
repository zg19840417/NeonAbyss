// 全局游戏数据类型
declare global {
  interface GameData {
    version: string;
    base: BaseData;
    dungeon: DungeonData;
    chipCardManager: ChipCardManagerData;
    fusionGirlManager: FusionGirlManagerData;
    reputation: Record<string, unknown>;
    achievements: AchievementsData;
    settings: SettingsData;
    progress: ProgressData;
    gacha: GachaData;
    shipParts: unknown[];
    elementPoints: ElementPointsData;
    minionStones: number;
    starStones: number;
  }

  interface BaseData {
    mycelium: number;
    sourceCore: number;
    starCoin: number;
    energyDrinks: (null | unknown)[];
    inventory: Record<string, number>;
    dailyPurchaseRecords: Record<string, unknown>;
    lastDailyReset: string | null;
  }

  interface DungeonData {
    currentFloor: number;
    maxReachedFloor: number;
    currentDimension: number;
    totalBattlesWon: number;
    totalGoldEarned: number;
    offlineProgress: OfflineProgressData;
  }

  interface OfflineProgressData {
    enabled: boolean;
    lastBattleTime: number;
    battlesWon: number;
    goldEarned: number;
  }

  interface ChipCardManagerData {
    ownedCards: unknown[];
    equippedCardId: string | null;
    shopCards: unknown[];
  }

  interface FusionGirlManagerData {
    ownedGirls: FusionGirlRecord[];
    deployedGirlIds: string[];
    maxDeploy: number;
    summonUnlockedGirlIds: string[];
  }

  interface FusionGirlRecord {
    id: string;
    name: string;
    element: string | null;
    profession: string | null;
    level: number;
    exp: number;
    quality: string;
    deployed: boolean;
    summonUnlocked: boolean;
    completedPortraitSetIds: string[];
    pendingQualityUpgrades: number;
    fragmentBonuses: {
      hp_pct: number;
      atk_pct: number;
      spd_pct: number;
      all_pct: number;
    };
    portraitProgress: Record<string, PortraitSetProgress>;
    moduleSlots: unknown[];
    pet: unknown;
  }

  interface PortraitSetProgress {
    portraitSetId: string;
    completed: boolean;
    fragmentProgress: Record<string, FragmentProgress>;
  }

  interface FragmentProgress {
    fragmentId: string;
    ownedCount: number;
    effectiveCount: number;
    requiredCount: number;
    bonusType: string;
    bonusValue: number;
    overflowElement: string;
  }

  interface AchievementsData {
    progress: Record<string, unknown>;
    unlocked: string[];
    claimedRewards: string[];
  }

  interface SettingsData {
    masterVolume: number;
    bgmVolume: number;
    seVolume: number;
    autoBattle: boolean;
    autoChip: boolean;
    battleSpeed: number;
  }

  interface ProgressData {
    clearedStages: string[];
  }

  interface GachaData {
    pityCounter: {
      count: number;
      srCount: number;
      ssrCount: number;
      urCount: number;
    };
    history: unknown[];
  }

  interface ElementPointsData {
    water: number;
    fire: number;
    wind: number;
  }

  interface Window {
    __game: import('phaser').Game;
    gameData: GameData;
  }
}

export {};
