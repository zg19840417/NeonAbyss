const http = require('http');
const fs = require('fs');
const path = require('path');

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
    "9": { inputs: { filename_prefix: `test_${Date.now()}`, images: ["57:8", 0] }, class_type: "SaveImage" }
  };
}

async function testWorkflow() {
  const workflow = buildZITWorkflow({
    positivePrompt: "test",
    width: 960,
    height: 1600,
    seed: 12345
  });
  
  console.log('测试修复后的工作流...');
  
  const postData = JSON.stringify({ prompt: workflow });
  
  const options = {
    hostname: config.comfyui.host,
    port: config.comfyui.port,
    path: '/prompt',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log('响应状态:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('响应数据:', data);
        resolve(JSON.parse(data));
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function checkHistory(promptId) {
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

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  try {
    const result = await testWorkflow();
    
    if (result.prompt_id) {
      console.log('\n任务提交成功！');
      console.log('Prompt ID:', result.prompt_id);
      
      console.log('\n等待生成完成...');
      for (let i = 0; i < 60; i++) {
        await wait(1000);
        const history = await checkHistory(result.prompt_id);
        if (history[result.prompt_id]?.status?.completed) {
          console.log('\n✓ 生成完成！');
          const outputs = history[result.prompt_id].outputs;
          for (const nodeId of Object.keys(outputs)) {
            if (outputs[nodeId].images) {
              console.log('图片:', outputs[nodeId].images);
            }
          }
          break;
        }
        if (i % 10 === 0) console.log(`等待中... (${i}s)`);
      }
    } else {
      console.log('\n✗ 任务提交失败');
    }
  } catch (e) {
    console.error('错误:', e);
  }
}

main();
