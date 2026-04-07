const fs = require('fs');
const path = require('path');

const prompts = JSON.parse(fs.readFileSync(path.join(__dirname, 'character_prompts.json'), 'utf-8'));

const races = {
  'plant': { name: '植物系', element: '风' },
  'animal': { name: '动物系', element: '水' },
  'mechanical': { name: '机械系', element: '暗' },
  'energy': { name: '能量系', element: '光' },
  'hybrid': { name: '混合系', element: '暗' }
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

function generateV3Prompt(charId, charData) {
  const race = raceMap[charId];
  const raceInfo = races[race];
  const element = raceInfo.element;
  const colors = elementColors[element];
  
  const prompt = `1024x1536竖屏立绘，高分辨率，电影质感，超现实写实风格，摄影师风格。超近距离特写视角，人物占据画面主体。

韩国22岁年轻女性，修长瓜子脸，下巴又尖又长，尖鼻子高鼻梁，狐狸眼。淡淡的眼影和眼线，美瞳为黑色。淡红色眼影，长睫毛，卧蚕明显，眼旁一颗淡淡美人痣。冷白瓷白皮肤光滑水润，在环境光照射下有轻微光泽度。骨架偏瘦但胸部和臀部丰满，小蛮腰，披肩直发。夜店精致魅惑装扮，红润肉色唇彩。腿非常细且长，属于腿精级别。裸足。

手指甲和脚指甲颜色为${colors.primary}，与整个卡牌主体色一致。头发为${colors.primary}色披肩直发，发丝间有${colors.accent}光泽。

${charData.prompt}

采用跪姿或蜷缩坐姿，双手自然垂放或轻放在膝盖上，掌心朝上或自然舒展。姿势舒展自然，让人身体所有部分都进入镜头。避免站立姿势。

眼眸直视镜头不要漂移，表情冷艳中带着纯欲风，有挑逗镜头的感觉。可以抬头眼睛微微藐视镜头，嘴角带着一丝不易察觉的微笑。不要大笑或夸张微笑。

背景为虚化的${colors.desc}环境，${colors.accent}光芒在朦胧中若隐若现。整体色调以${colors.primary}为主题，点缀${colors.accent}。废土末世氛围，暗色调背景与角色形成对比。背景虚化突出人物主体。

真人照片质感，外轮廓线清晰。皮肤强调非常白、冷白、瓷白。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`;

  return prompt;
}

console.log('正在更新character_prompts.json为v3.0格式...\n');

let updatedCount = 0;
for (const charId of Object.keys(prompts)) {
  const charData = prompts[charId];
  if (charData.prompt) {
    charData.prompt = generateV3Prompt(charId, charData);
    updatedCount++;
  }
}

const outputPath = path.join(__dirname, 'character_prompts.json');
fs.writeFileSync(outputPath, JSON.stringify(prompts, null, 2), 'utf8');

console.log(`✓ 已更新 ${updatedCount} 个角色的提示词为v3.0格式`);
console.log(`✓ 已保存到: ${outputPath}`);
