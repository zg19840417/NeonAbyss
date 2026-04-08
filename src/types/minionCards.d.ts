/**
 * 融合姬卡片类型定义
 * 数据来源: assets/data/json/fusionGirls.json
 */
declare interface FusionGirlCard {
  id: string;
  name: string;
  title: string;
  element: 'water' | 'fire' | 'wind' | 'light' | 'dark';
  profession: string;
  initialQuality: 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LE';
  defaultPortraitSetId: string;
  unlockChapterId: string;
  unlockStageId: string;
  description: string;
  baseHp: number;
  baseAtk: number;
  baseSpd: number;
  activeSkill1Id: string;
  activeSkill2Id: string;
  activeSkill3Id: string;
  petSlotUnlockQuality: 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LE';
  moduleSlotPlan: Record<string, number>;
  summonUnlockStageId: string;
  isStarter: boolean;
  isStarterDeployed: boolean;
  isStarterSummonUnlocked: boolean;
  hpGrowthPerLevel: number;
  atkGrowthPerLevel: number;
  spdGrowthPerLevel: number;
}

declare interface FusionGirlsData extends Array<FusionGirlCard> {}

/**
 * 随从卡片类型定义（旧版 minions.json 格式）
 * 数据来源: src/game/data/minions.json
 */
declare interface MinionCard {
  id: string;
  name: string;
  charClass: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  element: string;
  race: string;
  portrait: string;
  level: number;
  description: string;
  hp: number;
  activeSkill: MinionActiveSkill;
  passiveSkill: MinionPassiveSkill;
}

declare interface MinionActiveSkill {
  skillId: string;
  name: string;
  description: string;
  type: string;
  targetType: string;
  targetTeam: string;
  multiplier: number;
  cooldown: number;
  animation?: string;
  particle?: string;
  debuffType?: string;
  debuffValue?: number;
  debuffDuration?: number;
}

declare interface MinionPassiveSkill {
  id: string;
  name: string;
  description: string;
  type: string;
  value: number;
  targetType: string;
  icon?: string;
  buffType?: string;
  buffDuration?: number;
}

declare interface MinionCardsData extends Array<MinionCard> {}
