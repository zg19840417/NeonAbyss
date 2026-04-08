#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * 最终Boss立绘生成器 - 终焉之核·奥米茄
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const COMFYUI_HOST = '127.0.0.1';
const COMFYUI_PORT = 8188;
const WORKFLOW_PATH = path.join(__dirname, '..', 'image_z_image_turbo.json');
const MAPPING_PATH = path.join(__dirname, 'mutant_portrait_mapping.json');
const MUTANT_BOSS_DIR = path.join(__dirname, '..', 'assets', 'images', 'characters', 'mutant', 'boss');
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
  return `超写实风格，1024x1536竖屏立绘，废土末世世界观，近距离BOSS特写浅景深。

【主体特写】
这是融合技术的创造者，唯一成功融合所有元素的完美存在——终焉之核·奥米茄，近距离面部特写。外形是完美的人形男性，约2米高，体型健美而匀称，像是古希腊雕塑中走出的完美男性。冷白皮的肌肤上隐隐有淡淡的七彩流光，像钻石的折射，在不同角度呈现不同的色彩。身体悬浮在空中，周围空间不断因他的能量而扭曲。

【近景细节】
从这个距离可以看到肌肤上七彩流光的每一处细节——像是液化的星光在皮肤下流动，从不同的角度看呈现不同的色彩。面部俊美而冷漠，线条如雕塑般完美，眼神深邃而悲悯。眉毛是完美的弧形，睫毛长而浓密。头发为纯白色，长发及腰，发丝间流动着彩虹色的光芒，像是被液化的星光。

【元素光环】
身体周围环绕着五种元素的能量光环——每种元素都在他身上有明显的融合迹象：
水元素：背后有水波纹路般的纹身，纹身中隐约可见流动的水流，能召唤和控制水。
火元素：胸口有火焰图腾，温度从胸口散发，使周围的空气扭曲变形，能操控火焰。
风元素：四肢有藤蔓般的风纹，这些风纹像纹身一样刻在皮肤上，能操控气流。
暗元素：身体轮廓时有虚空裂隙闪烁，裂隙中透出深邃的黑暗，能穿越空间。
光元素：双眼在黑暗中发出耀眼的金色光芒，像是两颗微型太阳，占据画面的焦点。

【服装与细节】
身穿由五种元素能量编织成的长袍，长袍的材质看起来像是流动的液体金属，不断变换着颜色和形态。背后有五色光环，每种颜色代表一种元素，在黑暗中发出耀眼的光芒。

【背景环境】
背景是虚空裂隙的最深处——扭曲的空间，地表像破碎的镜子一样龟裂，裂缝中透出深紫色的虚空能量。到处是漂浮的维度碎片，像破碎的镜子碎片反射着不存在的光。空间在这里变得不稳定，一切都因奥米茄的能量而颤抖。远处有被吞噬的世界影像若隐若现。所有背景元素都处于极度的虚化中，只能看到模糊的紫色和七彩光芒。

【景深与构图】
超浅景深，背景虚化到几乎只剩色块。Boss主体占据画面的80%以上空间，是绝对的视觉焦点。焦点在Boss的双眼和元素光环上。整体色调为纯白和七彩流光，背景虚化为紫色和五彩的模糊色块。氛围神圣、威严、压迫。强调高分辨率，电影质感，超现实写实风格，摄影师风格。`;
}

async function generateFinalBoss() {
  const portraitId = 'omega_core';
  const targetPath = path.join(MUTANT_BOSS_DIR, `${portraitId}.png`);
  
  const mapping = readJson(MAPPING_PATH);
  const data = mapping[portraitId];
  
  console.log(`\n🎯 最终Boss: ${data.name}`);
  
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
    
    console.log('  ⏳ 提交任务...');
    const promptId = await submitPrompt(newWorkflow);
    console.log('  ⏳ 等待生成（可能需要较长时间）...');
    const history = await waitForCompletion(promptId);
    const images = getImages(history);
    
    if (images.length > 0) {
      if (copyImage(images[0], targetPath)) {
        console.log('  ✅ 生成成功！');
        return { success: true };
      }
    }
    
    console.log('  ❌ 失败: 无输出图片');
    return { success: false };
  } catch (e) {
    console.log(`  ❌ 失败: ${e.message}`);
    return { success: false, error: e.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔮 最终Boss立绘生成器 - 终焉之核·奥米茄');
  console.log('='.repeat(60));
  
  const result = await generateFinalBoss();
  
  console.log('\n' + '='.repeat(60));
  if (result.success) {
    console.log('✅ 最终Boss立绘生成完成！');
  } else {
    console.log('❌ 生成失败');
  }
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
