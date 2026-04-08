import MinionCardManager from './MinionCardManager.js';
import ChipCardManager from './ChipCardManager.js';
import ReputationSystem from './ReputationSystem.js';

export default class RewardManager {
  constructor() {
    this.rewardsLog = [];
  }

  distributeRewards(rewards) {
    const result = { exp: 0, mycelium: 0, sourceCore: 0, starCoin: 0, items: [] };
    if (!Array.isArray(rewards)) {
      return result;
    }

    rewards.forEach((reward) => {
      switch (reward.type) {
        case 'exp':
          result.exp += reward.amount || 0;
          this._addExp(reward.amount);
          break;
        case 'mycelium':
          result.mycelium += reward.amount || 0;
          this._addCurrency('mycelium', reward.amount);
          break;
        case 'sourceCore':
          result.sourceCore += reward.amount || 0;
          this._addCurrency('sourceCore', reward.amount);
          break;
        case 'starCoin':
          result.starCoin += reward.amount || 0;
          this._addCurrency('starCoin', reward.amount);
          break;
        case 'minionCard':
          this._grantMinionCard(reward, result);
          break;
        case 'chip':
          this._grantChip(reward, result);
          break;
        case 'shipPart':
          this._grantShipPart(reward, result);
          break;
        default:
          break;
      }
    });

    this.rewardsLog.push(result);
    return result;
  }

  _grantMinionCard(reward, result) {
    const manager = MinionCardManager.fromJSON(window.gameData?.minionCardManager || {});
    const amount = reward.amount || 1;
    const granted = [];

    for (let index = 0; index < amount; index += 1) {
      if (reward.cardId) {
        const card = manager.addCard({
          id: `minion_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          minionId: reward.cardId,
          name: reward.name || reward.cardId,
          quality: reward.quality || 'N',
          element: reward.element || null,
          race: reward.race || 'plant',
          charClass: reward.charClass || reward.profession || 'berserker',
          level: 1,
          star: 1
        });
        granted.push(card);
      } else if (reward.quality) {
        granted.push(manager.generateCardByRarity(reward.quality));
      } else {
        granted.push(manager.generateRandomCard());
      }
    }

    window.gameData.minionCardManager = manager.toJSON();
    result.items.push({
      type: 'minionCard',
      amount: granted.length,
      success: true,
      cards: granted.map((card) => ({ id: card.id, name: card.name, quality: card.quality }))
    });
  }

  _grantChip(reward, result) {
    const manager = ChipCardManager.fromJSON(window.gameData?.chipCardManager || {});
    const amount = reward.amount || 1;
    const granted = [];

    for (let index = 0; index < amount; index += 1) {
      if (reward.chipData) {
        const addResult = manager.addCard(reward.chipData);
        if (addResult.success) {
          granted.push(addResult.card);
        }
      } else {
        granted.push(manager.generateRandomCard());
      }
    }

    window.gameData.chipCardManager = manager.toJSON();
    result.items.push({
      type: 'chip',
      amount: granted.length,
      success: true,
      chips: granted.map((chip) => ({ id: chip.id, name: chip.name, quality: chip.quality }))
    });
  }

  _grantShipPart(reward, result) {
    if (!window.gameData.shipParts) {
      window.gameData.shipParts = [];
    }

    const partId = reward.id || reward.partId;
    if (!partId) {
      result.items.push({ type: 'shipPart', success: false });
      return;
    }

    if (!window.gameData.shipParts.includes(partId)) {
      window.gameData.shipParts.push(partId);
    }

    result.items.push({
      type: 'shipPart',
      id: partId,
      name: reward.name || partId,
      success: true
    });
  }

  _addExp(amount) {
    if (window.gameData?.reputation) {
      const system = ReputationSystem.fromJSON(window.gameData.reputation);
      system.addExp(amount || 0);
      window.gameData.reputation = system.toJSON();
    }
  }

  _addCurrency(type, amount) {
    if (window.gameData?.base) {
      window.gameData.base[type] = (window.gameData.base[type] || 0) + (amount || 0);
    }
  }

  getLog() {
    return this.rewardsLog;
  }

  clearLog() {
    this.rewardsLog = [];
  }
}
