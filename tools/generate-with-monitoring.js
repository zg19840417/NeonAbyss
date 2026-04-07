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

  async getQueue() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: '/queue',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('解析队列信息失败'));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

function buildTurboWorkflow(config, options) {
  const defaults = config.defaults;
  
  return {
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
        "seed": options.seed || Math.floor(Math.random() * 9999999999),
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
}

async function generateAndDownload() {
  console.log('===========================================');
  console.log('   ComfyUI 图片生成工具 (增强版)');
  console.log('===========================================\n');

  const configPath = path.join(__dirname, 'comfyui-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const comfyui = new ComfyUI(config);

  const prompt = process.argv[2] || "a cute anime girl with blue hair, fantasy game character";
  const width = parseInt(process.argv[3]) || 512;
  const height = parseInt(process.argv[4]) || 512;
  const steps = parseInt(process.argv[5]) || 8;

  console.log('生成参数:');
  console.log('  提示词:', prompt);
  console.log('  分辨率:', width, 'x', height);
  console.log('  步数:', steps);
  console.log();

  const workflow = buildTurboWorkflow(config, {
    prompt: prompt,
    width: width,
    height: height,
    steps: steps
  });

  console.log('正在提交任务...');
  const queueResult = await comfyui.queuePrompt(workflow);

  if (!queueResult.prompt_id) {
    throw new Error('提交任务失败');
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
          
          if (status.completed) {
            console.log('\n\n✓ 任务已完成!');
            break;
          }
          
          if (status.executed) {
            console.log('\n\n✓ 任务已执行完成!');
            break;
          }

          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          process.stdout.write(`\r运行中... ${elapsed}s - ${JSON.stringify(status)}`);
        }

        if (nodeData.images && nodeData.images.length > 0) {
          console.log('\n\n✓ 检测到生成的图片!');
          break;
        }
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
            const saveFilename = `${timestamp}_${i + 1}.png`;
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

  console.log('保存的文件:');
  savedFiles.forEach(f => console.log(' ', f));
}

generateAndDownload()
  .then(() => {
    console.log('✓ 成功!');
    process.exit(0);
  })
  .catch(e => {
    console.error('\n✗ 发生错误:', e.message);
    process.exit(1);
  });
