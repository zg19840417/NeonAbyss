#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * 野外Boss立绘生成器
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const COMFYUI_HOST = '127.0.0.1';
const COMFYUI_PORT = 8188;
const WORKFLOW_PATH = path.join(__dirname, '..', 'image_z_image_turbo.json');
const MAPPING_PATH = path.join(__dirname, 'mutant_portrait_mapping.json');
const WILD_BOSS_DIR = path.join(__dirname, '..', 'assets', 'images', 'characters', 'wild_boss');
const COMFYUI_OUTPUT = 'D:\\ComfyUI\\ComfyUI-aki-v2\\ComfyUI\\output';

const WIDTH = 1024;
const HEIGHT = 1536;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: COMFYUI_HOST,
      port: COMFYUI_PORT,
      path: endpoint,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function submitPrompt(prompt) {
  const res = await apiRequest('POST', '/prompt', { prompt });
  if (!res.prompt_id) throw new Error('提交失败');
  return res.prompt_id;
}

async function waitForCompletion(promptId, timeout = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const history = await apiRequest('GET', `/history/${promptId}`);
    if (history[promptId]) {
      if (history[promptId].status && history[promptId].status.exec_error) {
        throw new Error('执行错误');
      }
      return history[promptId];
    }
    await sleep(2000);
  }
  throw new Error('超时');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getImages(history) {
  const images = [];
  for (const nodeId in history.outputs) {
    const output = history.outputs[nodeId];
    if (output.images) {
      output.images.forEach(img => images.push(img));
    }
  }
  return images;
}

function copyImage(image, targetPath) {
  const src = path.join(COMFYUI_OUTPUT, image.subfolder || '', image.filename);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, targetPath);
    return true;
  }
  return false;
}

