const http = require('http');
const fs = require('fs');
const path = require('path');

async function checkQueue() {
  const configPath = path.join(__dirname, 'comfyui-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.comfyui.host,
      port: config.comfyui.port,
      path: '/queue',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const queue = JSON.parse(data);
          console.log('队列状态:');
          console.log(JSON.stringify(queue, null, 2));
          resolve(queue);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

checkQueue()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('检查队列失败:', e);
    process.exit(1);
  });
