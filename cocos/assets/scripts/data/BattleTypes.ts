import type { ElementType, ProfessionType, Quality, RuntimeStatBlock } from './CommonTypes';

export interface BattleSkillViewModel {
  skill_id: string;
  name: string;
  icon_key: string;
  cooldown: number;
  current_cooldown: number;
  description: string;
}

export interface BattleAbilityViewModel {
  ability_id: string;
  name: string;
  icon_key: string;
  unlocked: boolean;
  description: string;
}

export interface BattleUnitSnapshot {
  unit_id: string;
  source_id: string;
  name: string;
  title: string;
  quality: Quality;
  level: number;
  profession: ProfessionType;
  element: ElementType;
  portrait_key: string;
  hp: number;
  max_hp: number;
  atk: number;
  spd: number;
  skills: BattleSkillViewModel[];
  abilities: BattleAbilityViewModel[];
}

export interface BattleFormationSnapshot {
  allies: BattleUnitSnapshot[];
  enemies: BattleUnitSnapshot[];
  chip_id: string | null;
  chip_name: string | null;
}

export interface BattleResultSummary {
  win: boolean;
  star: 0 | 1 | 2 | 3;
  rounds: number;
  no_ally_death: boolean;
  within_round_limit: boolean;
}

export interface BattleLogEntry {
  timestamp: number;
  actor_unit_id: string | null;
  target_unit_id: string | null;
  message: string;
}

export interface FragmentGrowthSummary {
  base: RuntimeStatBlock;
  bonus: RuntimeStatBlock;
  final: RuntimeStatBlock;
}
