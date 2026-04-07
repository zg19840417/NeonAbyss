const fs = require('fs');
const path = require('path');

const langFilePath = path.join(__dirname, '../assets/data/json/language.json');
const langData = JSON.parse(fs.readFileSync(langFilePath, 'utf-8'));

const existingIds = new Set(langData.map(item => item.id));

const additionalTranslations = [
  { id: "game_title_zh", zh_cn: "出发！为了拯救这个世界！", en_us: "Let's Go! To Save the World!" },
  { id: "game_title_en", zh_cn: "Let's Go!", en_us: "Let's Go!" },
  { id: "tap_to_start", zh_cn: "点击屏幕开始游戏", en_us: "Tap to Start" },
  { id: "our_side", zh_cn: "我方", en_us: "Our Side" },
  { id: "crit_damage", zh_cn: "暴击!", en_us: "Critical!" },
  { id: "use_skill", zh_cn: "使用技能", en_us: "Use Skill" },
  { id: "victory", zh_cn: "胜利!", en_us: "Victory!" },
  { id: "mission_failed", zh_cn: "任务失败", en_us: "Mission Failed" },
  { id: "return_to_base", zh_cn: "角色将安全返回基地", en_us: "Characters will safely return to base" },
  { id: "obtain_mycelium", zh_cn: "获得菌丝: {amount}", en_us: "Obtain Mycelium: {amount}" },
  { id: "obtain_source_core", zh_cn: "获得源核: {amount}", en_us: "Obtain Source Core: {amount}" },
  { id: "dungeon_explore", zh_cn: "禁区探索", en_us: "Dungeon Exploration" },
  { id: "wild_explore", zh_cn: "野外探索", en_us: "Wild Exploration" },
  { id: "dimension", zh_cn: "次元 {num}", en_us: "Dimension {num}" },
  { id: "entering_battle", zh_cn: "正在进入自动战斗...", en_us: "Entering auto battle..." },
  { id: "initializing", zh_cn: "正在初始化游戏资源", en_us: "Initializing game resources" },
  { id: "unknown", zh_cn: "未知", en_us: "Unknown" },
  { id: "language", zh_cn: "语言", en_us: "Language" },
  { id: "language_switch", zh_cn: "切换语言", en_us: "Switch Language" },
  { id: "gacha_record", zh_cn: "抽卡记录", en_us: "Gacha History" },
  { id: "no_gacha_record", zh_cn: "暂无抽卡记录", en_us: "No Gacha Records" },
  { id: "pity_count", zh_cn: "保底: {count}抽", en_us: "Pity: {count} draws" },
  { id: "gacha_title", zh_cn: "融合召唤", en_us: "Fusion Summon" },
  { id: "fusion_maiden_count", zh_cn: "融合姬×{count}", en_us: "Fusion Maiden ×{count}" },
  { id: "obtain_reward", zh_cn: "获得 {reward}！", en_us: "Obtain {reward}!" },
  { id: "daily_limit_reached", zh_cn: "今日已售罄", en_us: "Sold Out Today" },
  { id: "already_purchased", zh_cn: "已购买过", en_us: "Already Purchased" },
  { id: "not_enough_currency", zh_cn: "货币不足", en_us: "Not Enough Currency" },
  { id: "cannot_purchase", zh_cn: "无法购买", en_us: "Cannot Purchase" },
  { id: "no_item", zh_cn: "暂无商品", en_us: "No Items" },
  { id: "daily_limit", zh_cn: "剩余: {remaining}/{limit}", en_us: "Remaining: {remaining}/{limit}" },
  { id: "one_time", zh_cn: "一次性", en_us: "One-time" },
  { id: "quality_normal", zh_cn: "普通", en_us: "Normal" },
  { id: "quality_rare", zh_cn: "稀有", en_us: "Rare" },
  { id: "quality_sr", zh_cn: "精良", en_us: "Elite" },
  { id: "quality_ssr", zh_cn: "史诗", en_us: "Epic" },
  { id: "quality_ur", zh_cn: "传说", en_us: "Legendary" },
  { id: "quality_mythic", zh_cn: "神话", en_us: "Mythic" },
  { id: "gacha", zh_cn: "抽卡", en_us: "Gacha" },
  { id: "single_draw", zh_cn: "单抽×1", en_us: "Single ×1" },
  { id: "ten_draw", zh_cn: "十连×10", en_us: "Ten Pull ×10" },
  { id: "explore", zh_cn: "探索", en_us: "Explore" },
  { id: "main_stages", zh_cn: "主线关卡", en_us: "Main Stages" },
  { id: "dungeon_entrance", zh_cn: "禁区入口", en_us: "Dungeon Entrance" },
  { id: "boss_stage", zh_cn: "Boss关卡", en_us: "Boss Stage" },
  { id: "normal_stage", zh_cn: "普通关卡", en_us: "Normal Stage" },
  { id: "stage_progress", zh_cn: "进度: {cleared}/{total}", en_us: "Progress: {cleared}/{total}" },
  { id: "stage_locked", zh_cn: "关卡已锁定", en_en: "Stage Locked" },
  { id: "clear_to_unlock", zh_cn: "完成前置关卡后解锁", en_us: "Unlock after clearing previous stages" }
];

let addedCount = 0;

additionalTranslations.forEach(trans => {
  if (!existingIds.has(trans.id)) {
    langData.push(trans);
    addedCount++;
  }
});

fs.writeFileSync(langFilePath, JSON.stringify(langData, null, 2), 'utf-8');
console.log(`已添加 ${addedCount} 个新的翻译项`);
console.log(`总翻译项数量: ${langData.length}`);
