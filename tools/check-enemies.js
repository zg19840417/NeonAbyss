const fs = require('fs');
const path = require('path');

const enemies = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'data', 'json', 'enemies.json'), 'utf-8'));

console.log('=== 敌人背景故事检查 ===\n');

const mutants = enemies.filter(e => e.type === 'mutant');
const lost = enemies.filter(e => e.type === 'lost');

console.log(`总敌人数量: ${enemies.length}`);
console.log(`变异生物(mutant): ${mutants.length}`);
console.log(`失心者(lost): ${lost.length}`);

console.log('\n=== 检查缺失背景故事的敌人 ===\n');

let missingStory = [];
enemies.forEach(enemy => {
  if (!enemy.description || enemy.description.trim() === '' || enemy.description.length < 20) {
    missingStory.push({
      id: enemy.enemyId,
      name: enemy.name,
      type: enemy.type,
      descLength: enemy.description ? enemy.description.length : 0
    });
  }
});

if (missingStory.length > 0) {
  console.log(`❌ 缺失/过短背景故事的敌人: ${missingStory.length}个\n`);
  missingStory.forEach(e => {
    console.log(`  ${e.id} - ${e.name} (${e.type}) - 描述长度: ${e.descLength}`);
  });
} else {
  console.log('✅ 所有敌人都有背景故事！');
}

console.log('\n=== 变异生物列表 ===\n');
mutants.forEach((m, i) => {
  console.log(`${i+1}. ${m.enemyId} - ${m.name}`);
  console.log(`   描述: ${m.description ? m.description.substring(0, 80) + '...' : '❌ 缺失'}`);
});

console.log('\n=== 失心者列表 ===\n');
lost.forEach((l, i) => {
  console.log(`${i+1}. ${l.enemyId} - ${l.name}`);
  console.log(`   描述: ${l.description ? l.description.substring(0, 80) + '...' : '❌ 缺失'}`);
});
