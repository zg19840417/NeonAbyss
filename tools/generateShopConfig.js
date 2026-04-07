const xlsx = require('xlsx');
const path = require('path');

const inputDir = path.join(__dirname, '../assets/data/excel');

const shopData = [
  // 表头
  ['shopId', 'shopType', 'itemId', 'itemName', 'cost', 'currency', 'dailyLimit', 'sortOrder', 'visible', 'startTime', 'endTime'],
  ['string', 'string', 'string', 'string', 'int', 'string', 'int', 'int', 'bool', 'string', 'string'],
  ['商品ID', '商店类型', '道具ID', '商品名称', '价格', '货币类型', '每日限量', '排序', '是否显示', '开始时间', '结束时间'],
  
  // 源核商店（10个商品）
  ['SC_001', 'sourceCore', 'ITEM_RAD_MEDICINE', '抗辐射药剂', 100, 'sourceCore', 10, 1, true, '', ''],
  ['SC_002', 'sourceCore', 'ITEM_PLUGIN_PROF_RANDOM', '职业改造晶片·R（随机）', 200, 'sourceCore', 3, 2, true, '', ''],
  ['SC_003', 'sourceCore', 'ITEM_PLUGIN_PROF_TANK', '职业改造晶片·R（坦克）', 300, 'sourceCore', 1, 3, true, '', ''],
  ['SC_004', 'sourceCore', 'ITEM_PLUGIN_PROF_DPS', '职业改造晶片·R（输出）', 300, 'sourceCore', 1, 4, true, '', ''],
  ['SC_005', 'sourceCore', 'ITEM_PLUGIN_PROF_SUPPORT', '职业改造晶片·R（辅助）', 300, 'sourceCore', 1, 5, true, '', ''],
  ['SC_006', 'sourceCore', 'ITEM_PLUGIN_RACE_SR', '种族改造晶片·SR（随机）', 500, 'sourceCore', 1, 6, true, '', ''],
  ['SC_007', 'sourceCore', 'ITEM_PLUGIN_ELEMENT_SR', '元素改造晶片·SR（随机）', 500, 'sourceCore', 1, 7, true, '', ''],
  ['SC_008', 'sourceCore', 'ITEM_EXP_CHIP_SMALL', '经验芯片·小', 50, 'sourceCore', 20, 8, true, '', ''],
  ['SC_009', 'sourceCore', 'ITEM_EXP_CHIP_MEDIUM', '经验芯片·中', 150, 'sourceCore', 10, 9, true, '', ''],
  ['SC_010', 'sourceCore', 'ITEM_EXP_CHIP_LARGE', '经验芯片·大', 400, 'sourceCore', 5, 10, true, '', ''],
  
  // 菌丝商店（8个商品）
  ['MS_001', 'mycelium', 'ITEM_N_FRAGMENT_BOX', 'N卡碎片自选箱', 500, 'mycelium', 5, 1, true, '', ''],
  ['MS_002', 'mycelium', 'ITEM_UPGRADE_MATERIAL_LOW', '升级材料·初级', 200, 'mycelium', 20, 2, true, '', ''],
  ['MS_003', 'mycelium', 'ITEM_UPGRADE_MATERIAL_MID', '升级材料·中级', 800, 'mycelium', 10, 3, true, '', ''],
  ['MS_004', 'mycelium', 'ITEM_CHIP_EXP_SMALL', '芯片经验模块·小', 300, 'mycelium', 15, 4, true, '', ''],
  ['MS_005', 'mycelium', 'ITEM_CHIP_EXP_MEDIUM', '芯片经验模块·中', 1000, 'mycelium', 5, 5, true, '', ''],
  ['MS_006', 'mycelium', 'ITEM_SKILL_UPGRADE_MATERIAL', '技能升级材料', 1500, 'mycelium', 3, 6, true, '', ''],
  ['MS_007', 'mycelium', 'ITEM_SOURCE_CORE', '源核×100', 5000, 'mycelium', 1, 7, true, '', ''],
  ['MS_008', 'mycelium', 'ITEM_RAD_MEDICINE', '抗辐射药剂', 3000, 'mycelium', 1, 8, true, '', ''],
  
  // 星币商店（8个商品）
  ['GC_001', 'starCoin', 'ITEM_SOURCE_CORE', '源核×100', 10, 'starCoin', 5, 1, true, '', ''],
  ['GC_002', 'starCoin', 'ITEM_SOURCE_CORE', '源核×500', 45, 'starCoin', 3, 2, true, '', ''],
  ['GC_003', 'starCoin', 'ITEM_SOURCE_CORE', '源核×1000', 80, 'starCoin', 2, 3, true, '', ''],
  ['GC_004', 'starCoin', 'PACK_NEWBIE', '新手成长礼包', 30, 'starCoin', -1, 4, true, '', ''],
  ['GC_005', 'starCoin', 'PACK_DAILY_DEAL', '每日特惠礼包', 6, 'starCoin', 1, 5, true, '', ''],
  ['GC_006', 'starCoin', 'ITEM_RAD_MEDICINE', '抗辐射药剂×5', 10, 'starCoin', 3, 6, true, '', ''],
  ['GC_007', 'starCoin', 'ITEM_PLUGIN_SSR', '异化改造晶片·SSR', 100, 'starCoin', 1, 7, true, '', ''],
  ['GC_008', 'starCoin', 'PACK_LIMITED_UP', '限定UP礼包', 68, 'starCoin', 1, 8, false, '', ''],
  
  // 碎片商店（7个兑换项）
  ['FR_001', 'fragment', 'MINION_R', '指定R角色', 20, 'r_fragment', 0, 1, true, '', ''],
  ['FR_002', 'fragment', 'MINION_SR', '指定SR角色', 40, 'sr_fragment', 0, 2, true, '', ''],
  ['FR_003', 'fragment', 'MINION_SSR', '指定SSR角色', 80, 'ssr_fragment', 0, 3, true, '', ''],
  ['FR_004', 'fragment', 'MINION_UR', '指定UR角色', 150, 'ur_fragment', 0, 4, true, '', ''],
  ['FR_005', 'fragment', 'ITEM_PLUGIN_PROF_RANDOM', '职业改造晶片·R（随机）', 10, 'r_fragment', 0, 5, true, '', ''],
  ['FR_006', 'fragment', 'MYCELIUM_500', '菌丝×500', 1, 'r_fragment', 0, 6, true, '', ''],
  ['FR_007', 'fragment', 'ITEM_SOURCE_CORE', '源核×100', 5, 'sr_fragment', 0, 7, true, '', ''],
  
  // 抽卡商店（2个商品）
  ['GA_001', 'gacha', 'GACHA_SINGLE', '单抽×1', 200, 'sourceCore', 0, 1, true, '', ''],
  ['GA_002', 'gacha', 'GACHA_TEN', '十连×10', 2000, 'sourceCore', 0, 2, true, '', '']
];

const ws = xlsx.utils.aoa_to_sheet(shopData);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Shop');

const outputPath = path.join(inputDir, 'shop.xlsx');
xlsx.writeFile(wb, outputPath);

console.log(`✅ shop.xlsx 已生成: ${outputPath}`);
console.log(`   - 源核商店: 10个商品`);
console.log(`   - 菌丝商店: 8个商品`);
console.log(`   - 星币商店: 8个商品`);
console.log(`   - 碎片商店: 7个兑换项`);
console.log(`   - 抽卡商店: 2个商品`);
console.log(`   - 总计: 35个商品`);
