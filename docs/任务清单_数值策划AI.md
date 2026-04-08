# 数值策划AI任务清单

**项目**: 废土元年 (NeonAbyss)
**更新日期**: 2026-04-07
**配表路径**: `/workspace/NeonAbyss/assets/data/json/`
**Excel路径**: `/workspace/NeonAbyss/assets/data/excel/`
**转换命令**: `cd /workspace/NeonAbyss && npm run convert`

---

## 任务总览

| 优先级 | 任务数 | 说明 |
|--------|--------|------|
| P0（阻塞核心玩法） | 1 | 卡牌ID体系统一 |
| P1（影响系统完整性） | 3 | 敌人ID统一、抽卡概率、Boss元素 |
| P2（完善体验） | 2 | 能力效果差异化、成就条件去重 |
| **合计** | **6** | |

---

## N-01：统一卡牌ID体系（gachaItems ↔ minionCards）

**优先级**: P0
**涉及文件**: `gachaItems.json`（88条）、`minionCards.json`（100条）

### 问题描述
两套卡牌ID体系无法互通：
- `gachaItems.json` 使用 `FM001~FM096` 格式（旧）
- `minionCards.json` 使用 `MC_wind_support_001` 等格式（新）

这导致抽卡系统无法正确产出融合姬——抽到了 `FM005` 但不知道对应哪张 `MC_xxx` 卡牌。

### 解决方案

**方案A（推荐）：将 gachaItems.json 的 cardId 全部更新为 minionCards.json 的 MC_ 格式**

1. 读取 `minionCards.json`，建立 FM序号 → MC_ID 的映射：
   - `minionCards.json` 中每张卡有 `cardId`（如 `MC_wind_support_001`）和序号（按数组索引+1）
   - FM001 → 第1张卡的 MC_ID，FM002 → 第2张卡的 MC_ID，以此类推

2. 更新 `gachaItems.json` 中所有 `cardId` 字段为对应的 MC_ID

3. 确认映射关系：88条 gachaItems 应能映射到 88 张 minionCards（100张中有12张可能不在卡池中，如LE品质限定卡）

**方案B：在 minionCards.json 中增加 fmId 字段**
- 为每张卡添加 `fmId: "FM001"` 字段
- 程序通过 fmId 桥接两套ID

### 验收标准
- [ ] gachaItems.json 中所有 cardId 都能在 minionCards.json 中找到
- [ ] 映射关系文档化（附在配表指导文档中）
- [ ] `npm run convert` 无报错
- [ ] 程序AI确认抽卡系统能正确读取卡牌

---

## N-02：统一敌人ID体系（wildStages ↔ enemies）

**优先级**: P1
**涉及文件**: `wildStages.json`（100条）、`enemies.json`（20条）

### 问题描述
两套敌人ID格式不匹配：
- `wildStages.json` 使用 `E001~E010` 格式
- `enemies.json` 使用 `E_M001~E_M010`（变异生物）和 `E_L001~E_L010`（失心者）

### 解决方案

**方案A（推荐）：更新 wildStages.json 的敌人ID**

1. 读取 `wildStages.json`，找到所有 `enemyId` 字段
2. 根据关卡主题确定敌人类型：
   - 野外关卡主要使用变异生物（`E_M001~E_M010`）
   - 禁区关卡可能使用失心者（`E_L001~E_L010`）
3. 将 `E001` → `E_M001`，`E002` → `E_M002`，以此类推
4. 如果某些关卡需要失心者类型敌人，使用 `E_Lxxx` 格式

**方案B：在 enemies.json 中增加 E001~E010 的别名**
- 不推荐，会增加维护成本

### 验收标准
- [ ] wildStages.json 中所有 enemyId 都能在 enemies.json 中找到
- [ ] `npm run convert` 无报错
- [ ] 程序AI确认关卡系统能正确加载敌人数据

---

## N-03：确认并统一抽卡概率体系

**优先级**: P1
**涉及文件**: `gachaPools.json`、`gachaItems.json`

### 问题描述
策划案定义了明确的概率百分比（R 85%、SR 12%、SSR 2.5%、UR 0.5%），但 `gachaItems.json` 使用权重制（R权重500、SR权重300、SSR权重150、UR权重40、LE权重10），两者换算后概率不一致。

### 当前权重与概率

| 品质 | 权重 | 换算概率 | 策划案概率 | 差异 |
|------|------|---------|-----------|------|
| R | 500 | 47.6% | 85.0% | -37.4% |
| SR | 300 | 28.6% | 12.0% | +16.6% |
| SSR | 150 | 14.3% | 2.5% | +11.8% |
| UR | 40 | 3.8% | 0.5% | +3.3% |
| LE | 10 | 1.0% | — | 策划案未定义LE |

