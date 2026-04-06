export const Rarity = {
  N: 'N',
  R: 'R',
  SR: 'SR',
  SSR: 'SSR',
  UR: 'UR',
  LE: 'LE'
};

export const RarityConfig = {
  [Rarity.N]: {
    name: '普通',
    nameEn: 'N',
    statMultiplier: 1.0,
    borderColor: 0x8a7a6a,
    glowColor: null,
    particleColor: null,
    textColor: '#8a7a6a'
  },
  [Rarity.R]: {
    name: '稀有',
    nameEn: 'R',
    statMultiplier: 1.2,
    borderColor: 0x4dabf7,
    glowColor: 0x4dabf7,
    particleColor: 0x4dabf7,
    textColor: '#4dabf7'
  },
  [Rarity.SR]: {
    name: '精良',
    nameEn: 'SR',
    statMultiplier: 1.5,
    borderColor: 0x9775fa,
    glowColor: 0x9775fa,
    particleColor: 0x9775fa,
    textColor: '#9775fa'
  },
  [Rarity.SSR]: {
    name: '史诗',
    nameEn: 'SSR',
    statMultiplier: 2.0,
    borderColor: 0xffd700,
    glowColor: 0xffd700,
    particleColor: 0xffd700,
    textColor: '#ffd700'
  },
  [Rarity.UR]: {
    name: '传说',
    nameEn: 'UR',
    statMultiplier: 2.5,
    borderColor: 0xff6b35,
    glowColor: 0xff6b35,
    particleColor: 0xff6b35,
    textColor: '#ff6b35'
  },
  [Rarity.LE]: {
    name: '神话',
    nameEn: 'LE',
    statMultiplier: 3.0,
    borderColor: 0xff00ff,
    glowColor: 0xff00ff,
    particleColor: 0xff00ff,
    textColor: '#ff00ff'
  }
};

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
    resistMultiplier: 1.0
  },
  [Element.FIRE]: {
    name: '火',
    nameEn: 'Fire',
    icon: '🔥',
    color: 0xff6b35,
    strongAgainst: Element.WIND,
    weakAgainst: Element.WATER,
    bonusMultiplier: 1.2,
    resistMultiplier: 1.0
  },
  [Element.WIND]: {
    name: '风',
    nameEn: 'Wind',
    icon: '🌪️',
    color: 0x74c0fc,
    strongAgainst: Element.DARK,
    weakAgainst: Element.FIRE,
    bonusMultiplier: 1.2,
    resistMultiplier: 1.0
  },
  [Element.LIGHT]: {
    name: '光',
    nameEn: 'Light',
    icon: '✨',
    color: 0xffee58,
    strongAgainst: Element.DARK,
    weakAgainst: Element.DARK,
    bonusMultiplier: 1.2,
    resistMultiplier: 1.0
  },
  [Element.DARK]: {
    name: '暗',
    nameEn: 'Dark',
    icon: '🌑',
    color: 0x9775fa,
    strongAgainst: Element.LIGHT,
    weakAgainst: Element.LIGHT,
    bonusMultiplier: 1.2,
    resistMultiplier: 1.0
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

export const Race = {
  PLANT: 'plant',
  ANIMAL: 'animal',
  MECH: 'mech',
  ENERGY: 'energy',
  HYBRID: 'hybrid'
};

export const RaceConfig = {
  [Race.PLANT]: {
    name: '植物',
    nameEn: 'Plant',
    icon: '🌿',
    description: '植物种族，每回合恢复最大生命值5%'
  },
  [Race.ANIMAL]: {
    name: '动物',
    nameEn: 'Animal',
    icon: '🐺',
    description: '动物种族，攻击力+15%，暴击率+10%'
  },
  [Race.MECH]: {
    name: '机械',
    nameEn: 'Mech',
    icon: '🤖',
    description: '机械种族，受到治疗效果降低30%，但免疫中毒和眩晕'
  },
  [Race.ENERGY]: {
    name: '能量体',
    nameEn: 'Energy',
    icon: '💎',
    description: '能量种族，闪避率额外+15%，但生命值上限-20%'
  },
  [Race.HYBRID]: {
    name: '混合体',
    nameEn: 'Hybrid',
    icon: '🧬',
    description: '混合种族，均衡型种族，无特殊加成'
  }
};

export default {
  Rarity,
  RarityConfig,
  Element,
  ElementConfig,
  Race,
  RaceConfig,
  getElementMultiplier
};
