import ChipCardManager from './ChipCardManager.js';
import ReputationSystem from './ReputationSystem.js';
import FusionGirlManager from './FusionGirlManager.js';

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
        case 'chip':
          this._grantChip(reward, result);
          break;
        case 'shipPart':
          this._grantShipPart(reward, result);
          break;
        case 'portraitFragment':
          this._grantPortraitFragment(reward, result);
          break;
        case 'unlockFusionGirl':
          this._unlockFusionGirl(reward, result);
          break;
        case 'elementPoint':
          this._grantElementPoint(reward, result);
          break;
        default:
          break;
      }
    });

    this.rewardsLog.push(result);
    return result;
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

  _grantPortraitFragment(reward, result) {
    const manager = FusionGirlManager.fromJSON(window.gameData?.fusionGirlManager || {});
    const amount = reward.amount || 1;
    const fragmentData = {
      id: reward.fragmentId || reward.id,
      fusionGirlId: reward.fusionGirlId,
      portraitSetId: reward.portraitSetId,
      requiredCount: reward.requiredCount,
      bonusType: reward.bonusType,
      bonusValue: reward.bonusValue,
      overflowElement: reward.overflowElement
    };

    const applyResult = manager.addFragment(fragmentData, amount);
    if (!applyResult.success) {
      result.items.push({
        type: 'portraitFragment',
        success: false,
        reason: applyResult.reason
      });
      return;
    }

    window.gameData.fusionGirlManager = manager.toJSON();

    if (applyResult.overflowCount > 0) {
      const element = applyResult.overflowElement || 'water';
      if (!window.gameData.elementPoints) {
        window.gameData.elementPoints = { water: 0, fire: 0, wind: 0 };
      }
      window.gameData.elementPoints[element] = (window.gameData.elementPoints[element] || 0) + applyResult.overflowCount;
    }

    result.items.push({
      type: 'portraitFragment',
      success: true,
      fusionGirlId: reward.fusionGirlId,
      portraitSetId: reward.portraitSetId,
      fragmentId: fragmentData.id,
      amount,
      effectiveAdded: applyResult.effectiveAdded,
      overflowCount: applyResult.overflowCount,
      completedSet: applyResult.completedSet,
      gainedUpgradeOpportunity: applyResult.gainedUpgradeOpportunity
    });
  }

  _unlockFusionGirl(reward, result) {
    const fusionGirlId = reward.fusionGirlId || reward.id;
    if (!fusionGirlId) {
      result.items.push({ type: 'unlockFusionGirl', success: false });
      return;
    }

    const manager = FusionGirlManager.fromJSON(window.gameData?.fusionGirlManager || {});
    const girl = manager.unlockGirl(fusionGirlId, { unlockSummon: reward.unlockSummon === true });
    window.gameData.fusionGirlManager = manager.toJSON();

    result.items.push({
      type: 'unlockFusionGirl',
      success: true,
      fusionGirlId,
      name: reward.name || girl?.name || fusionGirlId,
      unlockSummon: reward.unlockSummon === true
    });
  }

  _grantElementPoint(reward, result) {
    const element = reward.element || reward.pointType;
    const amount = reward.amount || 0;

    if (!element || amount <= 0) {
      result.items.push({ type: 'elementPoint', success: false });
      return;
    }

    if (!window.gameData.elementPoints) {
      window.gameData.elementPoints = { water: 0, fire: 0, wind: 0 };
    }

    window.gameData.elementPoints[element] = (window.gameData.elementPoints[element] || 0) + amount;
    result.items.push({
      type: 'elementPoint',
      success: true,
      element,
      amount
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
