# 《霓虹深渊 / Neon Abyss》代码修复提示词集

> **用途**：将每段提示词直接复制到 GPT-4 / Claude 中，让大模型帮你修改代码
> **项目路径**：`D:\77-myProject\苏打地牢`（本地）/ `https://github.com/zg19840417/NeonAbyss`（远程）
> **技术栈**：Phaser 3 + JavaScript（非TypeScript）+ Vite

---

## 使用说明

1. 每段提示词都是**自包含的**，包含项目上下文、问题定位、具体修改指令
2. 提示词按 **P0（阻塞运行）→ P1（影响质量）→ P2（架构优化）** 排列
3. 建议按顺序执行：先修P0，再修P1，最后做P2
4. 每段提示词标注了涉及的**文件路径**，大模型需要读取这些文件才能修改

---

# P0 — 阻塞运行的严重问题（必须立即修复）

---

## 提示词 1：修复 BattleScene.js 语法错误

```
你是一位资深游戏前端工程师，正在修复一个 Phaser 3 游戏项目的运行时崩溃Bug。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite
- 文件路径：src/scenes/BattleScene.js

## Bug描述
BattleScene.js 第508行的 onSkillAnimation 方法中，this.add.text() 的第一个参数传了字符串而非坐标，会导致运行时崩溃。

## 当前错误代码（第506-513行）
```javascript
onSkillAnimation(character, targets, skill, onComplete) {
    const isPlayer = this.players.some(p => p.name === character.name);
    const skillText = this.add.text(character.name, {
      fontSize: '14px',
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: '#9b59b6'
    }).setOrigin(0.5);
```

## 修复要求
1. this.add.text() 的第一个参数应该是 x 坐标（数字），第二个参数是 y 坐标（数字），第三个参数是文本内容（字符串）
2. skillText 应该显示在角色卡片上方，参考 onAttackAnimation 方法中的定位方式
3. 同时检查整个文件中是否还有其他 this.add.text() 调用存在类似的参数错误

## 修复后的代码应该类似
```javascript
onSkillAnimation(character, targets, skill, onComplete) {
    const isPlayer = this.players.some(p => p.name === character.name);
    const targetCards = isPlayer ? this.enemyCards : this.playerCards;
    const characterCard = targetCards.find(card => {
      const entity = card.container.getData(isPlayer ? 'enemy' : 'player');
      return entity && entity.name === character.name;
    });
    const cardX = characterCard ? characterCard.container.x : this.cameras.main.width / 2;
    const cardY = characterCard ? characterCard.container.y : 300;
    
    const skillText = this.add.text(cardX, cardY - 80, skill.name, {
      fontSize: '14px',
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold',
      color: '#9b59b6'
    }).setOrigin(0.5);
```

请读取 src/scenes/BattleScene.js 文件，修复这个Bug，并输出完整的修复后代码。
```

---

## 提示词 2：修复 HP 字段名不一致 + Enemy 类导入问题

```
你是一位资深游戏前端工程师，正在修复一个 Phaser 3 游戏项目的数据一致性问题。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite

## 问题1：HP字段名不一致
BattleSystem.js 使用 `currentHp` 字段来追踪HP，但 Character.js 使用 `hp` 字段。这导致战斗系统对玩家角色扣血时操作了错误的字段。

### BattleSystem.js 中的使用（多处）：
- 第49行：`char.currentHp = char.maxHp;`
- 第70行：`char.currentHp = char.maxHp;`
- 第157行：`entity.currentHp = Math.max(0, entity.currentHp - poisonDamage);`
- 第169行：`entity.currentHp = Math.min(entity.maxHp, entity.currentHp + healAmount);`
- 第224行：`target.currentHp = Math.max(0, target.currentHp - result.damage);`
- 第236行：`target.currentHp = Math.min(target.maxHp, target.currentHp + result.healing);`
- 第341行：`target.currentHp = Math.max(0, target.currentHp - finalDamage);`
- 第383行：`target.currentHp = Math.max(0, target.currentHp - finalDamage);`
- 第350行：`attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);`

### Character.js 中的定义：
- 第13行：`this.hp = data.hp || this.getBaseHp();`
- 第163-176行：`takeDamage()` 方法操作 `this.hp`
- 第179-186行：`heal()` 方法操作 `this.hp`

### 修复方案
在 BattleSystem.js 的 `setPlayerTeam` 方法中，将 Character 的 `hp` 映射到 `currentHp`：
```javascript
setPlayerTeam(characters) {
    this.playerTeam = characters.map(char => {
      if (!(char instanceof Character)) {
        char = new Character(char);
      }
      char.isDead = false;
      char.currentHp = char.hp;  // ← 关键：将hp映射到currentHp
      return char;
    });
}
```
同时在 `initialize()` 中也要修复：
```javascript
initialize() {
    // ...
    this.playerTeam.forEach(char => {
      char.isDead = false;
      char.currentHp = char.hp;  // ← 同步hp到currentHp
    });
    // ...
}
```

## 问题2：setEnemyTeam 中引用了未导入的 Enemy 类
BattleSystem.js 第56行 `if (!(enemy instanceof Enemy))` 引用了 Enemy 类，但 Enemy 类定义在 BattleSystem.js 文件末尾（第520行），在 setEnemyTeam 方法被调用时 Enemy 已经定义，所以实际上这不是导入问题。但为了代码清晰度，建议确认 Enemy 类确实在同一文件中已正确定义。

## 问题3：BattleScene.js 中 updateHPDisplay 的字段同步
BattleScene.js 第593行 `player.hp = entity.currentHp;` 和第602行 `enemy.hp = entity.currentHp;` 需要确保战斗结束后将 currentHp 同步回 hp。

## 修复要求
请读取以下文件：
1. src/game/systems/BattleSystem.js
2. src/game/entities/Character.js
3. src/scenes/BattleScene.js

执行以下修复：
1. 在 BattleSystem.setPlayerTeam 中添加 `char.currentHp = char.hp` 映射
2. 在 BattleSystem.initialize 中添加 `char.currentHp = char.hp` 映射
3. 确认 Enemy 类在 BattleSystem.js 中已正确导出
4. 在 BattleScene.updateHPDisplay 中确保 hp 和 currentHp 双向同步
5. 输出所有修改后的完整代码
```

---

## 提示词 3：将 setTimeout 替换为 Phaser 定时器

```
你是一位资深游戏前端工程师，正在修复一个 Phaser 3 游戏项目的内存泄漏问题。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite
- 文件路径：src/game/systems/BattleSystem.js

## 问题
BattleSystem.js 中使用原生 setTimeout 来控制战斗回合间的延迟。当场景切换时（如玩家点击"返回基地"），这些 setTimeout 不会被自动清除，导致：
1. 已销毁的场景对象仍被回调引用
2. 闭包持有 BattleSystem 和 Scene 的引用，导致内存无法释放
3. 战斗逻辑在场景切换后继续执行，可能产生不可预期的行为

## 当前使用 setTimeout 的位置
- 第124-127行：executeAutoTurn 中技能释放后
- 第134-138行：executeAutoTurn 中普攻后
- 第283-286行：executeEnemyTurn 中技能释放后
- 第294-298行：executeEnemyTurn 中普攻后

## 修复方案
将所有 setTimeout 替换为 Phaser 的 this.scene.time.delayedCall()，这样当场景关闭时定时器会自动清除。

但注意：BattleSystem 不是 Phaser 场景，它持有 this.scene 引用。需要确保：
1. 使用 this.scene.time.delayedCall 替代 setTimeout
2. 在 BattleSystem 构造函数中存储定时器引用
3. 在 pause() 和场景 shutdown 时清除所有定时器

```javascript
// 在构造函数中添加
constructor(scene, config = {}) {
    this.scene = scene;
    this.activeTimers = [];  // ← 新增：追踪所有活跃定时器
    // ... 其余不变
}

// 新增辅助方法
delayedCall(delay, callback) {
    if (!this.scene || !this.scene.time) return;
    const timer = this.scene.time.delayedCall(delay, callback);
    this.activeTimers.push(timer);
    return timer;
}

clearTimers() {
    this.activeTimers.forEach(timer => {
        if (timer && timer.remove) timer.remove();
    });
    this.activeTimers = [];
}

// 在 pause() 中清除定时器
pause() {
    this.currentPhase = BattlePhase.PAUSED;
    this.clearTimers();  // ← 新增
}

// 修改 executeAutoTurn 中的 setTimeout
// 原来：setTimeout(() => { this.executeEnemyTurn(); }, 200 / this.battleSpeed);
// 改为：this.delayedCall(200 / this.battleSpeed, () => { this.executeEnemyTurn(); });
```

## 修复要求
请读取 src/game/systems/BattleSystem.js，执行以下修改：
1. 在构造函数中添加 activeTimers 数组
2. 添加 delayedCall() 和 clearTimers() 辅助方法
3. 将所有4处 setTimeout 替换为 this.delayedCall()
4. 在 pause() 中调用 this.clearTimers()
5. 输出完整的修复后代码
```

---

## 提示词 4：修复事件监听器内存泄漏

```
你是一位资深游戏前端工程师，正在修复一个 Phaser 3 游戏项目的事件监听器内存泄漏问题。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite

## 问题
多个场景在 create() 中通过 battleSystem.on() 注册了事件监听器，但在 shutdown() 中没有调用 battleSystem.off() 清理。这导致：
1. 场景切换后旧的事件回调仍持有旧场景的引用
2. 重复进入战斗场景会累积越来越多的监听器
3. 长时间游玩后内存持续增长

## 涉及文件和位置

### BattleScene.js（第430-450行）
```javascript
setupBattleSystem() {
    this.battleSystem = new BattleSystem(this, { battleSpeed: 1 });
    // ... setPlayerTeam, setEnemyTeam ...
    
    this.battleSystem.on('onAttack', (data) => { ... });
    this.battleSystem.on('onDamage', (data) => { ... });
    this.battleSystem.on('onBattleLog', (data) => { ... });
    this.battleSystem.on('onVictory', (data) => { ... });
    this.battleSystem.on('onDefeat', (data) => { ... });
}

shutdown() {
    if (this.battleSystem) {
      this.battleSystem.pause();
      // ← 缺少：没有调用 off() 清理事件监听器
    }
    this.tweens.killAll();
}
```

### BootScene.js
- 注册了 window.addEventListener('resize', ...) 和 window.addEventListener('orientationchange', ...)
- shutdown() 方法不会被 Phaser 自动调用（Phaser 只调用 destroy），所以这些监听器永远不会被移除

## 修复方案

### BattleScene.js 修复
```javascript
setupBattleSystem() {
    this.battleSystem = new BattleSystem(this, { battleSpeed: 1 });
    
    // 保存回调引用以便后续清理
    this._battleHandlers = {
      onAttack: (data) => { this.updateHPDisplay(data.target); },
      onDamage: (data) => { if (data.isCrit) this.showDamageNumber(data.target, data.damage, true); },
      onBattleLog: (data) => { this.addLogEntry(data.action, data.result); },
      onVictory: (data) => { this.onBattleVictory(data); },
      onDefeat: (data) => { this.onBattleDefeat(data); }
    };
    
    Object.entries(this._battleHandlers).forEach(([event, handler]) => {
      this.battleSystem.on(event, handler);
    });
}

shutdown() {
    if (this.battleSystem && this._battleHandlers) {
      Object.entries(this._battleHandlers).forEach(([event, handler]) => {
        this.battleSystem.off(event, handler);
      });
      this._battleHandlers = null;
      this.battleSystem.pause();
    }
    this.tweens.killAll();
}
```

### BootScene.js 修复
```javascript
// 在 create() 中保存引用
this._onResize = () => { this.scale.resize(window.innerWidth, window.innerHeight); };
this._onOrientationChange = () => { this.scale.resize(window.innerWidth, window.innerHeight); };
window.addEventListener('resize', this._onResize);
window.addEventListener('orientationchange', this._onOrientationChange);

// 使用 destroy() 替代 shutdown()（Phaser 会调用 destroy）
destroy() {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onOrientationChange);
    super.destroy();
}
```

## 修复要求
请读取以下文件并修复：
1. src/scenes/BattleScene.js — 修复 battleSystem 事件监听器泄漏
2. src/scenes/BootScene.js — 修复 window 事件监听器泄漏
3. 检查 DungeonScene.js 和 MainMenuScene.js 是否也有类似问题并修复
4. 输出所有修改后的完整代码
```

