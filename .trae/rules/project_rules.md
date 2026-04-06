---
alwaysApply: false
description: 
---
# 废土元年 - 项目规则

## 项目信息
- **游戏名**：废土元年（Wasteland Year One）
- **引擎**：Phaser 3 | **分辨率**：375×812 | **服务器**：`npm start`
- **技术栈**：JavaScript + Vite | **图片目录**：`assets/images/`

## 世界观概述
- **背景**：核战争摧毁了人类文明，核辐射导致动植物和机械发生变异
- **融合**：残存人类与变异生物/植物/机械进行"融合"，成功者为"融合者"（保留人性），失败者为"失心者"（失去理性）
- **基地**：少数幸存者的避难所，玩家是基地管理者
- **探索**：地面层（野外）为低级区域，地下层（禁区）为高级区域
- **最终Boss**：终焉之神·奥米茄 — 远古生物与幕后人类融合的终极产物

## 战斗流程
```
基地 → 野外/禁区 → 自动战斗 → 胜利→下一层 | 失败→返回基地
```

## 代码规范（强制）

### 1. 禁止硬编码
```javascript
// ❌ this.add.text(100, 50, '文本', {...})
// ✅ this.add.text(Const.UI.TITLE_X, Const.UI.TITLE_Y, Lang.xxx, {...})
```
**常量表**：`src/game/data/Const.js` | **语言表**：`src/game/data/Lang.js`

### 2. 场景间通信 → EventBus
```javascript
// 监听者
this._eventListeners = { handler: (data) => this.onEvent(data) };
EventBus.on('event:name', this._eventListeners.handler);

// shutdown() 必须清理
EventBus.off('event:name', this._eventListeners.handler);

// 发送者
EventBus.emit('event:name', { data });
```

### 3. 监听器清理规范
- 存储在 `_xxxListeners` 对象中
- 使用箭头函数确保 `this` 上下文
- `shutdown()` 中调用 `.off()` 和 `.killAll()`

### 4. 系统类模板
```javascript
export default class SystemName {
  toJSON() { return {}; }
  save() { localStorage.setItem('key', JSON.stringify(this.toJSON())); }
}
```

### 5. 多语言翻译调用
```javascript
// View类中，从Lang.js导入
import { t } from '../../game/data/Lang.js';
// 添加本地方法
t(key, params = {}) { return t(key, params); }
// UI中使用
this.t('key_name')
```

## 文件结构
```
src/
├── scenes/
│   ├── views/          # TavernView, TeamView, DungeonView, ShopView, SettingsView, EquipmentView
│   ├── BootScene.js, PreloadScene.js, MainMenuScene.js
│   ├── BaseScene.js    # 底部导航 + 5个Tab
│   ├── DungeonScene.js # 野外/禁区过渡
│   └── BattleScene.js  # 战斗场景
├── game/
│   ├── EventBus.js     # 场景通信
│   ├── data/           # Const.js, Lang.js, CharacterClass.js, MinionConfig.js, minions.json
│   ├── entities/       # Character.js, MinionCard.js, EquipmentCard.js
│   └── systems/        # Battle, Dungeon, Base, Save, Sound, Equipment, Skill, Buff, Achievement, PassiveSkill, EquipmentCardManager
└── utils/              # ResponsiveUtils.js
```

## 种族体系

### 5大种族（按融合对象分类）
| 种族 | 融合对象 | 子种族（6个） |
|------|---------|-------------|
| 植物系 | 变异植物 | 菌类、花类、藤蔓、树木、仙人掌、水草 |
| 动物系 | 变异动物 | 猫科、犬科、鸟类、鱼类、爬行、昆虫 |
| 机械系 | 残存机械 | 战车、无人机、医疗、工业、军用、民用 |
| 能量系 | 辐射能量体 | 火焰、寒冰、雷电、光能、暗能、辐射 |
| 混合系 | 多种融合 | 动植混合、机植混合、机动混合、能量混合、三系混合、混沌 |

### 子种族天赋
- 每个子种族拥有1个专属天赋技能（主动或被动）
- 天赋不显示在卡片上，以技能形式存在于战斗系统中
- 示例：猫科天赋（被动）— 攻击时30%概率使敌人流血，每回合损失攻击力10%的血量，持续2回合

## 元素体系

### 5种元素
- 水、火、风、光、暗

### 克制关系
```
  水 ←克→ 火 ←克→ 风
  ↑                   ↓
  克                 克
  ↑                   ↓
  暗 ←互克→ 光
```

