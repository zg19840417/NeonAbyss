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
// 1. reputation.xlsx - 声誉等级配置表
// ============================================
function createReputationConfig() {
  const workbook = createWorkbook();
  
  const levels = [
    { level: 1, name: "新手拾荒者", requiredPoints: 0, unlockFacility: "基础", unlockEnergy: "普通能量", unlockCharacter: "⭐普通" },
    { level: 2, name: "见习驾驶员", requiredPoints: 100, unlockFacility: "设施2级", unlockEnergy: "活力苏打", unlockCharacter: "⭐普通" },
    { level: 3, name: "正式队员", requiredPoints: 300, unlockFacility: "设施3级", unlockEnergy: "强力能量,精准燃料", unlockCharacter: "⭐⭐中级" },
    { level: 4, name: "资深探险家", requiredPoints: 600, unlockFacility: "设施4级", unlockEnergy: "精准燃料", unlockCharacter: "⭐⭐中级" },
    { level: 5, name: "队长", requiredPoints: 1000, unlockFacility: "设施5级,黑客终端", unlockEnergy: "超频能量,战意激化剂,守护合剂", unlockCharacter: "⭐⭐⭐高级" },
    { level: 6, name: "英雄", requiredPoints: 1500, unlockFacility: "设施6级", unlockEnergy: "战意激化剂,守护合剂", unlockCharacter: "⭐⭐⭐高级" },
    { level: 7, name: "传奇人物", requiredPoints: 2500, unlockFacility: "设施7级", unlockEnergy: "传说能量", unlockCharacter: "⭐⭐⭐⭐传说" },
    { level: 8, name: "废土领袖", requiredPoints: 4000, unlockFacility: "设施8级", unlockEnergy: "传说能量,源初精华", unlockCharacter: "⭐⭐⭐⭐传说" },
    { level: 9, name: "方舟使者", requiredPoints: 6000, unlockFacility: "设施9级", unlockEnergy: "源初精华,禁忌药剂", unlockCharacter: "⭐⭐⭐⭐传说" },
    { level: 10, name: "传奇永恒", requiredPoints: 10000, unlockFacility: "设施满级", unlockEnergy: "禁忌药剂", unlockCharacter: "全部品质" }
  ];
  
  addSheet(workbook, "声誉等级", levels);
  
  const gainSources = [
    { source: "通关楼层", basePoints: 10, formula: "floor*10", dailyLimit: 0, description: "首次通关每层奖励" },
    { source: "击败BOSS", basePoints: 50, formula: "boss_level*100", dailyLimit: 0, description: "击败BOSS奖励，根据BOSS等级" },
    { source: "完成每日任务", basePoints: 20, formula: "fixed", dailyLimit: 200, description: "每日任务总计上限" },
    { source: "完成成就", basePoints: 50, formula: "fixed", dailyLimit: 0, description: "根据成就稀有度" },
    { source: "每日登录", basePoints: 10, formula: "fixed", dailyLimit: 10, description: "连续登录额外+5" },
    { source: "招募新角色", basePoints: 5, formula: "fixed", dailyLimit: 50, description: "每日首次招募额外+10" },
    { source: "装备强化", basePoints: 2, formula: "fixed", dailyLimit: 20, description: "每次强化成功" },
    { source: "使用能量饮料", basePoints: 3, formula: "fixed", dailyLimit: 30, description: "每日首次使用额外+5" },
    { source: "分享战绩", basePoints: 15, formula: "fixed", dailyLimit: 15, description: "社交功能" }
  ];
  
  addSheet(workbook, "声望获取", gainSources);
  
  saveWorkbook(workbook, 'reputation.xlsx');
}