---

## 提示词 5：修复 excelToJson.js 数据重复 + JSON数值类型

```
你是一位资深游戏前端工程师，正在修复一个 Phaser 3 游戏项目的数据转换脚本问题。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite

## 问题1：所有JSON数据表记录重复2倍
tools/excelToJson.js 转换脚本生成的所有JSON文件中，每条记录都重复出现了2次。
- professions.json：26条记录但实际只有13个唯一职业
- skills.json：62条记录但实际只有31个唯一技能
- enemies.json：20条记录但实际只有10个唯一敌人
- equipment.json：36条记录但实际只有18个唯一装备
- achievement.json、energies.json、baseFacilities.json、reputation.json、quest.json 同样存在此问题

## 问题2：JSON数值字段类型为字符串
转换后的JSON中，数值字段被保存为字符串类型：
- `baseCrit: "8"` 应为 `baseCrit: 8`
- `baseDodge: "10"` 应为 `baseDodge: 10`
- `multiplier: "1.2"` 应为 `multiplier: 1.2`
- `isHidden: "false"` 应为 `isHidden: false`

## 修复要求
请读取 tools/excelToJson.js，执行以下修改：

1. **去重逻辑**：在写入JSON之前，根据ID字段去重。不同表的ID字段名不同：
   - professions.json → `id`
   - skills.json → `skillId`
   - enemies.json → `enemyId`
   - equipment.json → `equipId`
   - achievement.json → `achievementId`
   - energies.json → `energyId`
   - baseFacilities.json → `facilityId`
   - reputation.json → `reputationId`
   - quest.json → `questId`

2. **类型自动转换**：在转换过程中自动将数值字符串转为正确类型：
   - 纯数字字符串 → number（如 `"8"` → `8`，`"1.2"` → `1.2`）
   - `"true"`/`"false"` → boolean
   - 保留真正的字符串字段（如 name、description）

3. **转换后校验**：输出每个表的记录数统计（去重前/去重后），方便确认

4. 修复后重新运行转换脚本，输出所有修复后的JSON文件

请输出完整的修复后 excelToJson.js 代码。
```

