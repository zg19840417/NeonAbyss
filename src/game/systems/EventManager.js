import EventData from '../data/EventData.js';
import EnemyData from '../data/EnemyData.js';

/**
 * 事件处理系统
 * 处理 battle/story/trade/random 四种事件类型
 */
export default class EventManager {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 处理事件
   * @param {Object} eventData - 事件数据
   * @returns {Object} 处理结果 {type, result}
   */
  processEvent(eventData) {
    if (!eventData) return { type: null, result: null };

    switch (eventData.eventType) {
      case 'battle':
        return this._handleBattleEvent(eventData);
      case 'story':
        return this._handleStoryEvent(eventData);
      case 'trade':
        return this._handleTradeEvent(eventData);
      case 'random':
        return this._handleRandomEvent(eventData);
      default:
        return { type: eventData.eventType, result: null };
    }
  }

  _handleBattleEvent(eventData) {
    // 从事件中加载敌人
    const enemies = (eventData.enemies || []).map(e =>
      EnemyData.resolveEnemyRef(e.enemyId, e.level)
    ).filter(Boolean);

    if (enemies.length === 0) {
      return { type: 'battle', result: { enemies: [], rewards: eventData.rewards || [] } };
    }

    return {
      type: 'battle',
      result: {
        enemies,
        rewards: eventData.rewards || []
      }
    };
  }

  _handleStoryEvent(eventData) {
    return {
      type: 'story',
      result: {
        content: eventData.storyContent || '',
        rewards: eventData.rewards || []
      }
    };
  }

  _handleTradeEvent(eventData) {
    return {
      type: 'trade',
      result: {
        tradeShopId: eventData.tradeShopId || null,
        rewards: eventData.rewards || []
      }
    };
  }

  _handleRandomEvent(eventData) {
    // 随机事件：50%获得奖励，50%无效果
    const lucky = Math.random() < 0.5;
    return {
      type: 'random',
      result: {
        content: lucky ? '你发现了一些有用的物资！' : '什么也没有发生...',
        rewards: lucky ? (eventData.rewards || []) : []
      }
    };
  }

  /**
   * 从事件池中抽取事件并处理
   * @param {string} poolId - 事件池ID
   * @returns {Object} 处理结果
   */
  rollAndProcess(poolId) {
    const event = EventData.rollEventFromPool(poolId);
    if (!event) return { type: null, result: null, event: null };
    const processed = this.processEvent(event);
    return { ...processed, event };
  }
}
