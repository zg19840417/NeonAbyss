"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLoad = onLoad;
exports.onBeforeLoad = onBeforeLoad;
const ws_1 = require("ws");
const cc_1 = require("cc");
let wss = null;
let mcpClients = new Set();
function startMCPServer() {
    const port = 9988;
    wss = new ws_1.WebSocketServer({ port });
    wss.on('connection', (ws) => {
        console.log('[Cocos MCP] AI Client connected');
        mcpClients.add(ws);
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                const response = await handleMCPMessage(message);
                ws.send(JSON.stringify(response));
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorResponse = {
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: `Internal error: ${errorMessage}`
                    },
                    id: null
                };
                ws.send(JSON.stringify(errorResponse));
            }
        });
        ws.on('close', () => {
            console.log('[Cocos MCP] AI Client disconnected');
            mcpClients.delete(ws);
        });
        ws.on('error', (err) => {
            console.error('[Cocos MCP] WebSocket error:', err);
            mcpClients.delete(ws);
        });
    });
    wss.on('error', (err) => {
        console.error('[Cocos MCP] Server error:', err);
    });
    console.log(`[Cocos MCP] Server started on port ${port}`);
}
async function handleMCPMessage(message) {
    const { method, params, id } = message;
    switch (method) {
        case 'initialize':
            return {
                jsonrpc: '2.0',
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {},
                        resources: {}
                    },
                    serverInfo: {
                        name: 'cocos-creator-mcp',
                        version: '1.0.0'
                    }
                },
                id
            };
        case 'tools/list':
            return {
                jsonrpc: '2.0',
                result: {
                    tools: [
                        {
                            name: 'scene_get_current',
                            description: 'Get current open scene information',
                            inputSchema: { type: 'object', properties: {} }
                        },
                        {
                            name: 'scene_list',
                            description: 'List all scenes in the project',
                            inputSchema: { type: 'object', properties: {} }
                        },
                        {
                            name: 'scene_open',
                            description: 'Open a specific scene',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    scenePath: { type: 'string', description: 'Scene path relative to assets/scenes' }
                                },
                                required: ['scenePath']
                            }
                        },
                        {
                            name: 'scene_save',
                            description: 'Save current scene',
                            inputSchema: { type: 'object', properties: {} }
                        },
                        {
                            name: 'node_create',
                            description: 'Create a new node in current scene',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', description: 'Node name' },
                                    parentPath: { type: 'string', description: 'Parent node path in hierarchy' },
                                    position: { type: 'object', description: 'Position {x, y, z}' },
                                    components: { type: 'array', description: 'Array of component types to add' }
                                },
                                required: ['name']
                            }
                        },
                        {
                            name: 'node_find',
                            description: 'Find node by name in current scene',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', description: 'Node name to search' }
                                },
                                required: ['name']
                            }
                        },
                        {
                            name: 'node_get_children',
                            description: 'Get children of a node',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    nodePath: { type: 'string', description: 'Node path in hierarchy' }
                                },
                                required: ['nodePath']
                            }
                        },
                        {
                            name: 'node_add_component',
                            description: 'Add component to a node',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    nodePath: { type: 'string', description: 'Node path in hierarchy' },
                                    componentType: { type: 'string', description: 'Component type (e.g., "cc.Sprite", "cc.Label")' }
                                },
                                required: ['nodePath', 'componentType']
                            }
                        },
                        {
                            name: 'node_set_property',
                            description: 'Set property on a node component',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    nodePath: { type: 'string', description: 'Node path in hierarchy' },
                                    componentType: { type: 'string', description: 'Component type' },
                                    property: { type: 'string', description: 'Property name' },
                                    value: { description: 'Property value' }
                                },
                                required: ['nodePath', 'componentType', 'property', 'value']
                            }
                        },
                        {
                            name: 'node_delete',
                            description: 'Delete a node from scene',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    nodePath: { type: 'string', description: 'Node path in hierarchy' }
                                },
                                required: ['nodePath']
                            }
                        },
                        {
                            name: 'prefab_instantiate',
                            description: 'Instantiate a prefab',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    prefabPath: { type: 'string', description: 'Prefab path relative to assets/prefabs' },
                                    parentPath: { type: 'string', description: 'Parent node path' },
                                    position: { type: 'object', description: 'Position {x, y, z}' }
                                },
                                required: ['prefabPath']
                            }
                        },
                        {
                            name: 'build_project',
                            description: 'Build the project',
                            inputSchema: {
                                type: 'object',
                                properties: {
                                    platform: { type: 'string', description: 'Build platform (web-mobile, android, etc.)' },
                                    buildPath: { type: 'string', description: 'Build output path' }
                                }
                            }
                        }
                    ]
                },
                id
            };
        case 'tools/call':
            return await handleToolCall(params.name, params.arguments, id);
        default:
            return {
                jsonrpc: '2.0',
                error: {
                    code: -32601,
                    message: `Method not found: ${method}`
                },
                id
            };
    }
}
async function handleToolCall(toolName, args, id) {
    try {
        let result;
        switch (toolName) {
            case 'scene_get_current':
                result = await getCurrentScene();
                break;
            case 'scene_list':
                result = await listScenes();
                break;
            case 'scene_open':
                result = await openScene(args.scenePath);
                break;
            case 'scene_save':
                result = await saveScene();
                break;
            case 'node_create':
                result = await createNode(args);
                break;
            case 'node_find':
                result = await findNode(args.name);
                break;
            case 'node_get_children':
                result = await getNodeChildren(args.nodePath);
                break;
            case 'node_add_component':
                result = await addComponent(args);
                break;
            case 'node_set_property':
                result = await setNodeProperty(args);
                break;
            case 'node_delete':
                result = await deleteNode(args.nodePath);
                break;
            case 'prefab_instantiate':
                result = await instantiatePrefab(args);
                break;
            case 'build_project':
                result = await buildProject(args);
                break;
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
        return {
            jsonrpc: '2.0',
            result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
            id
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            jsonrpc: '2.0',
            error: {
                code: -32603,
                message: errorMessage
            },
            id
        };
    }
}
async function getCurrentScene() {
    const scene = cc_1.editor.Scene && cc_1.editor.Scene.scene;
    if (!scene) {
        return { error: 'No scene is currently open' };
    }
    return {
        name: scene.name,
        uuid: scene.uuid
    };
}
async function listScenes() {
    const assetInfos = await cc_1.editor.assetdb.queryAssets('db://assets/scenes/**/*', 'uuid');
    return {
        scenes: assetInfos.map((info) => ({
            path: info.path,
            name: info.name,
            uuid: info.uuid
        }))
    };
}
async function openScene(scenePath) {
    const fullPath = `db://assets/scenes/${scenePath}`;
    await cc_1.editor.SceneUtils.requestOpenScene(fullPath);
    return { success: true, path: fullPath };
}
async function saveScene() {
    await cc_1.editor.SceneUtils.saveScene();
    return { success: true };
}
async function createNode(args) {
    const scene = cc_1.editor.Scene && cc_1.editor.Scene.scene;
    if (!scene) {
        throw new Error('No scene is currently open');
    }
    let parent = scene;
    if (args.parentPath) {
        const foundParent = findNodeByPath(args.parentPath);
        if (!foundParent) {
            throw new Error(`Parent node not found: ${args.parentPath}`);
        }
        parent = foundParent;
    }
    const newNode = new cc_1.Node(args.name);
    if (args.position) {
        newNode.position.set(args.position.x || 0, args.position.y || 0, args.position.z || 0);
    }
    if (args.components && Array.isArray(args.components)) {
        for (const compType of args.components) {
            const comp = addComponentByType(newNode, compType);
            if (!comp) {
                console.warn(`[Cocos MCP] Unknown component type: ${compType}`);
            }
        }
    }
    parent.addChild(newNode);
    return {
        success: true,
        node: {
            name: newNode.name,
            path: getNodePath(newNode),
            uuid: newNode.uuid
        }
    };
}
async function findNode(name) {
    const scene = cc_1.editor.Scene && cc_1.editor.Scene.scene;
    if (!scene) {
        throw new Error('No scene is currently open');
    }
    const node = findNodeByName(scene, name);
    if (!node) {
        return { found: false, name };
    }
    return {
        found: true,
        node: {
            name: node.name,
            path: getNodePath(node),
            active: node.active,
            children: node.children.map((child) => child.name)
        }
    };
}
async function getNodeChildren(nodePath) {
    const node = findNodeByPath(nodePath);
    if (!node) {
        throw new Error(`Node not found: ${nodePath}`);
    }
    return {
        nodePath,
        children: node.children.map((child) => ({
            name: child.name,
            path: getNodePath(child),
            active: child.active
        }))
    };
}
async function addComponent(args) {
    const node = findNodeByPath(args.nodePath);
    if (!node) {
        throw new Error(`Node not found: ${args.nodePath}`);
    }
    const comp = addComponentByType(node, args.componentType);
    if (!comp) {
        throw new Error(`Unknown component type: ${args.componentType}`);
    }
    return {
        success: true,
        component: {
            type: args.componentType,
            node: node.name
        }
    };
}
async function setNodeProperty(args) {
    const node = findNodeByPath(args.nodePath);
    if (!node) {
        throw new Error(`Node not found: ${args.nodePath}`);
    }
    const comp = node.getComponent(args.componentType);
    if (!comp) {
        throw new Error(`Component ${args.componentType} not found on node ${node.name}`);
    }
    comp[args.property] = args.value;
    return {
        success: true,
        node: node.name,
        component: args.componentType,
        property: args.property,
        value: args.value
    };
}
async function deleteNode(nodePath) {
    const node = findNodeByPath(nodePath);
    if (!node) {
        throw new Error(`Node not found: ${nodePath}`);
    }
    const parent = node.parent;
    if (parent) {
        parent.removeChild(node);
    }
    return { success: true, deleted: nodePath };
}
async function instantiatePrefab(args) {
    const prefabPath = `db://assets/prefabs/${args.prefabPath}`;
    const assetInfo = await cc_1.editor.assetdb.queryAssetInfo(prefabPath);
    if (!assetInfo) {
        throw new Error(`Prefab not found: ${prefabPath}`);
    }
    let parent = null;
    if (args.parentPath) {
        parent = findNodeByPath(args.parentPath);
    }
    const newNode = await cc_1.editor.assetdb.loadWithArgs(prefabPath, (err, asset) => {
        if (err) {
            throw new Error(`Failed to load prefab: ${err}`);
        }
    });
    return {
        success: true,
        prefab: args.prefabPath,
        instantiated: true
    };
}
async function buildProject(args) {
    const buildOptions = {
        platform: args.platform || 'web-mobile',
        buildPath: args.buildPath || 'build',
        debug: false
    };
    await cc_1.editor.Builder.build(buildOptions);
    return {
        success: true,
        platform: buildOptions.platform,
        buildPath: buildOptions.buildPath
    };
}
function findNodeByName(node, name) {
    if (node.name === name) {
        return node;
    }
    for (const child of node.children) {
        const found = findNodeByName(child, name);
        if (found) {
            return found;
        }
    }
    return null;
}
function findNodeByPath(path) {
    const scene = cc_1.editor.Scene && cc_1.editor.Scene.scene;
    if (!scene)
        return null;
    const parts = path.split('/').filter(p => p.length > 0);
    let current = scene;
    for (const part of parts) {
        if (!current)
            return null;
        let foundChild = null;
        for (const c of current.children) {
            if (c.name === part) {
                foundChild = c;
                break;
            }
        }
        if (!foundChild)
            return null;
        current = foundChild;
    }
    return current;
}
function getNodePath(node) {
    const parts = [];
    let current = node;
    while (current) {
        parts.unshift(current.name);
        current = current.parent;
    }
    return parts.join('/');
}
function addComponentByType(node, type) {
    const typeMap = {
        'cc.UITransform': cc_1.UITransform,
        'cc.Sprite': cc_1.Sprite,
        'cc.Label': cc_1.Label,
        'cc.Button': cc_1.Button
    };
    const ComponentClass = typeMap[type];
    if (ComponentClass) {
        return node.addComponent(ComponentClass);
    }
    return null;
}
function onLoad() {
    console.log('[Cocos MCP] Plugin loaded');
    startMCPServer();
}
function onBeforeLoad() {
    console.log('[Cocos MCP] Plugin unloading');
    if (wss) {
        wss.close();
        wss = null;
    }
}