---

## 提示词 6：统一角色数据源（消除JS硬编码 vs JSON双数据源冲突）

```
你是一位资深游戏前端工程师，正在修复一个 Phaser 3 游戏项目的双数据源冲突问题。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite

## 问题
项目中存在两套完全独立的角色职业数据，且互不关联、互相矛盾：

### 数据源A：src/game/data/CharacterClass.js（JS硬编码）
- 16个职业：iron_wall, life_guardian, steel_bastion, unyielding_will, berserker, element_mage, shadow_assassin, mech_engineer, destruction_warlock, mecha_war_god, tactical_commander, wind_swordsman, time_walker, natural_healer, holy_priest, elemental_lord
- 字段：baseHp, baseAtk, baseCritRate, baseDodgeRate, baseCritDamage, baseDamageReduction, baseLifeSteal, baseHatredBonus
- 定位枚举：tank/dps/support/healer

### 数据源B：assets/data/json/professions.json（Excel转JSON）
- 13个完全不同的职业：quantum_fortress, iron_berserker, battle_engineer 等
- 字段：baseHealth, baseAttack, baseCrit(字符串), baseDodge(字符串)
- 定位枚举：tank/damage/support/heal

## 修复方案
以 CharacterClass.js（数据源A）为唯一数据源，因为：
1. 它的字段更完整（包含暴击伤害、减伤、吸血、仇恨）
2. 它的类型正确（number而非string）
3. Character.js 实体类依赖它的字段结构

具体修改：
1. professions.json 中的数据应与 CharacterClass.js 保持一致，或暂时标记为废弃
2. 统一定位枚举值：使用 tank/dps/support/healer
3. 如果 professions.json 有 CharacterClass.js 没有的字段（如 recruitmentCost、skillId），将这些字段补充到 CharacterClass.js 中

## 修复要求
请读取以下文件：
1. src/game/data/CharacterClass.js
2. assets/data/json/professions.json
3. src/game/entities/Character.js（确认依赖的字段）

执行以下操作：
1. 对比两份数据，列出所有差异
2. 以 CharacterClass.js 为准，更新 professions.json 使其数据一致
3. 统一字段命名和枚举值
4. 补充缺失字段
5. 输出所有修改后的文件内容
```

---

# P1 — 影响质量的问题（本周修复）

---

## 提示词 7：抽取统一的 DamageCalculator

