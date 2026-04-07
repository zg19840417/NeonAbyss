const http = require('http');
const fs = require('fs');
const path = require('path');

async function downloadImage(filename, savePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(savePath);
    
    const options = {
      hostname: '127.0.0.1',
      port: 8188,
      path: `/view?filename=${encodeURIComponent(filename)}&subfolder=&type=output`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log('响应状态:', res.statusCode);
      
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

async function main() {
  const promptId = '16c0feae-42e2-4d56-9310-78c4d9b58265';
  const outputFolder = path.join(__dirname, '..', 'assets', 'images', 'characters', 'boss');
  
  console.log('正在获取历史记录...');
  
  const history = await new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 8188,
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

  if (!history || !history[promptId]) {
    console.log('未找到历史记录');
    return;
  }

  console.log('历史记录状态:', history[promptId].status);

  const outputs = history[promptId].outputs;
  console.log('outputs:', JSON.stringify(outputs, null, 2));

  if (outputs) {
    for (const nodeId of Object.keys(outputs)) {
      const nodeData = outputs[nodeId];
      if (nodeData.images && nodeData.images.length > 0) {
        console.log(`\n节点 ${nodeId} 有 ${nodeData.images.length} 张图片`);
        
        for (const img of nodeData.images) {
          console.log('图片:', img.filename);
          const savePath = path.join(outputFolder, 'B001.png');
          
          try {
            await downloadImage(img.filename, savePath);
            console.log('✓ 已保存:', savePath);
            
            const stats = fs.statSync(savePath);
            console.log('文件大小:', stats.size, 'bytes');
          } catch (e) {
            console.error('✗ 下载失败:', e.message);
          }
        }
      }
    }
  }
}

main().catch(e => {
  console.error('错误:', e);
  process.exit(1);
});
