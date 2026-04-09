const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const inputDir = path.join(__dirname, '..', 'assets', 'data', 'excel');
const outputDir = path.join(__dirname, '..', 'assets', 'data', 'json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function isEmptyCell(value) {
  return value === '' || value === null || value === undefined;
}

function isEmptyRow(row) {
  return !row || row.every(isEmptyCell);
}

function convertValue(value, type) {
  if (isEmptyCell(value)) {
    return null;
  }

  const typeStr = String(type || 'string').toLowerCase().trim();

  switch (typeStr) {
    case 'int':
    case 'integer':
      return Number.parseInt(value, 10) || 0;
    case 'float':
    case 'number':
      return Number.parseFloat(value) || 0;
    case 'bool':
    case 'boolean':
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'yes';
      }
      return Boolean(value);
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
    case 'array':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
        }
      }
      return Array.isArray(value) ? value : [value];
    case 'string':
    default:
      return String(value);
  }
}

function convertSheetRows(rows) {
  if (rows.length < 4) {
    throw new Error('数据行数不足，至少需要字段行、类型行、说明行和一行数据');
  }

  const fieldNames = rows[0];
  const dataTypes = rows[1];
  const payloadRows = rows.slice(3).filter((row) => !isEmptyRow(row));

  return payloadRows.map((row) => {
    const record = {};

    fieldNames.forEach((fieldName, index) => {
      if (!fieldName) {
        return;
      }
      record[fieldName] = convertValue(row[index], dataTypes[index]);
    });

    return record;
  });
}

function shapeOutput(fileName, records) {
  if (fileName === 'global_config.xlsx') {
    const config = {};
    records.forEach((record) => {
      config[record.config_key] = convertValue(record.config_value, record.value_type);
    });
    return config;
  }

  return records;
}

function convertWorkbook(fileName) {
  const filePath = path.join(inputDir, fileName);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  const records = convertSheetRows(rows);
  const shapedOutput = shapeOutput(fileName, records);
  const outputFile = path.join(outputDir, fileName.replace('.xlsx', '.json'));

  fs.writeFileSync(outputFile, JSON.stringify(shapedOutput, null, 2), 'utf8');

  return {
    fileName,
    count: Array.isArray(shapedOutput) ? shapedOutput.length : Object.keys(shapedOutput).length,
  };
}

function main() {
  const excelFiles = fs
    .readdirSync(inputDir)
    .filter((file) => file.endsWith('.xlsx'))
    .sort((a, b) => a.localeCompare(b));

  let successCount = 0;
  let errorCount = 0;

  excelFiles.forEach((fileName) => {
    try {
      const result = convertWorkbook(fileName);
      console.log(`✓ ${result.fileName} -> ${result.count} 条导出记录`);
      successCount += 1;
    } catch (error) {
      console.error(`✗ ${fileName}: ${error.message}`);
      errorCount += 1;
    }
  });

  console.log(`\nCocos 配表导出完成：${successCount} 成功，${errorCount} 失败`);

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}

main();
