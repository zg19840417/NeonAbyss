#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * 变异生物立绘生成器 v2 - 增强版提示词
 * 扩写内容：外貌、形态、环境描述，统一元素主体色
 * 全身特写占据大部分卡面
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const COMFYUI_HOST = '127.0.0.1';
const COMFYUI_PORT = 8188;
const WORKFLOW_PATH = path.join(__dirname, '..', 'image_z_image_turbo.json');
const MAPPING_PATH = path.join(__dirname, 'mutant_portrait_mapping.json');
const MUTANT_DIR = path.join(__dirname, '..', 'assets', 'images', 'characters', 'mutant');
const COMFYUI_OUTPUT = 'D:\\ComfyUI\\ComfyUI-aki-v2\\ComfyUI\\output';

const WIDTH = 1024;
const HEIGHT = 1536;

// 元素颜色配置
const ELEMENT_COLORS = {
  dark: { primary: '深紫和暗红', secondary: '灰黑和腐蚀绿', glow: '幽绿色', accent: '暗紫色' },
  water: { primary: '深蓝和冰蓝', secondary: '海青和紫罗', glow: '冰蓝色', accent: '湖蓝色' },
  fire: { primary: '熔岩红和火焰橙', secondary: '灰烬黑和焦褐', glow: '金黄色', accent: '火红色' },
  wind: { primary: '翠绿和黄绿', secondary: '荧光绿和草绿', glow: '风青色', accent: '碧绿色' },
  light: { primary: '金黄和纯白', secondary: '彩虹和星尘', glow: '耀金色', accent: '天使白' }
};

// 地图环境配置
const MAP_ENVIRONMENTS = {
  1: { name: '辐射废墟', env: '核战后的废墟旷野', details: '巨大的弹坑，被核爆摧毁的建筑残骸，飘浮的辐射尘埃，天空中扭曲的辐射云层发出诡异的绿色荧光，地面是龟裂的黄土被辐射污染成灰绿色' },
  2: { name: '有毒沼泽', env: '有毒沼泽的最深处', details: '墨绿色的沼泽水漂浮着腐烂的植物残骸，枯死的扭曲树木挂满黑色藤蔓，天空被毒雾笼罩呈病态黄色，到处是被淹没的生物骨架和汽车残骸' },
  3: { name: '钢铁要塞', env: '废弃军事要塞的废墟', details: '倒塌的混凝土掩体散落着锈蚀铁丝网，废弃的军用车辆残骸——坦克炮塔歪斜、装甲车被炸成两半，天空是永久的阴霾' },
  4: { name: '冰封高原', env: '冰封高原的旷野', details: '一望无际的冰雪平原反射刺眼阳光，巨大的冰柱从地面突起，远处的雪山连绵起伏，地面有巨大的裂缝冰层下的湖水呈深蓝色' },
  5: { name: '炽热火山', env: '炽热火山山坡', details: '凝固的熔岩流像灰色河流蔓延，表面是龟裂的灰色外壳，到处是火山口和冒烟裂缝，空气中弥漫硫磺气味，天空被火山灰云层遮蔽' },
  6: { name: '幽暗森林', env: '幽暗森林的深处', details: '参天巨树遮蔽天空只有零星光线透入，地面覆盖厚厚腐殖土，到处缠绕的藤蔓和发光的菌丝网络，空气中飘浮着发光孢子像微型星星' },
  7: { name: '沙漠荒原', env: '沙漠荒原的深处', details: '一望无际的金色沙丘延绵到地平线，枯死的沙漠植物扭曲枯木，远处的地平线在热浪中不断波动，到处是被风沙掩埋的废墟残骸' },
  8: { name: '深海沉城', env: '沉没都市的街道', details: '被洪水淹没的城市漂浮着汽车残骸，摩天楼残骸从水面伸出扭曲霓虹灯仍在闪烁，街道散落着被水浸泡的生活用品，水很浑浊呈深蓝色' },
  9: { name: '机械迷宫', env: '机械迷宫的深处', details: '巨大的服务器机房排列成行延伸到黑暗中，地面是冷却液浅池反射指示灯，到处是杂乱电缆管道，空气弥漫臭氧气味和电子元件热量' },
  10: { name: '虚空裂隙', env: '虚空裂隙的地表', details: '扭曲空间地表像破碎镜子龟裂，裂缝中透出深紫色虚空能量，到处漂浮维度碎片像破碎镜子反射不存在光线，空间不稳定到处扭曲' }
};

