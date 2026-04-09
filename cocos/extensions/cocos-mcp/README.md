# Cocos Creator MCP 插件

Cocos Creator 3.8.8 的 MCP (Model Context Protocol) 插件，用于与 AI 助手集成，实现编辑器自动化操作。

## 功能特性

- **场景操作**: 获取当前场景、列出所有场景、打开场景、保存场景
- **节点操作**: 创建节点、查找节点、删除节点、获取子节点
- **组件操作**: 添加组件、设置属性
- **预制体**: 实例化预制体
- **构建**: 执行项目构建

## 安装步骤

### 1. 安装插件

```bash
cd cocos/extensions/cocos-mcp
npm install
```

### 2. 编译 TypeScript

如果需要编译 TypeScript 文件：

```bash
npx tsc main.ts --outDir dist --module commonjs --target es2020 --esModuleInterop
```

或者直接使用：

```bash
npm run build
```

### 3. 在 Cocos Creator 中启用插件

1. 打开 Cocos Creator 3.8.8
2. 打开项目：`d:\77-myProject\苏打地牢\cocos`
3. 点击菜单：**扩展** -> **扩展管理器**
4. 在"项目"标签页中，你应该能看到 `cocos-mcp` 插件
5. 点击"启用"按钮

### 4. 启动 MCP 服务器

插件启用后，MCP 服务器会自动在端口 **9988** 启动。

你可以在 Cocos Creator 控制台看到以下日志：

```
[Cocos MCP] Plugin loaded
[Cocos MCP] Server started on port 9988
```

## 可用命令

### 场景操作

| 命令 | 描述 | 参数 |
|------|------|------|
| `scene_get_current` | 获取当前打开的场景 | 无 |
| `scene_list` | 列出所有场景 | 无 |
| `scene_open` | 打开指定场景 | `scenePath`: 场景路径（相对于 assets/scenes） |
| `scene_save` | 保存当前场景 | 无 |

### 节点操作

| 命令 | 描述 | 参数 |
|------|------|------|
| `node_create` | 创建新节点 | `name`, `parentPath`, `position`, `components` |
| `node_find` | 查找节点 | `name`: 节点名称 |
| `node_get_children` | 获取子节点 | `nodePath`: 节点路径 |
| `node_add_component` | 添加组件 | `nodePath`, `componentType` |
| `node_set_property` | 设置属性 | `nodePath`, `componentType`, `property`, `value` |
| `node_delete` | 删除节点 | `nodePath`: 节点路径 |

### 其他

| 命令 | 描述 | 参数 |
|------|------|------|
| `prefab_instantiate` | 实例化预制体 | `prefabPath`, `parentPath`, `position` |
| `build_project` | 构建项目 | `platform`, `buildPath` |

## 使用示例

### 创建场景节点

```
scene_open("MainMenuScene.scene")
node_create({
  name: "NewButton",
  parentPath: "Canvas/MainMenuRoot",
  position: { x: 0, y: 100, z: 0 },
  components: ["cc.Sprite", "cc.Button"]
})
```

### 查找并操作节点

```
node_find("StartButton")
node_add_component({
  nodePath: "Canvas/MainMenuRoot/StartButton",
  componentType: "cc.Button"
})
```

## 配置文件

插件配置位于 `package.json`，可修改项：

- `port`: MCP 服务器端口（默认 9988）
- `version`: 插件版本

## 注意事项

1. **编辑器状态**: 某些操作需要编辑器处于运行或暂停状态
2. **场景打开**: 在执行节点操作前，确保场景已打开
3. **权限**: 插件需要完整的编辑器权限
4. **端口占用**: 如果端口 9988 被占用，可在 `package.json` 中修改端口号

## 故障排除

### 插件未显示

- 确保 `extensions/cocos-mcp` 目录位于项目根目录
- 检查 `package.json` 的 `creator.version` 是否与编辑器版本匹配

### 连接失败

- 检查 MCP 服务器是否启动（Cocos Creator 控制台日志）
- 确认端口 9988 未被其他程序占用
- 检查防火墙设置

### 编译错误

- 确保已安装 Node.js 14+
- 运行 `npm install` 安装依赖
- 检查 TypeScript 版本：`npx tsc --version`

## 技术架构

```
AI Assistant (Trae)
    ↓ HTTP/WebSocket
Cocos Creator Extension (cocos-mcp)
    ↓ Editor API
Cocos Creator Editor
```

## 许可证

MIT License
