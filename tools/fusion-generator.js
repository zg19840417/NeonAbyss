import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComfyUI {
  constructor(config) {
    this.host = config.comfyui.host;
    this.port = config.comfyui.port;
    this.baseUrl = `http://${this.host}:${this.port}`;
  }

  async queuePrompt(workflow) {
    return this.post('/prompt', { prompt: workflow });
  }

  async getHistory(promptId) {
    return this.get(`/history/${promptId}`);
  }

  async getHistoryAll() {
    return this.get('/history?per_page=50');
  }

  async downloadImage(filename, subfolder, type, savePath) {
    const url = `${this.baseUrl}/view?filename=${filename}&subfolder=${subfolder || ''}&type=${type || 'output'}`;
    return this.download(url, savePath);
  }

  async get(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
    });
  }

  async post(path, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const body = JSON.stringify(data);
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  async download(url, savePath) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          this.download(res.headers.location, savePath).then(resolve).catch(reject);
          return;
        }

        const file = fs.createWriteStream(savePath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(savePath);
        });
      });

      req.on('error', reject);
      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error('下载超时'));
      });
    });
  }
}

const FUSION_PROMPTS = {
  'FM001': `1024x1536竖屏立绘，POV视角定焦镜头近距离特写。超现实写实风格，摄影师风格，电影质感，韩国22岁年轻女性。尖下巴又尖又长，尖鼻子高鼻梁，狐狸眼，长睫毛，卧蚕明显，眼旁一颗淡淡美人痣。冷白瓷白皮肤光滑水润，在环境光照射下有轻微光泽度。骨架偏瘦但胸部和臀部丰满，小蛮腰，披肩直发，夜店精致魅惑装扮，红润的唇彩。眼眸直视镜头不要漂移。

她是废土上最古老的融合姬，与一棵巨大的变异古树深度融合。头发为苍翠的翠绿色披肩直发，发丝间缠绕着细小的白色小花和嫩绿的新芽。指甲为翠绿色美甲。身穿飘逸的翠绿色丝质吊带长裙，裙摆由层层叠叠的薄纱和透明丝质面料组成，轻盈得仿佛被风轻轻吹起，裙摆下是白皙的裸足。皮肤上有淡金色的树脉纹路，从锁骨蔓延至手臂。双腿缠绕着苍翠的藤蔓，藤蔓从脚踝一直延伸到膝盖，像树根一样扎入周围的土壤。

她采用优雅的跪姿，双膝微微分开，双手自然垂放在大腿上，掌心朝上，指尖散发着微弱的翠绿色治愈光芒，姿势舒展自然。表情直视镜头，眼神冷艳中带着母性的温柔，仿佛在邀请观者进入她的治愈领域。背景为虚化的深山古树森林，巨大的树干和翠绿的藤蔓交织成一片朦胧的绿色穹顶，阳光从树冠缝隙中洒下形成金色光柱。整体色调以翠绿色为主题，点缀金色光芒，废土末世氛围。`,

  'FM021': `1024x1536竖屏立绘，POV视角定焦镜头近距离特写。超现实写实风格，摄影师风格，电影质感，韩国22岁年轻女性。尖下巴又尖又长，尖鼻子高鼻梁，狐狸眼，长睫毛，卧蚕明显，眼旁一颗淡淡美人痣。冷白瓷白皮肤光滑水润。骨架偏瘦但胸部和臀部丰满，小蛮腰，披肩直发，夜店精致魅惑装扮。

她是方舟计划的核心实验体，与变异雪豹深度嵌合。头发为银白色的蓬松披肩直发，发丝间有灰黑色的豹纹斑点。身穿飘逸的暗紫色透明丝质露肩长裙，裙摆由半透明的黑色羽毛和丝质面料组成，轻盈朦胧，裙摆下是白皙的裸足。脊椎两侧长出了一排可伸缩的骨刺，呈半透明的灰白色，锋利而优美。

眼眸直视镜头不要漂移。她采用跪姿，臀部坐在小腿上，双手放在膝盖上，姿势舒展自然。表情直视镜头，眼神冷峻而孤独，狐狸眼中带着掠食者的威压，嘴角带着危险的微笑，仿佛在审视观者是否值得她出手。背景为虚化的废弃城区废墟，月光从乌云缝隙中洒下，照亮了废墟的轮廓。整体色调以紫色为主题，点缀银白色，废土末世氛围。`,

  'FM041': `1024x1536竖屏立绘，POV视角定焦镜头近距离特写。超现实写实风格，摄影师风格，电影质感，韩国22岁年轻女性。尖下巴又尖又长，尖鼻子高鼻梁，狐狸眼，长睫毛，卧蚕明显，眼旁一颗淡淡美人痣。冷白瓷白皮肤光滑水润。骨架偏瘦但胸部和臀部丰满，小蛮腰，披肩直发，夜店精致魅惑装扮。

她是方舟计划的首席机械工程师，与星舰引擎核心深度融合。头发为银白色的光泽披肩直发，发丝间有电路纹路的金属光泽。嘴唇涂着银白色口红，指甲为银色金属质感美甲。身穿飘逸的银白色和金色拼接透明丝质长裙，裙摆由半透明的金属纤维丝质面料组成，轻盈金属光泽，裙摆下是白皙的裸足。脊椎被金属管线取代，从背部延伸出去与引擎子系统相连；双眼是纯粹的机械光圈，发出稳定的白色冷光，如同永不熄灭的恒星。

她采用坐姿，双腿自然下垂，姿势舒展自然。表情看向镜头，坚定而神圣，狐狸眼中带着守护者的使命，嘴角带着希望的微笑。背景为虚化的星舰引擎核心，巨大的推进器和能量管道在身后闪烁。整体色调以金色为主题，点缀银白色，废土末世氛围。`,

  'FM061': `1024x1536竖屏立绘，POV视角定焦镜头近距离特写。超现实写实风格，摄影师风格，电影质感，韩国22岁年轻女性。尖下巴又尖又长，尖鼻子高鼻梁，狐狸眼，长睫毛，卧蚕明显，眼旁一颗淡淡美人痣。冷白瓷白皮肤光滑水润。骨架偏瘦但胸部和臀部丰满，小蛮腰，披肩直发，夜店精致魅惑装扮，红润的唇彩。

她是第七避难所的首席能源工程师，与地热核心的火焰能量深度融合。头发为赤红色的飘浮流焰状披肩直发，发丝如火焰般飘动。指甲为赤红色美甲。身穿飘逸的赤红色和橙色拼接透明丝质露肩长裙，裙摆由半透明的火焰状丝质面料组成，轻盈燃烧，裙摆下是白皙的裸足。皮肤上布满不断渗出橙红色光芒的裂纹，在黑暗中如同燃烧的脉络；双眼是纯粹的火焰白光，眼眸直视镜头不要漂移。

她采用跪姿，赤红色的火焰能量场环绕全身，姿势舒展自然。表情直视镜头，眼神冷峻而痛苦，狐狸眼中带着失去记忆后的孤独，嘴角带着一丝苦涩的微笑。背景为虚化的地热核心废墟，熔岩和火焰在远处燃烧，地面被高温烧成琉璃。整体色调以红色为主题，点缀橙红色和金色，废土末世氛围。`
};

