import EquipmentSkill from './EquipmentSkill.js';

export default class EquipmentCard {
  constructor(data) {
    this.id = data.equipCardId || data.id || this.generateId();
    this.name = data.name;
    this.quality = data.quality || 'N';
    this.star = data.star || 1;
    this.maxStar = data.maxStar || 3;
    this.description = data.description || '';
    this.icon = data.icon || '';

    this.statBonuses = {
      atk: data.atkBonus || 0,
      hp: data.hpBonus || 0,
      critRate: data.critRateBonus || 0,
      dodgeRate: data.dodgeRateBonus || 0,
      damageReduction: data.damageReductionBonus || 0,
      lifeSteal: data.lifeStealBonus || 0
    };

    this.skills = (data.skills || []).map(skillData => {
      if (skillData instanceof EquipmentSkill) {
        return skillData;
      }
      return new EquipmentSkill(skillData);
    });

    this.upgradeCost = data.upgradeCost || 0;
  }

  generateId() {
    return 'equip_card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getEffectiveStats() {
    const starMultiplier = this.getStarMultiplier();
    const stats = {};
    for (const [key, value] of Object.entries(this.statBonuses)) {
      stats[key] = Math.floor(value * starMultiplier);
    }
    return stats;
  }

  getStarMultiplier() {
    const multipliers = { 1: 1.0, 2: 1.3, 3: 1.6, 4: 2.0, 5: 2.5 };
    return multipliers[this.star] || 1.0;
  }

  getSkillMultiplier() {
    const multipliers = { 1: 1.0, 2: 1.2, 3: 1.4, 4: 1.7, 5: 2.0 };
    return multipliers[this.star] || 1.0;
  }

  canUpgradeStar() {
    return this.star < this.maxStar;
  }

  upgradeStar() {
    if (!this.canUpgradeStar()) {
      return { success: false, reason: 'max_star' };
    }
    this.star++;
    return { success: true, newStar: this.star };
  }

  getQualityColor() {
    const colors = {
      'N': '#888888',
      'R': '#4a90d9',
      'SR': '#9b59b6',
      'SSR': '#f39c12',
      'SSR+': '#e74c3c'
    };
    return colors[this.quality] || colors['N'];
  }

  getQualityName() {
    const names = {
      'N': '普通',
      'R': '稀有',
      'SR': '史诗',
      'SSR': '传说',
      'SSR+': '神话'
    };
    return names[this.quality] || names['N'];
  }

  getStarDisplay() {
    const filled = '★'.repeat(this.star);
    const empty = '☆'.repeat(this.maxStar - this.star);
    return filled + empty;
  }

  getUnlockedSkills() {
    return this.skills.filter(skill => skill.isUnlocked(this.star));
  }

  applyAuraEffects(follower) {
    const unlockedSkills = this.getUnlockedSkills();
    const auraSkills = unlockedSkills.filter(skill => skill.type === 'aura');

    for (const skill of auraSkills) {
      skill.applyAura(follower, this);
    }
  }

  checkTriggerSkills(condition, context) {
    const unlockedSkills = this.getUnlockedSkills();
    const triggerSkills = unlockedSkills.filter(skill => skill.type === 'trigger');
    const triggeredEffects = [];

    for (const skill of triggerSkills) {
      if (skill.checkTrigger(condition, context)) {
        const effect = skill.executeTrigger(this, context);
        if (effect) {
          triggeredEffects.push(effect);
        }
      }
    }

    return triggeredEffects;
  }

  applyModifyEffects(followerSkills) {
    const unlockedSkills = this.getUnlockedSkills();
    const modifySkills = unlockedSkills.filter(skill => skill.type === 'modify');

    for (const skill of modifySkills) {
      skill.applyModify(followerSkills, this);
    }
  }

  onTurnEnd() {
    for (const skill of this.skills) {
      skill.onTurnEnd();
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      quality: this.quality,
      star: this.star,
      maxStar: this.maxStar,
      description: this.description,
      icon: this.icon,
      statBonuses: this.statBonuses,
      skills: this.skills.map(s => s.toJSON()),
      upgradeCost: this.upgradeCost
    };
  }

  static fromJSON(json) {
    return new EquipmentCard(json);
  }
}