function getPrompt(data) {
  const elementColors = {
    dark: '深紫/黑/暗红',
    water: '深蓝/青/冰蓝',
    fire: '赤红/橙/熔岩色',
    wind: '翠绿/黄绿/荧光绿',
    light: '金/白/彩虹色'
  };
  
  const prompts = {
    radiation_beast: `超写实风格，1024x1536竖屏立绘，废土末世世界观。核战后的废墟中，一头由核辐射造就的巨型变异生物正在咆哮。体型巨大，约5米高，四足行走姿态，像一头畸形的巨型野牛。全身覆盖着深灰色的变异皮肤，皮肤表面布满发光的辐射裂纹，裂纹中透出幽绿色的辐射光芒，在黑暗中像燃烧的脉络一样跳动。头部巨大而扭曲，深灰色的皮肤上布满了辐射增生的骨质结构，像珊瑚一样从颅骨上生长出来。两只眼睛已经从正常的眼睛变异为两个燃烧着幽绿色火焰的空洞，火焰在眼眶中跳动，散发出诡异的光芒。口部张开时露出参差不齐的巨大獠牙。背脊上有排列整齐的辐射结晶簇，这些结晶呈深绿色，在身体周围发出微弱的荧光。周围有飘浮的辐射尘埃粒子。整体色调为深灰和辐射绿，低饱和度的深灰色变异生物背景中，高饱和度的辐射绿裂纹光芒形成视觉焦点。氛围压迫、恐怖、有末日废土的荒凉感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景为辐射废墟的核心区域——核爆中心的废墟，巨大的弹坑、被辐射摧毁的建筑残骸。背景虚化突出生物主体。`,
    
    toxic_lord: `超写实风格，1024x1536竖屏立绘，废土末世世界观。有毒沼泽最深处，沉睡着一位沼泽的统治者。体型庞大，约4米长，半水栖形态，像一头畸形的巨型鳄鱼与沼泽本身的融合体。全身覆盖着深绿色的鳞片，鳞片之间渗出腐蚀性的绿色黏液，在空气中蒸腾出有毒的蒸汽。头部呈流线型，深绿色的鳞片上覆盖着一层厚厚的腐蚀性黏液。一对暗红色的眼睛在黑暗中发出微光，瞳孔是垂直的裂缝，充满冷血动物的冷酷。巨大的口部能完全张开，露出满口倒刺状的毒牙，毒牙呈深紫色，不断滴落腐蚀性唾液。背部有对称排列的毒气腺体，这些腺体不断释放出绿色的毒雾。周围有飘浮的毒雾，在它的身体周围形成朦胧的绿色光晕。整体色调为深绿和毒紫，氛围阴森、腐败、有毒物弥漫的窒息感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景为剧毒沼泽的核心区域——沼泽最深处，充满腐烂植物、有毒气体。背景虚化突出生物主体。`,
    
    steel_colossus: `超写实风格，1024x1536竖屏立绘，废土末世世界观。废弃的军事要塞深处，一台古老的战争机甲仍在执行它最后的命令。人形机甲形态，约6米高，像一座行走的废弃工厂。全身装甲已严重锈蚀，铁锈和苔藓覆盖了大部分表面，但仍在缓慢地行走和战斗。头部是残破的驾驶舱，面罩玻璃已经碎裂。两只红色的探照灯代替了眼睛，光芒闪烁不定，像是随时会熄灭的残烛。胸腔中央有一个暗红色的能量核心在脉动，光芒忽明忽暗，像垂死的心跳。右臂是一套残破的导弹发射器，发射管已经变形扭曲。左臂是巨大的机械爪，爪子残缺不全。背部有断裂的能量管道，不断喷出蒸汽和火花。整体色调为深灰和暗红，氛围沉重、压抑、有战争遗留的残骸感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景为钢铁要塞的核心区域——废弃的军事基地，充满锈蚀的武器残骸。背景虚化突出生物主体。`,
    
    frost_dragon: `超写实风格，1024x1536竖屏立绘，废土末世世界观。冰封高原的最高峰，一头上古巨龙的遗骸正在重新苏醒。巨龙形态，约8米翼展，像一座冰封的雪山。全身覆盖着纯白与冰蓝相间的鳞片，鳞片呈半透明状，内部有冰晶结构在光线中闪烁。龙头狭长而威严，冰蓝色的鳞片覆盖着头部每个角落。两只眼睛是深蓝色的冰晶结构，能发射冰冻射线，眼眶周围有白色的霜花堆积。一对巨大的龙角由凝固的冰晶构成，顶端不断释放出冷气。双翼由冰晶构成的骨架支撑，翼膜是半透明的冰层。背脊有一排尖锐的冰刺。尾巴是巨大的冰锥，呈螺旋状。呼吸时喷出白色的冻气。周围有飘浮的冰晶雪花。整体色调为冰蓝和纯白，氛围寒冷、威严、有上古巨龙的压迫感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景为冰封高原的核心区域——冰雪覆盖的山峰。背景虚化突出生物主体。`,
    
    lava_dragon: `超写实风格，1024x1536竖屏立绘，废土末世世界观。炽热火山的最深处，熔岩池中有什么东西正在苏醒。巨龙形态，约7米长，由流动的熔岩和凝固的火山岩构成。身体核心是炽热的白金色火焰，从裂缝中透出，照亮周围的一切。龙头由凝固的火山岩构成，但岩浆不断从眼眶、嘴部和裂缝中涌出。两只眼睛是两团永不熄灭的金色火焰。口中能喷出炽热的龙息。双角由凝固的熔岩构成，顶端有火焰在跳动。背脊有排列成行的火焰喷口。四肢由凝固的岩浆构成，表面有龟裂的纹理，从裂缝中透出炽热的光芒。尾巴是流动的熔岩流。周围地面因高温而呈现红黑色，处于半熔融状态。整体色调为熔岩红和暗金，氛围炽热、毁灭、有火焰之王的威严感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景为炽热火山的核心区域——熔岩湖边缘。背景虚化突出生物主体。`,
    
    ancient_tree: `超写实风格，1024x1536竖屏立绘，废土末世世界观。幽暗森林的最深处，一棵活了几千年的古树终于展现出了它的真正形态。巨型树人形态，约10米高，由无数藤蔓、树枝和扭曲的树根构成。躯干是一棵巨大的空心古树，内部燃烧着幽绿色的鬼火。面部由扭曲的树枝形成，似笑非笑的表情永远定格在脸上。两个眼眶是两团幽幽的绿色磷火。树冠是无数藤蔓交织而成，遮蔽了天空。无数藤蔓从身体各部位伸出，像触手一样蠕动。背部有巨大的树冠结构。根系在地面蔓延。整体色调为暗绿和幽绿，氛围诡异、恐怖、有被自然吞噬的绝望感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景为幽暗森林的核心区域——被植物完全覆盖的废墟。背景虚化突出生物主体。`,
    
    mirage_lord: `超写实风格，1024x1536竖屏立绘，废土末世世界观。沙漠荒原的深处，蜃景开始扭曲，一位不属于这个世界的神秘存在显现。人形虚影形态，约3米高，身体呈半透明状，由流动的金色沙尘和热浪构成。身体轮廓不断波动和扭曲，像是由无数沙粒组成的幻影。面部模糊，只有轮廓隐约可见，但两只琥珀色的眼睛格外清晰，眼眸深邃而古老。长发由流动的沙粒组成。双臂是两条流动的沙流，能在瞬间化为任何形态。身体周围有蜃景幻象环绕，显示出沙漠中不存在的美丽绿洲。背后有若隐若现的蜃景宫殿虚影。地面因热浪而扭曲。整体色调为金色和琥珀色，氛围虚幻、神秘、有海市蜃楼的不真实感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景为沙漠荒原的核心区域——金色沙海。背景虚化突出生物主体。`,
    
    sea_leviathan: `超写实风格，1024x1536竖屏立绘，废土末世世界观。沉没都市的最深处，曾经的海洋霸主正在巡视它的水下王国。巨型鲨鱼形态，约12米长，深蓝色的皮肤上有电弧在其上游走。身体与沉没建筑的残骸融合，背部生长着破碎的玻璃幕墙、扭曲的钢筋和锈蚀的管道。头部呈流线型但布满建筑残骸。一只眼睛是沉没都市的路灯，发出幽蓝色的冷光；另一只眼睛已经破损。口部巨大，满是生锈的金属碎片般的牙齿。鳍上有被海藻缠绕的沉没汽车残骸。尾巴是一条由电缆和管道构成的机械鞭。周围有发光的深海生物跟随。整体色调为深蓝和金属银，氛围压抑、深邃、有被遗忘的水下王国感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景为深海沉城的核心区域——沉没的摩天楼。背景虚化突出生物主体。`,
    
    matrix_mother: `超写实风格，1024x1536竖屏立绘，废土末世世界观。机械迷宫的最核心区域，一台觉醒的超级计算机将入侵者视为需要清除的病毒。巨型立方体结构，约15米高，由无数服务器机柜堆叠而成。表面有无数闪烁的LED屏幕和指示灯，红色、绿色、蓝色的光芒在黑暗中不断闪烁。正面是一个巨大的全息投影球体，显示着不断变化的数据流、代码和界面元素。立方体四角是重型的传感器阵列，发出红色扫描光。底部是庞大的电力和数据接口。顶部有散热风扇在缓慢旋转。四角有重型的武器系统——导弹发射器、激光炮。周围有无数小型无人机和机械臂环绕。整体色调为深蓝和暗红，氛围冰冷、压迫、有AI觉醒的恐怖感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景为机械迷宫的核心区域——堆叠的服务器机柜。背景虚化突出生物主体。`,
    
    void_herald: `超写实风格，1024x1536竖屏立绘，废土末世世界观。虚空裂隙的核心，一位来自异次元的信使正在穿越维度的壁垒。人形异次元生物，约4米高，身体呈不稳定状态，由黑色和紫色的虚空能量构成。身体的边缘不断崩解和重组。面部是一张不断变化的脸，时而狰狞，时而空洞，时而扭曲成不可能的几何形状。两只眼睛是两个白色的虚空裂隙，散发出刺眼的白光。双臂过长，指尖是尖锐的虚空碎片，在空气中划过时留下黑色的裂痕。身体表面偶尔闪过其他维度的影像。背后有一对由纯能量构成的不完整翅膀，翅膀边缘不断崩解和重组。周围空间不断扭曲。整体色调为暗紫和虚空黑，氛围诡异、不安、有维度崩塌的超现实感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景为虚空裂隙的核心区域——扭曲的空间。背景虚化突出生物主体。`
  };
  
  return prompts[data.name] || `超写实风格，1024x1536竖屏立绘，废土末世世界观。${data.name}。整体色调为${elementColors[data.element] || '深色'}。强调高分辨率，电影质感，超现实写实风格，摄影师风格。背景虚化突出生物主体。`;
}

