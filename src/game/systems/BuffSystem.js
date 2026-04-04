export const BuffType = {
  ATK_UP: 'atk_up',
  ATK_DOWN: 'atk_down',
  HP_UP: 'hp_up',
  HP_DOWN: 'hp_down',
  DEF_UP: 'def_up',
  DEF_DOWN: 'def_down',
  CRIT_UP: 'crit_up',
  CRIT_DOWN: 'crit_down',
  DODGE_UP: 'dodge_up',
  DODGE_DOWN: 'dodge_down',
  SHIELD: 'shield',
  REGEN: 'regen',
  POISON: 'poison',
  STUN: 'stun',
  SILENCE: 'silence',
  SPEED_UP: 'speed_up',
  SPEED_DOWN: 'speed_down',
  LIFESTEAL: 'lifesteal',
  COUNTER: 'counter'
};

export const BuffConfig = {
  [BuffType.ATK_UP]: {
    name: '攻击提升',
    icon: '⚔️',
    color: '#ff6b6b',
    positive: true
  },
  [BuffType.ATK_DOWN]: {
    name: '攻击下降',
    icon: '📉',
    color: '#888888',
    positive: false
  },
  [BuffType.HP_UP]: {
    name: '生命提升',
    icon: '❤️',
    color: '#ff6b6b',
    positive: true
  },
  [BuffType.HP_DOWN]: {
    name: '生命下降',
    icon: '💔',
    color: '#888888',
    positive: false
  },
  [BuffType.DEF_UP]: {
    name: '防御提升',
    icon: '🛡️',
    color: '#4dabf7',
    positive: true
  },
  [BuffType.DEF_DOWN]: {
    name: '防御下降',
    icon: '💔',
    color: '#888888',
    positive: false
  },
  [BuffType.CRIT_UP]: {
    name: '暴击提升',
    icon: '💥',
    color: '#ffd43b',
    positive: true
  },
  [BuffType.CRIT_DOWN]: {
    name: '暴击下降',
    icon: '📉',
    color: '#888888',
    positive: false
  },
  [BuffType.DODGE_UP]: {
    name: '闪避提升',
    icon: '💨',
    color: '#69db7c',
    positive: true
  },
  [BuffType.DODGE_DOWN]: {
    name: '闪避下降',
    icon: '📉',
    color: '#888888',
    positive: false
  },
  [BuffType.SHIELD]: {
    name: '护盾',
    icon: '🔰',
    color: '#74c0fc',
    positive: true
  },
  [BuffType.REGEN]: {
    name: '回复',
    icon: '💚',
    color: '#51cf66',
    positive: true
  },
  [BuffType.POISON]: {
    name: '中毒',
    icon: '☠️',
    color: '#9775fa',
    positive: false
  },
  [BuffType.STUN]: {
    name: '眩晕',
    icon: '⏰',
    color: '#ffd43b',
    positive: false
  },
  [BuffType.SILENCE]: {
    name: '沉默',
    icon: '🔇',
    color: '#868e96',
    positive: false
  },
  [BuffType.SPEED_UP]: {
    name: '加速',
    icon: '⚡',
    color: '#ffd43b',
    positive: true
  },
  [BuffType.SPEED_DOWN]: {
    name: '减速',
    icon: '🐌',
    color: '#868e96',
    positive: false
  },
  [BuffType.LIFESTEAL]: {
    name: '生命汲取',
    icon: '🩸',
    color: '#e8590c',
    positive: false
  },
  [BuffType.COUNTER]: {
    name: '反击姿态',
    icon: '🔄',
    color: '#f783ac',
    positive: true
  }
};

export default class BuffIconManager {
  constructor(scene) {
    this.scene = scene;
    this.icons = new Map();
  }
  
