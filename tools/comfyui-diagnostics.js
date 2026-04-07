const http = require('http');
const fs = require('fs');
const path = require('path');

async function comfyuiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 8188,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function clearQueue() {
  console.log('正在清除队列...\n');
  
  try {
    const queueResult = await comfyuiRequest('/queue', 'DELETE');
    console.log('清除队列结果:', queueResult);
  } catch (e) {
    console.log('清除队列时出错:', e.message);
  }
}

async function checkSystemStats() {
  console.log('\n检查系统状态...\n');
  
  try {
    const stats = await comfyuiRequest('/system_stats');
    console.log('系统信息:');
    console.log(JSON.stringify(stats.data, null, 2));
  } catch (e) {
    console.log('获取系统状态失败:', e.message);
  }
}

async function checkObjectInfo() {
  console.log('\n检查可用的节点类型...\n');
  
  try {
    const info = await comfyuiRequest('/object_info');
    console.log('可用的节点类型数量:', Object.keys(info.data).length);
    
    const relevantNodes = ['CheckpointLoader', 'EmptyLatentImage', 'CLIPTextEncode', 'KSampler', 'VAEDecode', 'SaveImage'];
    
    console.log('\n关键节点检查:');
    relevantNodes.forEach(nodeName => {
      const found = Object.keys(info.data).some(key => key.includes(nodeName));
      console.log(`  ${nodeName}: ${found ? '✓ 可用' : '✗ 不可用'}`);
    });
  } catch (e) {
    console.log('获取节点信息失败:', e.message);
  }
}

async function checkHistory() {
  console.log('\n检查历史记录...\n');
  
  try {
    const history = await comfyuiRequest('/history?max_entries=5');
    
    if (Array.isArray(history.data)) {
      console.log('最近的生成记录:');
      history.data.slice(0, 5).forEach((record, i) => {
        console.log(`\n记录 ${i + 1}:`);
        console.log(JSON.stringify(record, null, 2));
      });
    } else {
      const promptIds = Object.keys(history.data);
      console.log(`找到 ${promptIds.length} 条历史记录`);
      
      promptIds.slice(0, 3).forEach(promptId => {
        console.log(`\nPrompt ID: ${promptId}`);
        console.log(JSON.stringify(history.data[promptId], null, 2));
      });
    }
  } catch (e) {
    console.log('获取历史记录失败:', e.message);
  }
}

async function main() {
  console.log('===========================================');
  console.log('   ComfyUI 诊断工具');
  console.log('===========================================\n');

  await clearQueue();
  await checkSystemStats();
  await checkObjectInfo();
  await checkHistory();

  console.log('\n===========================================');
  console.log('诊断完成');
  console.log('===========================================\n');
  
  console.log('建议:');
  console.log('1. 如果系统正常但任务卡住，可能是模型加载问题');
  console.log('2. 检查 ComfyUI 终端窗口是否有错误信息');
  console.log('3. 尝试重启 ComfyUI');
  console.log('4. 确认 image_z_image_turbo 工作流是否正确设置');
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('发生错误:', e);
    process.exit(1);
  });
