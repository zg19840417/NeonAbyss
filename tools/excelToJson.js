const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const inputDir = path.join(__dirname, '../assets/data/excel');
const outputDir = path.join(__dirname, '../assets/data/json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function convertValue(value, type) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  
  const typeStr = String(type).toLowerCase().trim();
  
  switch (typeStr) {
    case 'int':
    case 'integer':
      return parseInt(value, 10) || 0;
    case 'float':
    case 'number':
      return parseFloat(value) || 0;
    case 'bool':
    case 'boolean':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    case 'array':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value.split(',').map(s => s.trim());
        }
      }
      return Array.isArray(value) ? value : [value];
    case 'json':
    case 'object':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    case 'string':
    default:
      return String(value);
  }
}

const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.xlsx'));

let successCount = 0;
let errorCount = 0;

files.forEach(file => {
  try {
    const filePath = path.join(inputDir, file);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (json.length < 4) {
      console.log(`跳过 ${file}: 数据行数不足`);
      return;
    }
    
    const fieldNames = json[0];
    const dataTypes = json[1];
    const descriptions = json[2];
    
    const data = [];
    for (let i = 3; i < json.length; i++) {
      const row = json[i];
      if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) {
        continue;
      }
      
      const obj = {};
      row.forEach((cell, index) => {
        const fieldName = fieldNames[index];
        const dataType = dataTypes[index];
        
        if (fieldName) {
          obj[fieldName] = convertValue(cell, dataType);
        }
      });
      data.push(obj);
    }
    
    const outputFile = path.join(outputDir, file.replace('.xlsx', '.json'));
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ ${file} -> ${data.length} 条记录`);
    successCount++;
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
    errorCount++;
  }
});

console.log(`\n转换完成: ${successCount} 成功, ${errorCount} 失败`);
