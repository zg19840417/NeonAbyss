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
// 1. skills.xlsx - 技能配置表
// ============================================
function createSkillsConfig() {
  const workbook = createWorkbook();
  
  // 技能基础信息
  const skills = [
    // 坦克类技能
    { skillId: "SK001", name: "盾击", description: "用盾牌猛击敌人", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 1.2, baseValue: 0, cooldown: 0, mpCost: 0, classRequired: "iron_wall" },
    { skillId: "SK002", name: "铁壁防御", description: "进入防御姿态，受到伤害减少30%", type: "buff", targetType: "self", targetTeam: "self", multiplier: 0, baseValue: 0.3, buffType: "damage_reduction", buffDuration: 2, cooldown: 3, mpCost: 0, classRequired: "iron_wall" },
    { skillId: "SK003", name: "嘲讽", description: "强制敌人攻击自己", type: "debuff", targetType: "single", targetTeam: "enemy", multiplier: 0, baseValue: 0, debuffType: "taunt", debuffDuration: 2, cooldown: 4, mpCost: 0, classRequired: "iron_wall" },
    { skillId: "SK004", name: "生命汲取", description: "治疗自己", type: "heal", targetType: "single", targetTeam: "ally", multiplier: 0, baseValue: 80, cooldown: 3, mpCost: 0, classRequired: "life_guardian" },
    { skillId: "SK005", name: "守护之盾", description: "为一名队友添加护盾", type: "shield", targetType: "single", targetTeam: "ally", multiplier: 0, baseValue: 150, shieldDuration: 3, cooldown: 4, mpCost: 0, classRequired: "life_guardian" },
    { skillId: "SK006", name: "团队守护", description: "全体队友伤害减少20%", type: "buff", targetType: "all_allies", targetTeam: "ally", multiplier: 0, baseValue: 0.2, buffType: "damage_reduction", buffDuration: 2, cooldown: 5, mpCost: 0, classRequired: "life_guardian" },
    { skillId: "SK007", name: "重装碾压", description: "重型攻击", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 1.5, baseValue: 0, cooldown: 2, mpCost: 0, classRequired: "steel_bastion" },
    { skillId: "SK008", name: "能量护盾", description: "减少即将受到的首次伤害", type: "buff", targetType: "self", targetTeam: "self", multiplier: 0, baseValue: 0.5, buffType: "damage_reduction", buffDuration: 2, cooldown: 4, mpCost: 0, classRequired: "steel_bastion" },
    { skillId: "SK009", name: "反击风暴", description: "受到攻击时反击", type: "counter", targetType: "self", targetTeam: "self", multiplier: 0, baseValue: 0.5, cooldown: 3, mpCost: 0, classRequired: "unyielding_will" },
    { skillId: "SK010", name: "岩石护甲", description: "增加防御", type: "buff", targetType: "self", targetTeam: "self", multiplier: 0, baseValue: 0.15, buffType: "damage_reduction", buffDuration: 3, cooldown: 4, mpCost: 0, classRequired: "unyielding_will" },
    
    // 输出类技能
    { skillId: "SK011", name: "狂暴打击", description: "高伤害攻击", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 1.8, baseValue: 0, cooldown: 1, mpCost: 0, classRequired: "berserker" },
    { skillId: "SK012", name: "血怒", description: "生命越低攻击越高", type: "passive", targetType: "self", targetTeam: "self", multiplier: 0, baseValue: 0, passiveEffect: "hp_low_atk_up", cooldown: 0, mpCost: 0, classRequired: "berserker" },
    { skillId: "SK013", name: "旋风斩", description: "对所有敌人造成伤害", type: "damage", targetType: "all_enemies", targetTeam: "enemy", multiplier: 0.8, baseValue: 0, cooldown: 3, mpCost: 0, classRequired: "berserker" },
    { skillId: "SK014", name: "火焰冲击", description: "火系魔法攻击", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 2.0, baseValue: 0, cooldown: 2, mpCost: 15, classRequired: "element_mage" },
    { skillId: "SK015", name: "冰霜新星", description: "对所有敌人造成伤害并减速", type: "damage", targetType: "all_enemies", targetTeam: "enemy", multiplier: 0.7, baseValue: 0, debuffType: "speed_down", debuffDuration: 2, cooldown: 4, mpCost: 25, classRequired: "element_mage" },
    { skillId: "SK016", name: "元素爆发", description: "根据敌人属性造成额外伤害", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 2.5, baseValue: 0, cooldown: 5, mpCost: 35, classRequired: "element_mage" },
    { skillId: "SK017", name: "暗影突袭", description: "高暴击率攻击", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 2.2, baseValue: 0, critBonus: 0.3, cooldown: 2, mpCost: 10, classRequired: "shadow_assassin" },
    { skillId: "SK018", name: "致命毒刃", description: "造成持续伤害", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 1.0, baseValue: 0, debuffType: "poison", debuffDuration: 3, cooldown: 3, mpCost: 8, classRequired: "shadow_assassin" },
    { skillId: "SK019", name: "隐匿", description: "大幅提升闪避率", type: "buff", targetType: "self", targetTeam: "self", multiplier: 0, baseValue: 0.4, buffType: "dodge_up", buffDuration: 2, cooldown: 4, mpCost: 0, classRequired: "shadow_assassin" },
    { skillId: "SK020", name: "机械炮击", description: "发射导弹攻击", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 1.6, baseValue: 0, cooldown: 2, mpCost: 0, classRequired: "mech_engineer" },
    { skillId: "SK021", name: "榴弹轰炸", description: "对区域敌人造成伤害", type: "damage", targetType: "all_enemies", targetTeam: "enemy", multiplier: 0.6, baseValue: 0, cooldown: 4, mpCost: 0, classRequired: "mech_engineer" },
    { skillId: "SK022", name: "能量修复", description: "治疗自己", type: "heal", targetType: "single", targetTeam: "self", multiplier: 0, baseValue: 100, cooldown: 4, mpCost: 0, classRequired: "mech_engineer" },
    { skillId: "SK023", name: "虚空之箭", description: "暗属性魔法攻击", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 2.3, baseValue: 0, cooldown: 2, mpCost: 20, classRequired: "destruction_warlock" },
    { skillId: "SK024", name: "生命虹吸", description: "造成伤害并治疗自己", type: "damage_heal", targetType: "single", targetTeam: "enemy", multiplier: 1.5, baseValue: 0, healPercent: 0.5, cooldown: 3, mpCost: 15, classRequired: "destruction_warlock" },
    { skillId: "SK025", name: "暗影领域", description: "对所有敌人造成伤害", type: "damage", targetType: "all_enemies", targetTeam: "enemy", multiplier: 1.0, baseValue: 0, cooldown: 5, mpCost: 30, classRequired: "destruction_warlock" },
    { skillId: "SK026", name: "战神之力", description: "大幅提升攻击力", type: "buff", targetType: "self", targetTeam: "self", multiplier: 0, baseValue: 0.4, buffType: "atk_up", buffDuration: 3, cooldown: 5, mpCost: 0, classRequired: "mecha_war_god" },
    { skillId: "SK027", name: "战神斩", description: "战神专属高伤害技能", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 2.8, baseValue: 0, cooldown: 3, mpCost: 0, classRequired: "mecha_war_god" },
    { skillId: "SK028", name: "光翼冲击", description: "飞行道具攻击所有敌人", type: "damage", targetType: "all_enemies", targetTeam: "enemy", multiplier: 0.9, baseValue: 0, cooldown: 4, mpCost: 0, classRequired: "mecha_war_god" },
    
    // 辅助类技能
    { skillId: "SK029", name: "战术指挥", description: "提升全体攻击力", type: "buff", targetType: "all_allies", targetTeam: "ally", multiplier: 0, baseValue: 0.2, buffType: "atk_up", buffDuration: 3, cooldown: 4, mpCost: 0, classRequired: "tactical_commander" },
    { skillId: "SK030", name: "战阵布置", description: "提升全体防御", type: "buff", targetType: "all_allies", targetTeam: "ally", multiplier: 0, baseValue: 0.15, buffType: "damage_reduction", buffDuration: 3, cooldown: 4, mpCost: 0, classRequired: "tactical_commander" },
    { skillId: "SK031", name: "精准打击", description: "对单体敌人造成高伤害并降低其防御", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 1.5, baseValue: 0, debuffType: "def_down", debuffDuration: 2, cooldown: 3, mpCost: 0, classRequired: "tactical_commander" },
    { skillId: "SK032", name: "疾风剑舞", description: "快速连续攻击", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 1.2, baseValue: 0, hitCount: 3, cooldown: 3, mpCost: 0, classRequired: "wind_swordsman" },
    { skillId: "SK033", name: "风之壁障", description: "提升全体闪避率", type: "buff", targetType: "all_allies", targetTeam: "ally", multiplier: 0, baseValue: 0.25, buffType: "dodge_up", buffDuration: 3, cooldown: 5, mpCost: 0, classRequired: "wind_swordsman" },
    { skillId: "SK034", name: "风刃", description: "远程风系攻击", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 1.4, baseValue: 0, cooldown: 2, mpCost: 5, classRequired: "wind_swordsman" },
    { skillId: "SK035", name: "时间减速", description: "降低敌人行动速度", type: "debuff", targetType: "single", targetTeam: "enemy", multiplier: 0, baseValue: 0, debuffType: "speed_down", debuffDuration: 2, cooldown: 4, mpCost: 15, classRequired: "time_walker" },
    { skillId: "SK036", name: "时间跳跃", description: "使一名队友立即行动", type: "support", targetType: "single", targetTeam: "ally", multiplier: 0, baseValue: 0, cooldown: 5, mpCost: 20, classRequired: "time_walker" },
    { skillId: "SK037", name: "时空扭曲", description: "对所有敌人造成伤害", type: "damage", targetType: "all_enemies", targetTeam: "enemy", multiplier: 0.8, baseValue: 0, cooldown: 4, mpCost: 25, classRequired: "time_walker" },
    
    // 治疗类技能
    { skillId: "SK038", name: "自然治愈", description: "治疗一名队友", type: "heal", targetType: "single", targetTeam: "ally", multiplier: 0, baseValue: 150, cooldown: 3, mpCost: 10, classRequired: "natural_healer" },
    { skillId: "SK039", name: "生命绽放", description: "治疗全体队友", type: "heal", targetType: "all_allies", targetTeam: "ally", multiplier: 0, baseValue: 80, cooldown: 5, mpCost: 20, classRequired: "natural_healer" },
    { skillId: "SK040", name: "荆棘之护", description: "为队友添加反伤护盾", type: "shield", targetType: "single", targetTeam: "ally", multiplier: 0, baseValue: 100, shieldDuration: 3, cooldown: 4, mpCost: 15, classRequired: "natural_healer" },
    { skillId: "SK041", name: "神圣治疗", description: "大量治疗一名队友", type: "heal", targetType: "single", targetTeam: "ally", multiplier: 0, baseValue: 250, cooldown: 4, mpCost: 15, classRequired: "holy_priest" },
    { skillId: "SK042", name: "神圣庇护", description: "为全体添加护盾", type: "shield", targetType: "all_allies", targetTeam: "ally", multiplier: 0, baseValue: 120, shieldDuration: 2, cooldown: 6, mpCost: 25, classRequired: "holy_priest" },
    { skillId: "SK043", name: "神圣净化", description: "驱散一个debuff", type: "cleanse", targetType: "single", targetTeam: "ally", multiplier: 0, baseValue: 0, cooldown: 3, mpCost: 10, classRequired: "holy_priest" },
    { skillId: "SK044", name: "元素审判", description: "根据敌人弱点造成伤害", type: "damage", targetType: "single", targetTeam: "enemy", multiplier: 2.0, baseValue: 0, cooldown: 3, mpCost: 20, classRequired: "elemental_lord" },
    { skillId: "SK045", name: "元素链接", description: "治疗并提升攻击", type: "heal", targetType: "single", targetTeam: "ally", multiplier: 0, baseValue: 100, buffType: "atk_up", buffValue: 0.15, buffDuration: 2, cooldown: 4, mpCost: 15, classRequired: "elemental_lord" },
    { skillId: "SK046", name: "元素风暴", description: "对所有敌人造成伤害", type: "damage", targetType: "all_enemies", targetTeam: "enemy", multiplier: 1.2, baseValue: 0, cooldown: 5, mpCost: 30, classRequired: "elemental_lord" }
  ];
  
  addSheet(workbook, "技能列表", skills);
  
  // 技能动画配置
  const skillAnimations = [
    { skillId: "SK001", animation: "slam", duration: 500, particle: "impact" },
    { skillId: "SK002", animation: "shield_up", duration: 600, particle: "shield" },
    { skillId: "SK003", animation: "shout", duration: 400, particle: "anger" },
    { skillId: "SK004", animation: "heal_glow", duration: 800, particle: "nature" },
    { skillId: "SK005", animation: "shield_appear", duration: 600, particle: "shield" },
    { skillId: "SK006", animation: "aura_expand", duration: 800, particle: "team_buff" },
    { skillId: "SK007", animation: "crush", duration: 700, particle: "metal" },
    { skillId: "SK008", animation: "energy_shield", duration: 500, particle: "energy" },
    { skillId: "SK009", animation: "counter_stance", duration: 400, particle: "rock" },
    { skillId: "SK010", animation: "rock_armor", duration: 600, particle: "rock" },
    { skillId: "SK011", animation: "fury_slash", duration: 500, particle: "blood" },
    { skillId: "SK012", animation: "passive", duration: 0, particle: "blood_aura" },
    { skillId: "SK013", animation: "spin_attack", duration: 800, particle: "wind" },
    { skillId: "SK014", animation: "fire_blast", duration: 600, particle: "fire" },
    { skillId: "SK015", animation: "ice_nova", duration: 800, particle: "ice" },
    { skillId: "SK016", animation: "element_burst", duration: 1000, particle: "elemental" },
    { skillId: "SK017", animation: "dash_strike", duration: 400, particle: "shadow" },
    { skillId: "SK018", animation: "poison_stab", duration: 500, particle: "poison" },
    { skillId: "SK019", animation: "stealth", duration: 600, particle: "shadow" },
    { skillId: "SK020", animation: "missile_launch", duration: 700, particle: "explosion" },
    { skillId: "SK021", animation: "grenade", duration: 800, particle: "explosion" },
    { skillId: "SK022", animation: "repair", duration: 600, particle: "mech" },
    { skillId: "SK023", animation: "void_arrow", duration: 600, particle: "void" },
    { skillId: "SK024", animation: "drain_life", duration: 800, particle: "void" },
    { skillId: "SK025", animation: "shadow_zone", duration: 900, particle: "void" },
    { skillId: "SK026", animation: "power_up", duration: 600, particle: "golden" },
    { skillId: "SK027", animation: "god_slash", duration: 800, particle: "golden" },
    { skillId: "SK028", animation: "wing_blast", duration: 700, particle: "energy" },
    { skillId: "SK029", animation: "command_aura", duration: 600, particle: "command" },
    { skillId: "SK030", animation: "defense_aura", duration: 600, particle: "shield" },
    { skillId: "SK031", animation: "precision_shot", duration: 500, particle: "laser" },
    { skillId: "SK032", animation: "wind_slash", duration: 400, particle: "wind" },
    { skillId: "SK033", animation: "wind_barrier", duration: 600, particle: "wind" },
    { skillId: "SK034", animation: "wind_blade", duration: 500, particle: "wind" },
    { skillId: "SK035", animation: "time_slow", duration: 800, particle: "time" },
    { skillId: "SK036", animation: "time_skip", duration: 500, particle: "time" },
    { skillId: "SK037", animation: "time_distortion", duration: 900, particle: "time" },
    { skillId: "SK038", animation: "nature_heal", duration: 800, particle: "nature" },
    { skillId: "SK039", animation: "nature_bloom", duration: 1000, particle: "nature" },
    { skillId: "SK040", animation: "thorn_shield", duration: 600, particle: "nature" },
    { skillId: "SK041", animation: "holy_light", duration: 800, particle: "holy" },
    { skillId: "SK042", animation: "holy_shield", duration: 700, particle: "holy" },
    { skillId: "SK043", animation: "holy_purify", duration: 600, particle: "holy" },
    { skillId: "SK044", animation: "element_judgment", duration: 800, particle: "elemental" },
    { skillId: "SK045", animation: "element_link", duration: 700, particle: "elemental" },
    { skillId: "SK046", animation: "elemental_storm", duration: 1000, particle: "elemental" }
  ];
  
  addSheet(workbook, "技能动画", skillAnimations);
  
  // 被动技能配置
  const passiveSkills = [
    { skillId: "PS001", name: "钢铁意志", description: "受到致命伤害时有30%概率存活1HP", classRequired: "iron_wall", effect: "survive_lethal", value: 0.3 },
    { skillId: "PS002", name: "生命链接", description: "治疗效果提升15%", classRequired: "life_guardian", effect: "heal_up", value: 0.15 },
    { skillId: "PS003", name: "机械护甲", description: "防御力永久提升10%", classRequired: "steel_bastion", effect: "defense_up", value: 0.10 },
    { skillId: "PS004", name: "岩石皮肤", description: "受到伤害减少5%", classRequired: "unyielding_will", effect: "damage_reduction", value: 0.05 },
    { skillId: "PS005", name: "狂暴本能", description: "生命值低于50%时攻击提升20%", classRequired: "berserker", effect: "hp_low_atk_up", value: 0.20 },
    { skillId: "PS006", name: "暴击精通", description: "暴击伤害提升25%", classRequired: "berserker", effect: "crit_damage_up", value: 0.25 },
    { skillId: "PS007", name: "元素亲和", description: "魔法伤害提升15%", classRequired: "element_mage", effect: "magic_damage_up", value: 0.15 },
    { skillId: "PS008", name: "冰冷之心", description: "敌人减速效果延长1回合", classRequired: "element_mage", effect: "slow_extend", value: 1 },
    { skillId: "PS009", name: "暗影步伐", description: "闪避成功后下次攻击必定暴击", classRequired: "shadow_assassin", effect: "dodge_crit", value: 1 },
    { skillId: "PS010", name: "毒液精通", description: "毒系伤害提升20%", classRequired: "shadow_assassin", effect: "poison_up", value: 0.20 },
    { skillId: "PS011", name: "工程学专家", description: "技能冷却时间减少10%", classRequired: "mech_engineer", effect: "cooldown_down", value: 0.10 },
    { skillId: "PS012", name: "自我修复", description: "每回合恢复3%最大生命", classRequired: "mech_engineer", effect: "regen", value: 0.03 },
    { skillId: "PS013", name: "虚空亲和", description: "虚空技能伤害提升20%", classRequired: "destruction_warlock", effect: "void_damage_up", value: 0.20 },
    { skillId: "PS014", name: "生命虹吸", description: "攻击时回复造成伤害的10%", classRequired: "destruction_warlock", effect: "lifesteal", value: 0.10 },
    { skillId: "PS015", name: "战神传承", description: "攻击力提升15%", classRequired: "mecha_war_god", effect: "atk_up", value: 0.15 },
    { skillId: "PS016", name: "不屈战意", description: "濒死时防御力提升30%", classRequired: "mecha_war_god", effect: "low_hp_def_up", value: 0.30 },
    { skillId: "PS017", name: "战术天才", description: "队友技能伤害提升10%", classRequired: "tactical_commander", effect: "team_damage_up", value: 0.10 },
    { skillId: "PS018", name: "鼓舞", description: "回合开始时队友恢复2%生命", classRequired: "tactical_commander", effect: "turn_heal", value: 0.02 },
    { skillId: "PS019", name: "疾风步", description: "闪避率提升15%", classRequired: "wind_swordsman", effect: "dodge_up", value: 0.15 },
    { skillId: "PS020", name: "连击", description: "普通攻击有20%概率再攻击一次", classRequired: "wind_swordsman", effect: "double_hit", value: 0.20 },
    { skillId: "PS021", name: "时间感知", description: "行动顺序提前", classRequired: "time_walker", effect: "speed_up", value: 2 },
    { skillId: "PS022", name: "时间回溯", description: "每场战斗一次，复活自己", classRequired: "time_walker", effect: "revive", value: 1 },
    { skillId: "PS023", name: "自然之心", description: "治疗效果提升20%", classRequired: "natural_healer", effect: "heal_up", value: 0.20 },
    { skillId: "PS024", name: "百花缭乱", description: "治疗时有30%概率不消耗技能", classRequired: "natural_healer", effect: "heal_free", value: 0.30 },
    { skillId: "PS025", name: "神圣之力", description: "治疗效果提升15%，护盾效果提升15%", classRequired: "holy_priest", effect: "heal_shield_up", value: 0.15 },
    { skillId: "PS026", name: "神圣祝福", description: "队友死亡时概率复活", classRequired: "holy_priest", effect: "ally_revive", value: 0.15 },
    { skillId: "PS027", name: "元素驾驭", description: "所有元素伤害提升10%", classRequired: "elemental_lord", effect: "element_damage_up", value: 0.10 },
    { skillId: "PS028", name: "元素爆发", description: "暴击时有30%概率造成双倍伤害", classRequired: "elemental_lord", effect: "crit_explosion", value: 0.30 }
  ];
  
  addSheet(workbook, "被动技能", passiveSkills);
  
  saveWorkbook(workbook, 'skills.xlsx');
}

console.log('开始创建技能配置表...\n');

try {
  createSkillsConfig();
  console.log('\n✅ 技能配置表创建完成！');
} catch (error) {
  console.error('创建技能配置表时出错:', error);
}
