// 角色职业枚举
export const CharacterClass = {
  // 坦克类
  IRON_WALL: 'iron_wall',        // 铁壁卫士
  LIFE_GUARDIAN: 'life_guardian', // 生命守护者
  STEEL_BASTION: 'steel_bastion', // 钢铁壁垒
  UNYIELDING_WILL: 'unyielding_will', // 不屈意志
  
  // 输出类
  BERSERKER: 'berserker',        // 狂战士
  ELEMENT_MAGE: 'element_mage',   // 元素法师
  SHADOW_ASSASSIN: 'shadow_assassin', // 影子刺客
  MECH_ENGINEER: 'mech_engineer', // 机械工程师
  DESTRUCTION_WARLOCK: 'destruction_warlock', // 毁灭术士
  MECHA_WAR_GOD: 'mecha_war_god', // 机甲战神
  
  // 辅助类
  TACTICAL_COMMANDER: 'tactical_commander', // 战术指挥官
  WIND_SWORDSMAN: 'wind_swordsman', // 疾风剑客
  TIME_WALKER: 'time_walker',      // 时空行者
  
  // 治疗类
  NATURAL_HEALER: 'natural_healer', // 自然治愈师
  HOLY_PRIEST: 'holy_priest',     // 神圣牧师
  ELEMENTAL_LORD: 'elemental_lord'  // 元素领主
};

// 职业定位
export const RoleType = {
  TANK: 'tank',       // 坦克
  DPS: 'dps',         // 输出
  SUPPORT: 'support', // 辅助
  HEALER: 'healer'    // 治疗
};

