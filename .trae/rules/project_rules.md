---
alwaysApply: true
---
# 霓虹深渊 - 项目规则

## 项目信息
- **引擎**：Phaser 3 | **分辨率**：375×812 | **服务器**：`npm start`

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

## 文件结构
```
src/
├── scenes/
│   ├── views/          # TavernView, TeamView, DungeonView, ShopView, SettingsView
│   ├── BootScene.js, PreloadScene.js, MainMenuScene.js
│   ├── BaseScene.js    # 底部导航 + 5个Tab
│   ├── DungeonScene.js # 禁区过渡
│   └── BattleScene.js  # 战斗场景
├── game/
│   ├── EventBus.js     # 场景通信
│   ├── data/           # Const.js, Lang.js, CharacterClass.js
│   ├── entities/       # Character.js
│   └── systems/        # Battle, Dungeon, Base, Save, Sound, Equipment, Skill, Buff, Achievement
└── utils/              # ResponsiveUtils.js
```

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

## 问题追踪

| 问题 | 状态 |
|------|------|
| 事件监听器泄漏 | ✅ 已修复 |
| 硬编码颜色/文本 | ✅ 已修复 |
| Character类缺少MP属性 | ✅ 已修复 |
| 闪避机制未实现 | ✅ 已修复 |
| hp/currentHp属性名不一致 | ✅ 已修复 |
| BaseScene 拆分 | ⚠️ 可选 |
| Excel表规范化 | ❌ 待处理 |
| 装备生成逻辑 | ❌ 待实现 |
| 套装效果激活 | ❌ 待实现 |
| 角色死亡复活 | ❌ 待实现 |

## 数值平衡建议

### 角色职业调整
| 职业 | 问题 | 建议 |
|------|------|------|
| 钢铁壁垒 | ATK过低 | 提升至35，增加嘲讽机制 |
| 影子刺客 | 过强 | HP降至320，暴击降至30% |
| 毁灭术士 | 吸血过高 | 吸血降至10% |

### 敌人成长曲线
当前公式：`Math.pow(growth, floorNumber - 1)` 导致后期难度断层
建议改为：`Math.pow(growth, Math.log2(floorNumber + 1))`