```
你是一位资深游戏前端工程师，正在重构一个 Phaser 3 游戏项目的伤害计算逻辑。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite

## 问题
项目中存在三套不同的伤害计算公式，对防御、暴击、减伤的处理各不相同：

### 公式1：BattleSystem.calculateDamage()（第402-432行）
```javascript
calculateDamage(attacker, target) {
    let attackerAtk = attacker.atk || 20;
    let targetDef = target.def || 5;
    // 处理buff加成...
    const baseDamage = attackerAtk - targetDef * 0.5;
    const variance = 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.floor(baseDamage * variance));
}
```
- 使用 attacker.atk - target.def * 0.5
- 暴击在调用处单独处理（×2）
- 不考虑目标的减伤率

### 公式2：Character.attack()（第188-214行）
```javascript
attack(target, skillMultiplier = 1) {
    let damage = this.atk * skillMultiplier;
    let isCritical = Math.random() < this.critRate;
    if (isCritical) damage *= this.critDamage;
    let actualDamage = target.takeDamage(damage);
    // ...
}
```
- 不考虑防御力
- 使用 this.critDamage（如1.5倍）而非固定2倍
- 通过 target.takeDamage() 间接应用减伤

### 公式3：Character.takeDamage()（第163-177行）
```javascript
takeDamage(damage) {
    let actualDamage = Math.max(1, Math.floor(damage * (1 - this.getBaseDamageReduction())));
    this.hp -= actualDamage;
    // ...
}
```
- 使用百分比减伤 (1 - damageReduction)
- 最低伤害为1

## 修复方案
创建 src/game/systems/DamageCalculator.js，统一伤害计算：

```javascript
export default class DamageCalculator {
    /**
     * 计算伤害
     * @param {Object} attacker - 攻击者
     * @param {Object} target - 目标
     * @param {Object} options - 可选参数
     * @returns {Object} { damage, isCritical, isDodged, attacker, target }
     */
    static calculate(attacker, target, options = {}) {
        const { skillMultiplier = 1, ignoreDefense = false } = options;
        
        // 1. 闪避判定
        if (Math.random() < (target.dodgeRate || 0)) {
            return { damage: 0, isCritical: false, isDodged: true, attacker, target };
        }
        
        // 2. 计算攻击力（含buff）
        let atk = DamageCalculator.getEffectiveAtk(attacker);
        atk *= skillMultiplier;
        
        // 3. 计算防御力（含buff）
        let def = ignoreDefense ? 0 : DamageCalculator.getEffectiveDef(target);
        
        // 4. 基础伤害
        let damage = Math.max(1, atk - def * 0.5);
        
        // 5. 随机浮动
        damage *= (0.9 + Math.random() * 0.2);
        
        // 6. 暴击
        let critRate = DamageCalculator.getEffectiveCritRate(attacker);
        let isCritical = Math.random() < critRate;
        if (isCritical) {
            let critDamage = attacker.critDamage || 2;
            damage *= critDamage;
        }
        
        // 7. 减伤
        let damageReduction = DamageCalculator.getEffectiveDamageReduction(target);
        damage *= (1 - damageReduction);
        
        // 8. 最低伤害
        damage = Math.max(1, Math.floor(damage));
        
        return { damage, isCritical, isDodged: false, attacker, target };
    }
    
    static getEffectiveAtk(entity) {
        let atk = entity.atk || 0;
        if (entity.buffs) {
            for (const buff of entity.buffs) {
                if (buff.type === 'atk_up') atk *= (1 + buff.value);
                if (buff.type === 'atk_down') atk *= (1 - buff.value);
            }
        }
        return atk;
    }
    
    static getEffectiveDef(entity) {
        let def = entity.def || 0;
        if (entity.buffs) {
            for (const buff of entity.buffs) {
                if (buff.type === 'def_up') def *= (1 + buff.value);
                if (buff.type === 'def_down') def *= (1 - buff.value);
                if (buff.type === 'shield') def += buff.value;
            }
        }
        return def;
    }
    
    static getEffectiveCritRate(entity) {
        let rate = entity.critRate || 0;
        if (entity.buffs) {
            for (const buff of entity.buffs) {
                if (buff.type === 'crit_up') rate += buff.value;
                if (buff.type === 'crit_down') rate -= buff.value;
            }
        }
        return Math.min(Math.max(rate, 0), 0.90);
    }
    
    static getEffectiveDamageReduction(entity) {
        let reduction = entity.damageReduction || 0;
        if (entity.buffs) {
            for (const buff of entity.buffs) {
                if (buff.type === 'shield') reduction += buff.value * 0.1;
            }
        }
        return Math.min(reduction, 0.75);
    }
}
```

## 修复要求
1. 创建 src/game/systems/DamageCalculator.js（使用上面的代码）
2. 修改 BattleSystem.js，将 calculateDamage()、executePlayerAttack()、executeEnemyAttack() 中的伤害计算替换为 DamageCalculator.calculate()
3. 修改 Character.js 的 attack() 方法，使用 DamageCalculator.calculate()
4. 在 DamageCalculator.calculate() 中加入闪避判定
5. 输出所有新建和修改的文件完整代码
```

---

## 提示词 8：统一存档系统

```
你是一位资深游戏前端工程师，正在重构一个 Phaser 3 游戏项目的存档系统。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite

## 问题
项目中存在三套独立的存档系统，各自直接操作 localStorage：
1. SaveSystem → localStorage['soda_dungeon_save']（主存档+备份）
2. DungeonSystem.save() → localStorage['dungeonSystem']（第327行）
3. BaseSystem.save() → localStorage['baseSystem']（第286行）

问题：
- 非原子性：保存到一半崩溃会导致数据不一致
- SaveSystem 的 base/dungeon 数据和 DungeonSystem/BaseSystem 各自的存档可能不同步
- BaseSystem.load() 没有 try-catch（第289行），JSON解析失败会崩溃
- validateSaveData 验证过于宽松（只检查 version/base/dungeon 是否存在）

## 修复方案
让 DungeonSystem 和 BaseSystem 不再直接操作 localStorage，而是通过 SaveSystem 统一管理。

### 修改 BaseSystem.js
```javascript
// 删除 save() 和 load() 方法（第285-300行）
// 改为由 SaveSystem 统一调用 toJSON() 和构造函数
```

### 修改 DungeonSystem.js
```javascript
// 删除 save() 和 load() 方法（第327-352行）
// 改为由 SaveSystem 统一调用 toJSON() 和构造函数
```

### 增强 SaveSystem.js 的 validateSaveData
```javascript
validateSaveData(saveData) {
    if (!saveData || typeof saveData !== 'object') return false;
    if (!saveData.version || typeof saveData.version !== 'string') return false;
    if (!saveData.base || typeof saveData.base !== 'object') return false;
    if (!saveData.dungeon || typeof saveData.dungeon !== 'object') return false;
    
    // 新增：数值范围校验
    if (typeof saveData.base.coins !== 'number' || saveData.base.coins < 0) return false;
    if (typeof saveData.dungeon.currentFloor !== 'number' || saveData.dungeon.currentFloor < 1) return false;
    
    // 新增：结构完整性校验
    if (!Array.isArray(saveData.base.characters)) return false;
    if (!Array.isArray(saveData.base.team)) return false;
    
    return true;
}
```

### 增强 SaveSystem 的 importSave
```javascript
importSave(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const saveData = JSON.parse(e.target.result);
                if (!this.validateSaveData(saveData)) {
                    reject(new Error('无效的存档文件：数据验证失败'));
                    return;
                }
                // 深度清洗：只保留已知字段，防止注入
                const cleanData = this.sanitizeSaveData(saveData);
                cleanData.timestamp = Date.now();
                const result = this.save(cleanData);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsText(file);
    });
}

