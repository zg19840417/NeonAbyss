import { BuffType, BuffConfig } from './BuffSystem.js';

export const AchievementType = {
  FLOOR_REACH: 'floor_reach',
  BATTLE_WIN: 'battle_win',
  GOLD_EARN: 'gold_earn',
  CHARACTER_RECRUIT: 'character_recruit',
  EQUIPMENT_ENHANCE: 'equipment_enhance',
  SKILL_USE: 'skill_use',
  BOSS_DEFEAT: 'boss_defeat',
  DIMENSION_REACH: 'dimension_reach'
};

export const Achievement = {
  FLOOR_10: {
    id: 'floor_10',
    name: '初探禁区',
    description: '到达第10层',
    type: AchievementType.FLOOR_REACH,
    target: 10,
    reward: { mycelium: 100 }
  },
  FLOOR_50: {
    id: 'floor_50',
    name: '深入禁区',
    description: '到达第50层',
    type: AchievementType.FLOOR_REACH,
    target: 50,
    reward: { mycelium: 500 }
  },
  FLOOR_100: {
    id: 'floor_100',
    name: '百层挑战',
    description: '到达第100层',
    type: AchievementType.FLOOR_REACH,
    target: 100,
    reward: { mycelium: 1000 }
  },
  BATTLE_WIN_10: {
    id: 'battle_win_10',
    name: '初露锋芒',
    description: '赢得10场战斗',
    type: AchievementType.BATTLE_WIN,
    target: 10,
    reward: { mycelium: 50 }
  },
  BATTLE_WIN_100: {
    id: 'battle_win_100',
    name: '百战百胜',
    description: '赢得100场战斗',
    type: AchievementType.BATTLE_WIN,
    target: 100,
    reward: { mycelium: 500 }
  },
  BATTLE_WIN_1000: {
    id: 'battle_win_1000',
    name: '千战千胜',
    description: '赢得1000场战斗',
    type: AchievementType.BATTLE_WIN,
    target: 1000,
    reward: { mycelium: 5000 }
  },
  GOLD_10000: {
    id: 'gold_10000',
    name: '万元户',
    description: '累计获得10000金币',
    type: AchievementType.GOLD_EARN,
    target: 10000,
    reward: { mycelium: 200 }
  },
  GOLD_100000: {
    id: 'gold_100000',
    name: '富豪',
    description: '累计获得100000金币',
    type: AchievementType.GOLD_EARN,
    target: 100000,
    reward: { mycelium: 2000 }
  },
  RECRUIT_3: {
    id: 'recruit_3',
    name: '三人成行',
    description: '招募3名角色',
    type: AchievementType.CHARACTER_RECRUIT,
    target: 3,
    reward: { mycelium: 100 }
  },
  RECRUIT_10: {
    id: 'recruit_10',
    name: '佣兵团长',
    description: '招募10名角色',
    type: AchievementType.CHARACTER_RECRUIT,
    target: 10,
    reward: { mycelium: 500 }
  },
  BOSS_DEFEAT_1: {
    id: 'boss_defeat_1',
    name: '首杀BOSS',
    description: '击败第1个BOSS',
    type: AchievementType.BOSS_DEFEAT,
    target: 1,
    reward: { mycelium: 200 }
  },
  BOSS_DEFEAT_10: {
    id: 'boss_defeat_10',
    name: 'BOSS猎人',
    description: '击败10个BOSS',
    type: AchievementType.BOSS_DEFEAT,
    target: 10,
    reward: { mycelium: 1000 }
  },
  DIMENSION_2: {
    id: 'dimension_2',
    name: '异维度',
    description: '进入第2维度',
    type: AchievementType.DIMENSION_REACH,
    target: 2,
    reward: { mycelium: 300 }
  },
  DIMENSION_3: {
    id: 'dimension_3',
    name: '维度行者',
    description: '进入第3维度',
    type: AchievementType.DIMENSION_REACH,
    target: 3,
    reward: { mycelium: 500 }
  },
  DIMENSION_5: {
    id: 'dimension_5',
    name: '多元宇宙',
    description: '进入第5维度',
    type: AchievementType.DIMENSION_REACH,
    target: 5,
    reward: { mycelium: 2000 }
  }
};

