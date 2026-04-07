const fs = require('fs');
const path = require('path');

const prompts = JSON.parse(fs.readFileSync(path.join(__dirname, 'character_prompts.json'), 'utf-8'));

const races = {
  'plant': { name: '植物系', range: 'FM001-FM020', file: '融合姬文生图提示词_植物系.md' },
  'animal': { name: '动物系', range: 'FM021-FM040', file: '融合姬文生图提示词_动物系.md' },
  'mechanical': { name: '机械系', range: 'FM041-FM060', file: '融合姬文生图提示词_机械系.md' },
  'energy': { name: '能量系', range: 'FM061-FM080', file: '融合姬文生图提示词_能量系.md' },
  'hybrid': { name: '混合系', range: 'FM081-FM100', file: '融合姬文生图提示词_混合系.md' }
};

const raceMap = {
  'FM001': 'plant', 'FM002': 'plant', 'FM003': 'plant', 'FM004': 'plant', 'FM005': 'plant',
  'FM006': 'plant', 'FM007': 'plant', 'FM008': 'plant', 'FM009': 'plant', 'FM010': 'plant',
  'FM011': 'plant', 'FM012': 'plant', 'FM013': 'plant', 'FM014': 'plant', 'FM015': 'plant',
  'FM016': 'plant', 'FM017': 'plant', 'FM018': 'plant', 'FM019': 'plant', 'FM020': 'plant',
  'FM021': 'animal', 'FM022': 'animal', 'FM023': 'animal', 'FM024': 'animal', 'FM025': 'animal',
  'FM026': 'animal', 'FM027': 'animal', 'FM028': 'animal', 'FM029': 'animal', 'FM030': 'animal',
  'FM031': 'animal', 'FM032': 'animal', 'FM033': 'animal', 'FM034': 'animal', 'FM035': 'animal',
  'FM036': 'animal', 'FM037': 'animal', 'FM038': 'animal', 'FM039': 'animal', 'FM040': 'animal',
  'FM041': 'mechanical', 'FM042': 'mechanical', 'FM043': 'mechanical', 'FM044': 'mechanical', 'FM045': 'mechanical',
  'FM046': 'mechanical', 'FM047': 'mechanical', 'FM048': 'mechanical', 'FM049': 'mechanical', 'FM050': 'mechanical',
  'FM051': 'mechanical', 'FM052': 'mechanical', 'FM053': 'mechanical', 'FM054': 'mechanical', 'FM055': 'mechanical',
  'FM056': 'mechanical', 'FM057': 'mechanical', 'FM058': 'mechanical', 'FM059': 'mechanical', 'FM060': 'mechanical',
  'FM061': 'energy', 'FM062': 'energy', 'FM063': 'energy', 'FM064': 'energy', 'FM065': 'energy',
  'FM066': 'energy', 'FM067': 'energy', 'FM068': 'energy', 'FM069': 'energy', 'FM070': 'energy',
  'FM071': 'energy', 'FM072': 'energy', 'FM073': 'energy', 'FM074': 'energy', 'FM075': 'energy',
  'FM076': 'energy', 'FM077': 'energy', 'FM078': 'energy', 'FM079': 'energy', 'FM080': 'energy',
  'FM081': 'hybrid', 'FM082': 'hybrid', 'FM083': 'hybrid', 'FM084': 'hybrid', 'FM085': 'hybrid',
  'FM086': 'hybrid', 'FM087': 'hybrid', 'FM088': 'hybrid', 'FM089': 'hybrid', 'FM090': 'hybrid',
  'FM091': 'hybrid', 'FM092': 'hybrid', 'FM093': 'hybrid', 'FM094': 'hybrid', 'FM095': 'hybrid',
  'FM096': 'hybrid', 'FM097': 'hybrid', 'FM098': 'hybrid', 'FM099': 'hybrid', 'FM100': 'hybrid'
};

function getRarity(charId) {
  const num = parseInt(charId.replace('FM', ''));
  if (num <= 5) return 'LE';
  if (num <= 20) return 'SSR';
  if (num <= 50) return 'SR';
  return 'R';
}

