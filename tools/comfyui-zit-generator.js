const http = require('http');
const fs = require('fs');
const path = require('path');

class ComfyUI {
  constructor(config) {
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
        if (res.statusCode === 404) {
          file.close();
          reject(new Error('文件不存在'));
          return;
        }
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

function buildZITWorkflow(options) {
  const seed = options.seed || Math.floor(Math.random() * 999999999999999);
  
  return {
    "57:28": {
      "inputs": {
        "unet_name": "z_image\\ZIT-divingZImageTurbo_v50Fp16.safetensors",
        "weight_dtype": "default"
      },
      "class_type": "UNETLoader"
    },
    "57:11": {
      "inputs": {
        "shift": 3,
        "model": ["57:28", 0]
      },
      "class_type": "ModelSamplingAuraFlow"
    },
    "57:13": {
      "inputs": {
        "width": options.width || 960,
        "height": options.height || 1600,
        "batch_size": 1
      },
      "class_type": "EmptySD3LatentImage"
    },
    "57:30": {
      "inputs": {
        "clip_name": "qwen_3_4b.safetensors",
        "type": "lumina2",
        "device": "default"
      },
      "class_type": "CLIPLoader"
    },
    "57:29": {
      "inputs": {
        "vae_name": "ae.safetensors"
      },
      "class_type": "VAELoader"
    },
    "57:27": {
      "inputs": {
        "text": options.prompt,
        "clip": ["57:30", 0]
      },
      "class_type": "CLIPTextEncode"
    },
    "57:33": {
      "inputs": {
        "conditioning": ["57:27", 0]
      },
      "class_type": "ConditioningZeroOut"
    },
    "57:3": {
      "inputs": {
        "seed": seed,
        "steps": options.steps || 8,
        "cfg": 1,
        "sampler_name": "res_multistep",
        "scheduler": "simple",
        "denoise": 1,
        "model": ["57:11", 0],
        "positive": ["57:27", 0],
        "negative": ["57:33", 0],
        "latent_image": ["57:13", 0]
      },
      "class_type": "KSampler"
    },
    "57:8": {
      "inputs": {
        "samples": ["57:3", 0],
        "vae": ["57:29", 0]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "z-image-turbo",
        "images": ["57:8", 0]
      },
      "class_type": "SaveImage"
    }
  };
}

async function generateWithZIT(prompt, width, height, steps) {
  console.log('===========================================');
  console.log('   ComfyUI ZIT 文生图工具');
  console.log('===========================================\n');

  const configPath = path.join(__dirname, 'comfyui-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const comfyui = new ComfyUI(config);

  console.log('生成参数:');
  console.log('  提示词:', prompt);
  console.log('  分辨率:', width, 'x', height);
  console.log('  步数:', steps);
  console.log('  工作流: ZIT (Zhuang\'s Image Turbo)');
  console.log();

  const workflow = buildZITWorkflow({
    prompt: prompt,
    width: width,
    height: height,
    steps: steps
  });

  console.log('正在提交任务...');
  const queueResult = await comfyui.queuePrompt(workflow);

  if (!queueResult.prompt_id) {
    throw new Error('提交任务失败: ' + JSON.stringify(queueResult));
  }

  console.log('✓ 任务已提交!');
  console.log('Prompt ID:', queueResult.prompt_id);
  console.log('\n正在监控任务状态...\n');

  const maxWait = 600000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    try {
      const history = await comfyui.getHistory(queueResult.prompt_id);
      
      if (history && history[queueResult.prompt_id]) {
        const nodeData = history[queueResult.prompt_id];
        
        if (nodeData.status) {
          const status = nodeData.status;
          
          if (status.completed || status.executed) {
            console.log('\n\n✓ 任务已完成!');
            break;
          }
        }

        if (nodeData.images && nodeData.images.length > 0) {
          console.log('\n\n✓ 检测到生成的图片!');
          break;
        }

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        process.stdout.write(`\r运行中... ${elapsed}s`);
      }
    } catch (e) {
      console.log('\n检查状态时出错:', e.message);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n\n正在下载图片...\n');

  const outputFolder = path.join(__dirname, '..', 'assets', 'images', 'resource-backup');
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const savedFiles = [];

  try {
    const history = await comfyui.getHistory(queueResult.prompt_id);
    
    if (history && history[queueResult.prompt_id]) {
      const nodeIds = Object.keys(history[queueResult.prompt_id]);

      for (const nodeId of nodeIds) {
        const nodeData = history[queueResult.prompt_id][nodeId];
        
        if (nodeData.images && nodeData.images.length > 0) {
          for (let i = 0; i < nodeData.images.length; i++) {
            const img = nodeData.images[i];
            const saveFilename = `ZIT_${timestamp}_${i + 1}.png`;
            const savePath = path.join(outputFolder, saveFilename);

            try {
              await comfyui.downloadImage(img.filename, img.subfolder, img.type, savePath);
              console.log(`✓ 已保存: ${saveFilename}`);
              savedFiles.push(savePath);
            } catch (e) {
              console.error(`✗ 下载失败: ${img.filename}`);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('获取历史记录失败:', e.message);
  }

  console.log('\n===========================================');
  console.log('生成完成!');
  console.log('===========================================');
  console.log('Prompt ID:', queueResult.prompt_id);
  console.log('保存位置:', outputFolder);
  console.log('文件数量:', savedFiles.length);
  console.log('===========================================\n');

  if (savedFiles.length > 0) {
    console.log('保存的文件:');
    savedFiles.forEach(f => console.log(' ', f));
  }
}

const args = process.argv.slice(2);
const prompt = args[0] || "a cute cat and dog fighting on the street";
const width = parseInt(args[1]) || 960;
const height = parseInt(args[2]) || 1600;
const steps = parseInt(args[3]) || 8;

generateWithZIT(prompt, width, height, steps)
  .then(() => {
    console.log('\n✓ 成功!');
    process.exit(0);
  })
  .catch(e => {
    console.error('\n✗ 发生错误:', e.message);
    process.exit(1);
  });
