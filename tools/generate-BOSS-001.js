const http = require('http');
const fs = require('fs');
const path = require('path');

async function generateBoss001Portrait() {
  const prompt = `废土末世风格，的女性战士角色立绘，竖屏2:3比例。韩国冷白皮年轻女性全身像。她身披锈蚀动力甲，是废弃矿区的安保守卫。动力甲厚重且布满铁锈和划痕，金属表面有辐射灼烧的痕迹，胸甲中心有暗红色能量核心脉动着微弱光芒。她的双眼原本是人类的眼睛，但因融合改造而闪烁着不自然的火红色光芒，眼神坚毅而冷酷。她手持一把巨大的等离子巨锤，锤头散发着灼热的红橙色光芒和高能粒子特效。她的头发枯黄干燥，被辐射和战斗损伤，短发凌乱地贴在脸侧。动力甲的关节处有蒸汽或能量泄漏的特效。姿态为战斗姿态，一手握锤垂在身侧，姿态威武而压迫感十足。背景为虚化的废弃矿区深处，生锈的机械和矿车散落，红色警示灯闪烁。整体色调以暗红、铁锈色和黑色为主，点缀橙红色能量光芒。废土末世氛围，超写实摄影风格，真人照片质感。`;

  const characterId = 'B001';
  const characterName = '锈蚀守卫·陈岚';
  const filename = `${characterId}.png`;
  const outputFolder = path.join(__dirname, '..', 'assets', 'images', 'characters', 'boss');

  console.log('===========================================');
  console.log(`   生成立绘: ${characterName}`);
  console.log('===========================================\n');

  const configPath = path.join(__dirname, 'comfyui-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: {
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
            "width": 960,
            "height": 1600,
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
            "text": prompt,
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
            "seed": Math.floor(Math.random() * 999999999999999),
            "steps": 8,
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
      }
    });

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

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.prompt_id) {
            console.log('✓ 任务已提交!');
            console.log('Prompt ID:', result.prompt_id);
            console.log('正在等待生成完成...\n');
            resolve(result.prompt_id);
          } else {
            reject(new Error('提交失败: ' + data));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function waitAndDownload(promptId, outputFolder, filename) {
  const configPath = path.join(__dirname, 'comfyui-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const maxWait = 600000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const history = await new Promise((resolve, reject) => {
        const options = {
          hostname: config.comfyui.host,
          port: config.comfyui.port,
          path: `/history/${promptId}`,
          method: 'GET'
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        });

        req.on('error', reject);
        req.end();
      });

      if (history && history[promptId] && history[promptId].status && history[promptId].status.completed) {
        console.log('\n✓ 生成完成! 正在下载...\n');

        const nodeIds = Object.keys(history[promptId]);
        for (const nodeId of nodeIds) {
          const nodeData = history[promptId][nodeId];
          if (nodeData.images && nodeData.images.length > 0) {
            const img = nodeData.images[0];
            const savePath = path.join(outputFolder, filename);

            await new Promise((resolve, reject) => {
              const file = fs.createWriteStream(savePath);
              const options = {
                hostname: config.comfyui.host,
                port: config.comfyui.port,
                path: `/view?filename=${encodeURIComponent(img.filename)}&subfolder=&type=output`,
                method: 'GET'
              };

              const req = http.request(options, (res) => {
                res.pipe(file);
                file.on('finish', () => {
                  file.close();
                  console.log('✓ 已保存:', savePath);
                  resolve();
                });
              });

              req.on('error', reject);
              req.end();
            });

            return true;
          }
        }
      }

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      process.stdout.write(`\r生成中... ${elapsed}s`);
    } catch (e) {
      console.log('\n检查状态时出错:', e.message);
    }
  }

  return false;
}

async function main() {
  const outputFolder = path.join(__dirname, '..', 'assets', 'images', 'characters', 'boss');
  const filename = 'B001.png';

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  try {
    const promptId = await generateBoss001Portrait();
    const success = await waitAndDownload(promptId, outputFolder, filename);

    console.log('\n===========================================');
    console.log(success ? '✓ 生成成功!' : '✗ 生成失败');
    console.log('===========================================');
    console.log('立绘文件:', path.join(outputFolder, filename));
    console.log('配置文件引用:');
    console.log('  bosses.json: "portrait": "characters/boss/B001.png"');
    console.log('===========================================\n');
    
    console.log('⚠️  重要提示:');
    console.log('1. 需要更新 bosses.json 中 BOSS_001 的 portrait 字段为 "characters/boss/B001.png"');
    console.log('2. 需要在 PreloadScene.js 中添加: { key: "B001", path: "assets/images/characters/boss/B001.png" }');
    console.log('3. 重启游戏以加载新资源\n');

  } catch (e) {
    console.error('\n✗ 发生错误:', e.message);
    process.exit(1);
  }
}

main();
