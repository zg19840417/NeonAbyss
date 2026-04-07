const fs = require('fs');
const path = require('path');

const fusionList = [
  { id: 'FM001', cardId: 'MC_wind_support_001' },
  { id: 'FM002', cardId: 'MC_wind_dps_002' },
  { id: 'FM003', cardId: 'MC_dark_dps_003' },
  { id: 'FM004', cardId: 'MC_water_tank_004' },
  { id: 'FM006', cardId: 'MC_light_support_006' },
  { id: 'FM007', cardId: 'MC_wind_dps_007' },
  { id: 'FM008', cardId: 'MC_water_tank_008' },
  { id: 'FM009', cardId: 'MC_dark_support_009' },
  { id: 'FM010', cardId: 'MC_fire_tank_010' },
  { id: 'FM014', cardId: 'MC_wind_tank_014' }
];

const configPath = path.join(__dirname, '..', 'assets', 'data', 'json', 'minionCards.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

console.log('正在更新融合姬配置文件...\n');

fusionList.forEach(({ id, cardId }) => {
  const card = config.find(c => c.cardId === cardId);
  if (card) {
    card.portrait = `characters/fusion/${id}.png`;
    console.log(`✓ ${id} → ${card.name}`);
  } else {
    console.log(`✗ 未找到: ${cardId}`);
  }
});

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('\n配置文件已更新！');
