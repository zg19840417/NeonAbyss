const http = require('http');
const path = require('path');
const fs = require('fs');

async function testComfyUIConnection() {
  const configPath = path.join(__dirname, 'comfyui-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  const host = config.comfyui.host;
  const port = config.comfyui.port;

  console.log('正在测试 ComfyUI 连接...');
  console.log(`地址: ${host}:${port}\n`);

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: host,
      port: port,
      path: '/system_stats',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✓ ComfyUI 连接成功！');
        console.log('响应状态:', res.statusCode);
        try {
          const stats = JSON.parse(data);
          console.log('系统信息:', JSON.stringify(stats, null, 2));
        } catch (e) {
          console.log('响应内容:', data);
        }
        resolve(true);
      });
    });

    req.on('error', (e) => {
      console.error('✗ 无法连接到 ComfyUI');
      console.error('错误:', e.message);
      console.error('\n请确保 ComfyUI 正在运行并启用了 API 功能');
      console.error('启动命令示例:');
      console.error('  python main.py --listen 127.0.0.1 --port 8188');
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('✗ 连接超时');
      reject(new Error('Connection timeout'));
    });

    req.end();
  });
}

testComfyUIConnection()
  .then(() => {
    console.log('\n✓ 连接测试通过！可以开始生成图片');
    process.exit(0);
  })
  .catch(() => {
    console.log('\n✗ 连接测试失败');
    process.exit(1);
  });
