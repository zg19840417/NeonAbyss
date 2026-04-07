/**
 * 奖励分发系统
 * 统一处理 exp/mycelium/sourceCore/minionCard/chip/shipPart 等奖励
 */
export default class RewardManager {
  constructor() {
    this.rewardsLog = [];
  }

  /**
   * 分发奖励
   * @param {Array} rewards - [{type, amount, id?}] 奖励数组
   * @returns {Object} 分发结果汇总
   */
  distributeRewards(rewards) {
    const result = { exp: 0, mycelium: 0, sourceCore: 0, items: [] };
    if (!Array.isArray(rewards)) return result;

    rewards.forEach(r => {
      switch (r.type) {
        case 'exp':
          result.exp += r.amount || 0;
          this._addExp(r.amount);
          break;
        case 'mycelium':
          result.mycelium += r.amount || 0;
          this._addCurrency('mycelium', r.amount);
          break;
        case 'sourceCore':
          result.sourceCore += r.amount || 0;
          this._addCurrency('sourceCore', r.amount);
          break;
        case 'minionCard':
          result.items.push({ type: 'minionCard', amount: r.amount || 1 });
          // TODO: 实际添加随从卡到背包
          break;
        case 'chip':
          result.items.push({ type: 'chip', amount: r.amount || 1 });
          // TODO: 实际添加芯片到背包
          break;
        case 'shipPart':
          result.items.push({ type: 'shipPart', id: r.id, name: r.name || r.id });
          // TODO: 记录方舟部件收集
          break;
      }
    });

    this.rewardsLog.push(result);
    return result;
  }

  _addExp(amount) {
    if (window.gameData?.reputationSystem) {
      window.gameData.reputationSystem.addExp(amount || 0);
    }
  }

  _addCurrency(type, amount) {
    if (window.gameData?.base) {
      const current = window.gameData.base[type] || 0;
      window.gameData.base[type] = current + (amount || 0);
    }
  }

  getLog() {
    return this.rewardsLog;
  }

  clearLog() {
    this.rewardsLog = [];
  }
}