### 克制效果
- 攻击克制方：最终伤害 +20%
- 被克制方攻击：受到最终伤害 -20%
- 克制效果在所有伤害计算完成后应用（包括暴击、技能、装备效果）

## 货币体系（三级）

| 货币 | 定位 | 说明 |
|------|------|------|
| 菌丝 | 基础货币 | 废土中疯长的变异真菌，可再生资源。大产大消，用于日常升级、强化、购买基础物资 |
| 源核 | 稀有代币 | 核战产生的能量结晶，稀有珍贵。用于招募随从、稀有培养、购买高级道具 |
| 星币 | 付费代币 | 人民币购买。用于商城礼包、可替换源核消费 |

## 声望体系
- 声望 = 账号等级，作为玩法养成进度的门槛
- 限制可解锁的区域和内容
- 每提升一定等级有一次性奖励
- 等级越高，解锁越多内容（新区域、新随从、新装备、新系统）

## 敌人分类

| 类型 | 说明 | 出现区域 |
|------|------|---------|
| 变异生物 | 辐射导致的动植物变异体，无融合能力 | 野外（地面层） |
| 失心者 | 融合失败体，拥有强大力量但失去理性 | 野外+禁区，精英/Boss级 |

## 随从卡系统规范

### MinionCard 实体类
- 继承 Character 类
- 品质：common | rare | epic | legendary
- 种族：plant | animal | mech | energy | hybrid
- 元素：water | fire | wind | light | dark
- 被动技能通过 `isMinionCard` 标记区分

### 被动技能类型
- 光环类(Aura)：AURA_ATK_UP, AURA_DEF_UP, AURA_HEAL
- 触发类(Trigger)：ON_ATTACK, ON_DAMAGE_TAKEN, ON_ALLY_DEATH, ON_KILL, ON_HP_BELOW_THRESHOLD, ON_TURN_START, ON_SUMMON
- 状态类(Status)：DIVINE_SHIELD, TAUNT, WINDFURY, REBIRTH, POISON_TOUCH, LIFESTEAL_AURA

## 装备卡系统规范

### 卡组结构
- 每支队伍：3张随从卡 + 1张装备卡
- 装备卡效果作用于全队3个随从，每人获得全额加成
- 装备卡仅可升星（1-5星），不可升级

### 装备卡模块
- 模块A：基础属性加成（攻击/生命/暴击/闪避/减伤/吸血）
- 模块B：赋予/改变技能（光环被动 / 触发型被动 / 改变现有技能）

### 装备卡品质
| 品质 | 属性数量 | 技能类型 | 最大星级 |
|------|---------|---------|---------|
| N | 1个 | 1个光环被动 | 3星 |
| R | 2个 | 1个光环被动 | 4星 |
| SR | 2个 | 1个光环+1个触发 | 4星 |
| SSR | 3个 | 1个光环+1个改变技能 | 5星 |
| SSR+ | 3个 | 1个光环+1个触发+1个改变 | 5星 |

## 性能规则
| 优化项 | 规则 |
|--------|------|
| 背景 | `fillGradientStyle` 替代逐行绘制 |
| 粒子 | ≤30个，使用 `fillCircle` |
| 动画 | 场景切换前 `tweens.killAll()` |

## 数据规范

### Excel表格式（前3行固定）
| 行号 | 内容 |
|------|------|
| 第1行 | 字段名（英文） |
| 第2行 | 数据类型 `int\|float\|string\|bool\|array\|json` |
| 第3行 | 中文解释 |
| 第4行+ | 数据 |

### 数据驱动流程
```
Excel (*.xlsx) → 转换脚本 → JSON (*.json) → 代码引用
```
**禁止**：直接编辑 JSON 文件

## 开发命令
```bash
npm start      # 开发服务器
npm run build  # 构建生产
npm run preview # 预览
```

## 已完成功能清单

| 功能 | 状态 | 文件 |
|------|------|------|
| 基础角色系统 | ✅ | Character.js |
| 装备卡系统 | ✅ | EquipmentCard.js, EquipmentCardManager.js |
| 随从卡系统 | ✅ | MinionCard.js, PassiveSkill.js, MinionConfig.js |
| 战斗系统 | ✅ | BattleSystem.js |
| 存档系统 | ✅ | SaveSystem.js |
| UI视图 | ✅ | views/*.js |

## 问题追踪

| 问题 | 状态 |
|------|------|
| 事件监听器泄漏 | ✅ 已修复 |
| 装备卡t()函数调用 | ✅ 已修复 |
| 随从卡被动触发逻辑 | ✅ 已修复 |
