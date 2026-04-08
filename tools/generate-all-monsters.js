#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * 怪物立绘批量生成器
 * 使用用户提供的 image_z_image_turbo.json 工作流
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const COMFYUI_HOST = '127.0.0.1';
const COMFYUI_PORT = 8188;
const WORKFLOW_PATH = path.join(__dirname, '..', 'image_z_image_turbo.json');
const MAPPING_PATH = path.join(__dirname, 'mutant_portrait_mapping.json');
const OUTPUT_BASE = path.join(__dirname, '..', 'assets', 'images', 'characters');
const WILD_BOSS_DIR = path.join(OUTPUT_BASE, 'wild_boss');
const MUTANT_BOSS_DIR = path.join(OUTPUT_BASE, 'mutant', 'boss');
const MUTANT_DIR = path.join(OUTPUT_BASE, 'mutant');
const COMFYUI_OUTPUT = 'C:\\Users\\mechrevo\\AppData\\Roaming\\ComfyUI\\output';

const WIDTH = 1024;
const HEIGHT = 1536;

// 读取文件
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// API请求
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

// 提交任务
async function submitPrompt(prompt) {
  const res = await apiRequest('POST', '/prompt', { prompt });
  if (!res.prompt_id) throw new Error('提交失败');
  return res.prompt_id;
}

// 等待完成
async function waitForCompletion(promptId, timeout = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const history = await apiRequest('GET', `/history/${promptId}`);
    if (history[promptId]) {
      const status = history[promptId].status;
      if (status && status.exec_error) throw new Error('执行错误');
      return history[promptId];
    }
    await sleep(2000);
  }
  throw new Error('超时');
}

// 工具函数
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 获取输出图片
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

// 复制图片
function copyImage(image, targetPath) {
  const src = path.join(COMFYUI_OUTPUT, image.subfolder || '', image.filename);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, targetPath);
    return true;
  }
  return false;
}

// 获取详细提示词
function getPrompt(mapping, portraitId) {
  const data = mapping[portraitId];
  const prompts = readJson(MAPPING_PATH.replace('.json', '.json'));
  
  // 从文档中提取提示词
  const docPath = path.join(__dirname, '..', 'docs', '提示词', '变异生物与野外Boss文生图提示词.md');
  if (fs.existsSync(docPath)) {
    const doc = fs.readFileSync(docPath, 'utf-8');
    
    // 查找对应的Boss或变异生物提示词
    let searchName = data.name;
    if (data.type === 'wildBoss') {
      searchName = `Boss ${portraitId.replace('WILDBOSS_', '')}：`;
    } else if (data.type === 'finalBoss') {
      searchName = '终焉之核·奥米茄';
    } else {
      searchName = data.name;
    }
    
    // 简化：直接生成基础提示词
  }
  
  // 生成提示词
  const elementColors = {
    dark: '深紫/黑/暗红',
    water: '深蓝/青/冰蓝',
    fire: '赤红/橙/熔岩色',
    wind: '翠绿/黄绿/荧光绿',
    light: '金/白/彩虹色'
  };
  
  const mapNames = {
    1: '辐射废墟', 2: '有毒沼泽', 3: '钢铁要塞', 4: '冰封高原', 5: '炽热火山',
    6: '幽暗森林', 7: '沙漠荒原', 8: '深海沉城', 9: '机械迷宫', 10: '虚空裂隙'
  };
  
  let prompt = `超写实风格，1024x1536竖屏立绘，废土末世世界观。`;
  
  if (data.type === 'wildBoss') {
    prompt += `核战后的废墟中，一头由核辐射造就的巨型变异生物。${data.name}。体型巨大，约5米高，全身覆盖着深灰色的变异皮肤，皮肤表面布满发光的辐射裂纹。两只眼睛从正常的眼睛变异为燃烧着幽绿色火焰的空洞。背脊上有排列整齐的辐射结晶簇。整体色调为${elementColors[data.element] || '深色'}，低饱和度的深灰色变异生物背景中，高饱和度的辐射绿裂纹光芒形成视觉焦点。氛围压迫、恐怖、有末日废土的荒凉感。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`;
  } else if (data.type === 'finalBoss') {
    prompt += `融合技术的创造者，唯一成功融合所有元素的完美存在，${data.name}。外形是完美的人形男性，约2米高，体型健美而匀称。冷白皮的肌肤上隐隐有淡淡的七彩流光。身体周围环绕着五种元素的能量光环——水、火、风、光、暗。整体色调为纯白和七彩，氛围神圣、威严、压迫。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`;
  } else {
    const mapName = mapNames[data.mapId] || '未知地图';
    const profNames = { tank: '坦克', dps: '输出', support: '辅助' };
    
    prompt += `${mapName}的变异${profNames[data.profession] || '战斗'}生物，${data.name}。约1-2米高，全身覆盖着${elementColors[data.element] || '深色'}的变异特征。废土末世氛围，背景虚化突出生物主体。强调高分辨率，电影质感，超现实写实风格。`;
  }
  
  return prompt;
}

