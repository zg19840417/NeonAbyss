import EquipmentCard from '../entities/EquipmentCard.js';
import EquipmentSkill from '../entities/EquipmentSkill.js';

export default class EquipmentCardManager {
  constructor(gameData = {}) {
    this.ownedCards = (gameData.ownedCards || []).map(cardData => {
      if (cardData instanceof EquipmentCard) {
        return cardData;
      }
      return EquipmentCard.fromJSON(cardData);
    });

    this.equippedCardId = gameData.equippedCardId || null;
    this.equippedCard = null;
    this.shopCards = gameData.shopCards || [];

    if (this.equippedCardId) {
      this.equippedCard = this.ownedCards.find(c => c.id === this.equippedCardId) || null;
    }
  }

  addCard(card) {
    if (!(card instanceof EquipmentCard)) {
      card = new EquipmentCard(card);
    }
    if (!card.id) {
      card.id = 'equip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    this.ownedCards.push(card);
    return card;
  }

  generateRandomCard() {
    const qualities = ['N', 'N', 'N', 'R', 'R', 'SR', 'SSR', 'SSR+'];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];
    const names = {
      N: ['铁剑', '木盾', '皮甲'],
      R: ['精钢剑', '铁甲', '魔法杖'],
      SR: ['烈焰之刃', '冰霜护甲', '雷霆法杖'],
      SSR: ['龙鳞剑', '凤凰羽衣', '陨星法杖'],
      'SSR+': ['神圣之光剑', '永恒守护甲', '混沌之源杖']
    };
    const name = names[quality][Math.floor(Math.random() * 3)];
    const newCard = new EquipmentCard({
      id: 'equip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: name,
      quality: quality,
      star: 1,
      atk: Math.floor(Math.random() * 20) + 10,
      hp: Math.floor(Math.random() * 100) + 50,
      critRate: 0.1
    });
    this.addCard(newCard);
    return newCard;
  }

  getAllCards() {
    return this.ownedCards;
  }

  getCardsByQuality(quality) {
    return this.ownedCards.filter(card => card.quality === quality);
  }

  getCardsByStar(star) {
    return this.ownedCards.filter(card => card.star === star);
  }

  getCardById(cardId) {
    return this.ownedCards.find(card => card.id === cardId);
  }

  equipCard(cardId) {
    const card = this.getCardById(cardId);
    if (!card) {
      return { success: false, reason: 'card_not_found' };
    }

    this.equippedCard = card;
    this.equippedCardId = card.id;

    return { success: true, card: card };
  }

  unequipCard() {
    if (!this.equippedCard) {
      return { success: false, reason: 'no_card_equipped' };
    }

    const card = this.equippedCard;
    this.equippedCard = null;
    this.equippedCardId = null;

    return { success: true, card: card };
  }

  upgradeStar(cardId, starStoneCost) {
    const card = this.getCardById(cardId);
    if (!card) {
      return { success: false, reason: 'card_not_found' };
    }

    if (!card.canUpgradeStar()) {
      return { success: false, reason: 'max_star' };
    }

    if (starStoneCost < card.upgradeCost) {
      return { success: false, reason: 'insufficient_star_stones', required: card.upgradeCost };
    }

    const result = card.upgradeStar();
    if (result.success) {
      return {
        success: true,
        card: card,
        newStar: result.newStar,
        cost: card.upgradeCost
      };
    }

    return result;
  }

  mergeUpgrade(sourceCardId1, sourceCardId2, sourceCardId3) {
    const card1 = this.getCardById(sourceCardId1);
    const card2 = this.getCardById(sourceCardId2);
    const card3 = sourceCardId3 ? this.getCardById(sourceCardId3) : null;

    if (!card1 || !card2) {
      return { success: false, reason: 'card_not_found' };
    }

    if (card1.equipCardId !== card2.equipCardId) {
      return { success: false, reason: 'different_card_types' };
    }
    if (card3 && card1.equipCardId !== card3.equipCardId) {
      return { success: false, reason: 'different_card_types' };
    }

    if (card1.star !== card2.star) {
      return { success: false, reason: 'different_star_levels' };
    }
    if (card3 && card1.star !== card3.star) {
      return { success: false, reason: 'different_star_levels' };
    }

    if (!card1.canUpgradeStar()) {
      return { success: false, reason: 'max_star' };
    }

    this.removeCard(sourceCardId1);
    this.removeCard(sourceCardId2);
    if (sourceCardId3) {
      this.removeCard(sourceCardId3);
    }

    const newCardData = {
      ...card1.toJSON(),
      id: 'equip_card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      star: card1.star + 1
    };
    const newCard = new EquipmentCard(newCardData);
    this.ownedCards.push(newCard);

    return { success: true, newCard: newCard };
  }