// 职业形态配置
const PROFESSION_FORMS = {
  tank: { shape: '体型壮硕敦厚', features: '覆盖厚重的外壳或装甲', movement: '缓慢而沉重地移动', combat: '近战防御为主' },
  dps: { shape: '体型修长敏捷', features: '拥有锋利的爪牙或武器', movement: '快速而灵活地移动', combat: '远程或近战爆发输出' },
  support: { shape: '形态轻盈优雅', features: '拥有能量光环或辅助结构', movement: '飘浮或轻盈地移动', combat: '辅助增益或控制为主' }
};

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

// 生成增强版变异生物提示词
function generateMutantPrompt(data) {
  const mapId = data.mapId;
  const element = data.element;
  const profession = data.profession;
  const name = data.name;
  
  const map = MAP_ENVIRONMENTS[mapId];
  const colors = ELEMENT_COLORS[element];
  const form = PROFESSION_FORMS[profession];
  
  // 根据元素生成具体外貌描述
  const elementAppearance = getElementAppearance(element, name);
  
  // 根据职业生成具体形态描述
  const professionAppearance = getProfessionAppearance(profession, element, name);
  
  return `超写实风格，1024x1536竖屏全身立绘，废土末世世界观，近距离BOSS级生物特写。

【主体生物 - 全身像】
${map.env}，一只变异${profession === 'tank' ? '坦克型' : profession === 'dps' ? '输出型' : '辅助型'}生物——${name}。${form.shape}，约1-2米高。${elementAppearance}。${professionAppearance}。全身${colors.primary}为主色调，${colors.secondary}为辅助色，身体边缘有${colors.glow}的光芒环绕。

【外貌细节】
从这个近距离可以看到生物的每一处细节——${getDetailedAppearance(element, profession)}。皮肤/外壳表面有${colors.accent}的纹理和纹路，在光线下反射出金属光泽或生物光泽。整体给人${getVibe(element)}的感觉。

【元素特征】
身体周围环绕着${colors.primary}的能量场${profession === 'support' ? '为友军提供增益' : profession === 'tank' ? '形成防护屏障' : '聚集攻击能量'}。能量在身体表面流动，形成可见的${colors.glow}光纹。

【环境互动】
背景是${map.env}——${map.details}。所有背景元素都处于极度虚化中，只能看到模糊的色块作为陪衬。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块。全身像占据画面的90%以上空间，生物的每个细节都清晰可见，是绝对的视觉焦点。焦点在生物的面部和核心特征上。整体色调为${colors.primary}，背景虚化为模糊的环境色块。氛围${getAtmosphere(element)}。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`;
}

function getElementAppearance(element, name) {
  const appearances = {
    dark: '皮肤呈深灰色或暗紫色，布满裂纹和腐蚀痕迹，眼睛发出幽绿色的诡异光芒，身体周围有暗影能量环绕',
    water: '皮肤呈深蓝色或冰蓝色，覆盖着鳞片或冰晶结构，眼睛发出冰蓝色的冷光，身体周围有水汽蒸腾或冰霜凝结',
    fire: '皮肤呈熔岩红色或焦黑色，表面有熔岩流动的纹理，眼睛发出金黄色的炽热光芒，身体周围有火焰燃烧或热气蒸腾',
    wind: '身体呈翠绿色或黄绿色，覆盖着藤蔓或叶片结构，眼睛发出风青色的光芒，身体周围有气流环绕或叶片飘舞',
    light: '皮肤呈金黄色或纯白色，身体散发着耀眼的金色光芒，眼睛发出天使白的神圣光芒，身体周围有彩虹光晕环绕'
  };
  return appearances[element] || appearances.dark;
}