sanitizeSaveData(data) {
    return {
        version: data.version,
        timestamp: data.timestamp,
        player: data.player || {},
        base: data.base || {},
        dungeon: data.dungeon || {},
        team: Array.isArray(data.team) ? data.team : [],
        inventory: Array.isArray(data.inventory) ? data.inventory : [],
        settings: data.settings || {},
        statistics: data.statistics || {},
        achievements: data.achievements || {},
        quests: data.quests || {}
    };
}
```

## 修复要求
请读取以下文件并修改：
1. src/game/systems/SaveSystem.js — 增强 validateSaveData、importSave，新增 sanitizeSaveData
2. src/game/systems/BaseSystem.js — 删除 save()/load() 方法
3. src/game/systems/DungeonSystem.js — 删除 save()/load() 方法
4. 检查所有调用 BaseSystem.save/load 和 DungeonSystem.save/load 的地方，改为通过 SaveSystem
5. 输出所有修改后的完整代码
```

---

## 提示词 9：修复 Character.js 升级属性未完全重算 + 缺少闪避判定

```
你是一位资深游戏前端工程师，正在修复一个 Phaser 3 游戏项目的角色系统Bug。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite
- 文件路径：src/game/entities/Character.js

## Bug1：levelUp() 只重算了 maxHp 和 atk，遗漏了其他属性
当前代码（第150-161行）：
```javascript
levelUp() {
    this.level++;
    this.maxExp = this.calculateMaxExp();
    let oldMaxHp = this.maxHp;
    this.maxHp = this.getMaxHp();
    this.hp += (this.maxHp - oldMaxHp);
    this.atk = this.getAtk();
    // ← 缺少：critRate, dodgeRate, critDamage, damageReduction, lifeSteal 未重算
    return { levelUp: true, newLevel: this.level };
}
```

## Bug2：attack() 方法缺少闪避判定
当前代码（第188-214行）直接计算伤害，没有检查目标的 dodgeRate。

## Bug3：takeDamage() 方法也没有闪避判定
闪避判定应该在伤害计算流程的最前面。

## 修复要求
请读取 src/game/entities/Character.js，执行以下修改：

1. 修复 levelUp()：重算所有属性
```javascript
levelUp() {
    this.level++;
    this.maxExp = this.calculateMaxExp();
    let oldMaxHp = this.maxHp;
    this.maxHp = this.getMaxHp();
    this.hp += (this.maxHp - oldMaxHp);
    this.atk = this.getAtk();
    this.critRate = this.getCritRate();
    this.dodgeRate = this.getDodgeRate();
    this.critDamage = this.getBaseCritDamage();
    this.damageReduction = this.getBaseDamageReduction();
    this.lifeSteal = this.getBaseLifeSteal();
    return { levelUp: true, newLevel: this.level };
}
```

2. 修复 attack()：在伤害计算前加入闪避判定
```javascript
attack(target, skillMultiplier = 1) {
    if (this.isDead || target.isDead) return null;
    
    // 闪避判定
    if (Math.random() < target.dodgeRate) {
        return { damage: 0, isCritical: false, isDodged: true, attacker: this, target };
    }
    
    // ... 原有逻辑不变
}
```

3. 修复 takeDamage()：加入闪避判定
```javascript
takeDamage(damage) {
    if (this.isDead) return 0;
    
    // 闪避判定
    if (Math.random() < this.dodgeRate) {
        return -1; // -1 表示闪避
    }
    
    // ... 原有逻辑不变
}
```

4. 输出完整的修复后代码
```

---

## 提示词 10：修复品质概率计算 Bug + 招募费用不区分品质

```
你是一位资深游戏前端工程师，正在修复一个 Phaser 3 游戏项目的招募系统Bug。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite
- 文件路径：src/game/systems/BaseSystem.js

## Bug1：品质概率计算错误（第109-117行）
```javascript
selectQualityByProbability(synthesizerBonus = 1) {
    const roll = Math.random();
    
    if (roll < 0.01 * synthesizerBonus) return 'mythic';      // 1% * bonus
    if (roll < 0.05 * synthesizerBonus) return 'legendary';   // 4% * bonus
    if (roll < 0.15 * synthesizerBonus) return 'epic';        // 10% * bonus
    if (roll < 0.35 * synthesizerBonus) return 'rare';        // 20% * bonus
    return 'common';                                           // 剩余
}
```

问题：当 synthesizerBonus > 1 时（合成台升级后），概率区间会重叠。
例如 synthesizerBonus = 1.5 时：
- mythic: roll < 0.015
- legendary: roll < 0.075（包含了0.015-0.075的区间，但这个区间应该属于epic）
- 实际上由于是 if-else 链，legendary 的判断 `roll < 0.075` 包含了 mythic 的区间

正确的做法应该是使用差值概率：
```javascript
selectQualityByProbability(synthesizerBonus = 1) {
    const roll = Math.random();
    const b = synthesizerBonus;
    
    // 累积概率，每段是独立区间
    const mythicChance = 0.01 * b;
    const legendaryChance = 0.04 * b;
    const epicChance = 0.10 * b;
    const rareChance = 0.20 * b;
    
    if (roll < mythicChance) return 'mythic';
    if (roll < mythicChance + legendaryChance) return 'legendary';
    if (roll < mythicChance + legendaryChance + epicChance) return 'epic';
    if (roll < mythicChance + legendaryChance + epicChance + rareChance) return 'rare';
    return 'common';
}
```

## Bug2：招募费用固定200，不区分品质（第149行）
```javascript
const recruitCost = 200;  // 所有品质都是200币
```

应该根据品质调整费用：
```javascript
const qualityCosts = {
    common: 100,
    rare: 200,
    epic: 500,
    legendary: 1000,
    mythic: 2000
};
const recruitCost = qualityCosts[character.quality] || 200;
```

## 修复要求
请读取 src/game/systems/BaseSystem.js，修复以上两个Bug，输出完整的修复后代码。
```

