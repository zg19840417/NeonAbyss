export default class ReputationSystem {
  constructor(gameData = {}) {
    this.level = gameData.level || 1;
    this.exp = gameData.exp || 0;
    this.totalExp = gameData.totalExp || 0;
  }

  getExpRequired() {
    // 每级需要递增的经验值
    return Math.floor(100 * Math.pow(1.2, this.level - 1));
  }

  addExp(amount) {
    this.exp += amount;
    this.totalExp += amount;
    const levelUps = [];

    while (this.exp >= this.getExpRequired() && this.level < 99) {
      this.exp -= this.getExpRequired();
      this.level++;
      levelUps.push(this.level);
    }

    return {
      expGained: amount,
      currentExp: this.exp,
      expRequired: this.getExpRequired(),
      level: this.level,
      levelUps: levelUps
    };
  }

  canUnlock(contentLevel) {
    return this.level >= contentLevel;
  }

  getProgress() {
    return {
      level: this.level,
      exp: this.exp,
      expRequired: this.getExpRequired(),
      percent: Math.floor((this.exp / this.getExpRequired()) * 100)
    };
  }

  toJSON() {
    return {
      level: this.level,
      exp: this.exp,
      totalExp: this.totalExp
    };
  }

  save() {
    try {
      localStorage.setItem('reputationSystem', JSON.stringify(this.toJSON()));
    } catch (e) {
      console.warn('Failed to save reputation system:', e);
    }
  }

  load() {
    try {
      const saved = localStorage.getItem('reputationSystem');
      if (saved) {
        const data = JSON.parse(saved);
        this.level = data.level || 1;
        this.exp = data.exp || 0;
        this.totalExp = data.totalExp || 0;
      }
    } catch (e) {
      console.warn('Failed to load reputation system:', e);
    }
  }

  static fromJSON(json) {
    return new ReputationSystem(json);
  }
}
