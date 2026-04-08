#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * 变异生物与Boss立绘批量生成脚本
 * 使用ComfyUI API生成变异生物和Boss立绘
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const COMFYUI_HOST = '127.0.0.1';
const COMFYUI_PORT = 8188;
const MAPPING_PATH = path.join(__dirname, 'mutant_portrait_mapping.json');
const OUTPUT_BASE = path.join(__dirname, '..', 'assets', 'images', 'characters');
const FUSION_DIR = path.join(OUTPUT_BASE, 'fusion');
const MUTANT_DIR = path.join(OUTPUT_BASE, 'mutant');
const MUTANT_BOSS_DIR = path.join(MUTANT_DIR, 'boss');
const WILD_BOSS_DIR = path.join(OUTPUT_BASE, 'wild_boss');
const COMFYUI_OUTPUT = 'C:\\Users\\mechrevo\\AppData\\Roaming\\ComfyUI\\output';

let mapping = {};
let queue = [];
let current = 0;
let successCount = 0;
let errorCount = 0;

// 读取映射表
function loadMapping() {
  if (fs.existsSync(MAPPING_PATH)) {
    mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
    console.log(`✓ 已加载映射表，包含 ${Object.keys(mapping).length} 个立绘`);
  } else {
    console.error('❌ 映射表文件不存在:', MAPPING_PATH);
    process.exit(1);
  }
}

// 初始化队列
function initQueue(type) {
  queue = Object.keys(mapping).filter(key => mapping[key].type === type);
  console.log(`\n📋 队列初始化完成: ${queue.length} 个${type === 'wildBoss' ? '野外Boss' : type === 'finalBoss' ? '最终Boss' : '变异生物'}`);
  console.log('=' .repeat(60));
}

// ComfyUI API请求
function comfyuiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: COMFYUI_HOST,
      port: COMFYUI_PORT,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// 提交ComfyUI任务
async function submitTask(prompt) {
  const response = await comfyuiRequest('POST', '/prompt', { prompt });
  return response;
}

// 轮询任务状态
async function pollTask(promptId, maxWait = 300000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      const history = await comfyuiRequest('GET', `/history/${promptId}`);
      
      if (history[promptId]) {
        const status = history[promptId].status;
        if (status.exec_error) {
          throw new Error('执行错误');
        }
        return history[promptId];
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      if (e.message !== '执行错误') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw e;
      }
    }
  }
  
  throw new Error('任务超时');
}

// 获取输出图片
function getOutputImages(history) {
  const images = [];
  const outputs = history.outputs;
  
  for (const nodeId in outputs) {
    const nodeOutput = outputs[nodeId];
    if (nodeOutput.images) {
      for (const image of nodeOutput.images) {
        images.push({
          filename: image.filename,
          subfolder: image.subfolder,
          type: image.type
        });
      }
    }
  }
  
  return images;
}

// 复制图片到目标目录
function copyImageToOutput(imageInfo, targetDir, portraitId) {
  const sourcePath = path.join(
    COMFYUI_OUTPUT,
    imageInfo.subfolder || '',
    imageInfo.filename
  );
  
  const targetPath = path.join(targetDir, `${portraitId}.png`);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    return true;
  } else {
    console.error(`   ⚠️ 源文件不存在: ${sourcePath}`);
    return false;
  }
}

// 生成单个立绘
async function generatePortrait(portraitId, data, targetDir) {
  console.log(`\n🎨 生成中: ${portraitId} (${data.name})`);
  console.log(`   类型: ${data.type}`);
  
  try {
    // 生成提示词
    const prompt = generatePrompt(portraitId, data);
    
    // 加载工作流
    const workflowPath = path.join(__dirname, '..', 'image_z_image_turbo.json');
    const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
    
    // 修改工作流参数
    const width = 1024;
    const height = 1536;
    const seed = Math.floor(Math.random() * 99999999999999);
    
    for (const [key, node] of Object.entries(workflow)) {
      workflow[key] = { class_type: node.class_type, inputs: { ...node.inputs } };
      const inputs = workflow[key].inputs;
      
      if (key === '57:27' && inputs.text !== undefined) {
        inputs.text = prompt;
      }
      if (key === '9' && inputs.filename_prefix !== undefined) {
        inputs.filename_prefix = `mutant_${portraitId}`;
      }
      if (key === '57:13') {
        if (inputs.width !== undefined) inputs.width = width;
        if (inputs.height !== undefined) inputs.height = height;
      }
      if (key === '57:3' && inputs.seed !== undefined) {
        inputs.seed = seed;
      }
    }
    
    // 提交任务
    const response = await submitTask(workflow);
    if (!response.prompt_id) {
      throw new Error('任务提交失败');
    }
    
    console.log(`   ⏳ 等待生成...`);
    
    // 轮询结果
    const history = await pollTask(response.prompt_id);
    const images = getOutputImages(history);
    
    if (images.length > 0) {
      const success = copyImageToOutput(images[0], targetDir, portraitId);
      if (success) {
        console.log(`   ✅ 成功保存: ${portraitId}.png`);
        return true;
      } else {
        console.error(`   ❌ 保存失败`);
        return false;
      }
    } else {
      console.error(`   ❌ 未找到输出图片`);
      return false;
    }
  } catch (e) {
    console.error(`   ❌ 生成失败: ${e.message}`);
    return false;
  }
}

