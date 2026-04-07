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

function buildWorkflow(config, options) {
  const defaults = config.defaults;
  const width = options.width || defaults.width;
  const height = options.height || defaults.height;

  return {
    "3": {
      "inputs": {
        "seed": options.seed || Math.floor(Math.random() * 9999999999),
        "steps": options.steps || defaults.steps,
        "cfg": options.cfg || defaults.cfg,
        "sampler_name": options.sampler || defaults.sampler_name,
        "scheduler": defaults.scheduler,
        "positive": options.prompt,
        "negative": options.negative_prompt || config.common.negative_prompt,
        "model": ["4", "load_model", "models"],
        "positive_token_normalization": "mean",
        "positive_weight_interpretation": "comfy",
        "negative_token_normalization": "mean",
        "negative_weight_interpretation": "comfy",
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": { "ckpt_name": options.model || "sd_xl_base_1.0.safetensors" },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": options.batch_size || defaults.batch_size
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "samples": ["3", "latent"],
        "filename_prefix": "ComfyUI_temp",
        "format": "image/png",
        "quality": 100,
        "counter": 1
      },
      "class_type": "SaveImage"
    }
  };
}

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .substring(0, 50);
}

function generateFilename(template, prompt, folder) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const keywords = prompt.split(' ')
    .filter(w => w.length > 2)
    .slice(0, 3)
    .join('_');
  
  const filename = template
    .replace('{prompt_keyword}', sanitizeFilename(keywords))
    .replace('{timestamp}', timestamp);
  
  return path.join(folder, filename);
}

async function main() {
  console.log('===========================================');
  console.log('     ComfyUI 文生图工具 - 苏打地牢项目');
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
    process.exit(1);
  }

  console.log('请输入提示词 (prompt):');
  console.log('例如: a beautiful fantasy landscape with floating islands\n');
  const prompt = await askQuestion('> ');

  if (!prompt.trim()) {
    console.error('错误: 提示词不能为空');
    rl.close();
    process.exit(1);
  }

  console.log('\n可选参数 (直接回车使用默认值):\n');
  
  const negative_prompt = await askQuestion('负向提示词 [' + config.common.negative_prompt.substring(0, 30) + '...]: ');
  const width = await askQuestion(`图像宽度 [${config.defaults.width}]: `);
  const height = await askQuestion(`图像高度 [${config.defaults.height}]: `);
  const steps = await askQuestion(`采样步数 [${config.defaults.steps}]: `);
  const cfg = await askQuestion(`CFG 尺度 [${config.defaults.cfg}]: `);
  const batch_size = await askQuestion(`批量大小 [${config.defaults.batch_size}]: `);

  console.log('\n可用的采样器:');
  console.log('  euler_ancestral, euler, ddim, dpmpp_2m, dpmpp_sde, dpmpp_2s_ancestral, etc.\n');
  const sampler = await askQuestion(`采样器 [${config.defaults.sampler_name}]: `);

  console.log('\n===========================================');
  console.log('生成参数:');
  console.log('===========================================');
  console.log(`  提示词: ${prompt}`);
  console.log(`  负向提示词: ${negative_prompt || config.common.negative_prompt}`);
  console.log(`  尺寸: ${width || config.defaults.width} x ${height || config.defaults.height}`);
  console.log(`  步数: ${steps || config.defaults.steps}`);
  console.log(`  CFG: ${cfg || config.defaults.cfg}`);
  console.log(`  批量: ${batch_size || config.defaults.batch_size}`);
  console.log(`  采样器: ${sampler || config.defaults.sampler_name}`);
  console.log('===========================================\n');

  const outputFolder = path.join(__dirname, '..', config.output.default_folder);
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
    console.log(`创建输出文件夹: ${outputFolder}`);
  }

  console.log('正在构建工作流...');
  const workflow = buildWorkflow(config, {
    prompt: prompt,
    negative_prompt: negative_prompt || config.common.negative_prompt,
    width: parseInt(width) || config.defaults.width,
    height: parseInt(height) || config.defaults.height,
    steps: parseInt(steps) || config.defaults.steps,
    cfg: parseFloat(cfg) || config.defaults.cfg,
    batch_size: parseInt(batch_size) || config.defaults.batch_size,
    sampler: sampler || config.defaults.sampler_name
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
  
  const checkCompletion = async () => {
    try {
      const history = await comfyui.getHistory(queueResult.prompt_id);
      if (history[queueResult.prompt_id] && history[queueResult.prompt_id].status) {
        const status = history[queueResult.prompt_id].status;
        if (status.completed || status.executed) {
          return true;
        }
        if (status.messages) {
          status.messages.forEach(msg => {
            if (msg[1] && msg[1].data) {
              process.stdout.write(`\r${spinChars[spinIndex++ % 4]} ${msg[1].data}`);
            }
          });
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
      process.stdout.write(`\r${spinChars[spinIndex++ % 4]} 等待中... ` + Date.now());
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n\n✓ 生成完成！正在下载图片...\n');

  const outputs = await comfyui.getOutputImages(queueResult.prompt_id);
  const savedFiles = [];

  for (const node_id in outputs) {
    for (const img of outputs[node_id]) {
      const filename = generateFilename(
        config.output.filename_template,
        prompt,
        ''
      );
      const savePath = path.join(outputFolder, `${filename}_${img.filename}`);
      
      try {
        await comfyui.downloadImage(img.filename, img.subfolder, img.type, savePath);
        console.log(`✓ 已保存: ${path.basename(savePath)}`);
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
