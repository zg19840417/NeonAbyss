import MinionCard from '../entities/MinionCard.js';
import minionsData from '../data/minions.json';
import Const from '../data/Const.js';

export default class MinionCardManager {
  constructor(data = {}) {
    this.ownedCards = (data.ownedCards || []).map(c => {
      if (c instanceof MinionCard) return c;
      return MinionCard.fromJSON(c);
    });
    this.deployedCards = data.deployedCards || [];
    this.maxDeploy = data.maxDeploy || 3;
    this.shopMinions = data.shopMinions || [];
  }

  initManager() {
    if (this.ownedCards.length === 0) {
      for (let i = 0; i < 3; i++) {
        this.generateRandomCard();
      }
    }
  }

  getAllCards() {
    return this.ownedCards;
  }

  getDeployedCards() {
    return this.deployedCards
      .map(id => this.ownedCards.find(c => c.id === id))
      .filter(c => c);
  }

  getDeployedCardById(id) {
    return this.ownedCards.find(c => c.id === id);
  }

  getAvailableCards() {
    const deployedIds = new Set(this.deployedCards);
    return this.ownedCards.filter(c => !deployedIds.has(c.id));
  }

  canDeploy() {
    return this.deployedCards.length < this.maxDeploy;
  }

  deployCard(cardId) {
    const card = this.ownedCards.find(c => c.id === cardId);
    if (!card) {
      return { success: false, reason: 'card_not_found' };
    }
    if (this.deployedCards.includes(cardId)) {
      return { success: false, reason: 'already_deployed' };
    }
    if (!this.canDeploy()) {
      return { success: false, reason: 'max_deploy_reached' };
    }
    this.deployedCards.push(cardId);
    return { success: true, card };
  }

  undeployCard(cardId) {
    const index = this.deployedCards.indexOf(cardId);
    if (index === -1) {
      return { success: false, reason: 'not_deployed' };
    }
    this.deployedCards.splice(index, 1);
    return { success: true };
  }

  addCard(card) {
    if (!card.id) {
      card.id = 'minion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    if (!(card instanceof MinionCard)) {
      card = new MinionCard(card);
    }
    this.ownedCards.push(card);
    return card;
  }

  removeCard(cardId) {
    const index = this.ownedCards.findIndex(c => c.id === cardId);
    if (index === -1) {
      return { success: false, reason: 'card_not_found' };
    }
    this.undeployCard(cardId);
    this.ownedCards.splice(index, 1);
    return { success: true };
  }

  getCardById(cardId) {
    return this.ownedCards.find(c => c.id === cardId);
  }

  getCardsByRarity(rarity) {
    return this.ownedCards.filter(c => c.rarity === rarity);
  }

  getCardsByElement(element) {
    return this.ownedCards.filter(c => c.element === element);
  }

  getCardsByRace(race) {
    return this.ownedCards.filter(c => c.race === race);
  }

  generateRandomCard() {
    const randomIndex = Math.floor(Math.random() * minionsData.length);
    const template = minionsData[randomIndex];
    const newCard = new MinionCard({
      ...template,
      id: 'minion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    });
    this.addCard(newCard);
    return newCard;
  }

  generateShopCard() {
    const randomIndex = Math.floor(Math.random() * minionsData.length);
    const template = minionsData[randomIndex];
    const newCard = new MinionCard({
      ...template,
      id: 'minion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    });
    return newCard;
  }

  generateCardByRarity(rarity) {
    const templates = minionsData.filter(m => {
      const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
      return rarityOrder.indexOf(m.rarity) <= rarityOrder.indexOf(rarity);
    });
    if (templates.length === 0) return this.generateRandomCard();

    const template = templates[Math.floor(Math.random() * templates.length)];
    const newCard = new MinionCard({
      ...template,
      id: 'minion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    });
    this.addCard(newCard);
    return newCard;
  }

  starUpgradeCost(star) {
    return Const.STAR_UPGRADE_COST[star] || 0;
  }

  canStarUpgrade(card) {
    if (card.star >= 5) return false;
    return true;
  }

  starUpgrade(cardId) {
    const card = this.getCardById(cardId);
    if (!card) {
      return { success: false, reason: 'card_not_found' };
    }
    if (!this.canStarUpgrade(card)) {
      return { success: false, reason: 'max_star_reached' };
    }
    const cost = this.starUpgradeCost(card.star);
    if ((window.gameData.minionStones || 0) < cost) {
      return { success: false, reason: 'not_enough_stones', required: cost };
    }
    window.gameData.minionStones = (window.gameData.minionStones || 0) - cost;
    card.star = (card.star || 0) + 1;
    return { success: true, card, newStar: card.star };
  }

  canMergeUpgrade(card) {
    if (card.star >= 5) return false;
    const sameCards = this.ownedCards.filter(c =>
      c.id !== card.id &&
      c.minionId === card.minionId &&
      c.star === card.star
    );
    return sameCards.length >= 2;
  }

  getMergeCandidates(card) {
    return this.ownedCards.filter(c =>
      c.id !== card.id &&
      c.minionId === card.minionId &&
      c.star === card.star
    ).slice(0, 2);
  }

  mergeUpgrade(sourceId1, sourceId2, targetId) {
    const target = this.getCardById(targetId);
    const source1 = this.getCardById(sourceId1);
    const source2 = this.getCardById(sourceId2);

    if (!target || !source1 || !source2) {
      return { success: false, reason: 'card_not_found' };
    }
    if (target.star >= 5) {
      return { success: false, reason: 'max_star_reached' };
    }
    if (target.id === source1.id || target.id === source2.id ||
        source1.id === source2.id) {
      return { success: false, reason: 'same_card' };
    }
    if (source1.star !== source2.star || source1.star !== target.star) {
      return { success: false, reason: 'star_mismatch' };
    }
    if (source1.minionId !== target.minionId || source2.minionId !== target.minionId) {
      return { success: false, reason: 'type_mismatch' };
    }

    this.undeployCard(source1.id);
    this.undeployCard(source2.id);
    this.removeCard(source1.id);
    this.removeCard(source2.id);
    target.star = (target.star || 0) + 1;

    return { success: true, card: target, newStar: target.star };
  }

  toJSON() {
    return {
      ownedCards: this.ownedCards.map(c => c instanceof MinionCard ? c.toJSON() : c),
      deployedCards: [...this.deployedCards],
      maxDeploy: this.maxDeploy
    };
  }

  static fromJSON(data) {
    return new MinionCardManager(data || {});
  }
}