function getProfessionAppearance(profession, element, name) {
  const appearances = {
    tank: {
      dark: '拥有厚重的骨质外壳或金属装甲覆盖全身，关节处有尖锐的骨刺突出，四肢粗壮有力',
      water: '拥有厚实的冰甲或水甲包裹全身，甲壳上有水流循环的纹理，身形敦实稳健',
      fire: '拥有熔岩凝固的厚重外壳，表面有岩浆流动的裂缝，体型笨重但防御力惊人',
      wind: '拥有藤蔓编织的厚实甲壳，表面有叶片层层覆盖，根系深入地面汲取力量',
      light: '拥有金色光芒凝聚的圣甲，表面有神圣符文流转，散发着温暖的光芒'
    },
    dps: {
      dark: '身体修长敏捷，拥有锋利的爪牙或能量刃，四肢细长但爆发力惊人，动作迅速致命',
      water: '身体流线型适合快速移动，拥有尖锐的冰刺或水刃，尾部可能有致命的毒刺',
      fire: '身体轻盈但充满爆发力，拥有火焰凝聚的利爪或翅膀，能进行毁灭性的打击',
      wind: '身体轻盈如风，拥有锋利的叶片刃或风刃，行动轨迹难以预测',
      light: '身体优雅修长，拥有光之刃或神圣爪击，攻击带有神圣灼烧效果'
    },
    support: {
      dark: '身体散发幽暗能量，拥有能量光环或触手状结构，能为友军提供暗影护盾',
      water: '身体透明或半透明，拥有水波纹路的光环，能为友军提供治疗和恢复',
      fire: '身体炽热明亮，拥有火焰能量构成的光环，能为友军提供热抗性和增益',
      wind: '身体轻盈飘渺，拥有风之气流环绕，能为友军提供加速和护盾',
      light: '身体神圣耀眼，拥有神圣光环和羽翼结构，能为友军提供圣光祝福'
    }
  };
  return appearances[profession][element];
}

function getDetailedAppearance(element, profession) {
  const details = {
    dark: '裂纹中透出幽绿色的光芒，像是黑暗中的鬼火在跳动',
    water: '鳞片或冰晶在光线下折射出七彩的光芒，表面有水汽凝结',
    fire: '熔岩般的纹理在皮肤下流动，热量扭曲了周围的空气',
    wind: '叶片或藤蔓在无风中轻轻摇曳，散发着生命的气息',
    light: '光芒在皮肤表面流动，像是液化的星光'
  };
  return details[element];
}

function getVibe(element) {
  const vibes = {
    dark: '诡异、恐怖、压迫',
    water: '冰冷、神秘、深邃',
    fire: '炽热、毁灭、燃烧',
    wind: '轻盈、生机、自然',
    light: '神圣、温暖、希望'
  };
  return vibes[element];
}

function getAtmosphere(element) {
  const atmospheres = {
    dark: '诡异、恐怖、有末日废土的荒凉感',
    water: '冰冷、深邃、有极寒的压迫感',
    fire: '炽热、毁灭、有火焰之王的威严感',
    wind: '轻盈、生机、有自然生命的神奇感',
    light: '神圣、温暖、有希望的光明感'
  };
  return atmospheres[element];
}

async function generateMutant(portraitId, data) {
  const targetPath = path.join(MUTANT_DIR, `${portraitId}.png`);
  
  // 删除旧版本
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    console.log('  🗑️  删除旧版本，准备重新生成...');
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
        inputs.text = generateMutantPrompt(data);
      }
      
      if (key === '9' && inputs.filename_prefix !== undefined) {
        inputs.filename_prefix = portraitId;
      }
      
      if (key === '57:13') {
        if (inputs.width !== undefined) inputs.width = WIDTH;
        if (inputs.height !== undefined) inputs.height = HEIGHT;
      }
    }
    
    console.log('  ⏳ 提交任务...');
    const promptId = await submitPrompt(newWorkflow);
    console.log('  ⏳ 等待生成...');
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
  console.log('🔮 变异生物立绘生成器 v2 - 增强版提示词');
  console.log('='.repeat(60) + '\n');
  
  const mapping = readJson(MAPPING_PATH);
  const mutants = Object.keys(mapping).filter(id => mapping[id].type === 'mutant');
  
  console.log(`📊 共 ${mutants.length} 个变异生物\n`);
  
  let success = 0, failed = 0;
  
  for (let i = 0; i < mutants.length; i++) {
    const portraitId = mutants[i];
    const data = mapping[portraitId];
    
    console.log(`\n[${i + 1}/${mutants.length}] ${portraitId} (${data.name})`);
    
    const result = await generateMutant(portraitId, data);
    
    if (result.success) {
      console.log('  ✅ 成功');
      success++;
    } else {
      console.log(`  ❌ 失败: ${result.error}`);
      failed++;
    }
    
    // 进度显示
    const progress = Math.round((i + 1) / mutants.length * 100);
    console.log(`  📊 进度: ${progress}% | 成功: ${success} | 失败: ${failed}`);
    
    if (i < mutants.length - 1) {
      await sleep(1000);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ 完成: 成功 ${success} | 失败 ${failed}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
