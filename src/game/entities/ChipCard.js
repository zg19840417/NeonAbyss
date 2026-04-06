export default class ChipCard {
  constructor(data = {}) {
    this.id = data.id || 'chip_' + Date.now();
    this.chipId = data.chipId || null;
    this.name = data.name || '未知芯片';
    this.nameEn = data.nameEn || 'Unknown Chip';
    this.quality = data.quality || 'N';  // N/R/SR/SSR/UR/LE
    this.star = data.star || 1;
    this.maxStar = data.maxStar || this.getDefaultMaxStar();
    this.description = data.description || '';
    this.icon = data.icon || '🔧';

    // 百分比属性（独立配置，不写死）
    this.hpPercent = data.hpPercent || 0;
    this.atkPercent = data.atkPercent || 0;

    // 目标限制
    this.targetProfession = data.targetProfession || null;  // null=通用, tank/dps/support
    this.targetElement = data.targetElement || null;        // null=通用, water/fire/wind/light/dark
    this.targetRace = data.targetRace || null;              // null=通用, plant/animal/mech/energy/hybrid

    // 技能列表
    this.skills = data.skills || [];

    // 升级费用
    this.upgradeCost = data.upgradeCost || this.calculateUpgradeCost();
  }

  getDefaultMaxStar() {
    const maxStarMap = { N: 3, R: 4, SR: 4, SSR: 5, UR: 5, LE: 5 };
    return maxStarMap[this.quality] || 3;
  }

  calculateUpgradeCost() {
    const costs = { 1: 10, 2: 30, 3: 80, 4: 200 };
    return costs[this.star] || 200;
  }

  getStarMultiplier() {
    const multipliers = { 1: 1.0, 2: 1.3, 3: 1.6, 4: 2.0, 5: 2.5 };
    return multipliers[this.star] || 1.0;
  }

  getSkillMultiplier() {
    const multipliers = { 1: 1.0, 2: 1.2, 3: 1.4, 4: 1.7, 5: 2.0 };
    return multipliers[this.star] || 1.0;
  }

  getEffectiveStats() {
    const starMult = this.getStarMultiplier();
    return {
      hpPercent: this.hpPercent * starMult,
      atkPercent: this.atkPercent * starMult
    };
  }

  getUnlockedSkills() {
    // 根据品质决定可解锁技能数：N/R/SR=1, SSR/UR=2, LE=3
    const skillCountMap = { N: 1, R: 1, SR: 1, SSR: 2, UR: 2, LE: 3 };
    const maxSkills = skillCountMap[this.quality] || 1;
    return this.skills.slice(0, maxSkills).map(s => ({
      ...s,
      value: s.value ? s.value * this.getSkillMultiplier() : s.value
    }));
  }

  canUpgradeStar() {
    return this.star < this.maxStar;
  }

  upgradeStar() {
    if (!this.canUpgradeStar()) {
      return { success: false, reason: 'max_star' };
    }
    this.star++;
    this.upgradeCost = this.calculateUpgradeCost();
    return { success: true, newStar: this.star };
  }

  isSuitableFor(minion) {
    if (this.targetProfession && minion.profession && this.targetProfession !== minion.profession && this.targetProfession !== 'all') return false;
    if (this.targetElement && minion.element && this.targetElement !== minion.element && this.targetElement !== 'all') return false;
    if (this.targetRace && minion.race && this.targetRace !== minion.race && this.targetRace !== 'all') return false;
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      chipId: this.chipId,
      name: this.name,
      nameEn: this.nameEn,
      quality: this.quality,
      star: this.star,
      maxStar: this.maxStar,
      description: this.description,
      icon: this.icon,
      hpPercent: this.hpPercent,
      atkPercent: this.atkPercent,
      targetProfession: this.targetProfession,
      targetElement: this.targetElement,
      targetRace: this.targetRace,
      skills: this.skills,
      upgradeCost: this.upgradeCost
    };
  }

  static fromJSON(json) {
    return new ChipCard(json);
  }
}
