export const Const = {
  SCENES: {
    BOOT: 'BootScene',
    PRELOAD: 'PreloadScene',
    MAIN_MENU: 'MainMenuScene',
    BASE: 'BaseScene',
    DUNGEON: 'DungeonScene',
    BATTLE: 'BattleScene',
    WILD_STAGE: 'WildStageScene',
    ZONE_EXPLORE: 'ZoneExploreScene',
  },

  COLORS: {
    BG_DARK: 0x0a0a14,
    BG_MID: 0x0d0d1d,
    BG_LIGHT: 0x080812,
    BG_HOVER: 0x1a1a2e,
    BG_DANGER: 0x330000,
    BG_CARD: 0x12121f,
    BG_INPUT: 0x0b0f18,
    BG_PANEL: 0x0f1522,
    BG_DEEP: 0x0d111d,
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
    OVERLAY: 0x000000,
    TEXT_LIGHT: '#f2f4f8',
    ACCENT_BLUE: 0x4dabf7,
    ACCENT_ORANGE: 0xff922b,
    ACCENT_GREEN: 0x20c997,
    ACCENT_PINK: 0xff6bcb,
    ACCENT_RED: 0xff6b6b,
    ACCENT_YELLOW: 0xf7b801,
    ACCENT_PURPLE: 0x845ef7,
    ACCENT_GREEN_BTN: 0x51cf66,
    ACCENT_BLUE_BTN: 0x3d8bfd,
  },

  TEXT_COLORS: {
    PRIMARY: '#e8e6e3',
    SECONDARY: '#8a8a9a',
    DARK: '#0c0e1a',
    GOLD: '#c9a84c',
    GOLD_LIGHT: '#e8d48b',
    CYAN: '#5b8dd9',
    PINK: '#d4728a',
    PURPLE: '#8b6cc7',
    MAGENTA: '#9b6cc7',
    YELLOW: '#f7b801',
    RED: '#ef4444',
    DANGER: '#ef4444',
    SUCCESS: '#22c55e',
    INACTIVE: '#4a4a6a'
  },

  ALPHA: {
    OVERLAY: 0.85,
    GRID: 0.015,
    DECOR: 0.2,
    GLOW: 0.3,
    PARTICLE_MIN: 0.1,
    PARTICLE_MAX: 0.3
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
    MODAL_RADIUS: 0,
    BUTTON_HEIGHT: 28,
    BUTTON_RADIUS: 4,
    CARD_RADIUS: 0,
    CARD_RADIUS_SMALL: 0
  },

  FONT: {
    SIZE_TINY: '9px',
    SIZE_MINI: '10px',
    SIZE_MICRO: '11px',
    SIZE_SMALL: '12px',
    SIZE_BODY: '13px',
    SIZE_NORMAL: '14px',
    SIZE_MEDIUM: '16px',
    SIZE_SUBTITLE: '18px',
    SIZE_TITLE: '20px',
    SIZE_ICON_LARGE: '42px',
    SIZE_ICON_MEDIUM: '28px',
    SIZE_ICON_SMALL: '24px',
    FAMILY_CN: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
    FAMILY_EN: 'Arial, sans-serif',
  },

  LAYOUT: {
    // 推荐：使用 ResponsiveUtils.getInstance().scale() 获取动态缩放因子
    // 以下为设计基准值（375x812），仅用于无 ResponsiveUtils 时的回退
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
  //   UR                        |  (无对应)                    |  5星
  //   LE                        |  (无对应)                    |  6星

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
      CARD_WIDTH: 106,
      CARD_HEIGHT: 159,
      ENEMY_CARD_WIDTH: 106,
      ENEMY_CARD_HEIGHT: 159,
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
    mycelium: 60000,
    sourceCore: 60000,
    starCoin: 60000
  },

  // 声望系统
  REPUTATION: {
    MAX_LEVEL: 99,
    EXP_PER_BATTLE: 10,
    EXP_PER_STAGE_CLEAR: 20
  },

  // 芯片品质体系
  CHIP_QUALITY: {
    N: { color: '#8a8a8a', textColor: '#8a8a8a', glow: 0, name: '普通', maxStar: 3, skillCount: 1 },
    R: { color: '#5b8dd9', textColor: '#5b8dd9', glow: 0.15, name: '稀有', maxStar: 4, skillCount: 1 },
    SR: { color: '#a78bfa', textColor: '#a78bfa', glow: 0.25, name: '精良', maxStar: 4, skillCount: 1 },
    SSR: { color: '#f59e0b', textColor: '#f59e0b', glow: 0.4, name: '史诗', maxStar: 5, skillCount: 2 },
    UR: { color: '#ef4444', textColor: '#ef4444', glow: 0.55, name: '传说', maxStar: 5, skillCount: 2 },
    LE: { color: '#d946ef', textColor: '#d946ef', glow: 0.7, name: '神话', maxStar: 5, skillCount: 3 }
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
