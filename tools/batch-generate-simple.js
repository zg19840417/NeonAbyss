const http = require('http');
const fs = require('fs');
const path = require('path');

const FUSION_LIST = [
  { id: 'FM001', name: '万根之母·秦若兰', prompt: '废土末世风格，女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她与一棵巨大的变异古树融合。长发变为苍翠的藤蔓编发，发丝间缠绕着白色花朵和嫩绿新芽。皮肤上有淡金色树脉纹路。身穿白色长裙，裙摆由薄纱和树叶编织。双手手背有树皮纹理。姿态慈祥站立，双手张开掌心朝上。从脚底延伸出无数根系，扎入地面。背景为虚化的深山古树森林。整体色调翠绿色为主，点缀金色光芒。废土末世氛围，超写实摄影风格。' },
  { id: 'FM002', name: '锈叶·苏蔓', prompt: '废土末世风格，女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她与变异藤蔓和锈蚀金属融合。头发为铁锈色藤蔓编发，末端有金属倒刺。手臂缠绕锈蚀金属荆棘，皮肤有淡绿色藤蔓纹路。身穿皮革金属拼接战斗服。姿态攻击姿态，右手挥藤蔓鞭。眼神凌厉坚定。背景为废弃城区废墟。整体色调绿色为主，点缀铁锈色。废土末世氛围，超写实摄影风格。' },
  { id: 'FM003', name: '毒蕊·方晴', prompt: '废土末世风格，女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她与噬魂花融合。长发为深紫黑色花瓣状发丝，眼瞳紫红色。皮肤有紫黑色脉络纹路。身穿黑色紧身战斗服，裙摆为黑色花瓣。姿态释放毒素，右手抬指尖有紫黑毒雾。表情冷艳神秘。背景为污染森林深处。整体色调紫色为主，点缀暗红。废土末世氛围，超写实摄影风格。' },
  { id: 'FM004', name: '苔甲·叶青', prompt: '废土末世风格，女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她与发光苔藓融合。短发为深蓝色，发丝间有发光苔藓颗粒。皮肤覆盖苔藓甲壳，深蓝绿色有绒毛。身穿矿工防护服改装战斗装。姿态防御姿态，双手交叉胸前。表情沉默坚定。背景为废弃矿坑。整体色调蓝色为主，点缀蓝绿荧光。废土末世氛围，超写实摄影风格。' },
  { id: 'FM006', name: '枯木回春·林芷', prompt: '废土末世风格，女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她与枯死古树融合。长发枯黄色但发梢有嫩绿新芽。皮肤有褐色树皮纹路。身穿米色褐色长袍，边缘有绿叶花朵。姿态施法姿态，右手伸掌心有金光，左手握枯枝手杖。表情温柔坚定。背景为枯木森林。整体色调金色为主，点缀枯黄嫩绿。废土末世氛围，超写实摄影风格。' },
  { id: 'FM007', name: '孢子云·孟瑶', prompt: '废土末世风格，女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她与变异真菌孢子融合。全身笼罩半透明孢子云雾。长发浅绿色，发丝间有发光孢子颗粒。面容被孢子面纱遮住，只露金色眼瞳。身穿灰绿薄纱长裙。姿态神秘站立，双手微张指尖有孢子光芒。表情神秘微笑。背景为辐射荒原。整体色调绿色为主，点缀荧光绿。废土末世氛围，超写实摄影风格。' },
  { id: 'FM008', name: '铁莲·赵雪', prompt: '废土末世风格，女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她与铁莲融合。长发深蓝色扎高马尾，发丝有银色金属光泽。皮肤有蓝灰金属纹路。双臂有铁莲花瓣甲壳。身穿蓝灰银拼接战斗装甲裙。姿态防御姿态，双臂交叉胸前。表情坚毅直爽。背景为军事前哨废墟。整体色调蓝色为主，点缀银灰金属光泽。废土末世氛围，超写实摄影风格。' },
  { id: 'FM009', name: '根网·唐欣', prompt: '废土末世风格，女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她是盲女与地下根系融合。长发深紫色，发丝有藤蔓根须。双眼被银白丝带蒙住。皮肤有紫色根系纹路。身穿紫色长袍。姿态感知姿态，双手向前掌心朝下。表情平静温柔。背景为地下根系网络。整体色调紫色为主，点缀银白。废土末世氛围，超写实摄影风格。' },
  { id: 'FM010', name: '仙人掌·沙琳', prompt: '废土末世风格，女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她与变异仙人掌融合。皮肤有仙人掌刺纹路暗红色。短发火红色。双臂有绿色仙人掌表皮和白色刺毛。身穿暗红绿色沙漠战斗装。姿态防御反击姿态，双臂张开有仙人掌刺。表情沉默坚韧。背景为沙漠绿洲。整体色调红色为主，点缀绿色。废土末世氛围，超写实摄影风格。' },
  { id: 'FM014', name: '藤盾·吴芳', prompt: '废土末世风格，女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她与藤蔓篱笆融合。长发深绿色扎单马尾。皮肤有深绿藤蔓纹路。双臂缠绕粗壮绿色藤蔓有刺。身穿深绿棕色守卫战斗装。姿态防御姿态，双臂前伸藤蔓盾牌。表情朴实憨厚。背景为幸存者聚落入口。整体色调绿色为主，点缀棕色。废土末世氛围，超写实摄影风格。' }
];

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'comfyui-config.json'), 'utf-8'));

function buildZITWorkflow(options) {
  const seed = options.seed || Math.floor(Math.random() * 999999999999999);
  return {
    "57:28": { inputs: { unet_name: "z_image\\ZIT-divingZImageTurbo_v50Fp16.safetensors", weight_dtype: "default" }, class_type: "UNETLoader" },
    "57:11": { inputs: { shift: 3, model: ["57:28", 0] }, class_type: "ModelSamplingAuraFlow" },
    "57:13": { inputs: { width: options.width || 960, height: options.height || 1600, batch_size: 1 }, class_type: "EmptySD3LatentImage" },
    "57:30": { inputs: { clip_name: "qwen_3_4b.safetensors", type: "lumina2", device: "default" }, class_type: "CLIPLoader" },
    "57:29": { inputs: { vae_name: "ae.safetensors" }, class_type: "VAELoader" },
    "57:27": { inputs: { text: options.positivePrompt, clip: ["57:30", 0] }, class_type: "CLIPTextEncode" },
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
    width: 960, height: 1600,
    seed: Math.floor(Math.random() * 9999999999)
  });
  
  console.log('  提交生成任务...');
  const result = await queuePrompt(workflow);
  
  if (!result.prompt_id) {
    console.log('  ✗ 提交失败:', result);
    return null;
  }
  
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
      const items = match[1].replace(/\s/g, '').split(',').filter(i => i);
      
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
  console.log('║   融合姬批量生成工具 v2.0（精简提示词）       ║');
  console.log('║   第一批: 10张融合姬立绘                     ║');
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
  
  if (results.length > 0) {
    console.log('\n请检查生成的图片是否符合预期！');
    console.log('提示词已精简，如仍不符合可以进一步调整。');
  }
}

main().catch(e => {
  console.error('错误:', e);
  process.exit(1);
});