---

## 提示词 11：修复离线收益计算 + Boss缩放因子可能为负数

```
你是一位资深游戏前端工程师，正在修复一个 Phaser 3 游戏项目的数值计算Bug。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite
- 文件路径：src/game/systems/DungeonSystem.js

## Bug1：离线收益计算不准确（第219-249行）
当前使用线性估算：`avgGoldPerBattle = 50 + this.currentFloor * 10`
问题：没有考虑战力瓶颈（玩家可能卡在某一层打不过），导致离线收益严重虚高。

修复：加入战力瓶颈系数，假设玩家在当前楼层有50%的胜率：
```javascript
calculateOfflineProgress() {
    // ...
    const winRate = 0.5; // 假设在当前楼层50%胜率
    const effectiveBattles = Math.floor(estimatedBattles * winRate);
    // ...
}
```

## Bug2：Boss缩放因子可能为负数（第106行）
```javascript
const scaleFactor = 1 + (floorNumber - this.currentDimension * 10) * 0.1;
```
当 floorNumber < this.currentDimension * 10 时（例如第11层但currentDimension=2），scaleFactor会小于1甚至为负数。

修复：
```javascript
const scaleFactor = Math.max(0.5, 1 + (floorNumber - this.currentDimension * 10) * 0.1);
```

## 修复要求
请读取 src/game/systems/DungeonSystem.js，修复以上两个Bug，输出完整的修复后代码。
```

---

## 提示词 12：修复 Lang.js 语言切换 + UIManager 硬编码清理

```
你是一位资深游戏前端工程师，正在修复一个 Phaser 3 游戏项目的多语言和硬编码问题。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite

## 问题1：Lang.js 不支持语言切换
src/game/data/Lang.js 中 `Lang[item.id] = item.zh_cn` 写死了中文，无法切换语言。

## 问题2：UIManager.js 大量硬编码
src/game/ui/UIManager.js 中存在大量硬编码：
- 颜色值：`0x2a2520`, `'#d4ccc0'`, `'#d4a574'`, `0x4a4540` 等
- 字体：`'Noto Sans SC'` 出现至少6处
- 尺寸：`width = 140`, `height = 50`, `fontSize = 14`
- 中文文本：`'角色'`, `'✕'` 等

## 修复要求

### 修复 Lang.js
请读取 src/game/data/Lang.js 和 assets/data/json/language.json，修改为支持运行时语言切换：
```javascript
import langData from '../../../assets/data/json/language.json';

const Lang = {};
let currentLang = 'zh_cn';

function buildLang(lang) {
    Object.keys(Lang).forEach(k => delete Lang[k]);
    langData.forEach(item => {
        if (item && item.id) {
            Lang[item.id] = item[lang] || item.zh_cn || item.id;
        }
    });
}

buildLang(currentLang);

export function setLanguage(lang) {
    currentLang = lang;
    buildLang(lang);
}

export function getCurrentLanguage() {
    return currentLang;
}

export function t(key, params = {}) {
    let value = Lang[key];
    if (!value) {
        console.warn(`[Lang] Missing key: ${key}`);
        return key;
    }
    Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return value;
}

export default Lang;
```

### 修复 UIManager.js
请读取 src/game/ui/UIManager.js 和 src/game/data/Const.js，将所有硬编码替换为 Const 中的常量。如果 Const 中缺少某个常量，先在 Const.js 中补充定义。

输出所有修改后的完整代码。
```

---

# P2 — 架构优化（下迭代执行）

---

## 提示词 13：创建统一 EventBus + GameStore

```
你是一位资深游戏前端架构师，正在为一个 Phaser 3 游戏项目创建核心基础设施层。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite
- 项目路径：src/

## 背景
当前项目中存在以下架构问题：
1. window.gameData 全局变量被多个场景直接读写，无校验无通知
2. BattleSystem、DungeonSystem、AchievementSystem 各自实现了 on/emit/off 事件系统（3处重复代码）
3. 场景间通过全局变量、scene data、函数回调三种方式传递数据，混乱不堪

## 任务1：创建 src/core/EventBus.js
创建一个统一的、全局单例的事件总线，替代所有重复的事件系统实现：

```javascript
export default class EventBus {
    constructor() {
        this._listeners = {};
        this._onceListeners = {};
        this._maxListeners = 20;
        this._debugMode = false;
    }

