const http = require('http');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'comfyui-config.json'), 'utf-8'));

function buildZITWorkflow(options) {
  return {
    "57:28": { inputs: { unet_name: "z_image\\ZIT-divingZImageTurbo_v50Fp16.safetensors", weight_dtype: "default" }, class_type: "UNETLoader" },
    "57:11": { inputs: { shift: 3, model: ["57:28", 0] }, class_type: "ModelSamplingAuraFlow" },
    "57:13": { inputs: { width: options.width || 960, height: options.height || 1600, batch_size: 1 }, class_type: "EmptySD3LatentImage" },
    "57:3": { inputs: { clip: ["57:5", 1] }, class_type: "CLIPTextEncode" },
    "57:4": { inputs: { clip: ["57:5", 1] }, class_type: "CLIPTextEncode" },
    "57:5": { inputs: { ckpt_name: "Qwen-Rapid-AIO-NSFW-v18.safetensors" }, class_type: "CLIPLoader" },
    "57:7": { inputs: { noise: ["57:19", 0], guidance: ["57:17", 0], model: ["57:11", 0] }, class_type: "Guidance" },
    "57:8": { inputs: { samples: ["57:16", 0], vae: ["57:27", 0] }, class_type: "VAEDecode" },
    "57:16": { inputs: { cfg: 1, sampler: ["57:19", 0], signal: ["57:15", 0], model: ["57:7", 0] }, class_type: "BasicGuidedGuider" },
    "57:17": { inputs: { text: "low quality, worst quality, bad anatomy", clip: ["57:5", 0] }, class_type: "CLIPTextEncode" },
    "57:15": { inputs: { text: options.positivePrompt, clip: ["57:5", 0] }, class_type: "CLIPTextEncode" },
    "57:19": { inputs: { noise_seed: options.seed || 12345, cfg: 1, sampler: "semi", signal: ["57:14", 0], model: ["57:7", 0] }, class_type: "SamplerCustomSampe" },
    "57:14": { inputs: { sigmas: [2], model: ["57:11", 0] }, class_type: "BasicGuidedScheduler" },
    "57:27": { inputs: { vae_name: "ae.safetensors" }, class_type: "VAELoader" },
    "57:22": { inputs: { width: options.width || 960, height: options.height || 1600, batch_size: 1 }, class_type: "EmptySD3LatentImage" },
    "9": { inputs: { filename_prefix: `test_${Date.now()}`, images: [["57:8", 0]] }, class_type: "SaveImage" }
  };
}

async function testPrompt() {
  const workflow = buildZITWorkflow({
    positivePrompt: "test prompt",
    width: 960,
    height: 1600,
    seed: 12345
  });
  
  console.log('测试提交任务到 ComfyUI...');
  console.log('Config:', config.comfyui);
  
  const postData = JSON.stringify({ prompt: workflow });
  console.log('\n请求数据预览:', JSON.stringify(workflow).substring(0, 200) + '...');
  
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
      console.log('\n响应状态:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('响应数据:', data);
        resolve(JSON.parse(data));
      });
    });
    
    req.on('error', (e) => {
      console.error('请求错误:', e);
      reject(e);
    });
    
    req.write(postData);
    req.end();
  });
}

testPrompt().catch(console.error);