// 角色职业信息配置
export const ClassConfig = {
  [CharacterClass.IRON_WALL]: {
    name: '铁壁卫士',
    nameEn: 'Iron Wall Guardian',
    mainRole: RoleType.TANK,
    subRole: RoleType.TANK,
    baseHp: 800,
    baseAtk: 25,
    baseCritRate: 0.10,
    baseDodgeRate: 0.05,
    baseCritDamage: 1.5,
    baseDamageReduction: 0.15,
    baseLifeSteal: 0,
    baseHatredBonus: 3,
    description: '重型装甲与植物融合的守护者，拥有极高的生命值和防御能力',
    icon: 'tank_shield'
  },
  [CharacterClass.LIFE_GUARDIAN]: {
    name: '生命守护者',
    nameEn: 'Life Guardian',
    mainRole: RoleType.TANK,
    subRole: RoleType.HEALER,
    baseHp: 700,
    baseAtk: 20,
    baseCritRate: 0.08,
    baseDodgeRate: 0.08,
    baseCritDamage: 1.5,
    baseDamageReduction: 0.10,
    baseLifeSteal: 0,
    baseHatredBonus: 2,
    description: '拥有治疗能力的坦克职业，适合保护队友',
    icon: 'tank_heal'
  },
  [CharacterClass.STEEL_BASTION]: {
    name: '钢铁壁垒',
    nameEn: 'Steel Bastion',
    mainRole: RoleType.TANK,
    subRole: RoleType.DPS,
    baseHp: 850,
    baseAtk: 30,
    baseCritRate: 0.12,
    baseDodgeRate: 0.03,
    baseCritDamage: 1.5,
    baseDamageReduction: 0.20,
    baseLifeSteal: 0,
    baseHatredBonus: 3,
    description: '完全机械化的重装机甲，拥有最高的防御能力',
    icon: 'tank_mech'
  },
  [CharacterClass.UNYIELDING_WILL]: {
    name: '不屈意志',
    nameEn: 'Unyielding Will',
    mainRole: RoleType.TANK,
    subRole: RoleType.SUPPORT,
    baseHp: 750,
    baseAtk: 22,
    baseCritRate: 0.10,
    baseDodgeRate: 0.10,
    baseCritDamage: 1.5,
    baseDamageReduction: 0.12,
    baseLifeSteal: 0.05,
    baseHatredBonus: 2,
    description: '岩石融合的战士，拥有反击能力',
    icon: 'tank_rock'
  },
  [CharacterClass.BERSERKER]: {
    name: '狂战士',
    nameEn: 'Berserker',
    mainRole: RoleType.DPS,
    subRole: RoleType.TANK,
    baseHp: 450,
    baseAtk: 45,
    baseCritRate: 0.25,
    baseDodgeRate: 0.05,
    baseCritDamage: 1.8,
    baseDamageReduction: 0.05,
    baseLifeSteal: 0.10,
    baseHatredBonus: 2,
    description: '野兽融合的狂暴战士，拥有极高的输出能力',
    icon: 'dps_beast'
  },
  [CharacterClass.ELEMENT_MAGE]: {
    name: '元素法师',
    nameEn: 'Elemental Mage',
    mainRole: RoleType.DPS,
    subRole: RoleType.SUPPORT,
    baseHp: 380,
    baseAtk: 50,
    baseCritRate: 0.20,
    baseDodgeRate: 0.05,
    baseCritDamage: 1.6,
    baseDamageReduction: 0.02,
    baseLifeSteal: 0,
    baseHatredBonus: 1,
    description: '掌握元素力量的法师，技能伤害极高',
    icon: 'dps_magic'
  },
  [CharacterClass.SHADOW_ASSASSIN]: {
    name: '影子刺客',
    nameEn: 'Shadow Assassin',
    mainRole: RoleType.DPS,
    subRole: RoleType.SUPPORT,
    baseHp: 350,
    baseAtk: 48,
    baseCritRate: 0.35,
    baseDodgeRate: 0.20,
    baseCritDamage: 2.0,
    baseDamageReduction: 0.02,
    baseLifeSteal: 0.05,
    baseHatredBonus: 1,
    description: '暗影融合的刺客，高暴击高闪避',
    icon: 'dps_assassin'
  },
  [CharacterClass.MECH_ENGINEER]: {
    name: '机械工程师',
    nameEn: 'Mech Engineer',
    mainRole: RoleType.DPS,
    subRole: RoleType.TANK,
    baseHp: 500,
    baseAtk: 40,
    baseCritRate: 0.15,
    baseDodgeRate: 0.08,
    baseCritDamage: 1.6,
    baseDamageReduction: 0.08,
    baseLifeSteal: 0.05,
    baseHatredBonus: 2,
    description: '机械改造的工程师，拥有不错的生存能力',
    icon: 'dps_engineer'
  },
  [CharacterClass.DESTRUCTION_WARLOCK]: {
    name: '毁灭术士',
    nameEn: 'Destruction Warlock',
    mainRole: RoleType.DPS,
    subRole: RoleType.HEALER,
    baseHp: 400,
    baseAtk: 55,
    baseCritRate: 0.18,
    baseDodgeRate: 0.03,
    baseCritDamage: 1.7,
    baseDamageReduction: 0.02,
    baseLifeSteal: 0.15,
    baseHatredBonus: 1,
    description: '虚空融合的术士，拥有生命汲取能力',
    icon: 'dps_warlock'
  },
  [CharacterClass.MECHA_WAR_GOD]: {
    name: '机甲战神',
    nameEn: 'Mecha War God',
    mainRole: RoleType.DPS,
    subRole: RoleType.TANK,
    baseHp: 550,
    baseAtk: 42,
    baseCritRate: 0.22,
    baseDodgeRate: 0.06,
    baseCritDamage: 1.7,
    baseDamageReduction: 0.08,
    baseLifeSteal: 0.08,
    baseHatredBonus: 2,
    description: '战神融合的机甲战士，均衡型输出',
    icon: 'dps_wargod'
  },
  [CharacterClass.TACTICAL_COMMANDER]: {
    name: '战术指挥官',
    nameEn: 'Tactical Commander',
    mainRole: RoleType.SUPPORT,
    subRole: RoleType.TANK,
    baseHp: 500,
    baseAtk: 30,
    baseCritRate: 0.12,
    baseDodgeRate: 0.08,
    baseCritDamage: 1.5,
    baseDamageReduction: 0.08,
    baseLifeSteal: 0,
    baseHatredBonus: 2,
    description: '智能融合的指挥官，拥有增益技能',
    icon: 'support_commander'
  },
  [CharacterClass.WIND_SWORDSMAN]: {
    name: '疾风剑客',
    nameEn: 'Wind Swordsman',
    mainRole: RoleType.SUPPORT,
    subRole: RoleType.DPS,
    baseHp: 400,
    baseAtk: 42,
    baseCritRate: 0.25,
    baseDodgeRate: 0.25,
    baseCritDamage: 1.6,
    baseDamageReduction: 0.03,
    baseLifeSteal: 0,
    baseHatredBonus: 1,
    description: '风元素融合的剑客，高闪避高暴击',
    icon: 'support_wind'
  },
  [CharacterClass.TIME_WALKER]: {
    name: '时空行者',
    nameEn: 'Time Walker',
    mainRole: RoleType.SUPPORT,
    subRole: RoleType.HEALER,
    baseHp: 420,
    baseAtk: 35,
    baseCritRate: 0.15,
    baseDodgeRate: 0.15,
    baseCritDamage: 1.5,
    baseDamageReduction: 0.05,
    baseLifeSteal: 0,
    baseHatredBonus: 1,
    description: '时间融合的行者，拥有控制技能',
    icon: 'support_time'
  },
  [CharacterClass.NATURAL_HEALER]: {
    name: '自然治愈师',
    nameEn: 'Natural Healer',
    mainRole: RoleType.HEALER,
    subRole: RoleType.SUPPORT,
    baseHp: 450,
    baseAtk: 25,
    baseCritRate: 0.08,
    baseDodgeRate: 0.10,
    baseCritDamage: 1.5,
    baseDamageReduction: 0.05,
    baseLifeSteal: 0,
    baseHatredBonus: 1,
    description: '自然融合的治愈师，群体治疗能力强',
    icon: 'healer_nature'
  },
  [CharacterClass.HOLY_PRIEST]: {
    name: '神圣牧师',
    nameEn: 'Holy Priest',
    mainRole: RoleType.HEALER,
    subRole: RoleType.TANK,
    baseHp: 480,
    baseAtk: 22,
    baseCritRate: 0.08,
    baseDodgeRate: 0.05,
    baseCritDamage: 1.5,
    baseDamageReduction: 0.08,
    baseLifeSteal: 0,
    baseHatredBonus: 2,
    description: '光明融合的牧师，拥有护盾技能',
    icon: 'healer_holy'
  },
  [CharacterClass.ELEMENTAL_LORD]: {
    name: '元素领主',
    nameEn: 'Elemental Lord',
    mainRole: RoleType.HEALER,
    subRole: RoleType.DPS,
    baseHp: 420,
    baseAtk: 38,
    baseCritRate: 0.18,
    baseDodgeRate: 0.05,
    baseCritDamage: 1.6,
    baseDamageReduction: 0.03,
    baseLifeSteal: 0.10,
    baseHatredBonus: 1,
    description: '全元素融合的领主，治疗输出兼顾',
    icon: 'healer_element'
  }
};

// 获取职业的主定位
export function getMainRole(charClass) {
  const config = ClassConfig[charClass];
  return config ? config.mainRole : null;
}

// 获取职业的辅助定位
export function getSubRole(charClass) {
  const config = ClassConfig[charClass];
  return config ? config.subRole : null;
}

// 判断是否为坦克职业
export function isTank(charClass) {
  const mainRole = getMainRole(charClass);
  const subRole = getSubRole(charClass);
  return mainRole === RoleType.TANK || subRole === RoleType.TANK;
}

// 判断是否为输出职业
export function isDps(charClass) {
  const mainRole = getMainRole(charClass);
  const subRole = getSubRole(charClass);
  return mainRole === RoleType.DPS || subRole === RoleType.DPS;
}

// 判断是否为治疗职业
export function isHealer(charClass) {
  const mainRole = getMainRole(charClass);
  const subRole = getSubRole(charClass);
  return mainRole === RoleType.HEALER || subRole === RoleType.HEALER;
}

// 判断是否为辅助职业
export function isSupport(charClass) {
  const mainRole = getMainRole(charClass);
  const subRole = getSubRole(charClass);
  return mainRole === RoleType.SUPPORT || subRole === RoleType.SUPPORT;
}
