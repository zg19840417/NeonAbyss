# ComfyUI 文生图工具使用说明

## 📋 前提条件

### 1. 确保 ComfyUI 已安装并配置好

ComfyUI 需要：
- Python 3.10+
- 必要的深度学习模型（SD, SDXL, Turbo 等）
- 网络连接（如果使用在线模型）

### 2. 启动 ComfyUI

在 ComfyUI 目录中运行：

```bash
# Windows
python main.py --listen 127.0.0.1 --port 8188

# 或使用默认设置
python main.py
```

**重要参数说明：**
- `--listen 127.0.0.1`: 允许本地网络访问（必须！）
- `--port 8188`: API 端口（必须！）
- `--force-upcast-attention`: 兼容性参数（推荐）

### 3. 验证 ComfyUI 是否运行

在浏览器中打开：
```
http://127.0.0.1:8188
```

你应该能看到 ComfyUI 的 Web 界面。

## 🎯 使用方法

### 方法一：交互式界面（推荐）

在项目根目录运行：

```bash
node tools/comfyui-turbo-generator.js
```

这个工具会：
1. 连接 ComfyUI
2. 让你选择分辨率
3. 输入提示词
4. 确认后自动生成并保存图片

### 方法二：命令行快速生成

```bash
# 基本用法
node tools/generate-with-monitoring.js "提示词" 宽度 高度 步数

# 示例
node tools/generate-with-monitoring.js "a cute anime girl" 512 512 8
```

## ⚙️ 可用工具列表

1. **comfyui-turbo-generator.js** - 交互式生成工具（推荐）
   - 让你选择分辨率（512x512, 768x768, 1024x1024 等）
   - 输入提示词
   - 可选：负向提示词、采样步数
   - 自动保存到 `assets/images/resource-backup/`

2. **generate-with-monitoring.js** - 命令行生成工具
   ```bash
   # 使用方法
   node tools/generate-with-monitoring.js "提示词" [宽度] [高度] [步数]
   
   # 示例
   node tools/generate-with-monitoring.js "fantasy landscape" 768 768 20
   ```

3. **download-comfyui-images.js** - 下载已有图片
   ```bash
   node tools/download-comfyui-images.js <prompt_id>
   ```

4. **check-queue.js** - 查看队列状态
   ```bash
   node tools/check-queue.js
   ```

5. **comfyui-diagnostics.js** - 诊断工具
   ```bash
   node tools/comfyui-diagnostics.js
   ```

## 🔧 配置文件

编辑 `tools/comfyui-config.json` 来自定义：

```json
{
  "comfyui": {
    "host": "127.0.0.1",
    "port": 8188
  },
  "output": {
    "default_folder": "assets/images/resource-backup"
  },
  "defaults": {
    "width": 512,
    "height": 512,
    "steps": 20,
    "cfg": 7,
    "sampler_name": "euler_ancestral"
  },
  "common": {
    "negative_prompt": "low quality, blurry..."
  }
}
```

## 📁 输出目录

生成的图片默认保存到：
```
assets/images/resource-backup/
```

文件名格式：`{提示词关键词}_{时间戳}.png`

## ❓ 常见问题

### 1. 连接被拒绝 (ECONNREFUSED)

**原因**：ComfyUI 没有运行

**解决**：
```bash
# 启动 ComfyUI
cd /path/to/ComfyUI
python main.py --listen 127.0.0.1 --port 8188
```

### 2. 模型加载失败

**原因**：指定的模型不存在或路径错误

**解决**：
- 检查 `tools/comfyui-config.json` 中的模型名称
- 确认模型文件在 ComfyUI 的 `models/checkpoints/` 目录中
- 使用 ComfyUI 界面中可见的模型名称

### 3. 任务卡住不完成

**可能原因**：
- GPU 显存不足
- 模型加载卡住
- 工作流配置错误

**解决**：
1. 检查 ComfyUI 终端窗口的错误信息
2. 重启 ComfyUI
3. 使用较小的分辨率测试
4. 确认 GPU 驱动和 CUDA 版本正确

### 4. 提示词验证失败

**原因**：工作流节点配置不匹配

**解决**：
- 确保使用的模型支持该工作流
- 检查 ComfyUI 中的 `object_info` 接口确认可用节点

## 🎨 测试流程

建议按以下顺序测试：

1. **第一步**：启动 ComfyUI 并验证连接
   ```bash
   # 在 ComfyUI 目录
   python main.py --listen 127.0.0.1 --port 8188
   
   # 新开终端，测试连接
   node tools/test-comfyui-connection.js
   ```

2. **第二步**：使用诊断工具
   ```bash
   node tools/comfyui-diagnostics.js
   ```

3. **第三步**：生成测试图片
   ```bash
   node tools/generate-with-monitoring.js "test image" 512 512 4
   ```

4. **第四步**：使用交互式界面
   ```bash
   node tools/comfyui-turbo-generator.js
   ```

## 📞 获取帮助

如果遇到问题：

1. 检查 ComfyUI 终端是否有错误信息
2. 查看 ComfyUI Web 界面的控制台日志
3. 运行诊断工具获取详细信息
4. 确认所有依赖和模型都已正确安装

## 🔗 相关资源

- ComfyUI GitHub: https://github.com/comfyanonymous/ComfyUI
- ComfyUI 官方文档: https://github.com/comfyanonymous/ComfyUI
- 模型下载: https://civitai.com/, https://huggingface.co/