// 生成提示词
function generatePrompt(portraitId, data) {
  const prompts = fs.readFileSync(
    path.join(__dirname, '..', 'docs', '提示词', '变异生物与野外Boss文生图提示词.md'),
    'utf-8'
  );
  
  // 根据类型查找对应的提示词
  let searchName = data.name;
  
  if (data.type === 'wildBoss') {
    searchName = `Boss ${portraitId.replace('WILDBOSS_', '')}：` + data.name;
  } else if (data.type === 'finalBoss') {
    searchName = '终焉之核·奥米茄';
  }
  
  // 简单提示词生成（基于映射表）
  const elementDesc = {
    dark: '深紫/黑/暗红',
    water: '深蓝/青/冰蓝',
    fire: '赤红/橙/熔岩色',
    wind: '翠绿/黄绿/荧光绿',
    light: '金/白/彩虹色'
  };
  
  let prompt = `超写实风格，1024x1536竖屏立绘，废土末世世界观。`;
  
  if (data.type === 'wildBoss') {
    prompt += `一头强大的变异生物，${data.name}。`;
  } else if (data.type === 'finalBoss') {
    prompt += `融合技术的创造者，${data.name}。`;
  } else {
    const mapNames = {
      1: '辐射废墟', 2: '有毒沼泽', 3: '钢铁要塞', 4: '冰封高原', 5: '炽热火山',
      6: '幽暗森林', 7: '沙漠荒原', 8: '深海沉城', 9: '机械迷宫', 10: '虚空裂隙'
    };
    const mapName = mapNames[data.mapId] || '未知地图';
    const profNames = { tank: '坦克', dps: '输出', support: '辅助' };
    const profName = profNames[data.profession] || '战斗';
    
    prompt += `${mapName}的变异${profName}生物，${data.name}。`;
  }
  
  prompt += `整体色调为${elementDesc[data.element] || '深色'}，废土末世氛围。`;
  prompt += `强调高分辨率，电影质感，超现实写实风格，摄影师风格。`;
  prompt += `背景虚化突出生物主体。`;
  
  return prompt;
}

// 批量生成
async function batchGenerate(type, maxConcurrent = 1) {
  initQueue(type);
  
  for (let i = 0; i < queue.length; i++) {
    const portraitId = queue[i];
    const data = mapping[portraitId];
    
    // 确定输出目录
    let targetDir;
    if (data.type === 'wildBoss') {
      targetDir = WILD_BOSS_DIR;
    } else if (data.type === 'finalBoss') {
      targetDir = MUTANT_BOSS_DIR;
    } else {
      targetDir = MUTANT_DIR;
    }
    
    // 检查是否已存在
    const targetPath = path.join(targetDir, `${portraitId}.png`);
    if (fs.existsSync(targetPath)) {
      console.log(`\n⏭️  跳过已存在: ${portraitId}.png`);
      continue;
    }
    
    const success = await generatePortrait(portraitId, data, targetDir);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // 进度显示
    const progress = Math.round((i + 1) / queue.length * 100);
    console.log(`\n📊 进度: ${i + 1}/${queue.length} (${progress}%) | 成功: ${successCount} | 失败: ${errorCount}`);
    
    // 避免请求过快
    if (i < queue.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// 主函数
async function main() {
  console.log('=' .repeat(60));
  console.log('🔮 变异生物与Boss立绘批量生成工具');
  console.log('=' .repeat(60));
  
  // 加载映射表
  loadMapping();
  
  // 获取命令行参数
  const args = process.argv.slice(2);
  const type = args[0] || 'all';
  
  if (type === 'wildBoss' || type === 'all') {
    console.log('\n' + '🎯 生成野外Boss立绘'.padEnd(60, '─'));
    await batchGenerate('wildBoss');
  }
  
  if (type === 'finalBoss' || type === 'all') {
    console.log('\n' + '🎯 生成最终Boss立绘'.padEnd(60, '─'));
    await batchGenerate('finalBoss');
  }
  
  if (type === 'mutant' || type === 'all') {
    console.log('\n' + '🎯 生成变异生物立绘'.padEnd(60, '─'));
    await batchGenerate('mutant');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ 生成完成！');
  console.log(`   成功: ${successCount}`);
  console.log(`   失败: ${errorCount}`);
  console.log('=' .repeat(60));
}

main().catch(console.error);