  createBuffIcon(x, y, buffType, duration, config = {}) {
    const {
      size = 24,
      showDuration = true,
      onClick = null
    } = config;
    
    const buffInfo = BuffConfig[buffType] || {
      name: '未知',
      icon: '❓',
      color: '#888888',
      positive: true
    };
    
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.circle(0, 0, size / 2, 0x2a2520);
    bg.setStrokeStyle(1, buffInfo.positive ? 0xa8d8a8 : 0xd8a8a8);
    
    const icon = this.scene.add.text(0, 0, buffInfo.icon, {
      fontSize: (size * 0.6) + 'px'
    }).setOrigin(0.5);
    
    container.add([bg, icon]);
    container.setSize(size, size);
    
    if (showDuration && duration > 0) {
      const durationBg = this.scene.add.rectangle(size / 2, size / 2, 12, 12, 0x000000, 0.8);
      const durationText = this.scene.add.text(size / 2, size / 2, duration.toString(), {
        fontSize: '8px',
        fill: '#ffffff',
        fontFamily: 'Noto Sans SC'
      }).setOrigin(0.5);
      
      container.add([durationBg, durationText]);
      
      container.updateDuration = (newDuration) => {
        durationText.setText(newDuration.toString());
        if (newDuration <= 0) {
          container.setVisible(false);
        }
      };
    }
    
    if (onClick) {
      container.setInteractive(new Phaser.Geom.Circle(0, 0, size / 2), Phaser.Geom.Circle.Contains);
      container.on('pointerdown', () => onClick(buffType));
    }
    
    this.icons.set(buffType + '_' + Date.now(), container);
    
    return container;
  }
  
  createBuffBar(x, y, buffs, debuffs, config = {}) {
    const {
      iconSize = 24,
      spacing = 4,
      maxPerRow = 8
    } = config;
    
    const container = this.scene.add.container(x, y);
    
    const allEffects = [
      ...buffs.map(b => ({ ...b, isBuff: true })),
      ...debuffs.map(d => ({ ...d, isBuff: false }))
    ];
    
    let currentX = 0;
    let currentY = 0;
    
    allEffects.forEach((effect, index) => {
      if (index > 0 && index % maxPerRow === 0) {
        currentX = 0;
        currentY += iconSize + spacing;
      }
      
      const icon = this.createBuffIcon(
        currentX,
        currentY,
        effect.id || effect.type,
        effect.remainingDuration || effect.duration || 0,
        { size: iconSize, showDuration: true }
      );
      
      container.add(icon);
      currentX += iconSize + spacing;
    });
    
    container.setSize(
      Math.min(allEffects.length, maxPerRow) * (iconSize + spacing),
      Math.ceil(allEffects.length / maxPerRow) * (iconSize + spacing)
    );
    
    container.refresh = (newBuffs, newDebuffs) => {
      container.removeAll(true);
      
      const allNewEffects = [
        ...newBuffs.map(b => ({ ...b, isBuff: true })),
        ...newDebuffs.map(d => ({ ...d, isBuff: false }))
      ];
      
      let cx = 0;
      let cy = 0;
      
      allNewEffects.forEach((effect, index) => {
        if (index > 0 && index % maxPerRow === 0) {
          cx = 0;
          cy += iconSize + spacing;
        }
        
        const icon = this.createBuffIcon(
          cx,
          cy,
          effect.id || effect.type,
          effect.remainingDuration || effect.duration || 0,
          { size: iconSize, showDuration: true }
        );
        
        container.add(icon);
        cx += iconSize + spacing;
      });
      
      container.setSize(
        Math.min(allNewEffects.length, maxPerRow) * (iconSize + spacing),
        Math.ceil(allNewEffects.length / maxPerRow) * (iconSize + spacing)
      );
    };
    
    return container;
  }
  
  destroyAll() {
    this.icons.forEach(icon => icon.destroy());
    this.icons.clear();
  }
}

export function getBuffDescription(buffType, value = 0, duration = 0) {
  const config = BuffConfig[buffType];
  if (!config) return '未知效果';
  
  let description = config.name;
  
  if (value > 0) {
    if (buffType.includes('UP') || buffType === BuffType.SHIELD) {
      description += ` +${(value * 100).toFixed(0)}%`;
    } else if (buffType.includes('DOWN')) {
      description += ` -${(value * 100).toFixed(0)}%`;
    }
  }
  
  if (duration > 0) {
    description += ` (${duration}回合)`;
  }
  
  return description;
}
