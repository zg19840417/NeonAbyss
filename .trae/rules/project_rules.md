---
alwaysApply: false
description: 项目的规则文档，执行相对复杂的代码任务时可以参考
---
# 霓虹深渊 - 项目规则文档

## 项目概述
- **项目名称**：霓虹深渊（Neon Abyss）
- **游戏类型**：废土融合 + 自动战斗 + 酒馆经营
- **目标平台**：移动端（手机优先）
- **游戏引擎**：Phaser 3
- **设计分辨率**：375×812（移动端逻辑像素）
- **开发服务器**：`npm start` → http://localhost:3000/

---

## 核心机制：纯自动战斗

### 原型参考
游戏核心机制完全参考原作 **Soda Dungeon**：
- **100%自动战斗**：玩家不参与战斗操作
- **无限层递进**：击败敌人自动进入下一层
- **无房间/事件系统**：直接战斗循环
- **放置离线收益**：关闭游戏也能继续战斗
- **角色安全归来**：战败也只是返回基地

### 战斗流程
```
基地 → 进入禁区 → 自动战斗 → 胜利/失败 → 返回基地
                        ↓
                    下一层（胜利）
```

---

## 设计规范

### 视觉风格：赛博朋克霓虹

**主题**：未来都市 + 霓虹美学
- **主背景**：深邃蓝黑色 (#0a0a14 → #0d0d1d)
- **霓虹色彩**：
  - 青色 (Cyan): #00ffff - 用于发光效果和强调
  - 粉色 (Pink): #ff66cc - 用于标题和重要文字
  - 紫色 (Purple): #9933ff - 用于装饰和高亮
  - 洋红 (Magenta): #ff00ff - 用于边框和点缀
- **字体**：Noto Sans SC（中文）+ Arial（英文）

### UI 特效
- **霓虹发光**：使用 `BlendModes.ADD` 实现文字发光
- **脉冲动画**：按钮和标题使用缩放+透明度脉冲
- **粒子效果**：浮动的霓虹色彩粒子
- **角落装饰**：L形霓虹边框 + 像素装饰条

### 布局结构
- **底部导航栏**：5个平级Tab切换（酒馆/队伍/禁区/商店/设置）
- **酒馆视图**：调酒师区域 + 快捷进入禁区按钮
- **卡片设计**：圆角矩形 + 细边框 + 悬停高亮

---

## 核心代码约定

### 场景文件（src/scenes/）
```javascript
export default class SceneName extends Phaser.Scene {
  constructor() {
    super({ key: 'SceneName' });
    this.config = this.initConfig();
  }

  initConfig() {
    return {
      colors: {
        bgDark: 0x0a0a14,
        cyan: 0x00ffff,
        magenta: 0xff00ff,
        pink: 0xff66cc,
        purple: 0x9933ff,
        textPrimary: '#ffffff',
        textSecondary: '#8888aa'
      }
    };
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.createBackground(width, height);
    this.createUI(width, height);
  }

  shutdown() {
    this.tweens.killAll();
  }
}
```

### 按钮回调处理
```javascript
container.on('pointerdown', () => {
  if (callback) callback.call(this);
});
```

### 系统类（src/game/systems/）
```javascript
export default class SystemName {
  constructor(gameData = {}) {
    this.state = 'idle';
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  toJSON() { return {}; }
  save() { localStorage.setItem('key', JSON.stringify(this.toJSON())); }
}
```

---

## 文件结构

```
src/
├── scenes/
│   ├── BootScene.js         # 启动场景 + 响应式配置
│   ├── PreloadScene.js      # 预加载 + 存档恢复
│   ├── MainMenuScene.js     # 主菜单（赛博朋克风格）
│   ├── BaseScene.js         # 主界面（底部导航栏）
│   ├── DungeonScene.js      # 禁区入口（过渡场景）
│   └── BattleScene.js       # 战斗场景
├── game/
│   ├── data/
│   │   └── CharacterClass.js # 角色职业配置
│   ├── entities/
│   │   └── Character.js      # 角色实体
│   └── systems/
│       ├── BattleSystem.js   # 战斗系统（自动战斗+技能+Buff）
│       ├── DungeonSystem.js  # 禁区系统（层数递进+成就）
│       ├── BaseSystem.js     # 基地系统
│       ├── SaveSystem.js     # 存档系统
│       ├── SoundManager.js   # 音效系统
│       ├── Equipment.js      # 装备系统
│       ├── Skill.js          # 技能系统
│       ├── BuffSystem.js     # Buff/DeBuff系统
│       └── AchievementSystem.js # 成就系统
└── utils/
    └── ResponsiveUtils.js    # 响应式布局工具
```

---

## 性能优化

### 背景绘制
- 使用 `fillGradientStyle` 而非逐行绘制
- 网格线使用低透明度减少绘制开销

### 粒子效果
- 粒子数量控制在 30 以内
- 使用 `Graphics.fillCircle` 而非纹理

### 动画管理
- 场景切换前调用 `shutdown()` 停止所有 tween
- 使用 `this.tweens.killAll()`

---

## 已完成功能（2026-04-04 更新）

### UI/视觉 ✅
- **主菜单**：赛博朋克霓虹风格，简洁过渡
- **底部导航栏**（新设计）：
  - 5个平级Tab：酒馆/队伍/禁区/商店/设置
  - 选中状态高亮
  - 点击直接切换视图
- **酒馆视图**：调酒师 + 快捷进入禁区
- **队伍视图**：角色管理 + 移除功能
- **禁区视图**：当前层数显示 + 开始探索
- **商店视图**：角色招募
- **设置视图**：音量/战斗速度设置

### 战斗系统 ✅
- **BattleSystem**：纯自动战斗，无玩家操作
- **技能系统集成**：角色技能自动触发（伤害/治疗/Buff）
- **Buff/DeBuff系统**：
  - 攻击Buff (ATK_UP/DOWN)
  - 防御Buff (DEF_UP/DOWN)
  - 暴击Buff (CRIT_UP/DOWN)
  - 持续伤害 (POISON)
  - 持续治疗 (REGEN)
  - 护盾 (SHIELD)
  - 眩晕 (STUN)
- **DungeonSystem**：层数递进，Boss层判定，离线收益追踪
- **BattleScene**：自动战斗界面，实时HP显示，攻击动画，战斗日志，技能动画

### 基地系统 ✅
- **BaseScene**：底部导航栏 + 5个功能视图
- 角色招募、队伍管理、商店、禁区入口、设置

### 装备系统 ✅
- **Equipment.js**：武器/护甲/饰品属性加成
- **强化系统**：装备可强化，属性乘数递增

### 成就系统 ✅
- **AchievementSystem.js**：完整成就追踪
- 15个成就（层数/战斗/金币/招募/Boss/维度）
- 奖励领取系统

### 响应式布局 ✅
- **ResponsiveUtils.js**：多分辨率适配工具
- 支持竖屏/横屏自动切换

### 数据系统 ✅
- 自动存档到localStorage
- DungeonSystem离线进度计算
- PreloadScene启动时恢复存档

---

## 待完成功能

- [ ] 多分辨率测试与适配（BattleScene深度适配）
- [ ] 音效资源文件添加（BGM + SE）
- [ ] 角色立绘实际图片资源
- [ ] 成就界面UI
- [ ] 酒馆NPC对话升级
- [ ] 多语言支持

---

## 开发命令

```bash
npm start      # 启动开发服务器 (http://localhost:3000)
npm run build  # 构建生产版本
npm run preview # 预览生产版本
```

---

## BattleSystem战斗流程

```
回合开始
    ↓
处理Buff效果（中毒扣血/回血/护盾）
    ↓
检测可用的角色技能
    ↓
├─ 有可用技能 → 执行技能（伤害/Buff/治疗）
├─ 无可用技能 → 执行普通攻击
    ↓
眩晕检测 → 被眩晕则跳过行动
    ↓
伤害计算（含Buff加成）
    ↓
应用伤害 → 吸血效果
    ↓
死亡检测
    ↓
回合结束
```

---

## BaseScene 底部导航设计

### Tab 配置
```javascript
const tabs = [
  { key: 'tavern', icon: '酒', label: '酒馆' },
  { key: 'team', icon: '队', label: '队伍' },
  { key: 'dungeon', icon: '牢', label: '禁区' },
  { key: 'shop', icon: '店', label: '商店' },
  { key: 'settings', icon: '设', label: '设置' }
];
```

### 切换逻辑
- `switchTab(key)` - 切换Tab并更新高亮状态
- `showView(key)` - 显示对应视图内容
- `clearContent()` - 保留导航栏，清除内容区

---

## 数据规范（强制执行）

### 1. 禁止硬编码数字和文本

**规则**：代码中不得直接写入任何数字和文本，必须通过常量表或语言表引用。

**正确示例**：
```javascript
// ❌ 错误：硬编码
this.add.text(100, 50, '欢迎来到霓虹酒馆', { fontSize: '18px' });

// ✅ 正确：引用常量表和语言表
this.add.text(Const.UI.TITLE_X, Const.UI.TITLE_Y, Lang.tavern.welcome, { 
  fontSize: Const.UI.FONT_SIZE_TITLE 
});
```

**常量表位置**：`src/game/data/Const.js`
**语言表位置**：`src/game/data/Lang.js`

---

### 2. Excel数据表驱动JSON

**规则**：所有游戏数据JSON文件必须由Excel表转换生成，禁止直接编辑JSON文件。

**流程**：
```
Excel数据表 (assets/data/excel/*.xlsx)
        ↓
    一键转表脚本
        ↓
JSON数据文件 (assets/data/json/*.json)
        ↓
    代码引用
```

**操作步骤**：
1. 在对应的Excel表中编辑数据
2. 执行一键转表命令：`npm run convert-data`
3. 代码自动引用生成的JSON文件

**禁止操作**：
- 直接编辑 `assets/data/json/` 目录下的任何JSON文件
- 在代码中硬编码游戏配置数据

---

### 3. Excel表格式规范

**规则**：所有Excel数据表必须遵循以下格式要求：

#### 表头结构（前3行）
| 行号 | 内容 | 说明 |
|------|------|------|
| 第1行 | 字段名 | 英文字段名，如 `id`, `name`, `baseHp` |
| 第2行 | 数据类型 | `int`, `float`, `string`, `bool`, `array`, `json` |
| 第3行 | 中文解释 | 字段说明，如 `角色ID`, `角色名称`, `基础生命值` |
| 第4行+ | 数据内容 | 实际数据行 |

#### 格式要求
- **冻结表头**：前3行必须冻结，滚动时保持可见
- **首列冻结**：ID列必须冻结，方便查看
- **数据类型标注**：每个字段必须标注数据类型
- **中文解释**：每个字段必须有中文说明

**示例**：
```
| id        | name     | baseHp | baseAtk |
|-----------|----------|--------|---------|
| string    | string   | int    | int     |
| 角色ID    | 角色名称 | 基础生命值 | 基础攻击力 |
| warrior_001 | 战士   | 500    | 30      |
| mage_001  | 法师     | 300    | 50      |
```

---

### 当前问题清单（待修复）

| 问题 | 状态 | 说明 |
|------|------|------|
| 代码中硬编码颜色值 | ❌ 待修复 | 如 `0x00ffff`, `#ff66cc` 等 |
| 代码中硬编码布局数值 | ❌ 待修复 | 如 `150`, `80`, `50` 等 |
| 代码中硬编码文本 | ❌ 待修复 | 如 `'酒馆'`, `'赛博币: 0'` 等 |
| Excel表缺少数据类型行 | ❌ 待修复 | 所有表需要添加第2行数据类型 |
| Excel表缺少中文解释行 | ❌ 待修复 | 所有表需要添加第3行中文解释 |
| Excel表未冻结表头 | ❌ 待修复 | 所有表需要冻结前3行 |
| 缺少一键转表脚本 | ❌ 待创建 | 需要创建 `scripts/convert-data.js` |
| 缺少JSON输出目录 | ❌ 待创建 | 需要创建 `assets/data/json/` |
