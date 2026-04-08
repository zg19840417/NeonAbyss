# 程序AI任务清单

**项目**: 废土元年 (NeonAbyss)
**更新日期**: 2026-04-07
**代码路径**: `/workspace/NeonAbyss/src/`
**配表路径**: `/workspace/NeonAbyss/assets/data/json/`

---

## 任务总览

| 优先级 | 任务数 | 说明 |
|--------|--------|------|
| P0（阻塞核心玩法） | 2 | 抽卡系统重构、奖励发放实现 |
| P1（影响系统完整性） | 4 | Equipment残留清理、活动/新手引导/图鉴系统 |
| P2（完善体验） | 3 | 融合系统、背包系统、活跃度宝箱接入 |
| P3（代码质量） | 1 | Equipment命名清理 |
| **合计** | **10** | |

---

## P0-01：重构 GachaSystem 抽卡逻辑

**文件**: `src/game/systems/GachaSystem.js`
**配表**: `assets/data/json/gachaItems.json`（88条）、`gachaPools.json`（1条）

### 问题描述
当前 `rollGacha()` 方法在确定品质后，调用 `createCharacter(quality)` **随机生成**角色（随机职业+随机名字），而不是从 `gachaItems.json` 配表中读取具体的融合姬卡牌。这导致：
- 玩家抽到的角色与配表无关，无法实现UP角色概率提升
- 无法实现限定卡池（不同卡池应有不同卡牌）
- 抽卡结果不可控

### 当前代码（需替换）
```js
// GachaSystem.js 第149-174行
createCharacter(quality = 'N') {
    const classes = Object.values(CharacterClass);
    const charClass = classes[Math.floor(Math.random() * classes.length)];
    const nameSet = this.getNameSetByClass(charClass);
    const randomName = nameSet[Math.floor(Math.random() * nameSet.length)];
    const data = { name: randomName, charClass, level: 1, quality };
    return new Character(data);
}
```

### 期望行为
1. `rollGacha()` 确定品质后，从 `gachaItems.json` 中**筛选该品质的所有卡牌**
2. 按权重随机选中一张具体卡牌（`gachaItems.json` 中有 `weight` 字段）
3. 通过选中的 `cardId`（如 `FM001`）从 `minionCards.json` 中获取完整卡牌数据
4. 创建对应的 Character 对象返回

### 验收标准
- [ ] 抽卡结果来自 gachaItems.json 配表，不再是随机生成
- [ ] 不同品质的卡牌按权重随机
- [ ] 保底机制（SR10/SSR40/UR200）仍然正常工作
- [ ] 抽卡历史记录显示正确的卡牌名称（来自 minionCards.json）
- [ ] `npm run build` 无报错

### 参考文件
- `assets/data/json/gachaItems.json` — 88条卡牌权重配置
- `assets/data/json/minionCards.json` — 100张融合姬完整数据
- `assets/data/json/gachaPools.json` — 卡池概率和保底配置
- `src/game/data/CharacterClass.js` — 职业定义

---

## P0-02：实现 RewardManager 奖励发放

**文件**: `src/game/systems/RewardManager.js`

### 问题描述
3个核心奖励类型的发放逻辑为空（仅记录日志，未实际发放）：

| 行号 | TODO | 当前行为 |
|------|------|---------|
| 35 | `// TODO: 实际添加随从卡到背包` | 仅 `console.log` |
| 39 | `// TODO: 实际添加芯片到背包` | 仅 `console.log` |
| 43 | `// TODO: 记录方舟部件收集` | 仅 `console.log` |

### 期望行为

**minionCard 类型**（第35行）：
- 调用 `MinionCardManager` 的添加方法，将随从卡加入玩家背包
- 如果背包已满，提示"背包已满"
- 更新存档

**chip 类型**（第39行）：
- 调用 `ChipCardManager` 的添加方法，将芯片加入玩家芯片背包
- 更新存档

**shipPart 类型**（第43行）：
- 在玩家存档中记录方舟部件收集进度
- 格式：`saveData.shipParts = saveData.shipParts || []; saveData.shipParts.push(partId);`
- 检查是否集齐全部10个，触发特殊奖励

### 验收标准
- [ ] minionCard 奖励实际添加到玩家背包（可在队伍界面看到）
- [ ] chip 奖励实际添加到玩家芯片背包
- [ ] shipPart 奖励记录到存档中
- [ ] 背包已满时有错误提示
- [ ] `npm run build` 无报错

### 参考文件
- `src/game/systems/MinionCardManager.js` — 随从卡管理
- `src/game/systems/ChipCardManager.js` — 芯片管理
- `src/game/systems/SaveSystem.js` — 存档系统

---

## P1-01：新建 ActivitySystem 活动系统

**策划案**: `docs/策划案/活动系统策划案.md`
**配表**: `assets/data/json/activityChest.json`（6条）

### 问题描述
策划案已定义5种活动类型（限时关卡、限时Boss、限时抽卡UP、每日特惠、赛季活动），但代码中完全没有 ActivitySystem。`activityChest.json` 配表存在但未被任何代码引用。