async function generateBoss(portraitId, data) {
  const targetPath = path.join(WILD_BOSS_DIR, `${portraitId}.png`);
  
  if (fs.existsSync(targetPath)) {
    return { skipped: true };
  }
  
  try {
    const workflow = readJson(WORKFLOW_PATH);
    const newWorkflow = {};
    
    for (const [key, node] of Object.entries(workflow)) {
      newWorkflow[key] = {
        class_type: node.class_type,
        inputs: { ...node.inputs }
      };
      const inputs = newWorkflow[key].inputs;
      
      if (key === '57:27' && inputs.text !== undefined) {
        inputs.text = getPrompt(data);
      }
      
      if (key === '9' && inputs.filename_prefix !== undefined) {
        inputs.filename_prefix = portraitId;
      }
      
      if (key === '57:13') {
        if (inputs.width !== undefined) inputs.width = WIDTH;
        if (inputs.height !== undefined) inputs.height = HEIGHT;
      }
    }
    
    console.log(`  ⏳ 提交任务...`);
    const promptId = await submitPrompt(newWorkflow);
    console.log(`  ⏳ 等待生成...`);
    const history = await waitForCompletion(promptId);
    const images = getImages(history);
    
    if (images.length > 0) {
      if (copyImage(images[0], targetPath)) {
        return { success: true };
      }
    }
    
    return { success: false, error: '无输出图片' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔮 野外Boss立绘生成器');
  console.log('='.repeat(60) + '\n');
  
  const mapping = readJson(MAPPING_PATH);
  const wildBosses = Object.keys(mapping).filter(id => mapping[id].type === 'wildBoss');
  
  console.log(`📊 共 ${wildBosses.length} 个野外Boss\n`);
  
  let success = 0, failed = 0, skipped = 0;
  
  for (let i = 0; i < wildBosses.length; i++) {
    const portraitId = wildBosses[i];
    const data = mapping[portraitId];
    
    console.log(`\n[${i + 1}/${wildBosses.length}] ${portraitId} (${data.name})`);
    
    const result = await generateBoss(portraitId, data);
    
    if (result.skipped) {
      console.log('  ⏭️  跳过（已存在）');
      skipped++;
    } else if (result.success) {
      console.log('  ✅ 成功');
      success++;
    } else {
      console.log(`  ❌ 失败: ${result.error}`);
      failed++;
    }
    
    if (i < wildBosses.length - 1 && !result.skipped) {
      await sleep(1000);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ 完成: 成功 ${success} | 失败 ${failed} | 跳过 ${skipped}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
