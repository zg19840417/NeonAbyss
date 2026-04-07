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
- **融合**：残存人类与变异生物/植物/机械进行"融合"，成功者为"融合姬"（保留人性，全女性），失败者为"失心者"（失去理性）
- **庇护所**：少数幸存者的避难所（实际是星舰指挥舱），玩家是基地管理者（继承者），不参与战斗
- **探索**：野外（地面层）为低级区域，禁区（地下层）为高级区域
- **最终Boss**：终焉之核·奥米茄 — 融合技术的创造者，完美融合体，要将所有人转化
- **星舰**：庇护所本身就是星舰，需要收集10个零件启动，带领幸存者离开地球

## 战斗流程
```
庇护所 → 野外/禁区 → 自动战斗 → 胜利→下一层 | 失败→可重试（无惩罚）
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
import { t } from '../../game/data/Lang.js';
t(key, params = {}) { return t(key, params); }
this.t('key_name')
```

## 文件结构
```
src/
├── scenes/
│   ├── views/          # ShelterView(庇护所), TeamView, DungeonView, ShopView, SettingsView, ChipView
│   ├── BootScene.js, PreloadScene.js, MainMenuScene.js
│   ├── BaseScene.js    # 底部导航 + Tab
│   ├── DungeonScene.js # 野外/禁区过渡
│   └── BattleScene.js  # 战斗场景
├── game/
│   ├── EventBus.js
│   ├── data/           # Const.js, Lang.js, CharacterClass.js, MinionConfig.js, minions.json
│   ├── entities/       # Character.js, MinionCard.js, ChipCard.js
│   └── systems/        # Battle, Dungeon, Base, Save, Sound, Equipment, Skill, Buff, Achievement, PassiveSkill, ChipCardManager, GachaSystem
└── utils/              # ResponsiveUtils.js
```

## 术语规范（强制）

| 术语 | 说明 | 禁止使用 |
|------|------|---------|
| 融合姬 | 己方融合姬卡，全女性 | "融合姬""角色""伙伴""驾驶员" |
| 失心者 | 敌方怪物 | "怪物""敌人"（代码外） |
| 变异生物 | 低级敌人（无融合能力） | |
| 庇护所 | 主界面/基地 | "酒馆""霓虹酒馆" |
| 菌丝 | 基础货币 | "金币""赛博币""coins" |
| 源核 | 稀有代币 | |
| 星币 | 付费代币 | |
| 抗辐射药剂 | 禁区入场道具 | |

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

## 元素体系

### 5种元素
- 水、火、风、光、暗
- 所有攻击遵循卡片元素属性，不区分物理/魔法

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
- 被克制方攻击：受到的最终伤害 -20%

## 货币体系（三级）

| 货币 | 定位 | 说明 |
|------|------|------|
| 菌丝 | 基础货币 | 日常升级、强化、购买基础物资 |
| 源核 | 稀有代币 | 抽卡招募融合姬、稀有培养、购买高级道具、购买抗辐射药剂 |
| 星币 | 付费代币 | 商城礼包，可替换源核消费 |

## 初始数值配置

### 配置文件
- **Excel表**：`assets/data/excel/initConfig.xlsx`
- **JSON文件**：`assets/data/json/initConfig.json`
- **生成脚本**：`tools/generateInitConfig.js`

### 修改流程
1. 修改 `initConfig.xlsx` 中的数值
2. 运行 `node tools/generateInitConfig.js` 生成JSON
3. 游戏自动加载 `initConfig.json`

### 可配置项
- 初始货币（菌丝、源核、星币、各类碎片）
- 其他初始值（队伍容量、背包容量、设施等级等）

## 声望体系
- 声望 = 账号等级，范围1-99级
- 通过打怪、任务等获得声望经验值
- 每个关卡有准入等级设定（准入等级 + 通关前置关卡）
- 主界面展示等级和经验条

## 敌人分类

| 类型 | type值 | 说明 | 出现区域 |
|------|--------|------|---------|
| 变异生物 | mutant | 辐射导致的变异体，无融合能力 | 野外 |
| 失心者 | lost | 融合失败体，拥有强大力量但失去理性 | 野外+禁区 |

## 品质体系（全系统统一六级）

| 代码 | 名称 | 芯片技能数 |
|------|------|-----------|
| N | 普通 | 1个 |
| R | 稀有 | 1个 |
| SR | 精良 | 1个 |
| SSR | 史诗 | 2个 |
| UR | 传说 | 2个 |
| LE | 神话 | 3个 |

## 融合姬卡系统规范

### MinionCard 实体类
- 继承 Character 类
- 品质：N | R | SR | SSR | UR | LE
- 种族：plant | animal | mech | energy | hybrid
- 元素：water | fire | wind | light | dark
- 职业：tank | dps | support
- 所有融合姬均为女性

