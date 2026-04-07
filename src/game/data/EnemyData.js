import enemiesData from '../../../assets/data/json/enemies.json';
import bossesData from '../../../assets/data/json/bosses.json';

// EnemyId映射表: E001~E020 → E_M001~E_M010, E_L001~E_L010
const ENEMY_ID_MAP = {
  'E001': 'E_M001', 'E002': 'E_M002', 'E003': 'E_M003', 'E004': 'E_M004', 'E005': 'E_M005',
  'E006': 'E_M006', 'E007': 'E_M007', 'E008': 'E_M008', 'E009': 'E_M009', 'E010': 'E_M010',
  'E011': 'E_L001', 'E012': 'E_L002', 'E013': 'E_L003', 'E014': 'E_L004', 'E015': 'E_L005',
  'E016': 'E_L006', 'E017': 'E_L007', 'E018': 'E_L008', 'E019': 'E_L009', 'E020': 'E_L010'
};

// 等级缩放公式
const HP_SCALE = 1.12;
const ATK_SCALE = 1.10;
const SPD_SCALE = 1.02;

class EnemyData {
  constructor() {
    this._enemies = {};
    this._bosses = {};
    this._loadEnemies();
    this._loadBosses();
  }

  _loadEnemies() {
    if (!Array.isArray(enemiesData)) return;
    enemiesData.forEach(e => { this._enemies[e.enemyId] = e; });
  }

  _loadBosses() {
    if (!Array.isArray(bossesData)) return;
    bossesData.forEach(b => { this._bosses[b.bossId] = b; });
  }

  getEnemyById(enemyId) {
    // 先尝试直接查找，再通过映射表
    return this._enemies[enemyId] || this._enemies[ENEMY_ID_MAP[enemyId]] || null;
  }

  getBossById(bossId) {
    return this._bosses[bossId] || null;
  }

  // 根据引用和等级生成战斗用敌人数据
  resolveEnemyRef(enemyId, level = 1) {
    const base = this.getEnemyById(enemyId);
    if (!base) return null;
    const lvl = Math.max(1, level);
    return {
      ...base,
      level: lvl,
      hp: Math.floor(base.baseHp * Math.pow(HP_SCALE, lvl - 1)),
      atk: Math.floor(base.baseAtk * Math.pow(ATK_SCALE, lvl - 1)),
      spd: Math.floor(base.baseSpd * Math.pow(SPD_SCALE, lvl - 1)),
      currentHp: Math.floor(base.baseHp * Math.pow(HP_SCALE, lvl - 1)),
      isDead: false,
      isBoss: false
    };
  }

  resolveBossRef(bossId, level = 1) {
    const base = this.getBossById(bossId);
    if (!base) return null;
    const lvl = Math.max(1, level);
    return {
      ...base,
      enemyId: base.bossId,
      name: base.name,
      nameEn: base.nameEn,
      type: base.type,
      element: base.element,
      level: lvl,
      hp: Math.floor(base.baseHp * Math.pow(HP_SCALE, lvl - 1)),
      atk: Math.floor(base.baseAtk * Math.pow(ATK_SCALE, lvl - 1)),
      spd: Math.floor(base.baseSpd * Math.pow(SPD_SCALE, lvl - 1)),
      currentHp: Math.floor(base.baseHp * Math.pow(HP_SCALE, lvl - 1)),
      isDead: false,
      isBoss: true,
      skills: base.skills || [],
      phases: base.phases || 1,
      shipPartId: base.shipPartId,
      shipPartName: base.shipPartName,
      preStory: base.preStory || ''
    };
  }

  getEnemiesByType(type) {
    return Object.values(this._enemies).filter(e => e.type === type);
  }
}

export default new EnemyData();