### 解决方案

**请数值策划确认**：以哪个为准？

**方案A：以策划案百分比为准，调整权重**
- R: 85% → 权重 8500
- SR: 12% → 权重 1200
- SSR: 2.5% → 权重 250
- UR: 0.5% → 权重 50
- LE: 0%（不在常驻池）→ 移除

**方案B：以当前权重为准，更新策划案**
- 将策划案中的概率改为实际权重换算值

### 验收标准
- [ ] gachaItems.json 权重与策划案概率一致
- [ ] 策划案文档同步更新
- [ ] 100次模拟抽卡的品质分布与预期概率误差 < 5%

---

## N-04：Boss 元素与区域匹配

**优先级**: P1
**涉及文件**: `bosses.json`（10条）

### 问题描述
2个Boss的元素与所在区域主题不匹配：

| Boss | 当前元素 | 所在区域 | 期望元素 |
|------|---------|---------|---------|
| BOSS_002 "暴走兽王·林瑶" | wind（风） | ZONE_AQUA（沉没水城） | **water（水）** |
| BOSS_003 "枯树之心·苏薇" | water（水） | ZONE_TREE（腐化丛林） | **wind（风）** |

### 解决方案
交换两个Boss的元素：
- BOSS_002: element 从 `wind` 改为 `water`
- BOSS_003: element 从 `water` 改为 `wind`

同时检查两个Boss的技能元素是否需要同步修改（`skillIds` 引用的技能元素应与Boss元素一致）。

### 验收标准
- [ ] BOSS_002 元素为 water，所在区域为水城
- [ ] BOSS_003 元素为 wind，所在区域为丛林
- [ ] Boss技能元素与Boss元素一致
- [ ] `npm run convert` 无报错

---

## N-05：能力效果差异化

**优先级**: P2
**涉及文件**: `abilities.json`（106条）

### 问题描述
发现2组能力效果完全重复：

| 能力A | 能力B | 共同效果 |
|-------|-------|---------|
| DPS_CORE_05 "元素共鸣" | DPS_ATK_02 "锋锐" | 都是 `atk_boost_percent: 0.15`（攻击力+15%） |

相同效果的能力会导致玩家选择无意义，降低养成深度。

### 解决方案
修改 DPS_CORE_05 "元素共鸣" 的效果，使其具有独特性：

**建议方案**：
- 改为元素伤害加成（而非普攻攻击力加成）
- 效果：`element_damage_boost: 0.15`（所有元素伤害+15%）
- 描述更新为："所有元素技能伤害提升15%"

### 验收标准
- [ ] DPS_CORE_05 和 DPS_ATK_02 效果不同
- [ ] 修改后的效果在 abilities.json 中格式正确
- [ ] `npm run convert` 无报错

---

## N-06：成就条件去重

**优先级**: P2
**涉及文件**: `achievement.json`（56条）

### 问题描述
2个成就的达成条件完全相同：

| 成就 | 条件 | 奖励 |
|------|------|------|
| EXP_015 "星舰零件收集者" | `collect_ship_parts: 10` | 源核5000 + TITLE_EXP_015_LE |
| SPC_005 "星舰启航" | `collect_ship_parts: 10` | 源核5000 + FRAME_SPC_005 |

两个成就都是"收集全部10个星舰零件"，但分属不同分类（探索 vs 特殊），奖励也不同。

### 解决方案

**方案A（推荐）：修改 SPC_005 的条件，使其更难达成**
- 改为：集齐全部10个星舰零件 **且** 通关第十章最终Boss
- condition: `collect_ship_parts: 10` → 增加 `clear_final_boss: 1`
- 这样 SPC_005 成为 EXP_015 的"进阶版"

**方案B：合并为一个成就**
- 删除 SPC_005，保留 EXP_015
- 不推荐，因为特殊成就应该有独特性

### 验收标准
- [ ] EXP_015 和 SPC_005 条件不同
- [ ] 成就总数仍为56条（如果方案A）
- [ ] `npm run convert` 无报错

---

## 已修复确认（无需处理）

| 编号 | 问题 | 修复状态 |
|------|------|---------|
| N04(旧) | SK_T_Active06 baseMultiplier=4 | ✅ 已修复 |
| N17 | levelUp.json upgradeCostBase 全为100 | ✅ 已修复（100~590递增） |
| N35 | shop引用不存在的道具 | ✅ 已修复（items.json 22→98条） |
| N01 | abilityPoolId 全为null | ✅ 已修复（100条均有值） |
| D02 | 保底机制不符 | ✅ 已修复（三级保底） |
| D12 | fusionAbilities 缺失 | ✅ 已修复（10条） |
