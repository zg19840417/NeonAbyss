import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';

declare const Editor: any;

const DEFAULT_PORT = 9988;
const SCENE_SCRIPT_NAME = 'cocos-mcp';

type JsonRpcId = string | number | null;

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'cocos_status',
    description: 'Get Cocos Creator bridge status and project path.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'scene_list',
    description: 'List all scenes under assets/scenes.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'scene_open',
    description: 'Open a scene in Cocos Creator.',
    inputSchema: {
      type: 'object',
      properties: {
        scenePath: {
          type: 'string',
          description: 'Scene path relative to assets/scenes, e.g. MainMenuScene.scene',
        },
      },
      required: ['scenePath'],
    },
  },
  {
    name: 'scene_save',
    description: 'Save the currently open scene.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'scene_get_current',
    description: 'Get the current open scene and basic stats.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'scene_get_hierarchy',
    description: 'Get the node hierarchy of the current scene.',
    inputSchema: {
      type: 'object',
      properties: {
        depth: {
          type: 'number',
          description: 'Maximum depth to serialize. Default 5.',
        },
      },
    },
  },
  {
    name: 'node_find',
    description: 'Find nodes by name in the current scene.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Node name to search.',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'node_create',
    description: 'Create a node under the given parent path.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Node name.' },
        parentPath: {
          type: 'string',
          description: 'Hierarchy path such as Canvas/MainMenuRoot. Empty means scene root.',
        },
        position: {
          type: 'object',
          description: 'Position object: { x, y, z }',
        },
        components: {
          type: 'array',
          description: 'Component names such as cc.UITransform, cc.Sprite, cc.Label, cc.Button.',
          items: { type: 'string' },
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'node_delete',
    description: 'Delete a node by hierarchy path.',
    inputSchema: {
      type: 'object',
      properties: {
        nodePath: {
          type: 'string',
          description: 'Hierarchy path of the node.',
        },
      },
      required: ['nodePath'],
    },
  },
  {
    name: 'node_set_position',
    description: 'Set the local position of a node.',
    inputSchema: {
      type: 'object',
      properties: {
        nodePath: { type: 'string' },
        position: {
          type: 'object',
          description: 'Position object: { x, y, z }',
        },
      },
      required: ['nodePath', 'position'],
    },
  },
  {
    name: 'node_set_active',
    description: 'Set a node active or inactive.',
    inputSchema: {
      type: 'object',
      properties: {
        nodePath: { type: 'string' },
        active: { type: 'boolean' },
      },
      required: ['nodePath', 'active'],
    },
  },
  {
    name: 'component_add',
    description: 'Add a supported component to a node.',
    inputSchema: {
      type: 'object',
      properties: {
        nodePath: { type: 'string' },
        componentType: {
          type: 'string',
          description: 'Supported: cc.UITransform, cc.Sprite, cc.Label, cc.Button.',
        },
      },
      required: ['nodePath', 'componentType'],
    },
  },
  {
    name: 'label_set_text',
    description: 'Set the string of a cc.Label component on a node.',
    inputSchema: {
      type: 'object',
      properties: {
        nodePath: { type: 'string' },
        text: { type: 'string' },
      },
      required: ['nodePath', 'text'],
    },
  },
];

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function load() {
  log('Extension loaded');
  startServer();
}

export function unload() {
  log('Extension unloading');
  stopServer();
}

function startServer() {
  if (wss) {
    return;
  }

  wss = new WebSocketServer({ port: DEFAULT_PORT });
  wss.on('connection', (socket) => {
    clients.add(socket);
    log('MCP bridge client connected');

    socket.on('message', async (raw) => {
      const response = await handleIncomingMessage(String(raw));
      socket.send(JSON.stringify(response));
    });

    socket.on('close', () => {
      clients.delete(socket);
      log('MCP bridge client disconnected');
    });

    socket.on('error', (error) => {
      clients.delete(socket);
      log(`Socket error: ${error instanceof Error ? error.message : String(error)}`);
    });
  });

  wss.on('listening', () => {
    log(`Bridge listening on ws://127.0.0.1:${DEFAULT_PORT}`);
  });

  wss.on('error', (error) => {
    log(`Server error: ${error instanceof Error ? error.message : String(error)}`);
  });
}

function stopServer() {
  for (const client of clients) {
    client.close();
  }
  clients.clear();

  if (wss) {
    wss.close();
    wss = null;
  }
}

