import Phaser from 'phaser';

// ===== 事件名称常量 =====
export const GameEvents = {
  // 货币变化
  CURRENCY_CHANGED: 'currency:changed',

  // 队伍变化
  TEAM_UPDATED: 'team:updated',
  TEAM_DEPLOY_CHANGED: 'team:deploy:changed',

  // 背包/物品变化
  INVENTORY_CHANGED: 'inventory:changed',

  // 芯片变化
  CHIP_EQPPED: 'chip:equipped',
  CHIP_UNEQUIPPED: 'chip:unequipped',
  CHIP_UPGRADED: 'chip:upgraded',

  // 融合姬变化
  FUSION_LEVEL_UP: 'fusion:levelup',
  FUSION_QUALITY_UP: 'fusion:qualityup',
  FUSION_DEPLOYED: 'fusion:deployed',
  FUSION_UNDEPLOYED: 'fusion:undeployed',

  // 战斗事件
  BATTLE_VICTORY: 'battle:victory',
  BATTLE_DEFEAT: 'battle:defeat',

  // 存档事件
  SAVE_REQUESTED: 'save:requested',
  DATA_RESET: 'data:reset',

  // UI 事件
  TAB_CHANGED: 'ui:tab:changed',
  VIEW_REFRESH: 'ui:view:refresh',
};

class EventBusClass extends Phaser.Events.EventEmitter {
  constructor() {
    super();
  }

  /**
   * 发出事件（链式调用友好）
   */
  emit(event, ...args) {
    super.emit(event, ...args);
    return this;
  }

  /**
   * 一次性监听
   */
  once(event, fn, context) {
    super.once(event, fn, context);
    return this;
  }
}

const EventBus = new EventBusClass();

export { EventBus };
export default EventBus;
