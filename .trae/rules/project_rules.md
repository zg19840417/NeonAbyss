---
alwaysApply: false
description: 
---
# 霓虹深渊 - 项目规则

## 项目信息
- **引擎**：Phaser 3 | **分辨率**：375×812 | **服务器**：`npm start`
- **技术栈**：JavaScript + Vite | **图片目录**：`assets/images/`

## 战斗流程
```
基地 → 禁区 → 自动战斗 → 胜利→下一层 | 失败→返回基地
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
│   ├── DungeonScene.js # 禁区过渡
│   └── BattleScene.js  # 战斗场景
├── game/
│   ├── EventBus.js     # 场景通信
│   ├── data/           # Const.js, Lang.js, CharacterClass.js, MinionConfig.js, minions.json
│   ├── entities/       # Character.js, MinionCard.js, EquipmentCard.js
│   └── systems/        # Battle, Dungeon, Base, Save, Sound, Equipment, Skill, Buff, Achievement, PassiveSkill, EquipmentCardManager
└── utils/              # ResponsiveUtils.js
```

## 随从卡系统规范

### MinionCard 实体类
- 继承 Character 类
- 品质：common | rare | epic | legendary
- 种族：human | mech | mutant | energy | beast
- 元素：fire | ice | thunder | dark | light
- 被动技能通过 `isMinionCard` 标记区分

### 被动技能类型
- 光环类(Aura)：AURA_ATK_UP, AURA_DEF_UP, AURA_HEAL
- 触发类(Trigger)：ON_ATTACK, ON_DAMAGE_TAKEN, ON_ALLY_DEATH, ON_KILL, ON_HP_BELOW_THRESHOLD, ON_TURN_START, ON_SUMMON
- 状态类(Status)：DIVINE_SHIELD, TAUNT, WINDFURY, REBIRTH, POISON_TOUCH, LIFESTEAL_AURA

### 种族天赋
| 种族 | 天赋效果 |
|------|----------|
| MECH | 免疫中毒和眩晕 |
| MUTANT | 每回合恢复5%最大生命 |
| ENERGY | 闪避+15%，生命上限-20% |
| BEAST | 攻击+15%，暴击+10% |

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
