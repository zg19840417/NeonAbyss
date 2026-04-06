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

  EQUIPMENT_QUALITY: {
    N: { color: '#888888', textColor: '#888888', glow: 0.2, name: '普通' },
    R: { color: '#4a90d9', textColor: '#4a90d9', glow: 0.35, name: '稀有' },
    SR: { color: '#9b59b6', textColor: '#9b59b6', glow: 0.5, name: '史诗' },
    SSR: { color: '#f39c12', textColor: '#f39c12', glow: 0.7, name: '传说' },
    'SSR+': { color: '#e74c3c', textColor: '#e74c3c', glow: 1.0, name: '神话' }
  },

  EQUIPMENT_STAR_MULTIPLIER: { 1: 1.0, 2: 1.3, 3: 1.6, 4: 2.0, 5: 2.5 },
  EQUIPMENT_SKILL_MULTIPLIER: { 1: 1.0, 2: 1.2, 3: 1.4, 4: 1.7, 5: 2.0 },
  STAR_UPGRADE_COST: { 1: 10, 2: 30, 3: 80, 4: 200 }
};

export default Const;
