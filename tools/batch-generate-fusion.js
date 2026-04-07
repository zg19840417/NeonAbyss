const http = require('http');
const fs = require('fs');
const path = require('path');

const FUSION_LIST = [
  { id: 'FM001', name: '万根之母·秦若兰', prompt: '超写实风格，韩国冷白皮年轻女性全身立绘，竖屏2:3比例。精致斩男妆容，裸足。她与一棵巨大的变异古树深度融合，是废土上最古老的融合姬。她的长发变为苍翠的藤蔓编发，发丝间缠绕着细小的白色花朵和嫩绿的新芽，藤蔓从头顶垂落至腰际，末端自然卷曲如垂柳。她的皮肤上有淡金色的树脉纹路，从锁骨蔓延至手臂，像阳光穿过树叶投下的光斑。身穿白色长裙，裙摆由层层叠叠的薄纱和活体树叶编织而成，腰间缠绕着粗壮的古树根须作为腰带，根须上挂满了发光的种子和干燥的花朵。她的双手手背覆盖着薄薄的树皮纹理，手指修长，指尖散发着微弱的绿色治愈光芒。她的姿态为慈祥的站立姿态，双手微微张开，掌心朝上，仿佛在向大地输送生命力。从她的脚底延伸出无数细密的根系，扎入地面，根系在地面蔓延开来，连接着远方的植物。背景为虚化的深山古树森林，巨大的树干和藤蔓交织成一片绿色的穹顶，阳光从树冠缝隙中洒下，形成丁达尔效应的光柱。整体色调以翠绿色为主，点缀金色光芒。废土末世氛围，暗色调背景与角色形成对比。写实摄影风格，真人照片质感，外轮廓线清晰。' },
  { id: 'FM002', name: '锈叶·苏蔓', prompt: '超写实风格，韩国冷白皮年轻女性全身立绘，竖屏2:3比例。精致斩男妆容，裸足。她与变异藤蔓和锈蚀金属融合，头发变为铁锈色的藤蔓编发，藤蔓从头顶垂落至肩膀，末端带有锋利的金属倒刺。她的手臂上缠绕着锈蚀的金属荆棘，荆棘从手腕一直延伸到上臂，金属表面有斑驳的铁锈质感，与白皙的皮肤形成强烈对比。皮肤上有淡绿色的脉络纹路，像藤蔓的纹路一样蔓延在锁骨和脖颈处。身穿废土风格的皮革和金属拼接战斗服，紧身设计勾勒出纤细的身材曲线，腰间有战术腰带，上面挂着金属弹壳和干枯的藤蔓。她的姿态为攻击姿态，右手高举挥出藤蔓鞭，藤蔓鞭从手掌中延伸出去，末端带有金属倒钩，左手防御性地挡在身前。她的眼神凌厉而坚定，嘴角微微上扬，带着一丝野性的笑意。背景为虚化的废弃城区废墟，倒塌的建筑和断裂的钢筋从裂缝中长出绿色植物，铁锈色与翠绿色交织。整体色调以绿色为主，点缀铁锈色。废土末世氛围，暗色调背景与角色形成对比。写实摄影风格，真人照片质感，外轮廓线清晰。' },
  { id: 'FM003', name: '毒蕊·方晴', prompt: '超写实风格，韩国冷白皮年轻女性全身立绘，竖屏2:3比例。精致斩男妆容，裸足。她与噬魂花融合，是废土上最危险的毒系融合姬。她的长发变为深紫黑色的花瓣状发丝，发丝末端像枯萎的花瓣一样微微卷曲，散发着幽暗的光泽。她的眼瞳变为紫红色，像毒液一样流动着暗光。她的嘴唇涂着深紫色的唇膏，呼出的气息带有淡淡的紫色雾气。皮肤上有紫黑色的脉络纹路，从脖颈蔓延至胸口，像被毒素侵蚀的藤蔓。身穿黑色紧身战斗服，服装表面有暗紫色的花瓣纹路装饰，腰部有紫黑色的藤蔓编织的束腰，裙摆由层层叠叠的黑色花瓣组成，半透明效果若隐若现地展示腿部线条。她的双手手指修长，指尖带有紫黑色的尖锐指甲，像花刺一样锋利。她的姿态为释放毒素的姿态，右手微微抬起，指尖散发着紫黑色的毒雾，左手自然下垂，手背上有紫色的花蕊纹路在发光。她的表情冷艳而神秘，眼神中带着一丝悲伤。背景为虚化的污染森林深处，枯死的树木和紫黑色的花朵覆盖了整个画面，雾气弥漫。整体色调以紫色为主，点缀暗红色。废土末世氛围，暗色调背景与角色形成对比。写实摄影风格，真人照片质感，外轮廓线清晰。' },
  { id: 'FM004', name: '苔甲·叶青', prompt: '超写实风格，韩国冷白皮年轻女性全身立绘，竖屏2:3比例。精致斩男妆容，裸足。她与发光苔藓融合，是天然的坦克型融合姬。她的短发为深蓝色，发丝间夹杂着细小的发光苔藓颗粒，在暗处散发柔和的蓝绿色荧光。她的皮肤上覆盖着一层厚厚的苔藓甲壳，从肩膀延伸到手臂和腿部，苔藓甲壳呈深蓝绿色，表面有细密的苔藓绒毛，在光线照射下闪烁着水润的光泽。甲壳覆盖不到的地方露出白皙的皮肤，形成蓝绿色与白色的美丽对比。身穿废土风格的矿工防护服改装的战斗装，紧身设计，胸前和腹部覆盖着苔藓甲壳形成的天然护甲，腰部有矿工工具带，上面挂着发光的苔藓灯和急救包。她的姿态为防御姿态，双脚分开站稳，双手交叉在胸前，苔藓甲壳在手臂上形成盾牌状的突起，散发着蓝色的治愈光芒。她的表情沉默而坚定，眼神温柔但不可动摇。背景为虚化的废弃矿坑，黑暗的矿道中生长着发光的苔藓，蓝色的荧光照亮了岩壁。整体色调以蓝色为主，点缀蓝绿色荧光。废土末世氛围，暗色调背景与角色形成对比。写实摄影风格，真人照片质感，外轮廓线清晰。' },
  { id: 'FM006', name: '枯木回春·林芷', prompt: '超写实风格，韩国冷白皮年轻女性全身立绘，竖屏2:3比例。精致斩男妆容，裸足。她与枯死的古树融合，拥有让枯木逢春的能力。她的长发变为枯黄色，发丝干燥而粗糙，像枯枝一样从头顶散落至腰际，但发梢处有嫩绿的新芽正在生长，象征着枯木回春的力量。她的皮肤上有褐色的树皮纹路，从手腕蔓延至手臂，像枯树的纹理，但纹路之间有绿色的汁液在流动，暗示着生命力的回归。身穿米色和褐色拼接的长袍，服装材质像树皮一样粗糙，但边缘处有嫩绿的叶片和花朵正在生长。腰间系着一条用枯藤编织的腰带，腰带上挂着一个小瓶，瓶中装着绿色的生命之液。她的姿态为施法姿态，右手向前伸出，掌心散发着金色的光芒，光芒中飘散着绿色的叶片和花瓣，左手握着一根枯枝手杖，手杖上正在萌发新芽。她的表情温柔而坚定，眼神中带着一丝疲惫和坚毅，嘴角有淡淡的微笑。背景为虚化的枯木森林，枯死的树干之间有绿色的嫩芽和花朵正在生长，金色的阳光从云层缝隙中洒下。整体色调以金色为主，点缀枯黄色和嫩绿色。废土末世氛围，暗色调背景与角色形成对比。写实摄影风格，真人照片质感，外轮廓线清晰。' },
  { id: 'FM007', name: '孢子云·孟瑶', prompt: '超写实风格，韩国冷白皮年轻女性全身立绘，竖屏2:3比例。精致斩男妆容，裸足。她与变异真菌孢子融合，是废土上最神秘的融合姬。她的全身笼罩在一团巨大的半透明孢子云雾中，只能隐约看到云雾中一个纤细的身影。她的长发为浅绿色，发丝间飘散着无数微小的发光孢子颗粒，像萤火虫一样在发间飞舞。她的面容被薄薄的孢子面纱遮住，只露出金色的眼瞳，眼中闪烁着神秘的光芒。她的皮肤白皙，上有淡绿色的菌丝纹路，像蛛网一样蔓延在锁骨和手臂上。身穿灰绿色的薄纱长裙，裙摆由半透明的菌丝编织而成，轻盈飘逸，裙摆末端飘散着绿色的孢子颗粒。她的姿态为神秘站立姿态，双手微微张开在身体两侧，指尖散发着绿色的孢子光芒，孢子从她的指尖飘散出去，在空气中形成美丽的光点。她的表情神秘而不可捉摸，嘴角带着一丝若有若无的微笑。背景为虚化的辐射荒原，巨大的变异蘑菇和菌丝覆盖了地面，孢子雾气弥漫在空气中。整体色调以绿色为主，点缀荧光绿和灰绿色。废土末世氛围，暗色调背景与角色形成对比。写实摄影风格，真人照片质感，外轮廓线清晰。' },
  { id: 'FM008', name: '铁莲·赵雪', prompt: '超写实风格，韩国冷白皮年轻女性全身立绘，竖屏2:3比例。精致斩男妆容，裸足。她与铁莲融合，是移动的钢铁堡垒。她的长发为深蓝色，扎成利落的高马尾，发丝间点缀着银色的金属光泽，像铁莲花瓣的反光。她的皮肤白皙，上有蓝灰色的金属纹路，从脖颈蔓延至肩膀，像铁莲花瓣的纹理。她的双臂覆盖着蓝灰色的铁莲花瓣甲壳，花瓣层层叠叠地排列，形成坚硬的天然铠甲，花瓣边缘有锋利的金属边缘。身穿蓝灰色和银色拼接的战斗装甲裙，紧身设计勾勒出健美的身材曲线，裙摆由铁莲花瓣组成，像盛开的花朵一样展开。腰间有金属锻造的宽腰带，上面挂着铁匠工具和金属碎片。她的姿态为防御姿态，双脚分开站稳，双臂交叉在胸前，铁莲花瓣甲壳在手臂上形成坚固的盾牌，蓝色光芒从花瓣缝隙中透出。她的表情坚毅而直爽，眼神中带着自信和勇气。背景为虚化的军事前哨废墟，倒塌的铁丝网和弹坑中生长着蓝色的铁莲花。整体色调以蓝色为主，点缀银灰色金属光泽。废土末世氛围，暗色调背景与角色形成对比。写实摄影风格，真人照片质感，外轮廓线清晰。' },
  { id: 'FM009', name: '根网·唐欣', prompt: '超写实风格，韩国冷白皮年轻女性全身立绘，竖屏2:3比例。精致斩男妆容，裸足。她是一个盲女，与地下根系网络融合，通过根系"看"世界。她的长发为深紫色，柔顺地垂落至腰际，发丝间缠绕着细小的藤蔓根须，根须末端有微弱的紫色荧光。她的双眼被一条银白色的丝带蒙住，丝带上绣着藤蔓纹路。她的皮肤白皙如瓷，上有紫色的根系纹路，从手腕蔓延至手臂，像地下根系的投影。身穿紫色的长袍，服装材质柔软飘逸，像藤蔓编织的布料，腰间有藤蔓束腰，裙摆拖地，边缘处有根须垂落。她的姿态为感知姿态，双手微微向前伸出，掌心朝下，手指修长而优雅，指尖有紫色的根系纹路在发光，仿佛在通过根系感知大地的一切。她的表情平静而温柔，蒙着双眼的面容带着安详的微笑，像一位洞察一切的先知。从她的脚底延伸出无数紫色的根系，根系在地面蔓延开来，形成一张巨大的网络。背景为虚化的地下根系网络，紫色的根系在黑暗中发光，像一张巨大的蛛网。整体色调以紫色为主，点缀银白色。废土末世氛围，暗色调背景与角色形成对比。写实摄影风格，真人照片质感，外轮廓线清晰。' },
  { id: 'FM010', name: '仙人掌·沙琳', prompt: '超写实风格，韩国冷白皮年轻女性全身立绘，竖屏2:3比例。精致斩男妆容，裸足。她与变异仙人掌融合，是沙漠中最顽强的战士。她的皮肤为健康的小麦色，上有细小的仙人掌刺纹路，从肩膀蔓延至手臂，刺纹路呈暗红色，像沙漠落日的余晖。她的短发为火红色，干练利落地剪至耳际，发丝间有细小的仙人掌花苞点缀。她的双臂覆盖着一层薄薄的绿色仙人掌表皮，表皮上有细小的白色刺毛，在光线照射下闪烁着银色的光芒。身穿暗红色和绿色拼接的沙漠战斗装，紧身设计，胸前有仙人掌形状的金属护甲，腰间有沙漠生存工具带，上面挂着水壶和匕首。裙摆为暗红色的短裙，边缘有仙人掌刺状的装饰。她的姿态为防御反击姿态，双脚分开站稳，双臂微微张开，仙人掌刺从手臂上竖起，形成天然的防御阵，右手握拳，拳面上有仙人掌刺在发光。她的表情沉默而坚韧，眼神中带着沙漠般的坚定和不屈。背景为虚化的沙漠绿洲，巨大的仙人掌和沙丘在远处绵延，红色的夕阳将沙漠染成一片火海。整体色调以红色为主，点缀绿色。废土末世氛围，暗色调背景与角色形成对比。写实摄影风格，真人照片质感，外轮廓线清晰。' },
  { id: 'FM014', name: '藤盾·吴芳', prompt: '超写实风格，韩国冷白皮年轻女性全身立绘，竖屏2:3比例。精致斩男妆容，裸足。她与藤蔓篱笆融合，是永远挡在队友前面的绿色墙壁。她的长发为深绿色，扎成利落的单马尾，发丝粗壮有力，像藤蔓一样从头顶垂落至腰际。她的皮肤为健康的小麦色，上有深绿色的藤蔓纹路，从手腕蔓延至手臂，像篱笆的编织纹理。她的双臂缠绕着粗壮的绿色藤蔓，藤蔓从手腕一直延伸到肩膀，编织成盾牌状的护甲，藤蔓上有锋利的刺和卷须。身穿深绿色和棕色拼接的守卫战斗装，紧身设计，胸前有藤蔓编织的护甲，腰间有守卫工具带，上面挂着对讲机和手电筒。裙摆为深绿色的短裙，边缘有藤蔓垂落。她的姿态为防御姿态，双脚分开站稳，双臂向前伸出，藤蔓在手臂上编织成一面巨大的绿色盾牌，盾牌上的藤蔓正在生长和修复。她的表情朴实憨厚，眼神坚定而忠诚，像一位可靠的守卫。背景为虚化的幸存者聚落入口，藤蔓篱笆和木质栅栏在远处排列，绿色植物从围墙缝隙中生长。整体色调以绿色为主，点缀棕色。废土末世氛围，暗色调背景与角色形成对比。写实摄影风格，真人照片质感，外轮廓线清晰。' }
];

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'comfyui-config.json'), 'utf-8'));

