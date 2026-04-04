const fs = require('fs');
const path = require('path');

const charactersDir = path.join(__dirname, '../../assets/images/characters');
const enemiesDir = path.join(__dirname, '../../assets/images/enemies');
const backgroundsDir = path.join(__dirname, '../../assets/images/backgrounds');
const uiDir = path.join(__dirname, '../../assets/images/ui');

[charactersDir, enemiesDir, backgroundsDir, uiDir].forEach(dir => {
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

const characters = [
  'char_iron_wall', 'char_life_guardian', 'char_steel_bastion', 'char_unyielding_will',
  'char_berserker', 'char_element_mage', 'char_shadow_assassin', 'char_mech_engineer',
  'char_destruction_warlock', 'char_mecha_war_god', 'char_tactical_commander',
  'char_wind_swordsman', 'char_time_walker', 'char_natural_healer', 'char_holy_priest',
  'char_elemental_lord'
];

const enemies = [
  'enemy_mech_hound', 'enemy_patrol_mech', 'enemy_mutant_spider', 'enemy_turret',
  'enemy_corruptor', 'enemy_berserker', 'enemy_shadow_assassin', 'enemy_heavy_guardian',
  'enemy_toxic_spitter', 'enemy_soul_reaper'
];

const bosses = [
  'boss_destroyer_lord', 'boss_shadow_emperor', 'boss_skynet_core',
  'boss_mech_mother', 'boss_omega'
];

const backgrounds = [
  'bg_dungeon_ruins', 'bg_base_interior', 'bg_battle_arena'
];

const uiButtons = [
  'ui_btn_attack', 'ui_btn_skill', 'ui_btn_defend', 'ui_btn_retreat', 'ui_btn_item'
];

const uiHPBars = [
  'ui_hp_friendly', 'ui_hp_enemy', 'ui_hp_boss'
];

console.log('开始生成PNG占位符文件...\n');

console.log('📁 角色立绘 (assets/images/characters/):');
characters.forEach(name => {
  const filePath = path.join(charactersDir, `${name}.png`);
  fs.writeFileSync(filePath, transparentPNG);
  console.log(`  ✓ ${name}.png`);
});

console.log('\n📁 普通敌人 (assets/images/enemies/):');
enemies.forEach(name => {
  const filePath = path.join(enemiesDir, `${name}.png`);
  fs.writeFileSync(filePath, transparentPNG);
  console.log(`  ✓ ${name}.png`);
});

console.log('\n📁 BOSS敌人 (assets/images/enemies/):');
bosses.forEach(name => {
  const filePath = path.join(enemiesDir, `${name}.png`);
  fs.writeFileSync(filePath, transparentPNG);
  console.log(`  ✓ ${name}.png`);
});

console.log('\n📁 背景图片 (assets/images/backgrounds/):');
backgrounds.forEach(name => {
  const filePath = path.join(backgroundsDir, `${name}.png`);
  fs.writeFileSync(filePath, transparentPNG);
  console.log(`  ✓ ${name}.png`);
});

console.log('\n📁 UI按钮 (assets/images/ui/):');
uiButtons.forEach(name => {
  const filePath = path.join(uiDir, `${name}.png`);
  fs.writeFileSync(filePath, transparentPNG);
  console.log(`  ✓ ${name}.png`);
});

console.log('\n📁 UI血条 (assets/images/ui/):');
uiHPBars.forEach(name => {
  const filePath = path.join(uiDir, `${name}.png`);
  fs.writeFileSync(filePath, transparentPNG);
  console.log(`  ✓ ${name}.png`);
});

console.log('\n✅ 所有PNG占位符文件生成完成！');
console.log('\n📋 文件清单:');
console.log(`  - 角色立绘: ${characters.length} 个`);
console.log(`  - 普通敌人: ${enemies.length} 个`);
console.log(`  - BOSS敌人: ${bosses.length} 个`);
console.log(`  - 背景图片: ${backgrounds.length} 个`);
console.log(`  - UI按钮: ${uiButtons.length} 个`);
console.log(`  - UI血条: ${uiHPBars.length} 个`);
console.log(`  - 总计: ${characters.length + enemies.length + bosses.length + backgrounds.length + uiButtons.length + uiHPBars.length} 个`);
console.log('\n💡 提示: 这些是1x1像素的透明PNG占位符。');
console.log('   请用您的实际PNG图片替换这些文件，保持相同的文件名。');