function getRole(charId) {
  const num = parseInt(charId.replace('FM', ''));
  if (num % 3 === 1) return '坦克';
  if (num % 3 === 2) return '输出';
  return '辅助';
}

function generateDocument(race, charIds) {
  const raceInfo = races[race];
  
  let content = `# 废土元年 · 融合姬文生图提示词（${raceInfo.name}）

> **版本**：v2.0
> **版本日期**：2026-04-07
> **用途**：${charIds.length}个${raceInfo.name}融合姬角色的文生图提示词，用于AI绘图生成卡面立绘

---

## 提示词通用规则

1. 用中文撰写，只用正面提示词
2. 每个提示词至少200字
3. 基础特征：韩国22岁年轻女性、尖下巴又尖又长、尖鼻子高鼻梁、狐狸眼、长睫毛、卧蚕明显、眼旁一颗淡淡美人痣、冷白瓷白皮肤光滑水润、裸足、披肩直发、身材骨架偏瘦但胸部和臀部丰满、小蛮腰、夜店精致魅惑装扮、红润的唇彩
4. 分辨率：1024x1536竖屏立绘，高分辨率，电影质感，超现实写实风格，摄影师风格
5. POV视角定焦镜头，人物近距离特写，仿佛人物正在凑近镜头
6. 姿势采用坐姿、睡姿或跪姿，避免站姿，姿势自然舒展
7. 穿着：清凉飘逸丝质衣服，大腿以下尽量不穿或穿透明丝袜（穿丝袜则不裸足），裸足时必须清凉丝质
8. 指甲颜色、头发颜色需与卡牌元素主题色一致
9. 表情眼睛看向镜头，直视镜头不要漂移，冷艳纯欲风，有挑逗镜头的感觉
10. 皮肤强调非常白、冷白、瓷白，环境光照射下有轻微光泽度
11. 描述与什么融合，身体哪些部位有融合迹象，避免手和脚被融合
12. 背景虚化贴合人物人设，元素属性决定主题色：水=蓝色、火=红色、风=绿色、光=金色、暗=紫色

---

## 一、${raceInfo.name}融合姬（${raceInfo.range}）

`;

  for (const charId of charIds) {
    const char = prompts[charId];
    if (!char) continue;
    
    const rarity = getRarity(charId);
    const role = getRole(charId);
    
    content += `### ${charId}：${char.name}

**属性**：${rarity} / 水 / ${role} / ${raceInfo.name}

**文生图提示词**：

${char.prompt.replace('960x1600', '1024x1536')}

---

`;
  }

  return content;
}

const outputDir = path.join(__dirname, '..', 'docs', '提示词');

const plantChars = Array.from({length: 20}, (_, i) => `FM${String(i+1).padStart(3, '0')}`);
const animalChars = Array.from({length: 20}, (_, i) => `FM${String(i+21).padStart(3, '0')}`);
const mechanicalChars = Array.from({length: 20}, (_, i) => `FM${String(i+41).padStart(3, '0')}`);
const energyChars = Array.from({length: 20}, (_, i) => `FM${String(i+61).padStart(3, '0')}`);
const hybridChars = Array.from({length: 20}, (_, i) => `FM${String(i+81).padStart(3, '0')}`);

console.log('正在生成提示词文档...\n');

fs.writeFileSync(path.join(outputDir, races.plant.file), generateDocument('plant', plantChars), 'utf8');
console.log(`✓ ${races.plant.file}`);

fs.writeFileSync(path.join(outputDir, races.animal.file), generateDocument('animal', animalChars), 'utf8');
console.log(`✓ ${races.animal.file}`);

fs.writeFileSync(path.join(outputDir, races.mechanical.file), generateDocument('mechanical', mechanicalChars), 'utf8');
console.log(`✓ ${races.mechanical.file}`);

fs.writeFileSync(path.join(outputDir, races.energy.file), generateDocument('energy', energyChars), 'utf8');
console.log(`✓ ${races.energy.file}`);

fs.writeFileSync(path.join(outputDir, races.hybrid.file), generateDocument('hybrid', hybridChars), 'utf8');
console.log(`✓ ${races.hybrid.file}`);

console.log('\n所有提示词文档已重新生成！');
