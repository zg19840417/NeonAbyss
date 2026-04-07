export const Const = {
  COLORS: {
    BG_DARK: 0x0a0a14,
    BG_MID: 0x0d0d1d,
    BG_LIGHT: 0x080812,
    BG_HOVER: 0x1a1a2e,
    BG_DANGER: 0x330000,
    CYAN: 0x00ffff,
    PINK: 0xff66cc,
    PURPLE: 0x9933ff,
    MAGENTA: 0xff00ff,
    YELLOW: 0xffff00,
    RED: 0xff6666,
    GREEN: 0x66bb6a,
    BUTTON_PRIMARY: 0x00ccff,
    BUTTON_HOVER: 0x33ddff,
    BUTTON_SECONDARY: 0x2a2a4a,
    BUTTON_CYAN: 0x00ccff,
    BUTTON_DANGER_BORDER: 0xff3333,
    BUTTON_INACTIVE: 0x444466,
    OVERLAY: 0x000000
  },

  TEXT_COLORS: {
    PRIMARY: '#ffffff',
    SECONDARY: '#8888aa',
    DARK: '#0a0a14',
    CYAN: '#00ffff',
    PINK: '#ff66cc',
    PURPLE: '#9933ff',
    MAGENTA: '#ff00ff',
    YELLOW: '#ffff00',
    RED: '#ff6666',
    DANGER: '#ff6666',
    SUCCESS: '#66bb6a',
    INACTIVE: '#6666aa'
  },

  ALPHA: {
    OVERLAY: 0.85,
    GRID: 0.03,
    DECOR: 0.4,
    GLOW: 0.5,
    PARTICLE_MIN: 0.2,
    PARTICLE_MAX: 0.5
  },

  UI: {
    DESIGN_WIDTH: 375,
    DESIGN_HEIGHT: 812,
    NAV_HEIGHT: 60,
    TITLE_Y: 35,
    COIN_Y: 65,
    TAB_Y: 55,
    MODAL_WIDTH: 260,
    MODAL_HEIGHT: 160,
    MODAL_RADIUS: 12,
    BUTTON_HEIGHT: 28,
    BUTTON_RADIUS: 6,
    CARD_RADIUS: 12,
    CARD_RADIUS_SMALL: 8
  },

  FONT: {
    SIZE_TITLE: '20px',
    SIZE_SUBTITLE: '18px',
    SIZE_NORMAL: '15px',
    SIZE_SMALL: '13px',
    SIZE_TINY: '11px',
    SIZE_ICON_LARGE: '42px',
    SIZE_ICON_MEDIUM: '36px',
    SIZE_ICON_SMALL: '28px',
    FAMILY_CN: 'Noto Sans SC',
    FAMILY_EN: 'Arial'
  },

  LAYOUT: {
    MARGIN_SMALL: 15,
    MARGIN_MEDIUM: 50,
    MARGIN_LARGE: 80,
    PADDING_SMALL: 10,
    PADDING_MEDIUM: 20,
    CARD_WIDTH: 200,
    CARD_HEIGHT: 180,
    CARD_SPACING: 70,
    PARTICLE_COUNT: 15,
    PARTICLE_SIZE_MIN: 1,
    PARTICLE_SIZE_MAX: 2,
    GRID_SPACING: 50,
    GLOW_RADIUS_BASE: 150,
    GLOW_RADIUS_STEP: 80
  },

  GAME: {
    MAX_TEAM_SIZE: 3,
    INITIAL_COINS: 10000,
    SAVE_DELAY: 100
  },

  DEPTH: {
    BACKGROUND: 0,
    CONTENT: 1,
    NAV: 10,
    MODAL_OVERLAY: 1000,
    MODAL_CONTENT: 1001,
    MODAL_UI: 1002
  },

  // 芯片卡品质体系 (equipment.json 的 quality 字段使用此套命名)
  // 随从卡品质体系见 MinionConfig.js 的 Rarity: common / rare / epic / legendary
  // 品质对照映射:
  //   芯片 (CHIP_QUALITY)       |  随从 (MinionConfig.Rarity)  |  等级
  //   --------------------------|------------------------------|------
  //   N                         |  common                      |  1星
  //   R                         |  rare                        |  2星
  //   SR                        |  epic                        |  3星
  //   SSR                       |  legendary                   |  4星
  //   SSR+                      |  (无对应)                    |  5星
  EQUIPMENT_QUALITY: {
    N: { color: '#888888', textColor: '#888888', glow: 0.2, name: '普通' },
    R: { color: '#4a90d9', textColor: '#4a90d9', glow: 0.35, name: '稀有' },
    SR: { color: '#9b59b6', textColor: '#9b59b6', glow: 0.5, name: '史诗' },
    SSR: { color: '#f39c12', textColor: '#f39c12', glow: 0.7, name: '传说' },
    'SSR+': { color: '#e74c3c', textColor: '#e74c3c', glow: 1.0, name: '神话' }
  },

  QUALITY_CONFIG: {
    common: { name: '普通', nameEn: 'Common', color: '#aaaaaa', textColor: '#cccccc', glowColor: 0x666666 },
    rare: { name: '稀有', nameEn: 'Rare', color: '#4488ff', textColor: '#6699ff', glowColor: 0x2266dd },
    epic: { name: '史诗', nameEn: 'Epic', color: '#aa44ff', textColor: '#cc66ff', glowColor: 0x8822dd },
    legendary: { name: '传说', nameEn: 'Legendary', color: '#ff8800', textColor: '#ffaa33', glowColor: 0xdd6600 },
    N: { name: '普通', nameEn: 'N', color: '#aaaaaa', textColor: '#cccccc', glowColor: 0x666666 },
    R: { name: '稀有', nameEn: 'R', color: '#4488ff', textColor: '#6699ff', glowColor: 0x2266dd },
    SR: { name: '精良', nameEn: 'SR', color: '#aa44ff', textColor: '#cc66ff', glowColor: 0x8822dd },
    SSR: { name: '史诗', nameEn: 'SSR', color: '#ff8800', textColor: '#ffaa33', glowColor: 0xdd6600 },
    'SSR+': { name: '传说', nameEn: 'SSR+', color: '#ff2222', textColor: '#ff4444', glowColor: 0xdd0000 }
  },

  // [C17 FIX] EQUIPMENT_ 前缀统一改为 CHIP_ 前缀
  CHIP_STAR_MULTIPLIER: { 1: 1.0, 2: 1.3, 3: 1.6, 4: 2.0, 5: 2.5 },
  CHIP_SKILL_MULTIPLIER: { 1: 1.0, 2: 1.2, 3: 1.4, 4: 1.7, 5: 2.0 },
  STAR_UPGRADE_COST: { 1: 10, 2: 30, 3: 80, 4: 200 },

  // ===== 战斗场景专用 (BattleScene) =====
  // 暖色调风格，与全局霓虹风格区分
  BATTLE: {
    COLORS: {
      BG_DARK: 0x1a1815,
      BG_MID: 0x252220,
      BORDER: 0x4a4540,
      AMBER: 0xd4a574,
      SACRED: 0xa8d8a8,
      CORRUPT: 0xd8a8a8,
      TEXT_PRIMARY: '#d4ccc0',
      TEXT_SECONDARY: '#8a7a6a',
      HP_GREEN: 0x6abd6a,
      HP_RED: 0xd86a6a,
      CRIT_GOLD: '#ffd700',
      HEAL_GREEN: '#44ff88',
      SKILL_PURPLE: '#9b59b6'
    },
    FONT: {
      SIZE_FLOOR_TITLE: '20px',
      SIZE_DIMENSION: '12px',
      SIZE_ENEMY_NAME: '14px',
      SIZE_ENEMY_LEVEL: '10px',
      SIZE_ENEMY_ATK: '12px',
      SIZE_ENEMY_HP: '10px',
      SIZE_PLAYER_NAME: '11px',
      SIZE_PLAYER_LEVEL: '9px',
      SIZE_PLAYER_ATK: '10px',
      SIZE_PLAYER_HP: '8px',
      SIZE_AREA_LABEL: '12px',
      SIZE_LOG: '12px',
      SIZE_BUTTON: '12px',
      SIZE_CIRCLE_BTN: '16px',
      SIZE_CRIT_LABEL: '16px',
      SIZE_DAMAGE_NORMAL: '14px',
      SIZE_DAMAGE_CRIT: '22px',
      SIZE_DAMAGE_HEAL: '16px',
      SIZE_SKILL_NAME: '20px',
      SIZE_SKILL_DESC: '14px',
      SIZE_VICTORY: '28px',
      SIZE_DEFEAT: '24px',
      SIZE_REWARD: '14px',
      SIZE_HINT: '12px',
      SIZE_ENEMY_PORTRAIT: '40px',
      SIZE_PLAYER_PORTRAIT: '24px'
    },
    LAYOUT: {
      CARD_WIDTH: 80,
      CARD_HEIGHT: 120,
      ENEMY_CARD_WIDTH: 140,
      ENEMY_CARD_HEIGHT: 180,
      ATTACK_DURATION: 400,
      RETURN_DURATION: 300
    }
  },

  // ===== 三级货币体系 =====
  CURRENCY: {
    MYCELIUM: 'mycelium',      // 菌丝 - 基础货币
    SOURCE_CORE: 'sourceCore', // 源核 - 稀有代币
    STAR_COIN: 'starCoin'      // 星币 - 付费代币
  },

  // 初始货币
  INITIAL_CURRENCY: {
    mycelium: 5000,
    sourceCore: 100,
    starCoin: 0
  },

  // 声望系统
  REPUTATION: {
    MAX_LEVEL: 99,
    EXP_PER_BATTLE: 10,
    EXP_PER_STAGE_CLEAR: 20
  },

  // 芯片品质体系（替代 EQUIPMENT_QUALITY）
  CHIP_QUALITY: {
    N: { color: '#888888', textColor: '#888888', glow: 0.2, name: '普通', maxStar: 3, skillCount: 1 },
    R: { color: '#4a90d9', textColor: '#4a90d9', glow: 0.35, name: '稀有', maxStar: 4, skillCount: 1 },
    SR: { color: '#9b59b6', textColor: '#9b59b6', glow: 0.5, name: '精良', maxStar: 4, skillCount: 1 },
    SSR: { color: '#f39c12', textColor: '#f39c12', glow: 0.7, name: '史诗', maxStar: 5, skillCount: 2 },
    UR: { color: '#ff4444', textColor: '#ff4444', glow: 0.85, name: '传说', maxStar: 5, skillCount: 2 },
    LE: { color: '#ff00ff', textColor: '#ff00ff', glow: 1.0, name: '神话', maxStar: 5, skillCount: 3 }
  },

  // 随从卡UI常量
  MINION: {
    CARD_WIDTH: 160,
    CARD_HEIGHT: 240,
    PORTRAIT_WIDTH: 140,
    PORTRAIT_HEIGHT: 90,
    PORTRAIT_RADIUS: 4,
    HP_BAR_HEIGHT: 10,
    HP_BAR_OFFSET_X: 15,
    HP_BAR_OFFSET_Y: 0,
    SKILL_TEXT_SIZE: '10px',
    NAME_TEXT_SIZE: '13px',
    RACE_TEXT_SIZE: '10px'
  },

  // 敌人类型
  ENEMY_TYPE: {
    MUTANT: 'mutant',    // 变异生物
    LOST: 'lost'         // 失心者
  }
};

export default Const;
