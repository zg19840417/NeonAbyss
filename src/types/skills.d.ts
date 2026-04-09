/**
 * 技能类型定义
 * 数据来源: assets/data/json/skills.json
 */
declare interface Skill {
  skillId: string;
  name: string;
  nameEn?: string;
  description: string;
  profession: string;
  skillType: 'active' | 'passive';
  targetType: string;
  effectType: string;
  element: string;
  baseMultiplier: number;
  cooldown: number;
  duration: number;
  additionalEffects?: string[];
  maxLevel: number;
  levelUpBonus: SkillLevelUpBonus[];
}

declare interface SkillLevelUpBonus {
  level: number;
  multiplierBonus: number;
  cooldownReduce?: number;
  unlockEffect?: {
    type: string;
    value: number;
    duration: number;
  };
  effectBoost?: {
    type: string;
    valueBonus: number;
  };
  targetBoost?: string;
}

declare interface SkillsData extends Array<Skill> {}