export default class AchievementSystem {
  constructor(gameData = {}) {
    this.listeners = {
      onAchievementUnlock: [],
      onRewardClaim: []
    };

    this.progress = gameData.progress || {};
    this.unlocked = gameData.unlocked || [];
    this.claimedRewards = gameData.claimedRewards || [];
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  updateProgress(type, value) {
    const key = `${type}_${value}`;
    this.progress[key] = (this.progress[key] || 0) + 1;
    this.checkAchievements(type);
  }

  updateFloorProgress(floor) {
    const key = `${AchievementType.FLOOR_REACH}_max`;
    if (!this.progress[key] || floor > this.progress[key]) {
      this.progress[key] = floor;
    }
    this.checkAchievements(AchievementType.FLOOR_REACH);
  }

  updateGoldProgress(totalGold) {
    this.progress.totalGoldEarned = totalGold;
    this.checkAchievements(AchievementType.GOLD_EARN);
  }

  updateBattleWinProgress(count) {
    this.progress.totalBattlesWon = count;
    this.checkAchievements(AchievementType.BATTLE_WIN);
  }

  updateRecruitProgress(count) {
    this.progress.totalRecruited = count;
    this.checkAchievements(AchievementType.CHARACTER_RECRUIT);
  }

  updateBossDefeatProgress(count) {
    this.progress.totalBossDefeated = count;
    this.checkAchievements(AchievementType.BOSS_DEFEAT);
  }

  updateDimensionProgress(dimension) {
    if (!this.progress.maxDimension || dimension > this.progress.maxDimension) {
      this.progress.maxDimension = dimension;
    }
    this.checkAchievements(AchievementType.DIMENSION_REACH);
  }

  checkAchievements(type) {
    const achievementList = Object.values(Achievement).filter(
      a => a.type === type && !this.unlocked.includes(a.id)
    );

    for (const achievement of achievementList) {
      let currentValue = 0;

      switch (type) {
        case AchievementType.FLOOR_REACH:
          currentValue = this.progress[`${type}_max`] || 0;
          break;
        case AchievementType.BATTLE_WIN:
          currentValue = this.progress.totalBattlesWon || 0;
          break;
        case AchievementType.GOLD_EARN:
          currentValue = this.progress.totalGoldEarned || 0;
          break;
        case AchievementType.CHARACTER_RECRUIT:
          currentValue = this.progress.totalRecruited || 0;
          break;
        case AchievementType.BOSS_DEFEAT:
          currentValue = this.progress.totalBossDefeated || 0;
          break;
        case AchievementType.DIMENSION_REACH:
          currentValue = this.progress.maxDimension || 0;
          break;
        default:
          currentValue = this.progress[`${type}_${achievement.target}`] || 0;
      }

      if (currentValue >= achievement.target) {
        this.unlockAchievement(achievement);
      }
    }
  }

  unlockAchievement(achievement) {
    if (this.unlocked.includes(achievement.id)) return;

    this.unlocked.push(achievement.id);
    this.emit('onAchievementUnlock', { achievement });
  }

  claimReward(achievementId) {
    const achievement = Achievement[achievementId];
    if (!achievement) return null;

    if (!this.unlocked.includes(achievementId)) return null;
    if (this.claimedRewards.includes(achievementId)) return null;

    this.claimedRewards.push(achievementId);
    this.emit('onRewardClaim', { achievement, reward: achievement.reward });

    return achievement.reward;
  }

  isUnlocked(achievementId) {
    return this.unlocked.includes(achievementId);
  }

  isRewardClaimed(achievementId) {
    return this.claimedRewards.includes(achievementId);
  }

  getUnlockedAchievements() {
    return this.unlocked.map(id => Achievement[id]).filter(Boolean);
  }

  getLockedAchievements() {
    return Object.values(Achievement).filter(
      a => !this.unlocked.includes(a.id)
    );
  }

  getClaimableRewards() {
    return this.unlocked
      .filter(id => !this.claimedRewards.includes(id))
      .map(id => Achievement[id])
      .filter(Boolean);
  }

  toJSON() {
    return {
      progress: this.progress,
      unlocked: this.unlocked,
      claimedRewards: this.claimedRewards
    };
  }
}