function buildZITWorkflow(options) {
  const seed = options.seed || Math.floor(Math.random() * 9999999999);
  return {
    "57:28": { inputs: { unet_name: "z_image\\ZIT-divingZImageTurbo_v50Fp16.safetensors", weight_dtype: "default" }, class_type: "UNETLoader" },
    "57:11": { inputs: { shift: 3, model: ["57:28", 0] }, class_type: "ModelSamplingAuraFlow" },
    "57:13": { inputs: { width: options.width || 960, height: options.height || 1600, batch_size: 1 }, class_type: "EmptySD3LatentImage" },
    "57:30": { inputs: { clip_name: "qwen_3_4b.safetensors", type: "lumina2", device: "default" }, class_type: "CLIPLoader" },
    "57:29": { inputs: { vae_name: "ae.safetensors" }, class_type: "VAELoader" },
    "57:27": { inputs: { text: "", clip: ["57:30", 0] }, class_type: "CLIPTextEncode" },
    "57:33": { inputs: { conditioning: ["57:27", 0] }, class_type: "ConditioningZeroOut" },
    "57:8": { inputs: { samples: ["57:3", 0], vae: ["57:29", 0] }, class_type: "VAEDecode" },
    "57:3": { inputs: { seed: seed, steps: 8, cfg: 1, sampler_name: "res_multistep", scheduler: "simple", denoise: 1, model: ["57:11", 0], positive: ["57:27", 0], negative: ["57:33", 0], latent_image: ["57:13", 0] }, class_type: "KSampler" },
    "9": { inputs: { filename_prefix: `fusion_${options.id}`, images: ["57:8", 0] }, class_type: "SaveImage" }
  };
}

