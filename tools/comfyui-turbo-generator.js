const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

  async waitForCompletion(prompt_id, interval = 1000, maxWait = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        const history = await this.getHistory(prompt_id);
        if (history[prompt_id] && history[prompt_id].status) {
          if (history[prompt_id].status.completed) {
            return true;
          }
          if (history[prompt_id].status.executed) {
            return true;
          }
        }
      } catch (e) {
        console.log('检查状态时出错:', e.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('等待完成超时');
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

  return workflow;
}

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .substring(0, 50);
}

function generateFilename(prompt) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const keywords = prompt.split(' ')
    .filter(w => w.length > 2)
    .slice(0, 3)
    .join('_');
  
  const filename = `${sanitizeFilename(keywords)}_${timestamp}`;
  return filename;
}

async function main() {
  console.log('===========================================');
  console.log('   ComfyUI Image Turbo 文生图工具');
  console.log('   苏打地牢项目 - 资源生成器');
  console.log('===========================================\n');

  const configPath = path.join(__dirname, 'comfyui-config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('错误: 找不到配置文件 comfyui-config.json');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const comfyui = new ComfyUI(config);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  try {
    console.log('正在连接 ComfyUI...');
    const testResult = await comfyui.queuePrompt({});
    console.log('✓ ComfyUI 连接成功\n');
  } catch (e) {
    console.error('✗ 无法连接到 ComfyUI');
    console.error('  请确保 ComfyUI 正在运行并启用了 API 功能');
    console.error('  错误:', e.message);
    rl.close();
    process.exit(1);
  }

  console.log('===========================================');
  console.log('请输入生成参数:');
  console.log('===========================================\n');

  console.log('支持的分辨率选项:');
  console.log('  1 - 512 x 512  (正方形 - 快)');
  console.log('  2 - 768 x 768  (正方形 - 中)');
  console.log('  3 - 1024 x 1024 (正方形 - 慢)');
  console.log('  4 - 1024 x 768  (横向 - 宽屏)');
  console.log('  5 - 768 x 1024  (竖向 - 竖屏)');
  console.log('  6 - 自定义分辨率\n');

  const resolutionChoice = await askQuestion('请选择分辨率 (1-6) [1]: ');
  let width = 512;
  let height = 512;

  switch (resolutionChoice.trim()) {
    case '2':
      width = 768;
      height = 768;
      break;
    case '3':
      width = 1024;
      height = 1024;
      break;
    case '4':
      width = 1024;
      height = 768;
      break;
    case '5':
      width = 768;
      height = 1024;
      break;
    case '6':
      const customWidth = await askQuestion('宽度 (如 1920): ');
      const customHeight = await askQuestion('高度 (如 1080): ');
      width = parseInt(customWidth) || 1024;
      height = parseInt(customHeight) || 1024;
      break;
    default:
      width = 512;
      height = 512;
  }

  console.log('\n');
  console.log('请输入提示词 (prompt):');
  console.log('例如: a beautiful fantasy landscape with floating islands\n');
  const prompt = await askQuestion('> ');

  if (!prompt.trim()) {
    console.error('错误: 提示词不能为空');
    rl.close();
    process.exit(1);
  }

  const negative_prompt = await askQuestion('\n负向提示词 (直接回车使用默认):\n> ');

  const stepsInput = await askQuestion(`\n采样步数 [${config.defaults.steps}]: `);
  const steps = parseInt(stepsInput) || config.defaults.steps;

  console.log('\n===========================================');
  console.log('生成参数确认:');
  console.log('===========================================');
  console.log(`  分辨率: ${width} x ${height}`);
  console.log(`  提示词: ${prompt}`);
  console.log(`  负向提示词: ${negative_prompt || config.common.negative_prompt}`);
  console.log(`  采样步数: ${steps}`);
  console.log('===========================================\n');

  const confirm = await askQuestion('确认开始生成? (y/n) [y]: ');
  if (confirm.trim().toLowerCase() === 'n') {
    console.log('已取消生成');
    rl.close();
    process.exit(0);
  }

  const outputFolder = path.join(__dirname, '..', 'assets', 'images', 'resource-backup');
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  console.log('\n正在构建 image_z_image_turbo 工作流...');
  const workflow = buildTurboWorkflow(config, {
    prompt: prompt,
    negative_prompt: negative_prompt || config.common.negative_prompt,
    width: width,
    height: height,
    steps: steps,
    cfg: config.defaults.cfg,
    sampler: config.defaults.sampler_name
  });

  console.log('正在提交任务到 ComfyUI...');
  const queueResult = await comfyui.queuePrompt(workflow);
  
  if (!queueResult.prompt_id) {
    console.error('错误: 提交任务失败', queueResult);
    rl.close();
    process.exit(1);
  }

  console.log(`✓ 任务已提交，Prompt ID: ${queueResult.prompt_id}`);
  console.log('正在等待生成完成...\n');

  const spinChars = ['|', '/', '-', '\\'];
  let spinIndex = 0;
  let dots = '';
  
  const checkCompletion = async () => {
    try {
      const history = await comfyui.getHistory(queueResult.prompt_id);
      if (history[queueResult.prompt_id] && history[queueResult.prompt_id].status) {
        const status = history[queueResult.prompt_id].status;
        if (status.completed || status.executed) {
          return true;
        }
      }
    } catch (e) {
      // 继续等待
    }
    return false;
  };

  let completed = false;
  while (!completed) {
    completed = await checkCompletion();
    if (!completed) {
      dots = dots.length >= 10 ? '' : dots + '.';
      process.stdout.write(`\r${spinChars[spinIndex++ % 4]} 正在生成中${dots} `);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n\n✓ 生成完成！正在下载图片...\n');

  const outputs = await comfyui.getOutputImages(queueResult.prompt_id);
  const savedFiles = [];
  const baseFilename = generateFilename(prompt);

  for (const node_id in outputs) {
    for (let i = 0; i < outputs[node_id].length; i++) {
      const img = outputs[node_id][i];
      const saveFilename = `${baseFilename}_${i + 1}.png`;
      const savePath = path.join(outputFolder, saveFilename);
      
      try {
        await comfyui.downloadImage(img.filename, img.subfolder, img.type, savePath);
        console.log(`✓ 已保存: ${saveFilename}`);
        savedFiles.push(savePath);
      } catch (e) {
        console.error(`✗ 保存失败 ${img.filename}:`, e.message);
      }
    }
  }

  console.log('\n===========================================');
  console.log('生成完成！');
  console.log('===========================================');
  console.log(`保存位置: ${outputFolder}`);
  console.log(`文件数量: ${savedFiles.length}`);
  console.log('===========================================\n');

  rl.close();
}

main().catch(e => {
  console.error('发生错误:', e);
  process.exit(1);
});
