const http = require('http');
const fs = require('fs');
const path = require('path');

async function downloadImage() {
  const filename = 'z-image-turbo_00336_.png';
  const savePath = path.join(__dirname, '..', 'assets', 'images', 'resource-backup', filename);
  
  console.log('正在下载图片...');
  console.log('文件名:', filename);
  console.log('保存路径:', savePath);
  
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
        console.log('✓ 下载成功!');
        resolve(savePath);
      });
    });

    req.on('error', (e) => {
      console.error('下载失败:', e.message);
      reject(e);
    });
    
    req.end();
  });
}

downloadImage()
  .then(() => {
    console.log('\n✓ 完成!');
    process.exit(0);
  })
  .catch(e => {
    console.error('\n✗ 失败:', e.message);
    process.exit(1);
  });
