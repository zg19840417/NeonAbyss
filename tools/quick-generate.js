const http = require('http');
const fs = require('fs');
const path = require('path');

class ComfyUI {
  constructor(config) {
    this.config = config;
    this.host = config.comfyui.host;
    this.port = config.comfyui.port;
  }

  async queuePrompt(prompt_data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ prompt: prompt_data });
      
      const options = {
        hostname: this.host,
        port: this.port,
        path: '/prompt',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('解析响应失败: ' + data));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  async getHistory(prompt_id) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: `/history/${prompt_id}`,
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('解析历史记录失败'));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async getOutputImages(prompt_id) {
    const history = await this.getHistory(prompt_id);
    const outputs = {};

    for (const node_id in history) {
      const node_output = history[node_id];
      if (node_output.images) {
        outputs[node_id] = node_output.images.map(img => ({
          filename: img.filename,
          subfolder: img.subfolder,
          type: img.type
        }));
      }
    }

    return outputs;
  }

  async downloadImage(filename, subfolder, type, savePath) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(savePath);
      
      const options = {
        hostname: this.host,
        port: this.port,
        path: `/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${encodeURIComponent(type)}`,
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(savePath);
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

function buildTurboWorkflow(config, options) {
  const defaults = config.defaults;
  
  const workflow = {
    "1": {
      "inputs": {
        "ckpt_name": options.model || "Qwen-Rapid-AIO-NSFW-v18.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "2": {
      "inputs": {
        "width": options.width,
        "height": options.height,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "3": {
      "inputs": {
        "text": options.prompt,
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "4": {
      "inputs": {
        "text": options.negative_prompt || config.common.negative_prompt,
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "5": {
      "inputs": {
        "model": ["1", 0],
        "seed": Math.floor(Math.random() * 9999999999),
        "steps": options.steps || defaults.steps,
        "cfg": options.cfg || defaults.cfg,
        "sampler_name": options.sampler || defaults.sampler_name,
        "scheduler": defaults.scheduler,
        "positive": ["3", 0],
        "negative": ["4", 0],
        "latent_image": ["2", 0],
        "denoise": 1.0
      },
      "class_type": "KSampler"
    },
    "6": {
      "inputs": {
        "samples": ["5", 0],
        "vae": ["1", 2]
      },
      "class_type": "VAEDecode"
    },
    "7": {
      "inputs": {
        "filename_prefix": "ComfyUI_Turbo",
        "images": ["6", 0]
      },
      "class_type": "SaveImage"
    }
  };

  return workflow;
}

async function generateImage() {
  console.log('===========================================');
  console.log('   ComfyUI Image Turbo 快速测试');
  console.log('===========================================\n');

  const configPath = path.join(__dirname, 'comfyui-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const comfyui = new ComfyUI(config);

  const prompt = "a cute anime girl with blue hair, fantasy game character, high quality";
  const negative_prompt = "low quality, blurry, deformed, bad anatomy, watermark, text";
  const width = 512;
  const height = 512;
  const steps = 8;

  console.log('测试参数:');
  console.log('  分辨率:', width, 'x', height);
  console.log('  提示词:', prompt);
  console.log('  步数:', steps);
  console.log('  工作流: image_z_image_turbo\n');

  const workflow = buildTurboWorkflow(config, {
    prompt: prompt,
    negative_prompt: negative_prompt,
    width: width,
    height: height,
    steps: steps,
    cfg: config.defaults.cfg,
    sampler: config.defaults.sampler_name
  });

  console.log('正在提交任务到 ComfyUI...');
  const queueResult = await comfyui.queuePrompt(workflow);
  
  if (!queueResult.prompt_id) {
    throw new Error('提交任务失败: ' + JSON.stringify(queueResult));
  }

  console.log('✓ 任务已提交，Prompt ID:', queueResult.prompt_id);
  console.log('正在等待生成完成...\n');

  let completed = false;
  const maxWait = 60000;
  const startTime = Date.now();

  while (!completed && Date.now() - startTime < maxWait) {
    try {
      const history = await comfyui.getHistory(queueResult.prompt_id);
      if (history[queueResult.prompt_id] && history[queueResult.prompt_id].status) {
        const status = history[queueResult.prompt_id].status;
        if (status.completed || status.executed) {
          completed = true;
          break;
        }
      }
    } catch (e) {
      console.log('检查状态时出错:', e.message);
    }
    
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n');

  if (!completed) {
    throw new Error('生成超时');
  }

  console.log('✓ 生成完成！正在下载图片...\n');

  const outputs = await comfyui.getOutputImages(queueResult.prompt_id);
  const outputFolder = path.join(__dirname, '..', 'assets', 'images', 'resource-backup');
  
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const savedFiles = [];

  for (const node_id in outputs) {
    for (let i = 0; i < outputs[node_id].length; i++) {
      const img = outputs[node_id][i];
      const saveFilename = `test_${timestamp}_${i + 1}.png`;
      const savePath = path.join(outputFolder, saveFilename);
      
      try {
        await comfyui.downloadImage(img.filename, img.subfolder, img.type, savePath);
        console.log('✓ 已保存:', saveFilename);
        savedFiles.push(savePath);
      } catch (e) {
        console.error('✗ 保存失败:', img.filename, '-', e.message);
      }
    }
  }

  console.log('\n===========================================');
  console.log('测试完成！');
  console.log('===========================================');
  console.log('保存位置:', outputFolder);
  console.log('文件数量:', savedFiles.length);
  console.log('===========================================\n');
}

generateImage()
  .then(() => {
    console.log('✓ 成功！');
    process.exit(0);
  })
  .catch(e => {
    console.error('\n✗ 发生错误:', e.message);
    console.error(e.stack);
    process.exit(1);
  });