    on(event, callback, priority = 0) {
        if (!this._listeners[event]) this._listeners[event] = [];
        if (this._listeners[event].length >= this._maxListeners) {
            console.warn(`[EventBus] Max listeners (${this._maxListeners}) reached for event: ${event}`);
        }
        const entry = { callback, priority };
        this._listeners[event].push(entry);
        this._listeners[event].sort((a, b) => b.priority - a.priority);
        // 返回取消函数，方便清理
        return () => this.off(event, callback);
    }

    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }

    off(event, callback) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(entry => entry.callback !== callback);
    }

    emit(event, data) {
        if (this._debugMode) console.log(`[EventBus] ${event}`, data);
        const listeners = this._listeners[event];
        if (!listeners || listeners.length === 0) return;
        // 复制一份再遍历，防止回调中修改监听器数组
        [...listeners].forEach(entry => {
            try {
                entry.callback(data);
            } catch (error) {
                console.error(`[EventBus] Error in handler for "${event}":`, error);
            }
        });
    }

    removeAllListeners(event) {
        if (event) {
            delete this._listeners[event];
        } else {
            this._listeners = {};
        }
    }

    listenerCount(event) {
        return this._listeners[event]?.length || 0;
    }

    setDebugMode(enabled) {
        this._debugMode = enabled;
    }
}

// 全局单例
const eventBus = new EventBus();
export { eventBus };
export default eventBus;
```

## 任务2：创建 src/core/GameStore.js
创建一个集中式状态管理器，替代 window.gameData：

```javascript
import eventBus from './EventBus.js';

export default class GameStore {
    constructor(initialState = {}) {
        this._state = {
            coins: initialState.coins || 0,
            currentFloor: initialState.currentFloor || 1,
            maxReachedFloor: initialState.maxReachedFloor || 1,
            currentDimension: initialState.currentDimension || 1,
            team: initialState.team || [],
            characters: initialState.characters || [],
            settings: initialState.settings || {
                musicVolume: 0.7,
                sfxVolume: 0.8,
                battleSpeed: 1,
                autoBattle: false
            },
            statistics: initialState.statistics || {
                totalBattles: 0,
                totalVictories: 0,
                totalCoinsEarned: 0
            }
        };
        this._subscribers = {};
    }

    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this._state);
    }

    set(path, value) {
        const keys = path.split('.');
        const oldValue = this.get(path);
        
        let obj = this._state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        
        if (oldValue !== value) {
            this._notify(path, value, oldValue);
        }
    }

    subscribe(path, callback) {
        if (!this._subscribers[path]) this._subscribers[path] = [];
        this._subscribers[path].push(callback);
        return () => {
            this._subscribers[path] = this._subscribers[path].filter(cb => cb !== callback);
        };
    }

    _notify(path, newValue, oldValue) {
        const event = `store:${path}`;
        eventBus.emit(event, { path, newValue, oldValue });
        
        // 通知路径前缀的订阅者
        Object.keys(this._subscribers).forEach(subPath => {
            if (path.startsWith(subPath) || subPath.startsWith(path)) {
                this._subscribers[subPath].forEach(cb => cb(newValue, oldValue, path));
            }
        });
    }

    getState() {
        return JSON.parse(JSON.stringify(this._state));
    }

    setState(newState) {
        Object.assign(this._state, newState);
        eventBus.emit('store:changed', { state: this._state });
    }

    reset() {
        this._state = {};
        eventBus.emit('store:reset');
    }
}

// 全局单例
const gameStore = new GameStore();
export { gameStore };
export default gameStore;
```

## 任务3：创建 src/core/SaveManager.js
创建统一存档管理器，替代分散的存档逻辑：

```javascript
import gameStore from './GameStore.js';
import eventBus from './EventBus.js';

const SAVE_KEY = 'neon_abyss_save';
const BACKUP_KEY = 'neon_abyss_save_backup';
const CURRENT_VERSION = '1.0.0';

export default class SaveManager {
    static save() {
        try {
            const data = {
                version: CURRENT_VERSION,
                timestamp: Date.now(),
                state: gameStore.getState()
            };
            const json = JSON.stringify(data);
            localStorage.setItem(SAVE_KEY, json);
            localStorage.setItem(BACKUP_KEY, json);
            eventBus.emit('save:complete', { timestamp: data.timestamp });
            return { success: true };
        } catch (error) {
            console.error('[SaveManager] Save failed:', error);
            return { success: false, error: error.message };
        }
    }

    static load() {
        try {
            const json = localStorage.getItem(SAVE_KEY);
            if (!json) return null;
            
            const data = JSON.parse(json);
            if (!SaveManager.validate(data)) {
                console.warn('[SaveManager] Validation failed, trying backup...');
                return SaveManager.loadBackup();
            }
            
            // 版本迁移
            const migrated = SaveManager.migrate(data);
            gameStore.setState(migrated.state);
            
            eventBus.emit('save:loaded', { version: migrated.version });
            return migrated;
        } catch (error) {
            console.error('[SaveManager] Load failed:', error);
            return SaveManager.loadBackup();
        }
    }

    static loadBackup() {
        try {
            const json = localStorage.getItem(BACKUP_KEY);
            if (!json) return null;
            const data = JSON.parse(json);
            if (SaveManager.validate(data)) {
                gameStore.setState(data.state);
                return data;
            }
        } catch (error) {
            console.error('[SaveManager] Backup load failed:', error);
        }
        return null;
    }

    static validate(data) {
        if (!data || typeof data !== 'object') return false;
        if (!data.version) return false;
        if (!data.state || typeof data.state !== 'object') return false;
        return true;
    }

    static migrate(data) {
        // 预留版本迁移逻辑
        // if (data.version === '0.9.0') { ... }
        return data;
    }

    static delete() {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(BACKUP_KEY);
    }

    static hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    static exportSave() {
        const json = localStorage.getItem(SAVE_KEY);
        if (!json) return null;
        const blob = new Blob([json], { type: 'application/json' });
        return URL.createObjectURL(blob);
    }

    static startAutoSave(getStateCallback, interval = 30000) {
        return setInterval(() => {
            SaveManager.save();
        }, interval);
    }
}
```

## 修复要求
1. 创建 src/core/ 目录
2. 创建上述3个文件：EventBus.js、GameStore.js、SaveManager.js
3. 输出所有3个文件的完整代码
4. 不需要修改现有文件（集成工作在后续提示词中完成）
```

