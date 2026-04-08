const path = require('path');
const XLSX = require('xlsx');

const outputDir = path.join(__dirname, '../assets/data/excel');

function createWorkbook() {
  return XLSX.utils.book_new();
}

function addSheet(workbook, sheetName, rows) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
}

function saveWorkbook(workbook, fileName) {
  const filePath = path.join(outputDir, fileName);
  XLSX.writeFile(workbook, filePath);
  console.log(`已生成: ${filePath}`);
}

function createFusionGirlsWorkbook() {
  const workbook = createWorkbook();
  const rows = [
    ['id', 'name', 'title', 'element', 'profession', 'initialQuality', 'defaultPortraitSetId', 'unlockChapterId', 'unlockStageId', 'description', 'baseHp', 'baseAtk', 'baseSpd', 'activeSkill1Id', 'activeSkill2Id', 'activeSkill3Id', 'petSlotUnlockQuality', 'moduleSlotPlan'],
    ['string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'int', 'int', 'int', 'string', 'string', 'string', 'string', 'json'],
    ['融合姬ID', '名称', '称号', '元素', '职业', '初始品质', '默认立绘套装ID', '解锁章节ID', '解锁关卡ID', '描述', '基础生命', '基础攻击', '基础速度', '技能1', '技能2', '技能3', '宠物栏解锁品质', '不同品质的模组槽数量规划'],
    ['FG_WATER_001', '凌霜', '失忆医者', 'water', 'support', 'N', 'PS_LINGSHUANG_01', 'chapter_01', 'stage_01_04', '剧情占位数据，后续可替换', 1080, 32, 14, 'SKILL_WATER_BASIC', 'SKILL_WATER_HEAL', 'SKILL_WATER_MEMORY', 'UR', '{"N":3,"R":5,"SR":5,"SSR":7,"UR":7,"LE":9}'],
    ['FG_FIRE_001', '烈焰', '余烬守卫', 'fire', 'dps', 'N', 'PS_LIEYAN_01', 'chapter_01', 'zone_01_lab', '剧情占位数据，后续可替换', 960, 40, 15, 'SKILL_FIRE_BASIC', 'SKILL_FIRE_BURST', 'SKILL_FIRE_OVERDRIVE', 'UR', '{"N":3,"R":5,"SR":5,"SSR":7,"UR":7,"LE":9}'],
    ['FG_WIND_001', '晨风', '风语观测者', 'wind', 'support', 'N', 'PS_CHENFENG_01', 'chapter_01', 'zone_01_mine', '剧情占位数据，后续可替换', 920, 34, 18, 'SKILL_WIND_BASIC', 'SKILL_WIND_SHIFT', 'SKILL_WIND_DOMAIN', 'UR', '{"N":3,"R":5,"SR":5,"SSR":7,"UR":7,"LE":9}']
  ];

  addSheet(workbook, '融合姬主表', rows);
  saveWorkbook(workbook, 'fusionGirls.xlsx');
}

function createPortraitSetsWorkbook() {
  const workbook = createWorkbook();
  const rows = [
    ['id', 'fusionGirlId', 'setOrder', 'setName', 'coverPortrait', 'description', 'isDefault', 'unlockPreviewText'],
    ['string', 'string', 'int', 'string', 'string', 'string', 'bool', 'string'],
    ['立绘套装ID', '融合姬ID', '套装序号', '套装名称', '立绘资源', '描述', '是否默认立绘', '升品质预览文案'],
    ['PS_LINGSHUANG_01', 'FG_WATER_001', 1, '初雪诊疗', 'characters/fusion/FM001.png', '凌霜第一套立绘占位数据', true, '解锁新的立绘表现与品质提升'],
    ['PS_LINGSHUANG_02', 'FG_WATER_001', 2, '寒潮守护', 'characters/fusion/FM001.png', '凌霜第二套立绘占位数据', false, '解锁新的立绘表现与品质提升'],
    ['PS_LIEYAN_01', 'FG_FIRE_001', 1, '余火巡行', 'characters/fusion/FM002.png', '烈焰第一套立绘占位数据', true, '解锁新的立绘表现与品质提升'],
    ['PS_CHENFENG_01', 'FG_WIND_001', 1, '静风观测', 'characters/fusion/FM003.png', '晨风第一套立绘占位数据', true, '解锁新的立绘表现与品质提升']
  ];

  addSheet(workbook, '立绘套装表', rows);
  saveWorkbook(workbook, 'portraitSets.xlsx');
}

function createPortraitFragmentsWorkbook() {
  const workbook = createWorkbook();
  const rows = [
    ['id', 'portraitSetId', 'fusionGirlId', 'fragmentQuality', 'fragmentSlot', 'requiredCount', 'bonusType', 'bonusValue', 'overflowElement', 'icon', 'description'],
    ['string', 'string', 'string', 'string', 'string', 'int', 'string', 'float', 'string', 'string', 'string'],
    ['碎片ID', '立绘套装ID', '融合姬ID', '碎片品质', '碎片槽位标识', '需求数量', '属性类型', '每张提供的数值', '溢出转换元素', '图标资源', '描述'],
    ['PF_LS_01_R', 'PS_LINGSHUANG_01', 'FG_WATER_001', 'R', 'R_CORE', 6, 'hp_pct', 0.01, 'water', 'fragment_r_water', 'R碎片示例'],
    ['PF_LS_01_SR', 'PS_LINGSHUANG_01', 'FG_WATER_001', 'SR', 'SR_CORE', 4, 'atk_pct', 0.03, 'water', 'fragment_sr_water', 'SR碎片示例'],
    ['PF_LS_01_SSR', 'PS_LINGSHUANG_01', 'FG_WATER_001', 'SSR', 'SSR_CORE', 3, 'spd_pct', 0.08, 'water', 'fragment_ssr_water', 'SSR碎片示例'],
    ['PF_LS_01_UR', 'PS_LINGSHUANG_01', 'FG_WATER_001', 'UR', 'UR_CORE', 2, 'all_pct', 0.02, 'water', 'fragment_ur_water', 'UR碎片示例'],
    ['PF_LS_02_R', 'PS_LINGSHUANG_02', 'FG_WATER_001', 'R', 'R_CORE', 8, 'hp_pct', 0.01, 'water', 'fragment_r_water', '第二套R碎片示例'],
    ['PF_LS_02_SR', 'PS_LINGSHUANG_02', 'FG_WATER_001', 'SR', 'SR_CORE', 5, 'atk_pct', 0.02, 'water', 'fragment_sr_water', '第二套SR碎片示例'],
    ['PF_LS_02_SSR', 'PS_LINGSHUANG_02', 'FG_WATER_001', 'SSR', 'SSR_CORE', 4, 'spd_pct', 0.05, 'water', 'fragment_ssr_water', '第二套SSR碎片示例'],
    ['PF_LS_02_UR', 'PS_LINGSHUANG_02', 'FG_WATER_001', 'UR', 'UR_CORE', 3, 'all_pct', 0.03, 'water', 'fragment_ur_water', '第二套UR碎片示例'],
    ['PF_LY_01_R', 'PS_LIEYAN_01', 'FG_FIRE_001', 'R', 'R_CORE', 6, 'atk_pct', 0.01, 'fire', 'fragment_r_fire', '烈焰R碎片示例'],
    ['PF_LY_01_SR', 'PS_LIEYAN_01', 'FG_FIRE_001', 'SR', 'SR_CORE', 4, 'atk_pct', 0.03, 'fire', 'fragment_sr_fire', '烈焰SR碎片示例'],
    ['PF_LY_01_SSR', 'PS_LIEYAN_01', 'FG_FIRE_001', 'SSR', 'SSR_CORE', 3, 'spd_pct', 0.06, 'fire', 'fragment_ssr_fire', '烈焰SSR碎片示例'],
    ['PF_LY_01_UR', 'PS_LIEYAN_01', 'FG_FIRE_001', 'UR', 'UR_CORE', 2, 'all_pct', 0.025, 'fire', 'fragment_ur_fire', '烈焰UR碎片示例'],
    ['PF_CF_01_R', 'PS_CHENFENG_01', 'FG_WIND_001', 'R', 'R_CORE', 6, 'spd_pct', 0.01, 'wind', 'fragment_r_wind', '晨风R碎片示例'],
    ['PF_CF_01_SR', 'PS_CHENFENG_01', 'FG_WIND_001', 'SR', 'SR_CORE', 4, 'atk_pct', 0.02, 'wind', 'fragment_sr_wind', '晨风SR碎片示例'],
    ['PF_CF_01_SSR', 'PS_CHENFENG_01', 'FG_WIND_001', 'SSR', 'SSR_CORE', 3, 'spd_pct', 0.08, 'wind', 'fragment_ssr_wind', '晨风SSR碎片示例'],
    ['PF_CF_01_UR', 'PS_CHENFENG_01', 'FG_WIND_001', 'UR', 'UR_CORE', 2, 'all_pct', 0.02, 'wind', 'fragment_ur_wind', '晨风UR碎片示例']
  ];

  addSheet(workbook, '立绘碎片表', rows);
  saveWorkbook(workbook, 'portraitFragments.xlsx');
}

function createElementShopWorkbook() {
  const workbook = createWorkbook();
  const rows = [
    ['id', 'shopElement', 'itemType', 'itemId', 'itemName', 'cost', 'dailyLimit', 'description'],
    ['string', 'string', 'string', 'string', 'string', 'int', 'int', 'string'],
    ['商品ID', '商店元素', '商品类型', '商品关联ID', '商品名称', '价格', '每日限购', '描述'],
    ['ES_WATER_001', 'water', 'material', 'ITEM_WATER_MEMORY', '水点记忆晶体', 20, 5, '水点商店示例商品'],
    ['ES_FIRE_001', 'fire', 'material', 'ITEM_FIRE_MEMORY', '火点燃素结晶', 20, 5, '火点商店示例商品'],
    ['ES_WIND_001', 'wind', 'material', 'ITEM_WIND_MEMORY', '风点流息结晶', 20, 5, '风点商店示例商品']
  ];

  addSheet(workbook, '元素点商店表', rows);
  saveWorkbook(workbook, 'elementPointShop.xlsx');
}

function main() {
  createFusionGirlsWorkbook();
  createPortraitSetsWorkbook();
  createPortraitFragmentsWorkbook();
  createElementShopWorkbook();
}

main();
