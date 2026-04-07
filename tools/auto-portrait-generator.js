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
        "filename_prefix": options.filename_prefix || "z-image-turbo",
        "images": ["57:8", 0]
      },
      "class_type": "SaveImage"
    }
  };
}

async function generatePortrait(config) {
  const {
    characterId,
    characterName,
    prompt,
    outputFolder,
    filename,
    width = 960,
    height = 1600,
    steps = 8
  } = config;

  console.log('===========================================');
  console.log(`   生成立绘: ${characterName}`);
  console.log('===========================================\n');

  const configPath = path.join(__dirname, 'comfyui-config.json');
  const comfyConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const comfyui = new ComfyUI(comfyConfig);

  console.log('生成参数:');
  console.log('  角色ID:', characterId);
  console.log('  角色名:', characterName);
  console.log('  分辨率:', width, 'x', height);
  console.log('  步数:', steps);
  console.log('  输出文件:', filename);
  console.log();

  const workflow = buildZITWorkflow({
    prompt: prompt,
    width: width,
    height: height,
    steps: steps,
    filename_prefix: outputFolder.split(/[/\\]/).pop()
  });

  console.log('正在提交任务...');
  const queueResult = await comfyui.queuePrompt(workflow);

  if (!queueResult.prompt_id) {
    throw new Error('提交任务失败: ' + JSON.stringify(queueResult));
  }

  console.log('✓ 任务已提交!');
  console.log('Prompt ID:', queueResult.prompt_id);
  console.log('正在等待生成完成...\n');

  const maxWait = 600000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    try {
      const history = await comfyui.getHistory(queueResult.prompt_id);
      
      if (history && history[queueResult.prompt_id]) {
        const nodeData = history[queueResult.prompt_id];
        
        if (nodeData.status && (nodeData.status.completed || nodeData.status.executed)) {
          console.log('\n✓ 生成完成!');
          break;
        }

        if (nodeData.images && nodeData.images.length > 0) {
          console.log('\n✓ 检测到生成的图片!');
          break;
        }

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        process.stdout.write(`\r生成中... ${elapsed}s`);
      }
    } catch (e) {
      console.log('\n检查状态时出错:', e.message);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n\n正在下载图片...\n');

  const savePath = path.join(outputFolder, filename);

  try {
    const history = await comfyui.getHistory(queueResult.prompt_id);
    
    if (history && history[queueResult.prompt_id]) {
      const nodeIds = Object.keys(history[queueResult.prompt_id]);

      for (const nodeId of nodeIds) {
        const nodeData = history[queueResult.prompt_id][nodeId];
        
        if (nodeData.images && nodeData.images.length > 0) {
          const img = nodeData.images[0];
          await comfyui.downloadImage(img.filename, img.subfolder, img.type, savePath);
          console.log('✓ 已保存:', savePath);
          return { success: true, path: savePath, promptId: queueResult.prompt_id };
        }
      }
    }
  } catch (e) {
    console.error('下载失败:', e.message);
  }

  return { success: false, promptId: queueResult.prompt_id };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('使用方法: node auto-portrait-generator.js <角色ID> <角色名> "<提示词>"');
    console.log('');
    console.log('示例:');
    console.log('node auto-portrait-generator.js B001 "锈甲蜥" "超写实风格，一只铁锈色鳞片的巨型蜥蜴..."');
    console.log('');
    console.log('角色ID格式:');
    console.log('  Boss: B001, B002, ...');
    console.log('  融合姬: FM001, FM002, ...');
    console.log('');
    process.exit(1);
  }

  const characterId = args[0];
  const characterName = args[1];
  const prompt = args[2];
  
  const isBoss = characterId.startsWith('B');
  const outputFolder = path.join(__dirname, '..', 'assets', 'images', 'characters', isBoss ? 'boss' : 'fusion');
  const filename = `${characterId}.png`;

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  try {
    const result = await generatePortrait({
      characterId,
      characterName,
      prompt,
      outputFolder,
      filename,
      width: 960,
      height: 1600,
      steps: 8
    });

    if (result.success) {
      console.log('\n===========================================');
      console.log('✓ 生成成功!');
      console.log('===========================================');
      console.log('立绘文件:', result.path);
      console.log('配置文件引用:');
      if (isBoss) {
        console.log(`  bosses.json: "portrait": "characters/boss/${filename}"`);
      } else {
        console.log(`  minions.json: "portrait": "characters/fusion/${filename}"`);
      }
      console.log('===========================================\n');
      
      console.log('⚠️  重要提示:');
      console.log('1. 配置文件已更新，需要重新加载或重启游戏');
      console.log('2. 如果是Boss，需要在 PreloadScene.js 中添加加载代码');
      console.log('3. 如果是融合姬，确保文件名在加载列表中');
      console.log('');
    } else {
      console.log('\n✗ 生成失败或图片未找到');
      console.log('Prompt ID:', result.promptId);
    }
  } catch (e) {
    console.error('\n✗ 发生错误:', e.message);
    process.exit(1);
  }
}

main();
