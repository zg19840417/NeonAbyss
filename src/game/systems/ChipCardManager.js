import ChipCard from '../entities/ChipCard.js';

export default class ChipCardManager {
  constructor(gameData = {}) {
    this.ownedCards = (gameData.ownedCards || []).map(cardData => {
      if (cardData instanceof ChipCard) {
        return cardData;
      }
      return ChipCard.fromJSON(cardData);
    });

    this.equippedCardId = gameData.equippedCardId || null;
    this.equippedCard = null;
    this.shopCards = gameData.shopCards || [];

    if (this.equippedCardId) {
      this.equippedCard = this.ownedCards.find(c => c.id === this.equippedCardId) || null;
    }
  }

  _createRandomCard() {
    const qualities = ['N', 'N', 'N', 'R', 'R', 'SR', 'SSR', 'UR', 'LE'];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];
    const names = {
      N: ['铁片芯片', '铜线芯片', '废料芯片'],
      R: ['精钢芯片', '合金芯片', '光学芯片'],
      SR: ['烈焰芯片', '冰霜芯片', '雷鸣芯片'],
      SSR: ['龙鳞芯片', '凤羽芯片', '陨星芯片'],
      UR: ['虚空芯片', '深渊芯片', '永恒芯片'],
      LE: ['创世芯片', '终焉芯片', '混沌芯片']
    };
    const name = names[quality]?.[Math.floor(Math.random() * 3)] || '未知芯片';
    return new ChipCard({
      id: 'chip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: name,
      quality: quality,
      star: 1,
      hpPercent: Math.floor(Math.random() * 10) + 2,
      atkPercent: Math.floor(Math.random() * 8) + 1
    });
  }

  generateRandomCard() {
    const newCard = this._createRandomCard();
    this.addCard(newCard);
    return newCard;
  }

  generateShopCard() {
    return this._createRandomCard();
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

  /**
   * 合成：3张同品质任意芯片 -> 1张高一品质随机芯片
   * 不需要同名，只需要同品质
   */
  synthesize(sourceCardIds, plugin = null) {
    if (!sourceCardIds || sourceCardIds.length < 3) {
      return { success: false, reason: 'need_3_cards' };
    }

    const cards = sourceCardIds.map(id => this.getCardById(id)).filter(Boolean);
    if (cards.length < 3) {
      return { success: false, reason: 'card_not_found' };
    }

    // 检查3张芯片是否同品质
    const quality = cards[0].quality;
    const allSameQuality = cards.every(c => c.quality === quality);
    if (!allSameQuality) {
      return { success: false, reason: 'different_qualities' };
    }

    // 品质升级映射
    const qualityUpgradeMap = { N: 'R', R: 'SR', SR: 'SSR', SSR: 'UR', UR: 'LE' };
    const nextQuality = qualityUpgradeMap[quality];
    if (!nextQuality) {
      return { success: false, reason: 'max_quality' };
    }

    // 移除源卡
    for (const cardId of sourceCardIds) {
      this.removeCard(cardId);
    }

    // 生成新卡
    const newCard = new ChipCard({
      id: 'chip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      quality: nextQuality,
      star: 1,
      hpPercent: Math.floor(Math.random() * 10) + 3,
      atkPercent: Math.floor(Math.random() * 8) + 2
    });

    // 如果有定向插件，应用插件效果
    if (plugin) {
      if (plugin.targetElement) newCard.targetElement = plugin.targetElement;
      if (plugin.targetProfession) newCard.targetProfession = plugin.targetProfession;
      if (plugin.targetRace) newCard.targetRace = plugin.targetRace;
    }

    this.ownedCards.push(newCard);

    return { success: true, newCard: newCard, consumedQuality: quality, resultQuality: nextQuality };
  }

  addCard(cardData) {
    let newCard;
    if (cardData instanceof ChipCard) {
      newCard = cardData;
    } else {
      newCard = new ChipCard(cardData);
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
      return { hpPercent: 0, atkPercent: 0 };
    }
    return this.equippedCard.getEffectiveStats();
  }

  getActiveSkills() {
    if (!this.equippedCard) return [];
    return this.equippedCard.getUnlockedSkills();
  }

  applyChipToTeam(teamMembers) {
    if (!this.equippedCard) return;

    const bonuses = this.equippedCard.getEffectiveStats();
    for (const member of teamMembers) {
      if (bonuses.hpPercent > 0) {
        const hpBonus = Math.floor((member.maxHp || member.hp || 0) * (bonuses.hpPercent / 100));
        member.hp = (member.hp || member.maxHp || 0) + hpBonus;
        member.maxHp = (member.maxHp || member.hp || 0) + hpBonus;
      }
      if (bonuses.atkPercent > 0) {
        const atkBonus = Math.floor((member.atk || 0) * (bonuses.atkPercent / 100));
        member.atk = (member.atk || 0) + atkBonus;
      }
    }
  }

  onBattleStart(teamMembers) {
    if (!this.equippedCard) return;

    this.applyChipToTeam(teamMembers);
  }

  onTurnEnd() {
    // 鑺墖鍥炲悎缁撴潫澶勭悊锛堥鐣欙級
  }

  checkTriggers(condition, context) {
    if (!this.equippedCard) return [];
    const skills = this.equippedCard.getUnlockedSkills();
    return skills.filter(s => s.trigger === condition);
  }

  getInfo() {
    return {
      totalCards: this.ownedCards.length,
      equippedCard: this.equippedCard ? this.equippedCard.toJSON() : null,
      teamStatBonuses: this.getTeamStatBonuses(),
      activeSkills: this.getActiveSkills(),
      qualityBreakdown: {
        N: this.getCardsByQuality('N').length,
        R: this.getCardsByQuality('R').length,
        SR: this.getCardsByQuality('SR').length,
        SSR: this.getCardsByQuality('SSR').length,
        UR: this.getCardsByQuality('UR').length,
        LE: this.getCardsByQuality('LE').length
      }
    };
  }

  toJSON() {
    return {
      ownedCards: this.ownedCards.map(card => card.toJSON()),
      equippedCardId: this.equippedCardId,
      shopCards: this.shopCards.map(c => c instanceof ChipCard ? c.toJSON() : c)
    };
  }

  save() {
    return this.toJSON();
  }

  load() {
    return this;
  }

  static fromJSON(json) {
    return new ChipCardManager(json);
  }
}