function buildWorkflow(charId, config, options) {
  const defaults = config.defaults;
  const width = options.width || defaults.width;
  const height = options.height || defaults.height;
  const seed = options.seed || Math.floor(Math.random() * 99999999999);

  const templatePath = path.join(__dirname, '..', 'image_z_image_turbo.json');
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

  const workflow = {};
  for (const [key, node] of Object.entries(template)) {
    const cleanKey = key.replace(/:/g, '_');
    workflow[cleanKey] = { class_type: node.class_type, inputs: { ...node.inputs } };
    const inputs = workflow[cleanKey].inputs;

    if (key === '57:27' && inputs.text !== undefined) {
      inputs.text = options.prompt;
    }
    if (key === '9' && inputs.filename_prefix !== undefined) {
      inputs.filename_prefix = options.filename_prefix || charId;
    }
    if (key === '57:13') {
      if (inputs.width !== undefined) inputs.width = width;
      if (inputs.height !== undefined) inputs.height = height;
    }
    if (key === '57:3' && inputs.seed !== undefined) {
      inputs.seed = seed;
    }
  }

  return workflow;
}

async function generateAndSave(charId, prompt, config, outputDir) {
  const comfyui = new ComfyUI(config);
  
  console.log(`\n正在生成 ${charId}...`);
  
  const workflow = buildWorkflow(charId, config, {
    prompt: prompt,
    width: 1024,
    height: 1536
  });

  const queueResult = await comfyui.queuePrompt(workflow);
  
  console.log(`  提交的工作流:`, JSON.stringify(workflow, null, 2));
  console.log(`  ComfyUI响应:`, JSON.stringify(queueResult, null, 2));
  
  if (!queueResult.prompt_id) {
    throw new Error(`提交 ${charId} 任务失败`);
  }

  console.log(`  任务已提交，Prompt ID: ${queueResult.prompt_id}`);
  
  const maxWait = 600000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      const history = await comfyui.getHistory(queueResult.prompt_id);
      
      if (history[queueResult.prompt_id]) {
        const outputs = history[queueResult.prompt_id];
        const saveNode = Object.keys(outputs).find(key => outputs[key].images);
        
        if (saveNode && outputs[saveNode].images) {
          const images = outputs[saveNode].images;
          console.log(`  生成完成！找到 ${images.length} 张图片`);
          
          const savedPaths = [];
          for (const img of images) {
            const savePath = path.join(outputDir, `${charId}.png`);
            await comfyui.downloadImage(img.filename, img.subfolder, img.type, savePath);
            console.log(`  已保存: ${savePath}`);
            savedPaths.push(savePath);
          }
          
          return savedPaths;
        }
      }
      
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`  等待中... (${elapsed}秒)`);
    } catch (e) {
      console.log(`  检查状态时出错: ${e.message}，继续等待...`);
    }
  }
  
  throw new Error(`${charId} 生成超时`);
}

