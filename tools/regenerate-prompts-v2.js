const fs = require('fs');
const path = require('path');

const prompts = JSON.parse(fs.readFileSync(path.join(__dirname, 'character_prompts.json'), 'utf-8'));

const races = {
  'plant': { name: '植物系', range: 'FM001-FM020', file: '融合姬文生图提示词_植物系.md', element: '风' },
  'animal': { name: '动物系', range: 'FM021-FM040', file: '融合姬文生图提示词_动物系.md', element: '水' },
  'mechanical': { name: '机械系', range: 'FM041-FM060', file: '融合姬文生图提示词_机械系.md', element: '暗' },
  'energy': { name: '能量系', range: 'FM061-FM080', file: '融合姬文生图提示词_能量系.md', element: '光' },
  'hybrid': { name: '混合系', range: 'FM081-FM100', file: '融合姬文生图提示词_混合系.md', element: '暗' }
};

const elementColors = {
  '水': { primary: '蓝色', accent: '透明色', desc: '清凉如水' },
  '火': { primary: '赤红色', accent: '橙红色', desc: '热烈如火' },
  '风': { primary: '翠绿色', accent: '金色', desc: '清新如风' },
  '光': { primary: '金色', accent: '银白色', desc: '圣洁如光' },
  '暗': { primary: '暗紫色', accent: '紫黑色', desc: '神秘如暗' }
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

function generatePrompt(charId, charData, race, element) {
  const colors = elementColors[element];
  const rarity = getRarity(charId);
  const role = getRole(charId);
  
  const basePrompt = `1024x1536竖屏立绘，高分辨率，电影质感，超现实写实风格，摄影师风格。超近距离特写视角，人物占据画面主体。

【基础人物特征】
韩国22岁年轻女性，修长瓜子脸，下巴又尖又长，尖鼻子高鼻梁，狐狸眼。淡淡的眼影和眼线，美瞳为黑色/浅棕色/浅蓝色中的一种（与角色主题呼应）。长睫毛，卧蚕明显，眼旁一颗淡淡美人痣。冷白瓷白皮肤光滑水润，在环境光照射下有轻微光泽度。骨架偏瘦但胸部和臀部丰满，小蛮腰，披肩直发。夜店精致魅惑装扮，红润肉色唇彩。腿非常细且长，属于腿精级别。裸足。

【指甲与发色】
手指甲和脚指甲颜色为${colors.primary}，与整个卡牌主体色一致。头发为${colors.primary}色披肩直发，发丝间有${colors.accent}光泽。

【服装描述】
身穿飘逸的${colors.primary}色丝质吊带长裙或露肩上衣，裙摆由层层叠叠的轻薄丝质面料组成，轻盈得仿佛被风轻轻吹起。丝质面料若有若无地展示身体曲线，大腿以下尽量保持裸足状态。如穿着丝袜则配合丝质长裙。服装设计清凉飘逸，铺满整个卡面。

【融合特征】
${charData.prompt}

【姿势要求】
采用跪姿或蜷缩坐姿，双手自然垂放或轻放在膝盖上，掌心朝上或自然舒展。姿势舒展自然，让人身体所有部分都进入镜头。避免站立姿势。

【表情要求】
眼眸直视镜头不要漂移，表情冷艳中带着纯欲风，有挑逗镜头的感觉。可以抬头眼睛微微藐视镜头，嘴角带着一丝不易察觉的微笑。不要大笑或夸张微笑。

【背景描述】
背景为虚化的${colors.desc}环境，${colors.accent}光芒在朦胧中若隐若现。整体色调以${colors.primary}为主题，点缀${colors.accent}。废土末世氛围，暗色调背景与角色形成对比。背景虚化突出人物主体。

【整体要求】
真人照片质感，外轮廓线清晰。皮肤强调非常白、冷白、瓷白。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`;

  return basePrompt;
}

function generateDocument(race, charIds) {
  const raceInfo = races[race];
  
  let content = `# 废土元年 · 融合姬文生图提示词（${raceInfo.name}）

> **版本**：v3.0
> **版本日期**：2026-04-07
> **用途**：${charIds.length}个${raceInfo.name}融合姬角色的文生图提示词，用于AI绘图生成卡面立绘

---

## 提示词通用规则

1. 分辨率：1024x1536竖屏立绘，高分辨率，电影质感，超现实写实风格，摄影师风格
2. 基础特征：韩国22岁年轻女性、修长瓜子脸、下巴又尖又长、尖鼻子高鼻梁、狐狸眼、长睫毛、卧蚕明显、眼旁一颗淡淡美人痣、冷白瓷白皮肤光滑水润、披肩直发、夜店精致魅惑装扮
3. 化妆：淡淡的眼影和眼线，美瞳为黑色/浅棕色/浅蓝色中的一种
4. 身材：骨架偏瘦但胸部和臀部丰满、小蛮腰、腿非常细且长（腿精级别）
5. 唇彩：红润肉色或红色唇彩
6. 指甲与发色：手指甲、脚指甲、头发颜色都与卡牌主体色一致
7. 姿势：坐姿、睡姿、跪姿或蜷缩姿势，让人身体所有部分都进入镜头，避免站姿
8. 表情：眼眸直视镜头不要漂移，冷艳纯欲风，有挑逗镜头的感觉，可以抬头藐视镜头，最多一丝不易察觉的微笑
9. 穿着：清凉飘逸丝质衣服，大腿以下尽量不穿或穿透明丝袜（穿丝袜可不裸足），避免皮质衣服
10. 皮肤：强调非常白、冷白、瓷白，在环境光照射下有轻微光泽度
11. 融合点：描述身体哪些部位有融合迹象，避免手和脚被融合
12. 主题色：根据元素属性决定（水=蓝、火=红、风=绿、光=黄/金、暗=紫）
13. 背景：虚化贴合人设，突出人物主体

---

## 一、${raceInfo.name}融合姬（${raceInfo.range}）

`;

  for (const charId of charIds) {
    const char = prompts[charId];
    if (!char) continue;
    
    const element = raceInfo.element;
    
    content += `### ${charId}：${char.name}

**属性**：${getRarity(charId)} / ${raceInfo.element} / ${getRole(charId)} / ${raceInfo.name}

**文生图提示词**：

${generatePrompt(charId, char, race, element)}

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

console.log('正在生成v3.0提示词文档...\n');
console.log('✓ 严格按照用户要求：');
console.log('  - 修长瓜子脸，尖下巴又尖又长');
console.log('  - 美瞳颜色：黑色/浅棕色/浅蓝色');
console.log('  - 淡淡的眼影和眼线');
console.log('  - 腿精级别腿');
console.log('  - 坐姿/跪姿/蜷缩姿势，避免站姿');
console.log('  - 冷艳纯欲风，挑逗镜头');
console.log('  - 清凉飘逸丝质衣服，避免皮质');
console.log('  - 裸足或透明丝袜');
console.log('  - 手脚保持原本样子，避免融合');
console.log('  - 1024x1536分辨率');
console.log('');

fs.writeFileSync(path.join(outputDir, races.plant.file), generateDocument('plant', plantChars), 'utf8');
console.log(`✓ ${races.plant.file} (植物系-风元素)`);

fs.writeFileSync(path.join(outputDir, races.animal.file), generateDocument('animal', animalChars), 'utf8');
console.log(`✓ ${races.animal.file} (动物系-水元素)`);

fs.writeFileSync(path.join(outputDir, races.mechanical.file), generateDocument('mechanical', mechanicalChars), 'utf8');
console.log(`✓ ${races.mechanical.file} (机械系-暗元素)`);

fs.writeFileSync(path.join(outputDir, races.energy.file), generateDocument('energy', energyChars), 'utf8');
console.log(`✓ ${races.energy.file} (能量系-光元素)`);

fs.writeFileSync(path.join(outputDir, races.hybrid.file), generateDocument('hybrid', hybridChars), 'utf8');
console.log(`✓ ${races.hybrid.file} (混合系-暗元素)`);

console.log('\n所有v3.0提示词文档已生成！');
