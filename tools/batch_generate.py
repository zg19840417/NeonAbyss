import json
import subprocess
import sys
import os
import time

# 加载待生成列表
with open(r'd:\77-myProject\苏打地牢\tools\to_generate.json', 'r', encoding='utf-8') as f:
    to_generate = json.load(f)

print(f"待生成角色数量: {len(to_generate)}")

# 启动ComfyUI连接测试
print("\n正在测试ComfyUI连接...")
try:
    result = subprocess.run(
        ['node', 'test-comfyui-connection.js'],
        cwd=r'd:\77-myProject\苏打地牢\tools',
        capture_output=True,
        text=True,
        timeout=30
    )
    if result.returncode == 0:
        print("ComfyUI连接正常")
    else:
        print("ComfyUI连接失败")
        print(result.stdout)
        print(result.stderr)
        sys.exit(1)
except Exception as e:
    print(f"连接测试出错: {e}")
    sys.exit(1)

# 逐个生成
for i, item in enumerate(to_generate, 1):
    print(f"\n{'='*50}")
    print(f"[{i}/{len(to_generate)}] 正在生成 {item['fm']}: {item['name']}")
    print(f"{'='*50}")
    
    # 构建命令
    cmd = [
        'node', 'auto-portrait-generator.js',
        item['fm'],
        item['name'],
        item['prompt']
    ]
    
    try:
        result = subprocess.run(
            cmd,
            cwd=r'd:\77-myProject\苏打地牢\tools',
            capture_output=True,
            text=True,
            timeout=600  # 10分钟超时
        )
        
        if result.returncode == 0:
            print(f"✓ 生成成功")
            # 检查输出文件是否存在
            output_path = rf'd:\77-myProject\苏打地牢\assets\images\characters\fusion\{item["fm"]}.png'
            if os.path.exists(output_path):
                print(f"✓ 文件已保存: {output_path}")
            else:
                print(f"⚠ 文件未找到: {output_path}")
        else:
            print(f"✗ 生成失败")
            print(result.stdout)
            if result.stderr:
                print(f"错误: {result.stderr}")
                
    except subprocess.TimeoutExpired:
        print(f"✗ 生成超时 (10分钟)")
    except Exception as e:
        print(f"✗ 发生错误: {e}")
    
    # 等待3秒再继续下一个，避免过快
    if i < len(to_generate):
        print("等待3秒...")
        time.sleep(3)

print(f"\n{'='*50}")
print(f"批量生成完成!")
print(f"{'='*50}")
