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

export const Element = {
  FIRE: 'fire',
  ICE: 'ice',
  THUNDER: 'thunder',
  DARK: 'dark',
  LIGHT: 'light'
};

export const ElementConfig = {
  [Element.FIRE]: {
    name: '火',
    nameEn: 'Fire',
    icon: '🔥',
    color: 0xff6b35,
    strongAgainst: Element.ICE,
    weakAgainst: Element.LIGHT,
    bonusMultiplier: 1.3,
    resistMultiplier: 0.7
  },
  [Element.ICE]: {
    name: '冰',
    nameEn: 'Ice',
    icon: '❄️',
    color: 0x74c0fc,
    strongAgainst: Element.THUNDER,
    weakAgainst: Element.FIRE,
    bonusMultiplier: 1.3,
    resistMultiplier: 0.7
  },
  [Element.THUNDER]: {
    name: '雷',
    nameEn: 'Thunder',
    icon: '⚡',
    color: 0xffd43b,
    strongAgainst: Element.DARK,
    weakAgainst: Element.ICE,
    bonusMultiplier: 1.3,
    resistMultiplier: 0.7
  },
  [Element.DARK]: {
    name: '暗',
    nameEn: 'Dark',
    icon: '🌑',
    color: 0x9775fa,
    strongAgainst: Element.LIGHT,
    weakAgainst: Element.THUNDER,
    bonusMultiplier: 1.3,
    resistMultiplier: 0.7
  },
  [Element.LIGHT]: {
    name: '光',
    nameEn: 'Light',
    icon: '✨',
    color: 0xffee58,
    strongAgainst: Element.FIRE,
    weakAgainst: Element.DARK,
    bonusMultiplier: 1.3,
    resistMultiplier: 0.7
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
  HUMAN: 'human',
  MECH: 'mech',
  MUTANT: 'mutant',
  ENERGY: 'energy',
  BEAST: 'beast'
};

export const RaceConfig = {
  [Race.HUMAN]: {
    name: '人类',
    nameEn: 'Human',
    icon: '🧑',
    description: '均衡型种族，无特殊加成'
  },
  [Race.MECH]: {
    name: '机械',
    nameEn: 'Mech',
    icon: '🤖',
    description: '机械种族，受到治疗效果降低30%，但免疫中毒和眩晕'
  },
  [Race.MUTANT]: {
    name: '变异体',
    nameEn: 'Mutant',
    icon: '🧬',
    description: '变异种族，每回合恢复最大生命值5%'
  },
  [Race.ENERGY]: {
    name: '能量体',
    nameEn: 'Energy',
    icon: '💎',
    description: '能量种族，闪避率额外+15%，但生命值上限-20%'
  },
  [Race.BEAST]: {
    name: '野兽',
    nameEn: 'Beast',
    icon: '🐺',
    description: '野兽种族，攻击力+15%，暴击率+10%'
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
