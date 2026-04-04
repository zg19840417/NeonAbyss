const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../assets/data/excel');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function createWorkbook() {
  return XLSX.utils.book_new();
}

function addSheet(workbook, sheetName, data) {
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, ws, sheetName);
}

function saveWorkbook(workbook, fileName) {
  const filePath = path.join(outputDir, fileName);
  XLSX.writeFile(workbook, filePath);
  console.log(`已创建: ${filePath}`);
}

// ============================================
// enemies.xlsx - 敌人配置表（完善版）
// ============================================
function createEnemiesConfig() {
  const workbook = createWorkbook();
  
  // 普通敌人配置
  const enemies = [
    { enemyId: "E001", name: "机械猎犬", englishName: "Mechanical Hound", type: "mech", minFloor: 1, maxFloor: 20, position: "front", baseHp: 80, baseAtk: 15, baseCritRate: 0.15, baseDodgeRate: 0.10, hpGrowth: 1.12, atkGrowth: 1.10, speed: 12, expReward: 8, coinReward: 15, dropRate: 0.30 },
    { enemyId: "E002", name: "巡逻机甲", englishName: "Patrol Mech", type: "mech", minFloor: 1, maxFloor: 30, position: "front", baseHp: 120, baseAtk: 12, baseCritRate: 0.10, baseDodgeRate: 0.05, hpGrowth: 1.13, atkGrowth: 1.09, speed: 8, expReward: 10, coinReward: 20, dropRate: 0.25 },
    { enemyId: "E003", name: "变异蜘蛛", englishName: "Mutant Spider", type: "mutant", minFloor: 5, maxFloor: 35, position: "back", baseHp: 60, baseAtk: 14, baseCritRate: 0.20, baseDodgeRate: 0.30, hpGrowth: 1.11, atkGrowth: 1.10, speed: 14, expReward: 12, coinReward: 18, dropRate: 0.20 },
    { enemyId: "E004", name: "炮台", englishName: "Turret", type: "mech", minFloor: 10, maxFloor: 40, position: "back", baseHp: 50, baseAtk: 20, baseCritRate: 0.05, baseDodgeRate: 0.00, hpGrowth: 1.10, atkGrowth: 1.12, speed: 6, expReward: 15, coinReward: 25, dropRate: 0.15 },
    { enemyId: "E005", name: "腐化者", englishName: "Corruptor", type: "spirit", minFloor: 15, maxFloor: 45, position: "middle", baseHp: 100, baseAtk: 10, baseCritRate: 0.10, baseDodgeRate: 0.15, hpGrowth: 1.12, atkGrowth: 1.08, speed: 10, expReward: 18, coinReward: 30, dropRate: 0.25 },
    { enemyId: "E006", name: "暴走者", englishName: "Berserker", type: "beast", minFloor: 20, maxFloor: 50, position: "front", baseHp: 70, baseAtk: 22, baseCritRate: 0.25, baseDodgeRate: 0.05, hpGrowth: 1.11, atkGrowth: 1.13, speed: 10, expReward: 20, coinReward: 35, dropRate: 0.20 },
    { enemyId: "E007", name: "影子刺客", englishName: "Shadow Assassin", type: "spirit", minFloor: 25, maxFloor: 55, position: "back", baseHp: 65, baseAtk: 18, baseCritRate: 0.35, baseDodgeRate: 0.25, hpGrowth: 1.11, atkGrowth: 1.11, speed: 15, expReward: 22, coinReward: 40, dropRate: 0.18 },
    { enemyId: "E008", name: "重装卫士", englishName: "Heavy Guardian", type: "mech", minFloor: 30, maxFloor: 60, position: "front", baseHp: 200, baseAtk: 8, baseCritRate: 0.05, baseDodgeRate: 0.00, hpGrowth: 1.15, atkGrowth: 1.07, speed: 5, expReward: 25, coinReward: 45, dropRate: 0.22 },
    { enemyId: "E009", name: "毒液喷射者", englishName: "Toxic Spitter", type: "mutant", minFloor: 35, maxFloor: 65, position: "middle", baseHp: 90, baseAtk: 12, baseCritRate: 0.10, baseDodgeRate: 0.10, hpGrowth: 1.12, atkGrowth: 1.09, speed: 9, expReward: 20, coinReward: 38, dropRate: 0.20 },
    { enemyId: "E010", name: "灵魂收割者", englishName: "Soul Reaper", type: "undead", minFloor: 40, maxFloor: 70, position: "middle", baseHp: 110, baseAtk: 16, baseCritRate: 0.20, baseDodgeRate: 0.15, hpGrowth: 1.13, atkGrowth: 1.10, speed: 11, expReward: 28, coinReward: 50, dropRate: 0.25 }
  ];
  
  addSheet(workbook, "普通敌人", enemies);
  
  // 精英敌人配置
  const eliteEnemies = [
    { eliteId: "EL001", name: "强化猎犬王", englishName: "Alpha Hound", baseEnemyId: "E001", floorRange: "10-20", hpMultiplier: 2.0, atkMultiplier: 1.5, skillId: "ELSK001", description: "机械猎犬的领袖，更快更强" },
    { eliteId: "EL002", name: "精英机甲", englishName: "Elite Mech", baseEnemyId: "E002", floorRange: "15-30", hpMultiplier: 2.5, atkMultiplier: 1.3, skillId: "ELSK002", description: "装备升级版的巡逻机甲" },
    { eliteId: "EL003", name: "剧毒蛛后", englishName: "Poison Queen", baseEnemyId: "E003", floorRange: "20-40", hpMultiplier: 2.0, atkMultiplier: 1.8, skillId: "ELSK003", description: "蜘蛛群的女王，毒素攻击更强" },
    { eliteId: "EL004", name: "自律炮台", englishName: "Auto Turret", baseEnemyId: "E004", floorRange: "25-45", hpMultiplier: 3.0, atkMultiplier: 1.5, skillId: "ELSK004", description: "无人控制的自动炮台" },
    { eliteId: "EL005", name: "完全腐化体", englishName: "Full Corrupt", baseEnemyId: "E005", floorRange: "30-50", hpMultiplier: 2.2, atkMultiplier: 1.6, skillId: "ELSK005", description: "完全失去理智的腐化者" }
  ];
  
  addSheet(workbook, "精英敌人", eliteEnemies);
  
  // 敌人技能配置
  const enemySkills = [
    { skillId: "ESK001", name: "撕咬", targetType: "single", multiplier: 1.2, cooldown: 0, effect: "normal" },
    { skillId: "ESK002", name: "冲锋", targetType: "single", multiplier: 1.5, cooldown: 2, effect: "normal" },
    { skillId: "ESK003", name: "扫射", targetType: "all_allies", multiplier: 0.6, cooldown: 3, effect: "normal" },
    { skillId: "ESK004", name: "毒牙", targetType: "single", multiplier: 1.0, cooldown: 2, effect: "poison", duration: 3 },
    { skillId: "ESK005", name: "蛛网", targetType: "single", multiplier: 0, cooldown: 4, effect: "stun", duration: 1 },
    { skillId: "ESK006", name: "能量弹", targetType: "single", multiplier: 1.8, cooldown: 0, effect: "normal" },
    { skillId: "ESK007", name: "过载", targetType: "self", multiplier: 0, cooldown: 5, effect: "atk_up", value: 0.5, duration: 2 },
    { skillId: "ESK008", name: "腐蚀之触", targetType: "single", multiplier: 0.8, cooldown: 2, effect: "def_down", duration: 2 },
    { skillId: "ESK009", name: "瘟疫", targetType: "all_allies", multiplier: 0.5, cooldown: 4, effect: "poison", duration: 2 },
    { skillId: "ESK010", name: "狂暴打击", targetType: "single", multiplier: 2.0, cooldown: 2, effect: "normal" },
    { skillId: "ESK011", name: "血怒", targetType: "self", multiplier: 0, cooldown: 0, effect: "atk_up", value: 0.3, duration: 3 },
    { skillId: "ESK012", name: "暗影突袭", targetType: "single", multiplier: 2.5, cooldown: 3, effect: "normal" },
    { skillId: "ESK013", name: "致命毒刃", targetType: "single", multiplier: 1.2, cooldown: 2, effect: "poison", duration: 4 },
    { skillId: "ESK014", name: "重锤", targetType: "single", multiplier: 1.0, cooldown: 1, effect: "def_down", duration: 1 },
    { skillId: "ESK015", name: "毒液喷射", targetType: "all_allies", multiplier: 0.7, cooldown: 3, effect: "poison", duration: 3 },
    { skillId: "ESK016", name: "灵魂虹吸", targetType: "single", multiplier: 1.5, cooldown: 2, effect: "lifesteal", value: 0.3 },
    { skillId: "ESK017", name: "死亡标记", targetType: "single", multiplier: 0, cooldown: 5, effect: "mark", duration: 3 },
    { skillId: "ESK018", name: "魂斩", targetType: "single", multiplier: 2.2, cooldown: 2, effect: "normal" }
  ];
  
  addSheet(workbook, "敌人技能", enemySkills);
  
  // 敌人AI配置
  const enemyAI = [
    { enemyType: "mech", behavior: "aggressive", targetPriority: "random", skillUsage: 0.6, description: "机械类敌人通常主动进攻" },
    { enemyType: "mutant", behavior: "opportunistic", targetPriority: "low_hp", skillUsage: 0.5, description: "变异类敌人会寻找机会攻击低血量目标" },
    { enemyType: "spirit", behavior: "stealth", targetPriority: "back_line", skillUsage: 0.7, description: "灵魂类敌人优先攻击后排脆皮" },
    { enemyType: "beast", behavior: "berserker", targetPriority: "random", skillUsage: 0.4, description: "野兽类敌人攻击凶猛但技能使用较少" },
    { enemyType: "undead", behavior: "tactical", targetPriority: "healer", skillUsage: 0.8, description: "亡灵类敌人会优先攻击治疗职业" }
  ];
  
  addSheet(workbook, "敌人AI", enemyAI);
  
  // 掉落配置
  const dropTables = [
    { dropTableId: "DT001", itemId: "coin", itemName: "赛博币", minAmount: 10, maxAmount: 50, probability: 100, floorRange: "1-10" },
    { dropTableId: "DT002", itemId: "coin", itemName: "赛博币", minAmount: 30, maxAmount: 100, probability: 100, floorRange: "11-20" },
    { dropTableId: "DT003", itemId: "coin", itemName: "赛博币", minAmount: 50, maxAmount: 150, probability: 100, floorRange: "21-30" },
    { dropTableId: "DT004", itemId: "coin", itemName: "赛博币", minAmount: 80, maxAmount: 200, probability: 100, floorRange: "31-40" },
    { dropTableId: "DT005", itemId: "coin", itemName: "赛博币", minAmount: 100, maxAmount: 300, probability: 100, floorRange: "41-50" },
    { dropTableId: "DT_N01", itemId: "equip_common", itemName: "普通装备", minAmount: 1, maxAmount: 1, probability: 30, floorRange: "1-20" },
    { dropTableId: "DT_N02", itemId: "equip_rare", itemName: "稀有装备", minAmount: 1, maxAmount: 1, probability: 10, floorRange: "21-40" },
    { dropTableId: "DT_N03", itemId: "equip_epic", itemName: "史诗装备", minAmount: 1, maxAmount: 1, probability: 3, floorRange: "41-50" },
    { dropTableId: "DT_M01", itemId: "material_01", itemName: "机械零件", minAmount: 1, maxAmount: 3, probability: 15, floorRange: "1-30" },
    { dropTableId: "DT_M02", itemId: "material_02", itemName: "变异组织", minAmount: 1, maxAmount: 3, probability: 15, floorRange: "5-40" },
    { dropTableId: "DT_M03", itemId: "material_03", itemName: "灵魂碎片", minAmount: 1, maxAmount: 3, probability: 12, floorRange: "20-50" }
  ];
  
  addSheet(workbook, "掉落配置", dropTables);
  
  saveWorkbook(workbook, 'enemies.xlsx');
}

console.log('开始创建敌人配置表...\n');

try {
  createEnemiesConfig();
  console.log('\n✅ 敌人配置表创建完成！');
} catch (error) {
  console.error('创建敌人配置表时出错:', error);
}