// 生成单个立绘
async function generateOne(portraitId, mapping) {
  const data = mapping[portraitId];
  
  // 确定输出目录
  let targetDir;
  if (data.type === 'wildBoss') targetDir = WILD_BOSS_DIR;
  else if (data.type === 'finalBoss') targetDir = MUTANT_BOSS_DIR;
  else targetDir = MUTANT_DIR;
  
  const targetPath = path.join(targetDir, `${portraitId}.png`);
  
  // 跳过已存在的
  if (fs.existsSync(targetPath)) {
    return { skipped: true };
  }
  
  try {
    // 加载工作流
    const workflow = readJson(WORKFLOW_PATH);
    
    // 构建工作流
    const newWorkflow = {};
    for (const [key, node] of Object.entries(workflow)) {
      newWorkflow[key] = {
        class_type: node.class_type,
        inputs: { ...node.inputs }
      };
      const inputs = newWorkflow[key].inputs;
      
      // 修改提示词
      if (key === '57:27' && inputs.text !== undefined) {
        inputs.text = getPrompt(mapping, portraitId);
      }
      
      // 修改文件名
      if (key === '9' && inputs.filename_prefix !== undefined) {
        inputs.filename_prefix = portraitId;
      }
      
      // 修改分辨率
      if (key === '57:13') {
        if (inputs.width !== undefined) inputs.width = WIDTH;
        if (inputs.height !== undefined) inputs.height = HEIGHT;
      }
    }
    
    // 提交
    const promptId = await submitPrompt(newWorkflow);
    
    // 等待
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

// 主函数
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔮 怪物立绘批量生成器');
  console.log('='.repeat(60));
  
  // 加载数据
  const mapping = readJson(MAPPING_PATH);
  const portraitIds = Object.keys(mapping);
  
  console.log(`\n📊 总计: ${portraitIds.length} 个立绘`);
  console.log('- 野外Boss: ' + portraitIds.filter(id => mapping[id].type === 'wildBoss').length);
  console.log('- 最终Boss: ' + portraitIds.filter(id => mapping[id].type === 'finalBoss').length);
  console.log('- 变异生物: ' + portraitIds.filter(id => mapping[id].type === 'mutant').length);
  console.log('\n' + '-'.repeat(60));
  
  let success = 0, failed = 0, skipped = 0;
  
  for (let i = 0; i < portraitIds.length; i++) {
    const portraitId = portraitIds[i];
    const data = mapping[portraitId];
    const progress = Math.round((i + 1) / portraitIds.length * 100);
    
    console.log(`\n[${i + 1}/${portraitIds.length}] ${progress}% | ${portraitId} (${data.name})`);
    
    const result = await generateOne(portraitId, mapping);
    
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
    
    // 避免过快
    if (i < portraitIds.length - 1 && !result.skipped) {
      await sleep(1000);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 生成完成!');
  console.log(`   成功: ${success} | 失败: ${failed} | 跳过: ${skipped}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
