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
   * @param {Array} rewards - [{type, amount, id?, cardId?, quality?}] 奖励数组
   * @returns {Object} 分发结果汇总
   */
  distributeRewards(rewards) {
    const result = { exp: 0, mycelium: 0, sourceCore: 0, starCoin: 0, items: [] };
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
        case 'starCoin':
          result.starCoin += r.amount || 0;
          this._addCurrency('starCoin', r.amount);
          break;
        case 'minionCard':
          this._grantMinionCard(r, result);
          break;
        case 'chip':
          this._grantChip(r, result);
          break;
        case 'shipPart':
          this._grantShipPart(r, result);
          break;
      }
    });

    this.rewardsLog.push(result);
    return result;
  }

  /**
   * 发放随从卡
   * @param {Object} r - {type, cardId?, quality?, amount?}
   * @param {Object} result - 结果汇总对象
   */
  _grantMinionCard(r, result) {
    const manager = window.gameData?.minionCardManager;
    if (!manager) {
      console.warn('[RewardManager] minionCardManager未初始化，无法发放随从卡');
      result.items.push({ type: 'minionCard', amount: r.amount || 1, success: false });
      return;
    }

    const amount = r.amount || 1;
    const granted = [];

    for (let i = 0; i < amount; i++) {
      if (r.cardId) {
        // 指定cardId发放
        const card = manager.addCard({
          id: 'minion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          minionId: r.cardId,
          name: r.name || r.cardId,
          quality: r.quality || 'N',
          element: r.element || null,
          race: r.race || 'plant',
          charClass: r.charClass || r.profession || 'berserker',
          level: 1,
          star: 1
        });
        granted.push(card);
      } else if (r.quality) {
        // 按品质随机发放
        const card = manager.generateCardByRarity(r.quality);
        granted.push(card);
      } else {
        // 完全随机
        const card = manager.generateRandomCard();
        granted.push(card);
      }
    }

    result.items.push({
      type: 'minionCard',
      amount: granted.length,
      success: true,
      cards: granted.map(c => ({ id: c.id, name: c.name, quality: c.quality }))
    });
  }

  /**
   * 发放芯片
   * @param {Object} r - {type, quality?, amount?}
   * @param {Object} result - 结果汇总对象
   */
  _grantChip(r, result) {
    const manager = window.gameData?.chipCardManager;
    if (!manager) {
      console.warn('[RewardManager] chipCardManager未初始化，无法发放芯片');
      result.items.push({ type: 'chip', amount: r.amount || 1, success: false });
      return;
    }

    const amount = r.amount || 1;
    const granted = [];

    for (let i = 0; i < amount; i++) {
      if (r.chipData) {
        // 指定芯片数据
        const addResult = manager.addCard(r.chipData);
        if (addResult.success) granted.push(addResult.card);
      } else {
        // 随机生成
        const card = manager.generateRandomCard();
        granted.push(card);
      }
    }

    result.items.push({
      type: 'chip',
      amount: granted.length,
      success: true,
      chips: granted.map(c => ({ id: c.id, name: c.name, quality: c.quality }))
    });
  }

  /**
   * 记录方舟部件收集
   * @param {Object} r - {type, id, name?}
   * @param {Object} result - 结果汇总对象
   */
  _grantShipPart(r, result) {
    if (!window.gameData) {
      console.warn('[RewardManager] gameData未初始化，无法记录方舟部件');
      result.items.push({ type: 'shipPart', id: r.id, success: false });
      return;
    }

    // 初始化shipParts集合
    if (!window.gameData.shipParts) {
      window.gameData.shipParts = [];
    }

    const partId = r.id || r.partId;
    if (!partId) {
      console.warn('[RewardManager] shipPart缺少id');
      result.items.push({ type: 'shipPart', success: false });
      return;
    }

    // 检查是否已收集
    if (!window.gameData.shipParts.includes(partId)) {
      window.gameData.shipParts.push(partId);
    }

    result.items.push({
      type: 'shipPart',
      id: partId,
      name: r.name || partId,
      success: true
    });
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
