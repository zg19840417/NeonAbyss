# cocos-mcp

给 `Cocos Creator 3.8.8` 用的本地桥接扩展。

它做两件事：

1. 在 Creator 里注册一个 `scene script`，真正执行场景、节点、组件操作。
2. 在本机启动一个 `WebSocket` 桥接服务，供外部标准 MCP Server 转发调用。

## 当前支持的能力

- `cocos_status`
- `scene_list`
- `scene_open`
- `scene_save`
- `scene_get_current`
- `scene_get_hierarchy`
- `node_find`
- `node_create`
- `node_delete`
- `node_set_position`
- `node_set_active`
- `component_add`
- `label_set_text`

## 安装

```powershell
cd D:\77-myProject\苏打地牢\cocos\extensions\cocos-mcp
npm install
npm run build
```

## 在 Cocos Creator 中启用

1. 打开项目 `D:\77-myProject\苏打地牢\cocos`
2. 进入“扩展 -> 扩展管理器”
3. 在“项目扩展”里启用 `cocos-mcp`

启用成功后，控制台应看到类似日志：

```text
[cocos-mcp] Extension loaded
[cocos-mcp] Bridge listening on ws://127.0.0.1:9988
```

## 外部 MCP Server

标准 `stdio` MCP Server 在：

`D:\77-myProject\苏打地牢\cocos\tools\cocos-mcp-server`

安装并启动：

```powershell
cd D:\77-myProject\苏打地牢\cocos\tools\cocos-mcp-server
npm install
npm start
```

这个进程会把标准 MCP 工具调用转发到 Creator 内部的桥接扩展。

## 注意

- 先打开 `Cocos Creator`，再启动外部 MCP Server。
- `scene_open` / `scene_save` 依赖 Creator 编辑器消息通道；如果某些版本行为有差异，先确认当前项目在编辑器内能正常打开和保存场景。
- 节点路径支持两种写法：
  - `Canvas/MainMenuRoot/StartButton`
  - `MainMenuScene/Canvas/MainMenuRoot/StartButton`