// ============================================
// 2. achievement.xlsx - 成就配置表
// ============================================
function createAchievementConfig() {
  const workbook = createWorkbook();
  
  const achievements = [
    // 探索类成就
    { id: "E01", name: "初入禁区", description: "首次进入禁区", category: "explore", difficulty: 1, rewardReputation: 10, targetType: "enter_dungeon", targetValue: 1, isHidden: false },
    { id: "E02", name: "登楼者", description: "到达第5层", category: "explore", difficulty: 2, rewardReputation: 20, targetType: "reach_floor", targetValue: 5, isHidden: false },
    { id: "E03", name: "深渊行者", description: "到达第10层", category: "explore", difficulty: 2, rewardReputation: 50, targetType: "reach_floor", targetValue: 10, isHidden: false },
    { id: "E04", name: "废土征服者", description: "到达第25层", category: "explore", difficulty: 3, rewardReputation: 100, targetType: "reach_floor", targetValue: 25, isHidden: false },
    { id: "E05", name: "方舟候选人", description: "到达第40层", category: "explore", difficulty: 4, rewardReputation: 200, targetType: "reach_floor", targetValue: 40, isHidden: false },
    { id: "E06", name: "传奇归来", description: "到达第50层并通关", category: "explore", difficulty: 5, rewardReputation: 500, targetType: "reach_floor", targetValue: 50, isHidden: false },
    { id: "E07", name: "宝箱猎人", description: "累计开启100个宝箱", category: "explore", difficulty: 2, rewardReputation: 30, targetType: "open_chest", targetValue: 100, isHidden: false },
    { id: "E08", name: "寻宝大师", description: "累计开启1000个宝箱", category: "explore", difficulty: 4, rewardReputation: 150, targetType: "open_chest", targetValue: 1000, isHidden: false },
    { id: "E09", name: "无尽探索", description: "单次探索连续通过20层", category: "explore", difficulty: 3, rewardReputation: 80, targetType: "consecutive_floors", targetValue: 20, isHidden: false },
    { id: "E10", name: "速通专家", description: "1小时内到达第30层", category: "explore", difficulty: 5, rewardReputation: 300, targetType: "speed_clear", targetValue: 30, isHidden: true },
    
    // 战斗类成就
    { id: "B01", name: "初次胜利", description: "赢得第一场战斗", category: "battle", difficulty: 1, rewardReputation: 10, targetType: "battle_win", targetValue: 1, isHidden: false },
    { id: "B02", name: "连胜新星", description: "获得5连胜", category: "battle", difficulty: 2, rewardReputation: 30, targetType: "win_streak", targetValue: 5, isHidden: false },
    { id: "B03", name: "不败传说", description: "获得20连胜", category: "battle", difficulty: 4, rewardReputation: 150, targetType: "win_streak", targetValue: 20, isHidden: false },
    { id: "B04", name: "暴击达人", description: "单次战斗造成10次暴击", category: "battle", difficulty: 2, rewardReputation: 40, targetType: "critical_hit", targetValue: 10, isHidden: false },
    { id: "B05", name: "一击必杀", description: "单次攻击造成超过1000伤害", category: "battle", difficulty: 3, rewardReputation: 60, targetType: "single_damage", targetValue: 1000, isHidden: false },
    { id: "B06", name: "完美闪避", description: "单次战斗闪避5次攻击", category: "battle", difficulty: 3, rewardReputation: 50, targetType: "dodge", targetValue: 5, isHidden: false },
    { id: "B07", name: "团队协作", description: "全员存活通关一层", category: "battle", difficulty: 2, rewardReputation: 40, targetType: "perfect_clear", targetValue: 1, isHidden: false },
    { id: "B08", name: "以少胜多", description: "以1人队伍击败3个敌人", category: "battle", difficulty: 4, rewardReputation: 100, targetType: "outnumbered_victory", targetValue: 3, isHidden: false },
    { id: "B09", name: "BOSS猎手", description: "击败第一个BOSS", category: "battle", difficulty: 2, rewardReputation: 50, targetType: "defeat_boss", targetValue: 1, isHidden: false },
    { id: "B10", name: "灭霸之路", description: "击败所有5个BOSS", category: "battle", difficulty: 5, rewardReputation: 400, targetType: "defeat_all_boss", targetValue: 5, isHidden: false },
    { id: "B11", name: "无伤通关", description: "单层无任何角色受伤通关", category: "battle", difficulty: 5, rewardReputation: 200, targetType: "no_damage_clear", targetValue: 1, isHidden: true },
    { id: "B12", name: "极速战斗", description: "10秒内结束一场战斗", category: "battle", difficulty: 3, rewardReputation: 80, targetType: "speed_battle", targetValue: 10, isHidden: true },
    
    // 角色类成就
    { id: "C01", name: "新兵入伍", description: "招募第一个角色", category: "character", difficulty: 1, rewardReputation: 10, targetType: "recruit", targetValue: 1, isHidden: false },
    { id: "C02", name: "五人小队", description: "组建完整的5人队伍", category: "character", difficulty: 2, rewardReputation: 30, targetType: "team_full", targetValue: 5, isHidden: false },
    { id: "C03", name: "职业收藏家", description: "收集所有12种职业各1个", category: "character", difficulty: 4, rewardReputation: 200, targetType: "collect_class", targetValue: 12, isHidden: false },
    { id: "C04", name: "传说收集者", description: "收集所有⭐⭐⭐⭐级职业", category: "character", difficulty: 5, rewardReputation: 250, targetType: "collect_legendary", targetValue: 4, isHidden: true },
    { id: "C05", name: "强化新手", description: "首次强化装备成功", category: "character", difficulty: 1, rewardReputation: 15, targetType: "enhance_equip", targetValue: 1, isHidden: false },
    { id: "C06", name: "装备大师", description: "拥有10件+10强化装备", category: "character", difficulty: 4, rewardReputation: 180, targetType: "enhanced_equip", targetValue: 10, isHidden: false },
    { id: "C07", name: "满级英雄", description: "将任意角色升到满级", category: "character", difficulty: 3, rewardReputation: 120, targetType: "max_level_char", targetValue: 1, isHidden: false },
    { id: "C08", name: "百万血量", description: "单个角色生命值达到100000", category: "character", difficulty: 4, rewardReputation: 150, targetType: "hp_milestone", targetValue: 100000, isHidden: true },
    
    // 经营类成就
    { id: "M01", name: "小本经营", description: "累计获得10000赛博币", category: "manage", difficulty: 1, rewardReputation: 15, targetType: "earn_coins", targetValue: 10000, isHidden: false },
    { id: "M02", name: "富甲一方", description: "累计获得1000000赛博币", category: "manage", difficulty: 3, rewardReputation: 100, targetType: "earn_coins", targetValue: 1000000, isHidden: false },
    { id: "M03", name: "亿万富翁", description: "累计获得100000000赛博币", category: "manage", difficulty: 5, rewardReputation: 350, targetType: "earn_coins", targetValue: 100000000, isHidden: true },
    { id: "M04", name: "设施建设者", description: "升级任意设施到5级", category: "manage", difficulty: 2, rewardReputation: 40, targetType: "facility_level", targetValue: 5, isHidden: false },
    { id: "M05", name: "完美基地", description: "所有设施达到满级", category: "manage", difficulty: 5, rewardReputation: 250, targetType: "max_all_facility", targetValue: 6, isHidden: false },
    { id: "M06", name: "能量饮料爱好者", description: "使用过全部10种能量饮料", category: "manage", difficulty: 3, rewardReputation: 80, targetType: "use_all_energy", targetValue: 10, isHidden: false },
    { id: "M07", name: "刷新大师", description: "累计刷新伙伴100次", category: "manage", difficulty: 2, rewardReputation: 50, targetType: "refresh_partner", targetValue: 100, isHidden: false },
    { id: "M08", name: "声誉先锋", description: "达到声誉等级5", category: "manage", difficulty: 2, rewardReputation: 60, targetType: "reputation_level", targetValue: 5, isHidden: false },
    { id: "M09", name: "废土传奇", description: "达到声誉等级10（满级）", category: "manage", difficulty: 5, rewardReputation: 500, targetType: "reputation_level", targetValue: 10, isHidden: false },
    
    // 特殊类成就
    { id: "S01", name: "幸存者", description: "游戏时长超过100小时", category: "special", difficulty: 2, rewardReputation: 100, targetType: "play_time", targetValue: 360000, isHidden: false },
    { id: "S02", name: "忠诚玩家", description: "连续7天登录", category: "special", difficulty: 1, rewardReputation: 50, targetType: "login_streak", targetValue: 7, isHidden: false },
    { id: "S03", name: "月度之星", description: "连续30天登录", category: "special", difficulty: 3, rewardReputation: 200, targetType: "login_streak", targetValue: 30, isHidden: false },
    { id: "S04", name: "禁忌触碰", description: "使用禁忌药剂并获得隐藏角色", category: "special", difficulty: 5, rewardReputation: 500, targetType: "forbidden_success", targetValue: 1, isHidden: true },
    { id: "S05", name: "完美主义者", description: "完成95%以上的成就", category: "special", difficulty: 5, rewardReputation: 800, targetType: "achievement_rate", targetValue: 95, isHidden: true },
    { id: "S06", name: "速通之神", description: "从零开始24小时内通关第50层", category: "special", difficulty: 5, rewardReputation: 1000, targetType: "speed_complete", targetValue: 1, isHidden: true },
    { id: "S07", name: "无敌之师", description: "全员传说品质通关第50层", category: "special", difficulty: 5, rewardReputation: 600, targetType: "legendary_team_clear", targetValue: 1, isHidden: true },
    { id: "S08", name: "彩蛋发现者", description: "发现游戏中所有隐藏彩蛋", category: "special", difficulty: 4, rewardReputation: 300, targetType: "find_easter_egg", targetValue: 10, isHidden: true }
  ];
  
  addSheet(workbook, "成就列表", achievements);
  
  const milestones = [
    { completedCount: 10, rewardCoins: 500, rewardTitle: "初出茅庐", description: "完成10个成就" },
    { completedCount: 25, rewardCoins: 2000, rewardTitle: "小有成就", description: "完成25个成就" },
    { completedCount: 50, rewardCoins: 10000, rewardTitle: "成就达人", description: "完成50个成就" },
    { completedCount: 75, rewardCoins: 50000, rewardTitle: "特殊头像框", description: "完成75个成就" },
    { completedCount: 100, rewardCoins: 999999, rewardTitle: "传奇永恒", description: "完成全部成就" }
  ];
  
  addSheet(workbook, "里程碑奖励", milestones);
  
  saveWorkbook(workbook, 'achievement.xlsx');
}