### 招募系统
- 消耗源核抽卡（单抽/十连抽）
- 需要配置卡池和抽取概率
- 取消原有的4种招募能量和刷新展示机制

## 强化芯片系统规范

### 卡组结构
- 每支队伍：3张融合姬卡 + 1张强化芯片
- 芯片效果作用于全队3个融合姬，每人获得全额加成

### 芯片模块
- **基础属性**：生命百分比 + 攻击百分比（Excel表驱动）
- **全局技能**：光环被动 / 触发型被动 / 改变现有技能

### 合成升级系统
- **基础合成**：3张同品质任意芯片 → 1张高一品质随机芯片
- **定向插件**（可选消耗品）：
  - 职业插件：坦克向/输出向/辅助向
  - 元素插件：水/火/风/光/暗
  - 种族插件：植物系/动物系/机械系/能量系/混合系

### 芯片数据结构
```javascript
{
  chipId: "chip_atk_fire_01",
  name: "烈焰攻击芯片",
  quality: "SSR",
  hpPercent: 15,
  atkPercent: 20,
  targetProfession: null,
  targetElement: "fire",
  targetRace: null,
  skillIds: [...]
}
```

## 关卡架构

### 野外
- 10张地图，每张10个战斗关卡，纯线性推进
- 每关固定3个敌人
- 通关=消灭全部敌人，失败无惩罚可重试
- 不可重复挑战
- 视觉：线性路径节点式

### 禁区
- 20个禁区（每张地图第5和第10节点各1个）
- 分支选路，每层2-3个节点卡片，完全显示信息
- 每层1个事件（战斗/剧情/交易/随机）
- 最后一层固定Boss战
- 通关=打到底，失败=任一战斗输（已通过层数奖励保留）
- 可重置后重新挑战（消耗抗辐射药剂）
- 抗辐射药剂：源核购买 + 每1小时免费1个