async function queuePrompt(prompt_data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ prompt: prompt_data });
    const options = {
      hostname: config.comfyui.host, port: config.comfyui.port, path: '/prompt', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getHistory(promptId) {
  return new Promise((resolve, reject) => {
    const options = { hostname: config.comfyui.host, port: config.comfyui.port, path: `/history/${promptId}`, method: 'GET' };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function downloadImage(filename, savePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(savePath);
    const options = { hostname: config.comfyui.host, port: config.comfyui.port, path: `/view?filename=${filename}&type=output`, method: 'GET' };
    http.get(options, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else {
        file.close();
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function waitForCompletion(promptId, maxWait = 120) {
  for (let i = 0; i < maxWait; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const history = await getHistory(promptId);
    if (history[promptId]?.status?.completed) return true;
    if (i % 10 === 0) console.log(`  等待中... (${i}/${maxWait}s)`);
  }
  return false;
}

async function generatePortrait(char) {
  console.log(`\n[${char.id}] ${char.name}`);
  console.log('─'.repeat(50));
  
  const workflow = buildZITWorkflow({
    id: char.id,
    positivePrompt: char.prompt,
    negativePrompt: "low quality, worst quality, bad anatomy, bad hands, missing fingers, extra limbs, deformed, disfigured, ugly, blurry, watermark, text, logo",
    width: 960, height: 1600,
    seed: Math.floor(Math.random() * 9999999999)
  });
  
  console.log('  提交生成任务...');
  const result = await queuePrompt(workflow);
  const promptId = result.prompt_id;
  console.log(`  Prompt ID: ${promptId}`);
  
  console.log('  等待生成完成...');
  const completed = await waitForCompletion(promptId);
  
  if (!completed) {
    console.log('  ✗ 生成超时');
    return null;
  }
  
  const history = await getHistory(promptId);
  const outputs = history[promptId].outputs;
  
  for (const nodeId of Object.keys(outputs)) {
    const nodeData = outputs[nodeId];
    if (nodeData.images) {
      const filename = nodeData.images[0].filename;
      const savePath = path.join(__dirname, '..', 'assets', 'images', 'characters', 'fusion', `${char.id}.png`);
      
      console.log(`  下载: ${filename}`);
      await downloadImage(filename, savePath);
      
      const stats = fs.statSync(savePath);
      console.log(`  ✓ 已保存: ${char.id}.png (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      return { id: char.id, name: char.name, path: savePath };
    }
  }
  
  return null;
}

async function updateConfig(fusionId) {
  const configPath = path.join(__dirname, '..', 'assets', 'data', 'json', 'minionCards.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  const idMap = {
    'FM001': 'MC_wind_support_001',
    'FM002': 'MC_wind_attack_001',
    'FM003': 'MC_dark_attack_001',
    'FM004': 'MC_water_tank_001',
    'FM006': 'MC_light_support_001',
    'FM007': 'MC_wind_attack_002',
    'FM008': 'MC_water_tank_002',
    'FM009': 'MC_dark_support_001',
    'FM010': 'MC_fire_tank_001',
    'FM014': 'MC_wind_tank_001'
  };
  
  const cardId = idMap[fusionId];
  if (!cardId) {
    console.log(`  ⚠ 未找到 ID 映射: ${fusionId}`);
    return false;
  }
  
  const card = config.find(c => c.cardId === cardId);
  if (card) {
    card.portrait = `characters/fusion/${fusionId}.png`;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`  ✓ 更新配置文件: minionCards.json`);
    return true;
  } else {
    console.log(`  ⚠ 未找到卡片: ${cardId}`);
    return false;
  }
}

async function updatePreloadScene(fusionId) {
  const preloadPath = path.join(__dirname, '..', 'src', 'scenes', 'PreloadScene.js');
  let content = fs.readFileSync(preloadPath, 'utf-8');
  
  if (!content.includes(`'${fusionId}'`)) {
    const match = content.match(/const fusionPortraits = \[([\s\S]*?)\];/);
    if (match) {
      const newItem = `'${fusionId}'`;
      const currentList = match[1].replace(/\s/g, '');
      const items = currentList.split(',').filter(i => i);
      
      if (!items.includes(`'${fusionId}'`)) {
        items.push(fusionId);
        items.sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || 0);
          const numB = parseInt(b.match(/\d+/)?.[0] || 0);
          return numA - numB;
        });
        
        const newList = items.map(item => `\n      '${item}'`).join(', ');
        content = content.replace(match[0], `const fusionPortraits = [${newList}\n    ];`);
        fs.writeFileSync(preloadPath, content);
        console.log(`  ✓ 更新加载代码: PreloadScene.js`);
        return true;
      }
    }
  }
  return false;
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   融合姬批量生成工具 v1.0                      ║');
  console.log('║   第一批: 10张融合姬立绘                       ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  const results = [];
  
  for (let i = 0; i < FUSION_LIST.length; i++) {
    const char = FUSION_LIST[i];
    console.log(`\n[${i + 1}/${FUSION_LIST.length}] 正在生成...`);
    
    try {
      const result = await generatePortrait(char);
      if (result) {
        await updateConfig(result.id);
        await updatePreloadScene(result.id);
        results.push(result);
      }
    } catch (e) {
      console.log(`  ✗ 错误: ${e.message}`);
    }
    
    if (i < FUSION_LIST.length - 1) {
      console.log('  等待3秒后继续...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   生成完成                                      ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n成功生成: ${results.length}/${FUSION_LIST.length} 张`);
  results.forEach(r => console.log(`  ✓ ${r.id} - ${r.name}`));
}

main().catch(e => {
  console.error('错误:', e);
  process.exit(1);
});