async function handleIncomingMessage(payload: string) {
  let message: any;

  try {
    message = JSON.parse(payload);
  } catch (error) {
    return makeError(null, -32700, `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const id = message?.id ?? null;
  const method = message?.method;

  try {
    switch (method) {
      case 'initialize':
        return makeResult(id, {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'cocos-creator-bridge',
            version: '1.0.0',
          },
        });
      case 'tools/list':
        return makeResult(id, { tools: TOOL_DEFINITIONS });
      case 'tools/call':
        return await handleToolCall(id, message?.params?.name, message?.params?.arguments ?? {});
      default:
        return makeError(id, -32601, `Method not found: ${String(method)}`);
    }
  } catch (error) {
    return makeError(id, -32603, error instanceof Error ? error.message : String(error));
  }
}

async function handleToolCall(id: JsonRpcId, toolName: string, args: Record<string, unknown>) {
  switch (toolName) {
    case 'cocos_status':
      return makeTextResult(id, {
        ok: true,
        port: DEFAULT_PORT,
        projectPath: getProjectPath(),
        extension: SCENE_SCRIPT_NAME,
      });
    case 'scene_list':
      return makeTextResult(id, {
        scenes: listFilesUnder('assets/scenes', '.scene'),
      });
    case 'scene_open':
      return makeTextResult(id, await openScene(String(args.scenePath ?? '')));
    case 'scene_save':
      return makeTextResult(id, await saveScene());
    case 'scene_get_current':
      return makeTextResult(id, await executeSceneScript('sceneGetCurrent'));
    case 'scene_get_hierarchy':
      return makeTextResult(id, await executeSceneScript('sceneGetHierarchy', Number(args.depth ?? 5)));
    case 'node_find':
      return makeTextResult(id, await executeSceneScript('nodeFind', String(args.name ?? '')));
    case 'node_create':
      return makeTextResult(id, await executeSceneScript('nodeCreate', args));
    case 'node_delete':
      return makeTextResult(id, await executeSceneScript('nodeDelete', String(args.nodePath ?? '')));
    case 'node_set_position':
      return makeTextResult(
        id,
        await executeSceneScript('nodeSetPosition', String(args.nodePath ?? ''), args.position ?? {}),
      );
    case 'node_set_active':
      return makeTextResult(
        id,
        await executeSceneScript('nodeSetActive', String(args.nodePath ?? ''), Boolean(args.active)),
      );
    case 'component_add':
      return makeTextResult(
        id,
        await executeSceneScript('componentAdd', String(args.nodePath ?? ''), String(args.componentType ?? '')),
      );
    case 'label_set_text':
      return makeTextResult(
        id,
        await executeSceneScript('labelSetText', String(args.nodePath ?? ''), String(args.text ?? '')),
      );
    default:
      return makeError(id, -32601, `Unknown tool: ${toolName}`);
  }
}

async function executeSceneScript(method: string, ...args: unknown[]) {
  return await Editor.Message.request('scene', 'execute-scene-script', {
    name: SCENE_SCRIPT_NAME,
    method,
    args,
  });
}

async function openScene(scenePath: string) {
  const normalized = normalizeAssetRelativePath(scenePath, 'scenes', '.scene');
  const dbPath = `db://assets/scenes/${normalized}`;
  const errors: string[] = [];

  try {
    const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', dbPath);
    const openTarget = assetInfo?.uuid ?? dbPath;
    await Editor.Message.request('asset-db', 'open-asset', openTarget);
    return {
      success: true,
      scenePath: normalized,
      dbPath,
      uuid: assetInfo?.uuid ?? null,
    };
  } catch (error) {
    errors.push(`asset-db/open-asset failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    await Editor.Message.request('scene', 'open-scene', dbPath);
    return {
      success: true,
      scenePath: normalized,
      dbPath,
      via: 'scene/open-scene',
    };
  } catch (error) {
    errors.push(`scene/open-scene failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  throw new Error(`Unable to open scene ${dbPath}. ${errors.join(' | ')}`);
}

async function saveScene() {
  const attempts: Array<[string, string]> = [
    ['scene', 'save-scene'],
    ['scene', 'save'],
  ];
  const errors: string[] = [];

  for (const [channel, method] of attempts) {
    try {
      const result = await Editor.Message.request(channel, method);
      return {
        success: true,
        via: `${channel}/${method}`,
        result: result ?? null,
      };
    } catch (error) {
      errors.push(`${channel}/${method}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Unable to save current scene. ${errors.join(' | ')}`);
}

function listFilesUnder(relativeDir: string, extension: string) {
  const baseDir = path.join(getProjectPath(), relativeDir);
  if (!fs.existsSync(baseDir)) {
    return [];
  }

  const results: string[] = [];
  walkFiles(baseDir, (absolutePath) => {
    if (absolutePath.endsWith(extension)) {
      results.push(toPosixPath(path.relative(baseDir, absolutePath)));
    }
  });

  return results.sort((a, b) => a.localeCompare(b));
}

function walkFiles(dirPath: string, onFile: (absolutePath: string) => void) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolutePath, onFile);
      continue;
    }
    onFile(absolutePath);
  }
}

function getProjectPath(): string {
  return Editor?.Project?.path ?? process.cwd();
}

function normalizeAssetRelativePath(input: string, prefix: string, extension: string) {
  const raw = toPosixPath(String(input || '').trim());
  if (!raw) {
    throw new Error('scenePath is required');
  }

  let normalized = raw.replace(/^db:\/\/assets\//, '');
  if (normalized.startsWith(`${prefix}/`)) {
    normalized = normalized.slice(prefix.length + 1);
  }
  if (!normalized.endsWith(extension)) {
    normalized = `${normalized}${extension}`;
  }
  return normalized;
}

function toPosixPath(value: string) {
  return value.replace(/\\/g, '/');
}

function makeResult(id: JsonRpcId, result: unknown) {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

function makeTextResult(id: JsonRpcId, data: unknown) {
  return makeResult(id, {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data,
  });
}

function makeError(id: JsonRpcId, code: number, message: string) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  };
}

function log(message: string) {
  console.log(`[cocos-mcp] ${message}`);
}
