const http = require('http');
const fs = require('fs');
const path = require('path');

class ComfyUI {
  constructor(config) {
    this.host = config.comfyui.host;
    this.port = config.comfyui.port;
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

async function downloadImages(promptId) {
  console.log('===========================================');
  console.log('   ComfyUI 图片下载工具');
  console.log('===========================================\n');

  const configPath = path.join(__dirname, 'comfyui-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const comfyui = new ComfyUI(config);

  console.log('正在获取历史记录...');
  const history = await comfyui.getHistory(promptId);

  if (!history[promptId]) {
    console.error('未找到该 prompt_id 的记录');
    console.log('可用的记录:', Object.keys(history));
    return;
  }

  const outputFolder = path.join(__dirname, '..', 'assets', 'images', 'resource-backup');
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  console.log('找到历史记录:');
  console.log(JSON.stringify(history[promptId], null, 2));

  const nodeIds = Object.keys(history[promptId]);
  const savedFiles = [];

  for (const nodeId of nodeIds) {
    const nodeData = history[promptId][nodeId];
    if (nodeData.images && nodeData.images.length > 0) {
      console.log(`\n节点 ${nodeId} 找到了 ${nodeData.images.length} 张图片`);

      for (const img of nodeData.images) {
        const savePath = path.join(outputFolder, img.filename);
        
        try {
          await comfyui.downloadImage(img.filename, img.subfolder, img.type, savePath);
          console.log(`✓ 已下载: ${img.filename}`);
          savedFiles.push(savePath);
        } catch (e) {
          console.error(`✗ 下载失败: ${img.filename}`, e.message);
        }
      }
    }
  }

  console.log('\n===========================================');
  console.log('下载完成！');
  console.log('===========================================');
  console.log('保存位置:', outputFolder);
  console.log('文件数量:', savedFiles.length);
  console.log('===========================================\n');
}

const promptId = process.argv[2];

if (!promptId) {
  console.log('使用方法: node download-comfyui-images.js <prompt_id>');
  console.log('\n示例:');
  console.log('node download-comfyui-images.js 4638cdd0-5e8a-4c55-88bc-4587465b9256');
  process.exit(1);
}

downloadImages(promptId)
  .then(() => process.exit(0))
  .catch(e => {
    console.error('发生错误:', e);
    process.exit(1);
  });
