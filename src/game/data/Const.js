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
    BUTTON_PRIMARY: 0x00ccff,
    BUTTON_HOVER: 0x33ddff,
    BUTTON_SECONDARY: 0x2a2a4a,
    BUTTON_DANGER_BORDER: 0xff3333,
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

  QUALITY_CONFIG: {
    N: { name: '普通', nameEn: 'N', color: '#aaaaaa', textColor: '#cccccc', glowColor: 0x666666 },
    R: { name: '稀有', nameEn: 'R', color: '#4488ff', textColor: '#6699ff', glowColor: 0x2266dd },
    SR: { name: '精良', nameEn: 'SR', color: '#aa44ff', textColor: '#cc66ff', glowColor: 0x8822dd },
    SSR: { name: '史诗', nameEn: 'SSR', color: '#ff8800', textColor: '#ffaa33', glowColor: 0xdd6600 },
    UR: { name: '传说', nameEn: 'UR', color: '#ff6b35', textColor: '#ff8c5a', glowColor: 0xdd4f1a },
    LE: { name: '神话', nameEn: 'LE', color: '#ff00ff', textColor: '#ff44ff', glowColor: 0xdd00dd }
  },

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
  }
};

export default Const;
