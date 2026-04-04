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
// equipment.xlsx - 装备配置表
// ============================================
function createEquipmentConfig() {
  const workbook = createWorkbook();
  
  // 装备基础配置
  const equipment = [
    // 武器
    { equipId: "WPN001", name: "生锈长剑", type: "weapon", quality: "common", rarity: 1, atkBonus: 5, hpBonus: 0, critRateBonus: 0, dodgeRateBonus: 0, damageReductionBonus: 0, description: "一把普通的生锈长剑" },
    { equipId: "WPN002", name: "制式军刀", type: "weapon", quality: "common", rarity: 1, atkBonus: 8, hpBonus: 0, critRateBonus: 0, dodgeRateBonus: 0, damageReductionBonus: 0, description: "标准配置的军用武器" },
    { equipId: "WPN003", name: "能量光剑", type: "weapon", quality: "rare", rarity: 2, atkBonus: 15, hpBonus: 0, critRateBonus: 0.03, dodgeRateBonus: 0, damageReductionBonus: 0, description: "利用能量技术制造的光剑" },
    { equipId: "WPN004", name: "雷霆之怒", type: "weapon", quality: "rare", rarity: 2, atkBonus: 18, hpBonus: 0, critRateBonus: 0.05, dodgeRateBonus: 0, damageReductionBonus: 0, description: "雷电属性的高级武器" },
    { equipId: "WPN005", name: "暗影匕首", type: "weapon", quality: "epic", rarity: 3, atkBonus: 25, hpBonus: 0, critRateBonus: 0.08, dodgeRateBonus: 0.05, damageReductionBonus: 0, description: "刺客公会流传的暗杀武器" },
    { equipId: "WPN006", name: "元素法杖", type: "weapon", quality: "epic", rarity: 3, atkBonus: 30, hpBonus: 20, critRateBonus: 0.05, dodgeRateBonus: 0, damageReductionBonus: 0, description: "蕴含元素之力的法杖" },
    { equipId: "WPN007", name: "战神巨剑", type: "weapon", quality: "legendary", rarity: 4, atkBonus: 45, hpBonus: 0, critRateBonus: 0.10, dodgeRateBonus: 0, damageReductionBonus: 0.05, description: "传说中的战神佩剑" },
    { equipId: "WPN008", name: "虚空撕裂者", type: "weapon", quality: "legendary", rarity: 4, atkBonus: 50, hpBonus: 0, critRateBonus: 0.12, dodgeRateBonus: 0, damageReductionBonus: 0, description: "能够撕裂次元的武器" },
    { equipId: "WPN009", name: "永恒之光", type: "weapon", quality: "mythic", rarity: 5, atkBonus: 80, hpBonus: 50, critRateBonus: 0.15, dodgeRateBonus: 0.05, damageReductionBonus: 0.10, description: "蕴含创世力量的神器" },
    
    // 护甲
    { equipId: "ARM001", name: "破旧皮甲", type: "armor", quality: "common", rarity: 1, atkBonus: 0, hpBonus: 30, critRateBonus: 0, dodgeRateBonus: 0, damageReductionBonus: 0.03, description: "勉强能穿的防护装备" },
    { equipId: "ARM002", name: "标准护甲", type: "armor", quality: "common", rarity: 1, atkBonus: 0, hpBonus: 50, critRateBonus: 0, dodgeRateBonus: 0, damageReductionBonus: 0.05, description: "标准配置的防护装备" },
    { equipId: "ARM003", name: "能量护盾", type: "armor", quality: "rare", rarity: 2, atkBonus: 0, hpBonus: 80, critRateBonus: 0, dodgeRateBonus: 0.03, damageReductionBonus: 0.08, description: "配备能量护盾的护甲" },
    { equipId: "ARM004", name: "钢铁壁垒", type: "armor", quality: "rare", rarity: 2, atkBonus: 0, hpBonus: 100, critRateBonus: 0, dodgeRateBonus: 0, damageReductionBonus: 0.12, description: "重型防护装备" },
    { equipId: "ARM005", name: "暗影斗篷", type: "armor", quality: "epic", rarity: 3, atkBonus: 0, hpBonus: 120, critRateBonus: 0.05, dodgeRateBonus: 0.08, damageReductionBonus: 0.08, description: "能够隐匿身形的护甲" },
    { equipId: "ARM006", name: "元素之铠", type: "armor", quality: "epic", rarity: 3, atkBonus: 0, hpBonus: 150, critRateBonus: 0, dodgeRateBonus: 0.05, damageReductionBonus: 0.15, description: "蕴含元素防护的护甲" },
    { equipId: "ARM007", name: "战神护甲", type: "armor", quality: "legendary", rarity: 4, atkBonus: 0, hpBonus: 200, critRateBonus: 0, dodgeRateBonus: 0.05, damageReductionBonus: 0.20, description: "战神传承的防护装备" },
    { equipId: "ARM008", name: "虚空铠甲", type: "armor", quality: "legendary", rarity: 4, atkBonus: 0, hpBonus: 250, critRateBonus: 0, dodgeRateBonus: 0, damageReductionBonus: 0.25, description: "来自虚空的防护铠甲" },
    { equipId: "ARM009", name: "永恒守护", type: "armor", quality: "mythic", rarity: 5, atkBonus: 0, hpBonus: 400, critRateBonus: 0.05, dodgeRateBonus: 0.10, damageReductionBonus: 0.30, description: "永恒守护者的神装" },
    
    // 饰品
    { equipId: "ACC001", name: "旧戒指", type: "accessory", quality: "common", rarity: 1, atkBonus: 2, hpBonus: 10, critRateBonus: 0.01, dodgeRateBonus: 0, damageReductionBonus: 0, description: "一枚普通的戒指" },
    { equipId: "ACC002", name: "能量吊坠", type: "accessory", quality: "common", rarity: 1, atkBonus: 3, hpBonus: 15, critRateBonus: 0, dodgeRateBonus: 0.02, damageReductionBonus: 0, description: "蕴含微弱能量的饰品" },
    { equipId: "ACC003", name: "暴击戒指", type: "accessory", quality: "rare", rarity: 2, atkBonus: 5, hpBonus: 20, critRateBonus: 0.08, dodgeRateBonus: 0, damageReductionBonus: 0, description: "提升暴击率的戒指" },
    { equipId: "ACC004", name: "闪避项链", type: "accessory", quality: "rare", rarity: 2, atkBonus: 0, hpBonus: 25, critRateBonus: 0, dodgeRateBonus: 0.08, damageReductionBonus: 0, description: "提升闪避率的项链" },
    { equipId: "ACC005", name: "暴怒指虎", type: "accessory", quality: "epic", rarity: 3, atkBonus: 12, hpBonus: 30, critRateBonus: 0.10, dodgeRateBonus: 0.03, damageReductionBonus: 0, description: "野兽风格的战斗饰品" },
    { equipId: "ACC006", name: "生命护符", type: "accessory", quality: "epic", rarity: 3, atkBonus: 0, hpBonus: 80, critRateBonus: 0.03, dodgeRateBonus: 0.03, damageReductionBonus: 0.03, description: "大幅提升生命值的护符" },
    { equipId: "ACC007", name: "战神徽章", type: "accessory", quality: "legendary", rarity: 4, atkBonus: 20, hpBonus: 50, critRateBonus: 0.12, dodgeRateBonus: 0.05, damageReductionBonus: 0.05, description: "战神传承的荣誉徽章" },
    { equipId: "ACC008", name: "时空罗盘", type: "accessory", quality: "legendary", rarity: 4, atkBonus: 15, hpBonus: 60, critRateBonus: 0.08, dodgeRateBonus: 0.10, damageReductionBonus: 0, description: "能够操控时间的罗盘" },
    { equipId: "ACC009", name: "永恒之眼", type: "accessory", quality: "mythic", rarity: 5, atkBonus: 30, hpBonus: 100, critRateBonus: 0.15, dodgeRateBonus: 0.10, damageReductionBonus: 0.08, description: "蕴含宇宙力量的神器" }
  ];
  
  addSheet(workbook, "装备列表", equipment);
  
  // 装备强化配置
  const enhancement = [
    { level: 0, cost: 0, statMultiplier: 1.00, successRate: 100, description: "初始状态" },
    { level: 1, cost: 100, statMultiplier: 1.05, successRate: 100, description: "+5%属性" },
    { level: 2, cost: 200, statMultiplier: 1.10, successRate: 95, description: "+10%属性" },
    { level: 3, cost: 400, statMultiplier: 1.15, successRate: 90, description: "+15%属性" },
    { level: 4, cost: 800, statMultiplier: 1.20, successRate: 85, description: "+20%属性" },
    { level: 5, cost: 1500, statMultiplier: 1.25, successRate: 80, description: "+25%属性" },
    { level: 6, cost: 3000, statMultiplier: 1.30, successRate: 75, description: "+30%属性" },
    { level: 7, cost: 5000, statMultiplier: 1.35, successRate: 70, description: "+35%属性" },
    { level: 8, cost: 8000, statMultiplier: 1.40, successRate: 65, description: "+40%属性" },
    { level: 9, cost: 12000, statMultiplier: 1.45, successRate: 60, description: "+45%属性" },
    { level: 10, cost: 20000, statMultiplier: 1.50, successRate: 55, description: "+50%属性，MAX" }
  ];
  
  addSheet(workbook, "强化等级", enhancement);
  
  // 套装配置
  const sets = [
    { setId: "SET001", name: "战神套装", pieceCount: 3, bonus2Piece: "攻击+10%", bonus3Piece: "暴击率+15%", requiredQuality: "legendary" },
    { setId: "SET002", name: "守护套装", pieceCount: 3, bonus2Piece: "生命+15%", bonus3Piece: "减伤+10%", requiredQuality: "legendary" },
    { setId: "SET003", name: "疾风套装", pieceCount: 3, bonus2Piece: "闪避+10%", bonus3Piece: "速度+5", requiredQuality: "epic" },
    { setId: "SET004", name: "元素套装", pieceCount: 3, bonus2Piece: "技能伤害+12%", bonus3Piece: "元素伤害+20%", requiredQuality: "epic" },
    { setId: "SET005", name: "永恒套装", pieceCount: 3, bonus2Piece: "全属性+8%", bonus3Piece: "特殊效果翻倍", requiredQuality: "mythic" }
  ];
  
  addSheet(workbook, "装备套装", sets);
  
  // 装备掉落来源
  const dropSources = [
    { sourceType: "enemy", sourceId: "E001-E010", equipQuality: "common", probability: 0.30, floorRange: "1-20" },
    { sourceType: "enemy", sourceId: "E001-E010", equipQuality: "rare", probability: 0.10, floorRange: "21-40" },
    { sourceType: "enemy", sourceId: "E001-E010", equipQuality: "epic", probability: 0.03, floorRange: "41-50" },
    { sourceType: "elite", sourceId: "EL001-EL005", equipQuality: "rare", probability: 0.50, floorRange: "10-50" },
    { sourceType: "elite", sourceId: "EL001-EL005", equipQuality: "epic", probability: 0.15, floorRange: "20-50" },
    { sourceType: "shop", sourceId: "equip_shop", equipQuality: "common", probability: 100, price: "200-500" },
    { sourceType: "shop", sourceId: "equip_shop", equipQuality: "rare", probability: 100, price: "1000-2000" },
    { sourceType: "chest", sourceId: "normal_chest", equipQuality: "common", probability: 0.50, floorRange: "1-50" },
    { sourceType: "chest", sourceId: "normal_chest", equipQuality: "rare", probability: 0.15, floorRange: "1-50" },
    { sourceType: "chest", sourceId: "golden_chest", equipQuality: "epic", probability: 0.30, floorRange: "1-50" },
    { sourceType: "chest", sourceId: "golden_chest", equipQuality: "legendary", probability: 0.05, floorRange: "1-50" }
  ];
  
  addSheet(workbook, "掉落来源", dropSources);
  
  saveWorkbook(workbook, 'equipment.xlsx');
}

console.log('开始创建装备配置表...\n');

try {
  createEquipmentConfig();
  console.log('\n✅ 装备配置表创建完成！');
} catch (error) {
  console.error('创建装备配置表时出错:', error);
}
