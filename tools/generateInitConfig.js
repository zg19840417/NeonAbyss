const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../assets/data/excel');
const jsonOutputDir = path.join(__dirname, '../assets/data/json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(jsonOutputDir)) {
  fs.mkdirSync(jsonOutputDir, { recursive: true });
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

function createInitConfig() {
  const workbook = createWorkbook();
  
  const currencies = [
    { key: 'mycelium', name: '菌丝', initialValue: 60000, description: '主要货币' },
    { key: 'sourceCore', name: '源核', initialValue: 60000, description: '稀有货币' },
    { key: 'starCoin', name: '星币', initialValue: 60000, description: '特殊货币' },
    { key: 'r_fragment', name: 'R碎片', initialValue: 0, description: 'R级角色碎片' },
    { key: 'sr_fragment', name: 'SR碎片', initialValue: 0, description: 'SR级角色碎片' },
    { key: 'ssr_fragment', name: 'SSR碎片', initialValue: 0, description: 'SSR级角色碎片' },
    { key: 'ur_fragment', name: 'UR碎片', initialValue: 0, description: 'UR级角色碎片' }
  ];
  
  addSheet(workbook, '初始货币', currencies);
  
  const otherInits = [
    { key: 'teamSize', name: '队伍容量', initialValue: 4, description: '最大队伍人数' },
    { key: 'inventorySize', name: '背包容量', initialValue: 50, description: '背包格子数' },
    { key: 'facilityLevel', name: '设施等级', initialValue: 1, description: '初始设施等级' },
    { key: 'maxFloor', name: '最高楼层', initialValue: 0, description: '已通关最高楼层' },
    { key: 'reputation', name: '声望', initialValue: 0, description: '当前声望值' },
    { key: 'energyDrinks', name: '能量饮料', initialValue: 3, description: '初始能量饮料数量' },
    { key: 'recruitCost', name: '招募费用', initialValue: 500, description: '单次招募费用' }
  ];
  
  addSheet(workbook, '其他初始值', otherInits);
  
  saveWorkbook(workbook, 'initConfig.xlsx');
  
  const jsonData = {
    currencies: {},
    other: {}
  };
  
  currencies.forEach(c => {
    jsonData.currencies[c.key] = c.initialValue;
  });
  
  otherInits.forEach(o => {
    jsonData.other[o.key] = o.initialValue;
  });
  
  const jsonPath = path.join(jsonOutputDir, 'initConfig.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`已生成JSON: ${jsonPath}`);
}

console.log('开始创建初始化配置...\n');
createInitConfig();
console.log('\n✅ 初始化配置创建完成！');