### 期望行为
1. 新建 `src/game/systems/ActivitySystem.js`
2. 实现活动数据加载、时间判断（开始/结束）、奖励领取
3. 在 BaseScene 中添加活动入口（红点提示）
4. 接入 activityChest.json 的活跃度宝箱逻辑

### 验收标准
- [ ] ActivitySystem.js 文件存在且可被 import
- [ ] 活动数据从配表/策划案加载
- [ ] 活动入口在主界面可见
- [ ] activityChest.json 被代码引用
- [ ] `npm run build` 无报错

### 参考文件
- `docs/策划案/活动系统策划案.md` — 活动规则定义
- `assets/data/json/activityChest.json` — 活跃度宝箱配置
- `src/game/systems/ShopSystem.js` — 可参考的商品/购买逻辑

---

## P1-02：新建 TutorialSystem 新手引导

**策划案**: `docs/策划案/新手引导策划案.md`

### 问题描述
策划案定义了7步新手引导流程（看板娘对话→招募→编队→探索→战斗→商店→任务），但代码中完全没有引导系统。

### 期望行为
1. 新建 `src/game/systems/TutorialSystem.js`
2. 实现步骤式引导（遮罩+高亮+箭头指向）
3. 首次进入游戏时自动触发
4. 支持跳过和重新触发
5. 引导进度存入 localStorage

### 验收标准
- [ ] TutorialSystem.js 文件存在
- [ ] 新玩家首次进入触发引导
- [ ] 引导步骤按策划案顺序执行
- [ ] 可跳过引导
- [ ] `npm run build` 无报错

### 参考文件
- `docs/策划案/新手引导策划案.md` — 7步引导流程
- `src/scenes/BaseScene.js` — 主场景（引导触发点）
- `src/game/utils/AnimationHelper.js` — 动画工具

---

## P1-03：新建 CollectionSystem 图鉴系统

**策划案**: `docs/策划案/图鉴系统策划案.md`
**配表**: `assets/data/json/minionCards.json`（100张）、`bosses.json`（10个）

### 问题描述
策划案定义了图鉴系统（角色图鉴、敌人图鉴、物品图鉴、收集进度），但代码中没有图鉴系统。

### 期望行为
1. 新建 `src/game/systems/CollectionSystem.js`
2. 实现角色图鉴浏览（按品质/元素/种族筛选）
3. 显示收集进度（已拥有/总数）
4. 未获得的显示剪影+???名称
5. 在 BaseScene 中添加图鉴入口

### 验收标准
- [ ] CollectionSystem.js 文件存在
- [ ] 可浏览100张融合姬图鉴
- [ ] 显示收集进度百分比
- [ ] 未获得卡牌显示为???
- [ ] `npm run build` 无报错

### 参考文件
- `docs/策划案/图鉴系统策划案.md` — 图鉴规则
- `assets/data/json/minionCards.json` — 100张卡牌数据
- `src/game/utils/CardRenderer.js` — 卡牌渲染器（可复用）

---

## P1-04：接入 activityChest 活跃度宝箱

**配表**: `assets/data/json/activityChest.json`（6条：4每日+2每周）
**关联**: `assets/data/json/quest.json`（22条任务，每条有 activityPoints）

### 问题描述
`activityChest.json` 已存在（6个宝箱配置），`quest.json` 中每条任务有 `activityPoints` 字段，但代码中没有任何地方引用 activityChest，活跃度宝箱功能完全不可用。

### 期望行为
1. 在 QuestSystem（或 BaseScene 的任务页面）中显示活跃度进度条
2. 当活跃度达到宝箱阈值时，宝箱可领取
3. 点击宝箱显示奖励内容（来自 activityChest.json 的 rewards 字段）
4. 领取后调用 RewardManager 发放奖励
5. 每日/每周宝箱分别计算和重置

### 验收标准
- [ ] 任务页面显示活跃度进度条和宝箱
- [ ] 完成任务后活跃度正确累加
- [ ] 宝箱达到阈值后可点击领取
- [ ] 领取后奖励实际发放
- [ ] `npm run build` 无报错

### 参考文件
- `assets/data/json/activityChest.json` — 宝箱配置（requiredPoints + rewards）
- `assets/data/json/quest.json` — 任务配置（activityPoints 字段）
- `src/game/systems/RewardManager.js` — 奖励发放

---

## P2-01：新建 FusionSystem 主副卡融合系统

**策划案**: `docs/策划案/主副卡融合系统策划案.md`
**配表**: `assets/data/json/fusionAbilities.json`（10条隐藏融合规则）

### 问题描述
策划案定义了"1张主卡 + 1张同品质副卡 + 菌丝 → 主卡进化"的融合系统，配表 fusionAbilities.json 已有10条隐藏融合规则，但代码中完全没有融合系统。