---

## 提示词 14：将 BaseScene.js 拆分为 Scene + Views

```
你是一位资深游戏前端架构师，正在重构一个 Phaser 3 游戏项目的主界面场景。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite

## 问题
BaseScene.js 有 957 行代码，承担了太多职责：
- 底部导航栏渲染
- 酒馆视图（招募/调酒师）
- 队伍视图（角色管理/移除）
- 禁区视图（层数/开始探索）
- 商店视图（购买角色）
- 设置视图（音量/速度）
- Tab切换逻辑

## 修复方案
将 BaseScene.js 拆分为：
1. `BaseScene.js`（~150行）— 仅负责场景生命周期、TabBar容器、视图切换
2. `views/TavernView.js` — 酒馆视图
3. `views/TeamView.js` — 队伍视图
4. `views/DungeonView.js` — 禁区视图
5. `views/ShopView.js` — 商店视图
6. `views/SettingsView.js` — 设置视图

每个 View 类的接口：
```javascript
export default class TavernView {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.container = scene.add.container(x, y);
        this.width = width;
        this.height = height;
        this.isVisible = false;
    }

    create() {
        // 创建所有UI元素，添加到 this.container
    }

    show() {
        this.container.setVisible(true);
        this.isVisible = true;
        this.refresh(); // 刷新数据
    }

    hide() {
        this.container.setVisible(false);
        this.isVisible = false;
    }

    refresh() {
        // 刷新显示数据
    }

    destroy() {
        this.container.destroy();
    }
}
```

BaseScene 的简化结构：
```javascript
export default class BaseScene extends Phaser.Scene {
    create() {
        this.createBackground();
        this.createHeader();
        this.createTabBar();
        this.createViews();
        this.showView('tavern');
    }

    createViews() {
        const viewArea = { x: 0, y: 120, width: this.cameras.main.width, height: 580 };
        this.views = {
            tavern: new TavernView(this, viewArea.x, viewArea.y, viewArea.width, viewArea.height),
            team: new TeamView(this, viewArea.x, viewArea.y, viewArea.width, viewArea.height),
            dungeon: new DungeonView(this, viewArea.x, viewArea.y, viewArea.width, viewArea.height),
            shop: new ShopView(this, viewArea.x, viewArea.y, viewArea.width, viewArea.height),
            settings: new SettingsView(this, viewArea.x, viewArea.y, viewArea.width, viewArea.height)
        };
        Object.values(this.views).forEach(v => v.create());
    }

    showView(viewName) {
        Object.entries(this.views).forEach(([name, view]) => {
            if (name === viewName) view.show();
            else view.hide();
        });
        this.currentView = viewName;
    }
}
```

## 修复要求
请读取 src/scenes/BaseScene.js，执行拆分：
1. 创建 src/scenes/views/ 目录
2. 将 BaseScene.js 中的各视图逻辑拆分到对应的 View 文件中
3. 简化 BaseScene.js 为视图容器
4. 确保所有功能保持不变
5. 输出所有新建和修改的文件完整代码
```

---

## 提示词 15：Vite 构建优化配置

```
你是一位资深游戏前端工程师，正在优化一个 Phaser 3 游戏项目的 Vite 构建配置。

## 项目信息
- 项目名：霓虹深渊 (Neon Abyss)
- 技术栈：Phaser 3 + JavaScript + Vite

## 问题
当前 vite.config.js 配置过于简单，缺少关键的生产构建优化：
1. 未配置代码分割 — Phaser 3 完整包约1MB+，全量加载影响首屏速度
2. 未配置压缩 — 缺少 terser minify 和 gzip/brotli
3. 未配置资源内联阈值
4. 缺少 chunk 大小警告限制

## 修复要求
请读取 vite.config.js，替换为以下优化配置：

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // 移除 console.log
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.warn']
      }
    },
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'phaser-core': ['phaser'],
          'vendor': ['phaser']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  },
  assetsInlineLimit: 4096, // 4KB以下内联
  cssCodeSplit: true,
  logLevel: 'warn'
});
```

同时建议在 package.json 中添加：
```json
{
  "scripts": {
    "analyze": "vite-bundle-visualizer"
  },
  "devDependencies": {
    "rollup-plugin-visualizer": "^5.9.0"
  }
}
```

请输出完整的 vite.config.js 和 package.json 的修改内容。
```

---

## 附录：提示词使用顺序建议

| 顺序 | 提示词编号 | 修复内容 | 预估耗时 |
|------|-----------|---------|---------|
| 1 | 提示词1 | BattleScene语法错误 | 5分钟 |
| 2 | 提示词2 | HP字段名+Enemy导入 | 30分钟 |
| 3 | 提示词3 | setTimeout→Phaser定时器 | 1小时 |
| 4 | 提示词4 | 事件监听器泄漏 | 1小时 |
| 5 | 提示词5 | excelToJson去重+类型 | 30分钟 |
| 6 | 提示词6 | 统一角色数据源 | 2小时 |
| 7 | 提示词7 | 统一DamageCalculator | 2小时 |
| 8 | 提示词8 | 统一存档系统 | 2小时 |
| 9 | 提示词9 | Character升级+闪避 | 30分钟 |
| 10 | 提示词10 | 品质概率+招募费用 | 30分钟 |
| 11 | 提示词11 | 离线收益+Boss缩放 | 30分钟 |
| 12 | 提示词12 | Lang切换+UIManager | 2小时 |
| 13 | 提示词13 | EventBus+GameStore+SaveManager | 3小时 |
| 14 | 提示词14 | BaseScene拆分 | 4小时 |
| 15 | 提示词15 | Vite构建优化 | 30分钟 |

**P0 总计：~6小时 | P1 总计：~8小时 | P2 总计：~7小时**

---

> 文档版本：v1.0 | 生成日期：2026-04-04
> 共 **15段提示词**，覆盖 P0/P1/P2 三个优先级的所有关键问题
