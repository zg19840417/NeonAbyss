const fs = require('fs');
const path = require('path');

const backgroundsDir = path.join(__dirname, '../../assets/images/backgrounds');
const uiDir = path.join(__dirname, '../../assets/images/ui');

[backgroundsDir, uiDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const transparentPNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0B, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0x60, 0x60, 0x60, 0x00,
  0x00, 0x00, 0x82, 0x00, 0x81, 0xD8, 0x52, 0xED, 0x7C, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

const backgrounds = [
  { name: 'bg_dungeon_ruins', width: 375, height: 812 },
  { name: 'bg_base_interior', width: 375, height: 812 },
  { name: 'bg_battle_arena', width: 375, height: 812 }
];

const uiButtons = [
  { name: 'ui_btn_attack', width: 140, height: 50 },
  { name: 'ui_btn_skill', width: 140, height: 50 },
  { name: 'ui_btn_defend', width: 140, height: 50 },
  { name: 'ui_btn_retreat', width: 140, height: 50 },
  { name: 'ui_btn_item', width: 140, height: 50 }
];

const uiHPBars = [
  { name: 'ui_hp_friendly', width: 140, height: 14 },
  { name: 'ui_hp_enemy', width: 140, height: 14 },
  { name: 'ui_hp_boss', width: 140, height: 14 }
];

console.log('开始生成PNG占位符...\n');

console.log('📁 背景图片:');
backgrounds.forEach(bg => {
  const filePath = path.join(backgroundsDir, `${bg.name}.png`);
  fs.writeFileSync(filePath, transparentPNG);
  console.log(`  ✓ ${bg.name}.png (${bg.width}x${bg.height})`);
});

console.log('\n📁 UI按钮:');
uiButtons.forEach(btn => {
  const filePath = path.join(uiDir, `${btn.name}.png`);
  fs.writeFileSync(filePath, transparentPNG);
  console.log(`  ✓ ${btn.name}.png (${btn.width}x${btn.height})`);
});

console.log('\n📁 UI血条:');
uiHPBars.forEach(hp => {
  const filePath = path.join(uiDir, `${hp.name}.png`);
  fs.writeFileSync(filePath, transparentPNG);
  console.log(`  ✓ ${hp.name}.png (${hp.width}x${hp.height})`);
});

console.log('\n✅ 所有PNG占位符生成完成！');
console.log('\n💡 提示: 这些是1x1像素的透明PNG占位符。');
console.log('   请用您的实际PNG图片替换这些文件，保持相同的文件名和尺寸。');