### 期望行为
1. 新建 `src/game/systems/FusionSystem.js`
2. 实现主副卡选择界面（选择主卡→选择同品质副卡）
3. 融合消耗计算（菌丝 + 可选材料）
4. 融合结果：主卡品质提升（N→R→SR→SSR→UR），保留主卡技能和部分属性
5. 隐藏融合能力触发：当主副卡满足 fusionAbilities.json 中的组合条件时，额外获得隐藏能力
6. 融合动画效果

### 验收标准
- [ ] FusionSystem.js 文件存在
- [ ] 可选择主卡和副卡进行融合
- [ ] 融合后主卡品质提升
- [ ] 满足条件时触发隐藏融合能力
- [ ] 融合消耗正确的货币
- [ ] `npm run build` 无报错

### 参考文件
- `docs/策划案/主副卡融合系统策划案.md` — 融合规则
- `assets/data/json/fusionAbilities.json` — 10条隐藏融合配方
- `assets/data/json/abilities.json` — 106条能力数据
- `src/game/systems/MinionCardManager.js` — 随从卡管理（有 mergeUpgrade 方法可参考）

---

## P2-02：完善 InventorySystem 背包系统

**策划案**: `docs/策划案/背包与物品系统策划案.md`
**配表**: `assets/data/json/items.json`（98条）

### 问题描述
当前仅有 `BaseSystem.js` 中的简单 inventory 字典（`{itemId: count}`）和4个基础方法（addItem/removeItem/getItemCount/hasItem），没有独立的背包系统UI和完整功能。

### 期望行为
1. 新建 `src/scenes/views/InventoryView.js`（背包界面）
2. 实现物品分类浏览（消耗品/插件/礼包/碎片/称号/头像框）
3. 实现物品使用/装备逻辑
4. 实现物品排序（按品质/类型/获取时间）
5. 实现批量操作（批量使用、批量出售）
6. 在 BaseScene 中添加背包入口

### 验收标准
- [ ] InventoryView.js 文件存在
- [ ] 可浏览98种道具
- [ ] 物品按分类显示
- [ ] 可使用消耗品类道具
- [ ] `npm run build` 无报错

### 参考文件
- `docs/策划案/背包与物品系统策划案.md` — 背包规则
- `assets/data/json/items.json` — 98条道具数据
- `src/game/systems/BaseSystem.js` — 现有 inventory 基础方法
- `src/scenes/views/ShopView.js` — 可参考的商品列表UI

---

## P2-03：Equipment 命名批量清理

**涉及文件**: 7个JS文件，共48处残留

### 问题描述
装备系统已替换为芯片系统，但代码中仍有48处使用 "Equipment" 命名的方法/变量/属性。虽然功能已对接 ChipCardManager，但命名不一致会导致后续维护混乱。

### 残留清单

| 文件 | 残留数 | 典型残留 |
|------|--------|---------|
| `src/game/systems/BattleSystem.js` | ~25处 | `applyEquipmentCardBonuses()`, `applyEquipmentSkills()`, `checkEquipmentTriggers()`, `executeEquipmentTrigger()`, `applyOnHitEquipmentEffects()` |
| `src/scenes/views/TeamView.js` | ~8处 | `allEquipments`, `getEquipmentStats()`, `getEquipmentQualityConfig()`, `'装备'` UI文案 |
| `src/game/systems/DungeonSystem.js` | ~6处 | `autoEquipmentEnabled`, `setAutoEquipment()` |
| `src/scenes/views/EquipmentView.js` | 整个文件 | 类名 `EquipmentView`（如果保留则重命名为 `ChipView`） |
| `src/scenes/BaseScene.js` | ~2处 | `import EquipmentView`, `showEquipmentContent()` |
| `src/scenes/PreloadScene.js` | ~1处 | `autoEquipment: true` |
| `src/scenes/SaveSystem.js` | ~1处 | `autoEquipment: false` |

### 替换规则

| 旧命名 | 新命名 |
|--------|--------|
| `Equipment` | `Chip` |
| `equipment` | `chip` |
| `EquipmentCard` | `ChipCard` |
| `EquipmentView` | `ChipView` |
| `EquipmentSkill` | `ChipSkill` |
| `autoEquipment` | `autoChip` |
| `装备` (UI文案) | `芯片` |

### 验收标准
- [ ] `src/` 下搜索 "Equipment" 仅剩注释中的历史说明
- [ ] 所有方法名、变量名、属性名已更新
- [ ] UI文案中"装备"已替换为"芯片"
- [ ] `npm run build` 无报错
- [ ] 游戏功能不受影响（芯片系统正常工作）

---

## 已修复确认（无需处理）

以下问题在远程更新中已被修复，**不需要再处理**：

| 编号 | 问题 | 修复状态 |
|------|------|---------|
| C12 | hpPercentBefore 在死亡后计算 | ✅ 已修复（移到扣血前，第862行） |
| C13 | BattleScene.playerTeam 不存在 | ✅ 已修复（改用 this.minions） |
| C30 | BaseSystem.addCurrency 重复定义 | ✅ 已修复（删除第一套） |
| C31 | 战败给予全额奖励 | ✅ 已修复（仅给10%菌丝安慰奖） |