async function main() {
  console.log('===========================================');
  console.log('   融合姬立绘生成工具');
  console.log('   苏打地牢项目');
  console.log('===========================================\n');

  const configPath = path.join(__dirname, 'comfyui-config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('错误: 找不到配置文件 comfyui-config.json');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  const outputDir = path.join(__dirname, '..', 'assets', 'images', 'characters', 'fusion');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('正在测试 ComfyUI 连接...');
  const testComfyui = new ComfyUI(config);
  try {
    await testComfyui.getHistoryAll();
    console.log('✓ ComfyUI 连接成功\n');
  } catch (e) {
    console.error('✗ 无法连接到 ComfyUI');
    console.error('  请确保 ComfyUI 正在运行并启用了 API 功能');
    console.error('  错误:', e.message);
    console.error('\n启动 ComfyUI 命令:');
    console.error('  python main.py --listen 127.0.0.1 --port 8188');
    process.exit(1);
  }

  const charIds = process.argv.slice(2).length > 0 
    ? process.argv.slice(2) 
    : ['FM001', 'FM021', 'FM041', 'FM061'];

  console.log('将生成以下角色立绘:');
  for (const charId of charIds) {
    const charName = getCharName(charId);
    console.log(`  ${charId}: ${charName}`);
  }
  console.log('');

  console.log('生成参数:');
  console.log('  分辨率: 1024 x 1536');
  console.log('  步数: 8');
  console.log('  CFG: 1');
  console.log('  采样器: res_multistep');
  console.log('');

  for (const charId of charIds) {
    const prompt = FUSION_PROMPTS[charId];
    if (!prompt) {
      console.log(`跳过 ${charId}: 未找到提示词`);
      continue;
    }

    try {
      await generateAndSave(charId, prompt, config, outputDir);
      console.log(`✓ ${charId} 生成并保存成功\n`);
    } catch (e) {
      console.error(`✗ ${charId} 生成失败: ${e.message}\n`);
    }
  }

  console.log('===========================================');
  console.log('生成完成！');
  console.log('===========================================');
  console.log(`图片已保存到: ${outputDir}`);
}

function getCharName(charId) {
  const names = {
    'FM001': '万根之母·秦若兰',
    'FM021': '百兽之眼·沈霜',
    'FM041': '方舟引擎·陆昭衡',
    'FM061': '焚城之烬·苏晚棠',
    'FM062': '雷暴走廊·钟离澈',
    'FM063': '零度黎明·沈若冰',
    'FM064': '暗蚀·林墨',
    'FM065': '光子·叶明',
    'FM066': '微光·周莹',
    'FM067': '脉冲·吴涛',
    'FM068': '离子·郑洁',
    'FM069': '回旋·孙磊',
    'FM070': '折射·李晴',
    'FM071': '辐射·赵阳',
    'FM072': '光谱·钱璐',
    'FM073': '磁场·周杰',
    'FM074': '引力·吴静',
    'FM075': '量子·郑强',
    'FM076': '引力波·王婷',
    'FM077': '粒子·李明',
    'FM078': '能量场·张雪',
    'FM079': '光量子·陈阳',
    'FM080': '暗能量·林暗',
    'FM002': '锈叶·苏蔓',
    'FM003': '毒蕊·方晴',
    'FM004': '苔甲·叶青',
    'FM005': '荆棘之心·柳依',
    'FM006': '枯木回春·林芷',
    'FM007': '孢子云·孟瑶',
    'FM008': '铁莲·赵雪',
    'FM009': '根网·唐欣',
    'FM010': '花仙·何琳',
    'FM011': '菌后·郑莉',
    'FM012': '暗藤·吴霜',
    'FM013': '绞杀·孙薇',
    'FM014': '草灵·刘芳',
    'FM015': '蘑菇·马莉',
    'FM016': '藤蔓·李青',
    'FM017': '花瓣·王红',
    'FM018': '树叶·赵绿',
    'FM019': '枯藤·李蔓',
    'FM020': '树心·王莹',
    'FM022': '铁颚·白露',
    'FM023': '蛇吻·陈玉',
    'FM024': '水影·周鱼',
    'FM025': '羽刃·吴羽',
    'FM026': '蛛丝·郑网',
    'FM027': '蜂刺·马蜜',
    'FM028': '蝎尾·赵毒',
    'FM029': '蝶翼·钱彩',
    'FM030': '甲壳·孙坚',
    'FM031': '鳞甲·周鳞',
    'FM032': '爪锋·吴爪',
    'FM033': '尾鞭·郑尾',
    'FM034': '齿痕·钱齿',
    'FM035': '鳍刃·孙鳍',
    'FM036': '翼展·吴翼',
    'FM037': '壳盾·郑壳',
    'FM038': '丝缚·马丝',
    'FM039': '羽织·李羽',
    'FM040': '猫步·钟灵',
    'FM042': '履带碾压者·韩铁衣',
    'FM043': '炮管·赵射',
    'FM044': '盾甲·钱防',
    'FM045': '刃锋·孙刀',
    'FM046': '装甲·周甲',
    'FM047': '焊枪·吴焊',
    'FM048': '芯片·郑芯',
    'FM049': '电路·马电',
    'FM050': '焊锡·李锡',
    'FM051': '数据·陈数',
    'FM052': '链接·周连',
    'FM053': '接口·吴口',
    'FM054': '协议·郑协',
    'FM055': '代码·孙码',
    'FM056': '算法·钱算',
    'FM057': '模型·周模',
    'FM058': '网络·吴网',
    'FM059': '终端·郑终',
    'FM060': '控制·孙控',
    'FM081': '三神一体·陆神',
    'FM082': '融核·周合',
    'FM083': '嵌合·吴嵌',
    'FM084': '融合·郑融',
    'FM085': '混成·马混',
    'FM086': '编织者·李织',
    'FM087': '共鸣·陈共',
    'FM088': '绞杀者·周绞',
    'FM089': '裂隙·吴裂',
    'FM090': '绽放·郑绽',
    'FM091': '三界·孙三',
    'FM092': '碎片·钱碎',
    'FM093': '融合·周融',
    'FM094': '机械藤·吴机',
    'FM095': '电能肉·郑电',
    'FM096': '机动血·马机',
    'FM097': '血肉器·李血',
    'FM098': '变异菌·陈变',
    'FM099': '植甲·周植',
    'FM100': '机核·吴核'
  };
  return names[charId] || '未知角色';
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('发生错误:', e);
    process.exit(1);
  });