// ============================================
// 3. quest.xlsx - 每日/每周任务配置表
// ============================================
function createQuestConfig() {
  const workbook = createWorkbook();
  
  const dailyQuests = [
    { questId: "D01", name: "每日登录", description: "登录游戏", type: "daily", category: "other", targetParam: "login", targetValue: 1, rewardReputation: 10, rewardCoins: 100, isFixed: true, weight: 0 },
    { questId: "D02", name: "探索禁区", description: "进入禁区并完成1层探索", type: "daily", category: "explore", targetParam: "complete_floor", targetValue: 1, rewardReputation: 15, rewardCoins: 200, isFixed: true, weight: 0 },
    { questId: "D03", name: "战斗胜利", description: "赢得战斗胜利", type: "daily", category: "battle", targetParam: "battle_win", targetValue: 3, rewardReputation: 20, rewardCoins: 300, isFixed: true, weight: 0 },
    { questId: "D04", name: "招募伙伴", description: "在基地招募新角色", type: "daily", category: "manage", targetParam: "recruit", targetValue: 1, rewardReputation: 10, rewardCoins: 150, isFixed: true, weight: 0 },
    { questId: "D05", name: "使用能量饮料", description: "购买并使用能量饮料", type: "daily", category: "manage", targetParam: "use_energy_drink", targetValue: 1, rewardReputation: 10, rewardCoins: 100, isFixed: true, weight: 0 },
    { questId: "D06", name: "升级设施", description: "升级任意基地设施", type: "daily", category: "manage", targetParam: "upgrade_facility", targetValue: 1, rewardReputation: 15, rewardCoins: 250, isFixed: true, weight: 0 }
  ];
  
  addSheet(workbook, "固定每日任务", dailyQuests);
  
  const randomQuests = [
    // 探索类随机任务
    { questId: "R01", name: "宝箱猎人", description: "开启宝箱", type: "random", category: "explore", targetParam: "open_chest", targetValue: 5, rewardReputation: 25, rewardCoins: 400, isFixed: false, weight: 10 },
    { questId: "R02", name: "登高者-10", description: "到达第10层", type: "random", category: "explore", targetParam: "reach_floor", targetValue: 10, rewardReputation: 30, rewardCoins: 500, isFixed: false, weight: 8 },
    { questId: "R03", name: "登高者-20", description: "到达第20层", type: "random", category: "explore", targetParam: "reach_floor", targetValue: 20, rewardReputation: 40, rewardCoins: 600, isFixed: false, weight: 5 },
    { questId: "R04", name: "登高者-30", description: "到达第30层", type: "random", category: "explore", targetParam: "reach_floor", targetValue: 30, rewardReputation: 50, rewardCoins: 700, isFixed: false, weight: 3 },
    { questId: "R05", name: "连续探索", description: "连续探索不退出", type: "random", category: "explore", targetParam: "consecutive_floors", targetValue: 5, rewardReputation: 35, rewardCoins: 550, isFixed: false, weight: 6 },
    { questId: "R06", name: "自动探索", description: "使用自动探索功能", type: "random", category: "explore", targetParam: "auto_explore", targetValue: 3, rewardReputation: 20, rewardCoins: 350, isFixed: false, weight: 10 },
    { questId: "R07", name: "BOSS挑战者", description: "挑战BOSS（无论胜负）", type: "random", category: "explore", targetParam: "challenge_boss", targetValue: 1, rewardReputation: 40, rewardCoins: 800, isFixed: false, weight: 4 },
    
    // 战斗类随机任务
    { questId: "R08", name: "暴击专家", description: "造成暴击", type: "random", category: "battle", targetParam: "critical_hit", targetValue: 10, rewardReputation: 25, rewardCoins: 400, isFixed: false, weight: 10 },
    { questId: "R09", name: "无伤通关", description: "单层无角色死亡通关", type: "random", category: "battle", targetParam: "no_death_clear", targetValue: 1, rewardReputation: 45, rewardCoins: 900, isFixed: false, weight: 5 },
    { questId: "R10", name: "技能释放者", description: "使用技能攻击", type: "random", category: "battle", targetParam: "use_skill", targetValue: 8, rewardReputation: 20, rewardCoins: 350, isFixed: false, weight: 10 },
    { questId: "R11", name: "快速战斗", description: "30秒内结束战斗", type: "random", category: "battle", targetParam: "speed_battle", targetValue: 3, rewardReputation: 30, rewardCoins: 500, isFixed: false, weight: 8 },
    { questId: "R12", name: "以少胜多", description: "用≤3人队伍击败敌人", type: "random", category: "battle", targetParam: "outnumbered_win", targetValue: 2, rewardReputation: 35, rewardCoins: 600, isFixed: false, weight: 6 },
    
    // 经营类随机任务
    { questId: "R13", name: "强化装备", description: "强化装备成功", type: "random", category: "manage", targetParam: "enhance_equip", targetValue: 3, rewardReputation: 20, rewardCoins: 350, isFixed: false, weight: 10 },
    { questId: "R14", name: "刷新伙伴", description: "睡一觉刷新伙伴", type: "random", category: "manage", targetParam: "refresh_partner", targetValue: 1, rewardReputation: 15, rewardCoins: 250, isFixed: false, weight: 12 },
    { questId: "R15", name: "大手笔消费", description: "累计消耗赛博币", type: "random", category: "manage", targetParam: "spend_coins", targetValue: 5000, rewardReputation: 25, rewardCoins: 450, isFixed: false, weight: 8 },
    { questId: "R16", name: "设施满级", description: "将任意设施升到下一级", type: "random", category: "manage", targetParam: "facility_upgrade", targetValue: 1, rewardReputation: 20, rewardCoins: 350, isFixed: false, weight: 10 },
    { questId: "R17", name: "收集狂人", description: "招募3个不同职业的角色", type: "random", category: "manage", targetParam: "recruit_different_class", targetValue: 3, rewardReputation: 25, rewardCoins: 400, isFixed: false, weight: 6 }
  ];
  
  addSheet(workbook, "随机任务池", randomQuests);
  
  const weeklyQuests = [
    { questId: "W01", name: "周常探索者", description: "本周累计探索楼层", type: "weekly", category: "explore", targetParam: "weekly_floors", targetValue: 50, rewardReputation: 80, rewardCoins: 1500, resetDay: 1 },
    { questId: "W02", name: "周常战士", description: "本周累计战斗胜利", type: "weekly", category: "battle", targetParam: "weekly_battle_win", targetValue: 30, rewardReputation: 80, rewardCoins: 1500, resetDay: 1 },
    { questId: "W03", name: "周常经营者", description: "本周累计招募角色", type: "weekly", category: "manage", targetParam: "weekly_recruit", targetValue: 10, rewardReputation: 60, rewardCoins: 1200, resetDay: 1 }
  ];
  
  addSheet(workbook, "每周任务", weeklyQuests);
  
  const completionRewards = [
    { completedTasks: 4, bonusReputation: 20, bonusCoins: 300, description: "完成4个每日任务" },
    { completedTasks: 6, bonusReputation: 50, bonusCoins: 800, description: "完成全部6个固定任务" },
    { completedTasks: 8, bonusReputation: 80, bonusCoins: 1500, description: "完成全部任务（含随机）" },
    { completedTasks: 7, bonusReputation: 200, bonusCoins: 0, description: "连续7天全勤", title: "勤奋探险家" }
  ];
  
  addSheet(workbook, "完成奖励", completionRewards);
  
  saveWorkbook(workbook, 'quest.xlsx');
}

