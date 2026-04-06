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
| 融合姬 | 己方随从卡，全女性 | "随从""角色""伙伴""驾驶员" |
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
  skills: [...]
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
| 装备卡系统 | ✅ | EquipmentCard.js, EquipmentCardManager.js（待重命名为ChipCard） |
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