### 配置表
- wildStages.xlsx → 野外关卡表
- zoneStages.xlsx → 禁区关卡表
- events.xlsx → 事件配置表
- eventPools.xlsx → 事件池配置表

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
| 第2行 | 数据类型 `int|float|string|bool|array|json` |
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
| 融合姬卡系统 | ✅ | MinionCard.js, PassiveSkill.js, MinionConfig.js |
| 战斗系统 | ✅ | BattleSystem.js |
| 存档系统 | ✅ | SaveSystem.js |
| UI视图 | ✅ | views/*.js |
| 商店系统v2.0 | ✅ | ShopView.js, ShopSystem.js, BaseSystem.js |
| 货币系统 | ✅ | BaseSystem.js (currencies) |
| 物品背包系统 | ✅ | BaseSystem.js (inventory) |
| 每日限购系统 | ✅ | BaseSystem.js (dailyPurchaseRecords) |

## 问题追踪

| 问题 | 状态 |
|------|------|
| 事件监听器泄漏 | ✅ 已修复 |
| 装备卡t()函数调用 | ✅ 已修复 |
| 融合姬卡被动触发逻辑 | ✅ 已修复 |
| 商店滚动事件累积 | ✅ 已修复 |
| 闭包引用错误 | ✅ 已修复 |

---

## 📋 数值策划执行指南

> 本节提取本文档中与数值配表相关的所有内容，以可直接执行的方式呈现。

### 1. 术语规范表（配表与文案统一使用）

| 标准术语 | 说明 | 禁止使用（代码外） | 代码中使用 |
|---------|------|-------------------|-----------|
| 融合姬 | 己方融合姬卡，全女性 | "角色""伙伴""驾驶员" | MinionCard |
| 失心者 | 敌方怪物 | "怪物""敌人" | lost |
| 变异生物 | 低级敌人（无融合能力） | — | mutant |
| 庇护所 | 主界面/基地 | "酒馆""霓虹酒馆" | shelter |
| 菌丝 | 基础货币 | "金币""赛博币""coins" | mycelium |
| 源核 | 稀有代币 | — | sourceCore |
| 星币 | 付费代币 | — | starCoin |
| 抗辐射药剂 | 禁区入场道具 | — | anti_radiation_medicine |

### 2. 品质枚举值定义

| 代码 | 名称 | 芯片技能数 | 配表填写值 |
|------|------|-----------|-----------|
| N | 普通 | 1个 | `N` |
| R | 稀有 | 1个 | `R` |
| SR | 精良 | 1个 | `SR` |
| SSR | 史诗 | 2个 | `SSR` |
| UR | 传说 | 2个 | `UR` |
| LE | 神话 | 3个 | `LE` |

### 3. 元素枚举值定义

| 代码 | 中文名 | 克制关系 |
|------|--------|---------|
| water | 水 | 克火 |
| fire | 火 | 克风 |
| wind | 风 | 克水 |
| light | 光 | 互克暗 |
| dark | 暗 | 互克光 |

克制效果：攻击克制方 +20% 伤害，被克制方 -20% 伤害。

### 4. 种族枚举值定义

| 代码 | 中文名 | 子种族（6个） |
|------|--------|-------------|
| plant | 植物系 | 菌类、花类、藤蔓、树木、仙人掌、水草 |
| animal | 动物系 | 猫科、犬科、鸟类、鱼类、爬行、昆虫 |
| mech | 机械系 | 战车、无人机、医疗、工业、军用、民用 |
| energy | 能量系 | 火焰、寒冰、雷电、光能、暗能、辐射 |
| hybrid | 混合系 | 动植混合、机植混合、机动混合、能量混合、三系混合、混沌 |

### 5. 职业枚举值定义

| 代码 | 中文名 | 说明 |
|------|--------|------|
| tank | 坦克 | 承担伤害 |
| dps | 输出 | 造成伤害 |
| support | 辅助 | 治疗/增益 |

### 6. 敌人类型枚举值定义

| 代码 | 中文名 | 出现区域 |
|------|--------|---------|
| mutant | 变异生物 | 野外 |
| lost | 失心者 | 野外+禁区 |

### 7. 货币代码规范

| 代码 | 中文名 | 定位 | 用途 |
|------|--------|------|------|
| mycelium | 菌丝 | 基础货币 | 日常升级、强化、购买基础物资 |
| sourceCore | 源核 | 稀有代币 | 抽卡招募融合姬、稀有培养、购买高级道具、购买抗辐射药剂 |
| starCoin | 星币 | 付费代币 | 商城礼包，可替换源核消费 |

### 8. 关卡配置表清单

| 配置表 | 用途 |
|--------|------|
| wildStages.xlsx | 野外关卡表（10张地图，每张10关） |
| zoneStages.xlsx | 禁区关卡表（20个禁区） |
| events.xlsx | 事件配置表 |
| eventPools.xlsx | 事件池配置表 |
| minionCards.xlsx | 融合姬卡配置表（100张） |
| chipCards.xlsx | 强化芯片配置表 |
| items.xlsx | 道具配置表（头像框/称号/药剂等） |
| levelUp.xlsx | 等级经验与奖励表 |
| achievement.xlsx | 成就配置表 |
| quest.xlsx | 任务配置表 |
| gachaConfig.xlsx | 抽卡配置表 |
| gachaPool.xlsx | 卡池配置表 |
| activityChest.xlsx | 活跃度宝箱配置表 |
| shopItems.xlsx | 商店道具配置表 |

---

## 🎨 美术执行指南

> 本节提取本文档中与美术资源、UI界面相关的所有内容，以可直接执行的方式呈现。

### 1. 已完成功能中涉及美术的部分

| 功能 | 美术资源状态 | 说明 |
|------|-------------|------|
| 基础角色系统 | 需确认 | Character.js 已完成，需对应角色立绘/图标 |
| 装备卡系统（待重命名为ChipCard） | 需确认 | 芯片卡面美术资源 |
| 融合姬卡系统 | 需确认 | MinionCard.js 已完成，需100张融合姬卡面 |
| 战斗系统 | 需确认 | BattleSystem.js 已完成，需战斗UI/特效 |
| UI视图 | 需确认 | views/*.js 已完成，需对应UI素材 |

### 2. 文件命名规范

| 资源类型 | 命名规则 | 示例 |
|---------|---------|------|
| 图片资源 | 小写+下划线 | `bg_shelter.png`, `icon_mycelium.png` |
| 图片目录 | `assets/images/` | 按功能分子目录 |
| 融合姬立绘 | `minion_{id}_{pose}.png` | `minion_LE_001_default.png` |
| 芯片图标 | `chip_{quality}_{element}.png` | `chip_SSR_fire.png` |
| UI图标 | `icon_{function}.png` | `icon_navigation_team.png` |
| 背景图 | `bg_{scene}_{variant}.png` | `bg_shelter_night.png` |

### 3. 游戏分辨率与适配

| 配置项 | 值 |
|--------|-----|
| 设计分辨率 | 375×812（竖屏） |
| 适配策略 | 由 ResponsiveUtils.js 处理 |
| 图片目录 | `assets/images/` |

### 4. 品质视觉规范（全系统统一六级）

| 品质 | 推荐主色调 | 卡框效果 |
|------|-----------|---------|
| N | 灰色/白色 | 简单边框 |
| R | 绿色 | 绿色边框 |
| SR | 蓝色 | 蓝色边框+微光 |
| SSR | 紫色 | 紫色边框+光效 |
| UR | 橙色/金色 | 金色边框+动态光效 |
| LE | 彩虹/全息 | 全息效果+专属动画 |

---

## 💻 程序实现指南

> 本节提取本文档中与程序代码实现相关的所有内容，以可直接执行的方式呈现。

### 1. 代码规范

#### 1.1 ESLint 规范

- 禁止硬编码数值和文本字符串
- 使用 `Const.UI.XXX` 替代硬编码坐标
- 使用 `Lang.xxx` / `t('key_name')` 替代硬编码文本

```javascript
// ❌ 禁止
this.add.text(100, 50, '文本', {...});

// ✅ 正确
this.add.text(Const.UI.TITLE_X, Const.UI.TITLE_Y, this.t('key_name'), {...});
```

#### 1.2 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 场景文件 | PascalCase + Scene 后缀 | `BootScene.js`, `BattleScene.js` |
| 视图文件 | PascalCase + View 后缀 | `ShelterView.js`, `TeamView.js` |
| 系统文件 | PascalCase + System 后缀 | `BattleSystem.js`, `SaveSystem.js` |
| 实体文件 | PascalCase | `Character.js`, `MinionCard.js` |
| 工具文件 | PascalCase + Utils 后缀 | `ResponsiveUtils.js` |
| 数据文件 | PascalCase | `Const.js`, `Lang.js`, `EventBus.js` |

#### 1.3 类命名规范

```javascript
// 系统类模板
export default class SystemName {
  toJSON() { return {}; }
  save() { localStorage.setItem('key', JSON.stringify(this.toJSON())); }
}

// 场景类继承 Phaser.Scene
export default class MyScene extends BaseScene {
  constructor() { super('MyScene'); }
  // ...
}
```

### 2. 项目文件结构

```
src/
├── scenes/
│   ├── views/          # ShelterView(庇护所), TeamView, DungeonView, ShopView, SettingsView, ChipView
│   ├── BootScene.js, PreloadScene.js, MainMenuScene.js
│   ├── BaseScene.js    # 底部导航 + Tab（所有视图的基类）
│   ├── DungeonScene.js # 野外/禁区过渡
│   └── BattleScene.js  # 战斗场景
├── game/
│   ├── EventBus.js     # 全局事件总线
│   ├── data/           # Const.js, Lang.js, CharacterClass.js, MinionConfig.js, minions.json
│   ├── entities/       # Character.js, MinionCard.js, ChipCard.js
│   └── systems/        # Battle, Dungeon, Base, Save, Sound, Equipment, Skill, Buff, 
│                       # Achievement, PassiveSkill, ChipCardManager, GachaSystem
└── utils/              # ResponsiveUtils.js
```

### 3. 已完成功能清单（开发参考）

| 功能 | 状态 | 文件 | 说明 |
|------|------|------|------|
| 基础角色系统 | ✅ | Character.js | 角色基类，含属性/技能框架 |
| 融合姬卡系统 | ✅ | MinionCard.js, PassiveSkill.js, MinionConfig.js | 继承 Character，含被动技能 |
| 战斗系统 | ✅ | BattleSystem.js | 自动战斗逻辑 |
| 存档系统 | ✅ | SaveSystem.js | localStorage 持久化 |
| UI视图 | ✅ | views/*.js | ShelterView, TeamView 等 |
| 商店系统v2.0 | ✅ | ShopView.js, ShopSystem.js | 5商店+货币+限购+滚动 |

### 4. 数据流向

```
Excel (*.xlsx) → 转换脚本 → JSON (*.json) → 代码引用
```

**关键规则：**
- **禁止**直接编辑 JSON 文件
- 所有数值数据必须从 Excel 表导出
- Excel 表格式前3行固定：第1行字段名（英文）、第2行数据类型、第3行中文解释
- 第4行起为实际数据

### 5. 场景间通信规范

```javascript
// 监听事件
this._eventListeners = { handler: (data) => this.onEvent(data) };
EventBus.on('event:name', this._eventListeners.handler);

// shutdown() 必须清理监听器
EventBus.off('event:name', this._eventListeners.handler);

// 发送事件
EventBus.emit('event:name', { data });
```

**清理规范：**
- 监听器存储在 `_xxxListeners` 对象中
- 使用箭头函数确保 `this` 上下文
- `shutdown()` 中必须调用 `.off()` 和 `.killAll()`

### 6. 多语言规范

```javascript
import { t } from '../../game/data/Lang.js';

// 在场景中使用
this.t('key_name')

// 带参数
this.t('key_name', { count: 5 })
```

### 7. 性能规则

| 优化项 | 规则 |
|--------|------|
| 背景绘制 | 使用 `fillGradientStyle` 替代逐行绘制 |
| 粒子数量 | 最多30个，使用 `fillCircle` |
| 场景切换 | 切换前调用 `tweens.killAll()` 清理动画 |

### 8. 开发命令

```bash
npm start       # 启动开发服务器
npm run build   # 构建生产版本
npm run preview # 预览构建结果
```