// ============================================
// 4. bosses.xlsx - BOSS详细配置表
// ============================================
function createBossConfig() {
  const workbook = createWorkbook();
  
  const bosses = [
    {
      bossId: 1,
      name: "毁灭领主",
      englishName: "Destroyer Lord Argos",
      floor: 10,
      type: "mech",
      hp: 2000,
      atk: 30,
      critRate: 0.15,
      dodgeRate: 0.05,
      phase: 1,
      specialMechanic: "召唤小怪|狂暴",
      dropTableId: "boss_01"
    },
    {
      bossId: 2,
      name: "暗影帝王",
      englishName: "Shadow Emperor Noxus",
      floor: 20,
      type: "shadow",
      hp: 3500,
      atk: 35,
      critRate: 0.30,
      dodgeRate: 0.25,
      phase: 2,
      specialMechanic: "分身术|影遁",
      dropTableId: "boss_02"
    },
    {
      bossId: 3,
      name: "天网核心",
      englishName: "SkyNet Core Prime",
      floor: 30,
      type: "ai",
      hp: 5000,
      atk: 40,
      critRate: 0.20,
      dodgeRate: 0.10,
      phase: 2,
      specialMechanic: "系统入侵|能量风暴|护盾机制",
      dropTableId: "boss_03"
    },
    {
      bossId: 4,
      name: "机械母体",
      englishName: "Mech Mother Genesis",
      floor: 40,
      type: "factory",
      hp: 8000,
      atk: 35,
      critRate: 0.10,
      dodgeRate: 0.00,
      phase: 1,
      specialMechanic: "无限召唤|自毁程序|维修模式",
      dropTableId: "boss_04"
    },
    {
      bossId: 5,
      name: "终焉之神",
      englishName: "God of End Omega",
      floor: 50,
      type: "final",
      hp: 15000,
      atk: 50,
      critRate: 0.25,
      dodgeRate: 0.15,
      phase: 3,
      specialMechanic: "三阶段变身|终极审判|末日countdown",
      dropTableId: "boss_final"
    }
  ];
  
  addSheet(workbook, "BOSS基础信息", bosses);
  
  const bossSkills = [
    // 毁灭领主技能
    { bossId: 1, skillId: "B01_S1", skillName: "毁灭践踏", type: "active", effect: "对全体造成80%攻击伤害", cooldown: 2, targetType: "all_enemies" },
    { bossId: 1, skillId: "B01_S2", skillName: "召唤猎犬", type: "active", effect: "召唤2只机械猎犬", cooldown: 5, targetType: "summon" },
    { bossId: 1, skillId: "B01_S3", skillName: "狂暴", type: "passive", effect: "生命<50%时，攻击+50%", cooldown: 0, targetType: "self_buff" },
    
    // 暗影帝王技能
    { bossId: 2, skillId: "B02_S1", skillName: "暗影斩", type: "active", effect: "对单体造成250%攻击伤害", cooldown: 1, targetType: "single" },
    { bossId: 2, skillId: "B02_S2", skillName: "分身术", type: "active", effect: "创建2个分身（各30%HP）", cooldown: 6, targetType: "summon" },
    { bossId: 2, skillId: "B02_S3", skillName: "影遁", type: "active", effect: "闪避率+50%，持续2回合", cooldown: 4, targetType: "self_buff" },
    { bossId: 2, skillId: "B02_S4", skillName: "虚弱标记", type: "passive", effect: "击败分身后本体防御-30%", cooldown: 0, targetType: "debuff" },
    
    // 天网核心技能
    { bossId: 3, skillId: "B03_S1", skillName: "系统入侵", type: "active", effect: "控制1个角色1回合无法行动", cooldown: 3, targetType: "single" },
    { bossId: 3, skillId: "B03_S2", skillName: "能量风暴", type: "active", effect: "对全体造成100%攻击伤害", cooldown: 2, targetType: "all_enemies" },
    { bossId: 3, skillId: "B03_S3", skillName: "数据过载", type: "active", effect: "下次受到伤害反弹200%", cooldown: 5, targetType: "self_buff" },
    { bossId: 3, skillId: "B03_S4", skillName: "护盾机制", type: "passive", effect: "护盾值=最大HP的20%，护盾存在时免疫控制", cooldown: 0, targetType: "shield" },
    
    // 机械母体技能
    { bossId: 4, skillId: "B04_S1", skillName: "生产指令", type: "active", effect: "召唤3只随机小怪", cooldown: 2, targetType: "summon" },
    { bossId: 4, skillId: "B04_S2", skillName: "自毁程序", type: "active", effect: "对全体造成150%攻击伤害", cooldown: 4, targetType: "all_enemies" },
    { bossId: 4, skillId: "B04_S3", skillName: "维修模式", type: "active", effect: "回复20%最大HP", cooldown: 6, targetType: "self_heal" },
    { bossId: 4, skillId: "B04_S4", skillName: "伤害减免", type: "passive", effect: "小怪存在时受到伤害-30%", cooldown: 0, targetType: "self_debuff" },
    
    // 最终BOSS技能（多阶段）
    { bossId: 5, skillId: "B05_P1S1", skillName: "毁灭光束", type: "active", effect: "对单体造成300%攻击伤害", cooldown: 1, targetType: "single", phase: 1 },
    { bossId: 5, skillId: "B05_P1S2", skillName: "能量冲击", type: "active", effect: "对全体造成120%攻击伤害", cooldown: 2, targetType: "all_enemies", phase: 1 },
    { bossId: 5, skillId: "B05_P1S3", skillName: "力量汲取", type: "active", effect: "吸取1个角色20%攻击力，持续3回合", cooldown: 4, targetType: "single", phase: 1 },
    { bossId: 5, skillId: "B05_P2S1", skillName: "暗影领域", type: "active", effect: "全体敌人命中-25%，持续3回合", cooldown: 3, targetType: "all_enemies", phase: 2 },
    { bossId: 5, skillId: "B05_P2S2", skillName: "死亡标记", type: "active", effect: "标记1个角色，3回合后造成500%攻击伤害", cooldown: 5, targetType: "single", phase: 2 },
    { bossId: 5, skillId: "B05_P2S3", skillName: "影分身", type: "active", effect: "创建3个分身（各20%HP）", cooldown: 8, targetType: "summon", phase: 2 },
    { bossId: 5, skillId: "B05_P3S1", skillName: "终极审判", type: "active", effect: "对全体造成200%攻击伤害", cooldown: 2, targetType: "all_enemies", phase: 3 },
    { bossId: 5, skillId: "B05_P3S2", skillName: "时间停止", type: "active", effect: "所有角色无法行动1回合", cooldown: 6, targetType: "all_enemies", phase: 3 },
    { bossId: 5, skillId: "B05_P3S3", skillName: "末日countdown", type: "active", effect: "5回合后造成99999伤害", cooldown: 0, targetType: "instant_death", phase: 3 }
  ];
  
  addSheet(workbook, "BOSS技能", bossSkills);
  
  const bossDrops = [
    { dropTableId: "boss_01", itemId: "coins", itemName: "赛博币", minAmount: 500, maxAmount: 800, probability: 100 },
    { dropTableId: "boss_01", itemId: "exp", itemName: "经验值", minAmount: 200, maxAmount: 300, probability: 100 },
    { dropTableId: "boss_01", itemId: "rare_equip", itemName: "稀有装备", minAmount: 1, maxAmount: 1, probability: 100 },
    { dropTableId: "boss_01", itemId: "epic_equip", itemName: "史诗装备", minAmount: 1, maxAmount: 1, probability: 30 },
    { dropTableId: "boss_01", itemId: "legend_equip", itemName: "传说装备", minAmount: 1, maxAmount: 1, probability: 5 },
    
    { dropTableId: "boss_02", itemId: "coins", itemName: "赛博币", minAmount: 800, maxAmount: 1200, probability: 100 },
    { dropTableId: "boss_02", itemId: "exp", itemName: "经验值", minAmount: 400, maxAmount: 500, probability: 100 },
    { dropTableId: "boss_02", itemId: "epic_equip", itemName: "史诗装备", minAmount: 1, maxAmount: 1, probability: 100 },
    { dropTableId: "boss_02", itemId: "legend_equip", itemName: "传说装备", minAmount: 1, maxAmount: 1, probability: 10 },
    
    { dropTableId: "boss_03", itemId: "coins", itemName: "赛博币", minAmount: 1000, maxAmount: 1500, probability: 100 },
    { dropTableId: "boss_03", itemId: "exp", itemName: "经验值", minAmount: 600, maxAmount: 800, probability: 100 },
    { dropTableId: "boss_03", itemId: "epic_equip", itemName: "史诗装备", minAmount: 1, maxAmount: 2, probability: 100 },
    { dropTableId: "boss_03", itemId: "legend_equip", itemName: "传说装备", minAmount: 1, maxAmount: 1, probability: 15 },
    
    { dropTableId: "boss_04", itemId: "coins", itemName: "赛博币", minAmount: 1500, maxAmount: 2000, probability: 100 },
    { dropTableId: "boss_04", itemId: "exp", itemName: "经验值", minAmount: 800, maxAmount: 1000, probability: 100 },
    { dropTableId: "boss_04", itemId: "legend_equip", itemName: "传说装备", minAmount: 1, maxAmount: 2, probability: 100 },
    
    { dropTableId: "boss_final", itemId: "coins", itemName: "赛博币", minAmount: 5000, maxAmount: 10000, probability: 100 },
    { dropTableId: "boss_final", itemId: "exp", itemName: "经验值", minAmount: 2000, maxAmount: 3000, probability: 100 },
    { dropTableId: "boss_final", itemId: "legend_equip", itemName: "传说装备", minAmount: 2, maxAmount: 3, probability: 100 },
    { dropTableId: "boss_final", itemId: "unique_item", itemName: "独特道具", minAmount: 1, maxAmount: 1, probability: 100 }
  ];
  
  addSheet(workbook, "BOSS掉落", bossDrops);
  
  saveWorkbook(workbook, 'bosses.xlsx');
}

// 执行所有创建函数
console.log('开始创建Excel配置表...\n');

try {
  createReputationConfig();
  createAchievementConfig();
  createQuestConfig();
  createBossConfig();
  
  console.log('\n✅ 所有Excel配置表创建完成！');
  console.log(`📁 输出目录: ${outputDir}`);
} catch (error) {
  console.error('创建Excel文件时出错:', error);
}
