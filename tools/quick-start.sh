#!/bin/bash

# ComfyUI 快速启动脚本

echo "==========================================="
echo "   ComfyUI 快速启动工具"
echo "==========================================="
echo ""

# 检查 ComfyUI 是否在运行
echo "1. 检查 ComfyUI 连接状态..."
node tools/test-comfyui-connection.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ ComfyUI 正在运行!"
    echo ""
    
    # 检查队列
    echo "2. 检查队列状态..."
    node tools/check-queue.js
    
    echo ""
    echo "==========================================="
    echo "ComfyUI 状态正常，可以开始生成!"
    echo "==========================================="
    echo ""
    echo "使用方法:"
    echo "  交互式界面: node tools/comfyui-turbo-generator.js"
    echo "  快速生成:   node tools/generate-with-monitoring.js \"提示词\""
    echo ""
else
    echo ""
    echo "✗ ComfyUI 未运行"
    echo ""
    echo "请按以下步骤启动 ComfyUI:"
    echo ""
    echo "1. 打开一个新的终端窗口"
    echo "2. 进入 ComfyUI 目录:"
    echo "   cd /path/to/ComfyUI"
    echo ""
    echo "3. 运行以下命令启动 ComfyUI:"
    echo "   python main.py --listen 127.0.0.1 --port 8188"
    echo ""
    echo "4. 等待看到 'Starting server' 或 'Server started' 消息"
    echo "5. 然后再次运行此脚本验证连接"
    echo ""
    echo "或者直接在浏览器中打开:"
    echo "   http://127.0.0.1:8188"
    echo ""
fi