  addCard(cardData) {
    let newCard;
    if (cardData instanceof EquipmentCard) {
      newCard = cardData;
    } else {
      newCard = new EquipmentCard(cardData);
    }
    this.ownedCards.push(newCard);
    return { success: true, card: newCard };
  }

  removeCard(cardId) {
    const index = this.ownedCards.findIndex(card => card.id === cardId);
    if (index === -1) {
      return { success: false, reason: 'card_not_found' };
    }

    const card = this.ownedCards[index];

    if (this.equippedCardId === cardId) {
      this.equippedCard = null;
      this.equippedCardId = null;
    }

    this.ownedCards.splice(index, 1);
    return { success: true, card: card };
  }

  getTeamStatBonuses() {
    if (!this.equippedCard) {
      return { atk: 0, hp: 0, critRate: 0, dodgeRate: 0, damageReduction: 0, lifeSteal: 0 };
    }
    return this.equippedCard.getEffectiveStats();
  }

  getActiveSkills() {
    if (!this.equippedCard) return [];
    return this.equippedCard.getUnlockedSkills();
  }

  applyEquipmentToTeam(teamMembers) {
    if (!this.equippedCard) return;

    for (const follower of teamMembers) {
      this.equippedCard.applyAuraEffects(follower);
    }

    const followerSkills = [];
    for (const follower of teamMembers) {
      if (follower.skills) {
        followerSkills.push(...follower.skills);
      }
    }
    this.equippedCard.applyModifyEffects(followerSkills);
  }

  onBattleStart(teamMembers) {
    if (!this.equippedCard) return;

    for (const follower of teamMembers) {
      this.equippedCard.applyAuraEffects(follower);
    }

    const context = { isBattleStart: true, targets: teamMembers };
    return this.equippedCard.checkTriggerSkills('battle_start', context);
  }

  onTurnEnd() {
    if (this.equippedCard) {
      this.equippedCard.onTurnEnd();
    }
  }

  checkTriggers(condition, context) {
    if (!this.equippedCard) return [];
    return this.equippedCard.checkTriggerSkills(condition, context);
  }

  getInfo() {
    return {
      totalCards: this.ownedCards.length,
      equippedCard: this.equippedCard ? this.equippedCard.toJSON() : null,
      teamStatBonuses: this.getTeamStatBonuses(),
      activeSkills: this.getActiveSkills().map(s => s.toJSON()),
      qualityBreakdown: {
        N: this.getCardsByQuality('N').length,
        R: this.getCardsByQuality('R').length,
        SR: this.getCardsByQuality('SR').length,
        SSR: this.getCardsByQuality('SSR').length,
        'SSR+': this.getCardsByQuality('SSR+').length
      }
    };
  }

  toJSON() {
    return {
      ownedCards: this.ownedCards.map(card => card.toJSON()),
      equippedCardId: this.equippedCardId
    };
  }

  save() {
    try {
      localStorage.setItem('equipmentCardManager', JSON.stringify(this.toJSON()));
    } catch (e) {
      console.warn('Failed to save equipment card manager:', e);
    }
  }

  load() {
    try {
      const saved = localStorage.getItem('equipmentCardManager');
      if (saved) {
        const data = JSON.parse(saved);
        this.ownedCards = (data.ownedCards || []).map(cardData => EquipmentCard.fromJSON(cardData));
        this.equippedCardId = data.equippedCardId || null;
        this.equippedCard = this.equippedCardId ? this.getCardById(this.equippedCardId) : null;
      }
    } catch (e) {
      console.warn('Failed to load equipment card manager:', e);
    }
  }

  static fromJSON(json) {
    return new EquipmentCardManager(json);
  }
}
