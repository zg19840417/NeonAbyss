// ===== 稀有度体系 =====
export const Rarity = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

export const RarityConfig = {
  [Rarity.COMMON]: {
    name: '普通',
    nameEn: 'Common',
    statMultiplier: 1.0,
    borderColor: 0x8a7a6a,
    glowColor: null,
    particleColor: null,
    textColor: '#8a7a6a'
  },
  [Rarity.RARE]: {
    name: '稀有',
    nameEn: 'Rare',
    statMultiplier: 1.2,
    borderColor: 0x4dabf7,
    glowColor: 0x4dabf7,
    particleColor: 0x4dabf7,
    textColor: '#4dabf7'
  },
  [Rarity.EPIC]: {
    name: '史诗',
    nameEn: 'Epic',
    statMultiplier: 1.5,
    borderColor: 0x9775fa,
    glowColor: 0x9775fa,
    particleColor: 0x9775fa,
    textColor: '#9775fa'
  },
  [Rarity.LEGENDARY]: {
    name: '传说',
    nameEn: 'Legendary',
    statMultiplier: 2.0,
    borderColor: 0xffd700,
    glowColor: 0xffd700,
    particleColor: 0xffd700,
    textColor: '#ffd700'
  }
};

// ===== 种族体系（5大种族，按融合对象分类） =====
export const Race = {
  PLANT: 'plant',
  ANIMAL: 'animal',
  MECH: 'mech',
  ENERGY: 'energy',
  HYBRID: 'hybrid'
};

export const RaceConfig = {
  [Race.PLANT]: {
    name: '植物系',
    nameEn: 'Plant',
    icon: '🌿',
    description: '与变异植物融合的融合者'
  },
  [Race.ANIMAL]: {
    name: '动物系',
    nameEn: 'Animal',
    icon: '🐾',
    description: '与变异动物融合的融合者'
  },
  [Race.MECH]: {
    name: '机械系',
    nameEn: 'Mech',
    icon: '⚙️',
    description: '与残存机械融合的融合者'
  },
  [Race.ENERGY]: {
    name: '能量系',
    nameEn: 'Energy',
    icon: '💎',
    description: '与辐射能量体融合的融合者'
  },
  [Race.HYBRID]: {
    name: '混合系',
    nameEn: 'Hybrid',
    icon: '🔮',
    description: '多种融合的融合者'
  }
};

// ===== 元素体系（5种元素） =====
export const Element = {
  WATER: 'water',
  FIRE: 'fire',
  WIND: 'wind',
  LIGHT: 'light',
  DARK: 'dark'
};

export const ElementConfig = {
  [Element.WATER]: {
    name: '水',
    nameEn: 'Water',
    icon: '💧',
    color: 0x4dabf7,
    strongAgainst: Element.FIRE,
    weakAgainst: Element.WIND,
    bonusMultiplier: 1.2,
    resistMultiplier: 0.8
  },
  [Element.FIRE]: {
    name: '火',
    nameEn: 'Fire',
    icon: '🔥',
    color: 0xff6b35,
    strongAgainst: Element.WIND,
    weakAgainst: Element.WATER,
    bonusMultiplier: 1.2,
    resistMultiplier: 0.8
  },
  [Element.WIND]: {
    name: '风',
    nameEn: 'Wind',
    icon: '🌪️',
    color: 0x74c0fc,
    strongAgainst: Element.DARK,
    weakAgainst: Element.FIRE,
    bonusMultiplier: 1.2,
    resistMultiplier: 0.8
  },
  [Element.LIGHT]: {
    name: '光',
    nameEn: 'Light',
    icon: '✨',
    color: 0xffee58,
    strongAgainst: Element.DARK,
    weakAgainst: Element.DARK,
    bonusMultiplier: 1.2,
    resistMultiplier: 0.8
  },
  [Element.DARK]: {
    name: '暗',
    nameEn: 'Dark',
    icon: '🌑',
    color: 0x9775fa,
    strongAgainst: Element.LIGHT,
    weakAgainst: Element.LIGHT,
    bonusMultiplier: 1.2,
    resistMultiplier: 0.8
  }
};

export function getElementMultiplier(attackerElement, defenderElement) {
  if (!attackerElement || !defenderElement) return 1.0;
  const attackerConfig = ElementConfig[attackerElement];
  if (!attackerConfig) return 1.0;
  if (attackerConfig.strongAgainst === defenderElement) return attackerConfig.bonusMultiplier;
  if (attackerConfig.weakAgainst === defenderElement) return attackerConfig.resistMultiplier;
  return 1.0;
}

export default {
  Rarity,
  RarityConfig,
  Race,
  RaceConfig,
  Element,
  ElementConfig,
  getElementMultiplier
};
