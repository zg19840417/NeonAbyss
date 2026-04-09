import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import WebSocket from 'ws';

const BRIDGE_URL = process.env.COCOS_MCP_BRIDGE_URL || 'ws://127.0.0.1:9988';

class BridgeClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
    this.connecting = null;
  }

  async connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return this.socket;
    }

    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = new Promise((resolve, reject) => {
      const socket = new WebSocket(this.url);

      socket.on('open', () => {
        this.socket = socket;
        this.connecting = null;
        resolve(socket);
      });

      socket.on('message', (raw) => {
        this.handleMessage(String(raw));
      });

      socket.on('close', () => {
        this.socket = null;
        const error = new Error(
          'Connection to the Cocos Creator bridge was closed. Make sure Cocos Creator is open and the cocos-mcp extension is enabled.',
        );
        for (const { reject: rejectPending } of this.pending.values()) {
          rejectPending(error);
        }
        this.pending.clear();
      });

      socket.on('error', (error) => {
        if (this.connecting) {
          this.connecting = null;
          reject(error);
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        for (const { reject: rejectPending } of this.pending.values()) {
          rejectPending(new Error(message));
        }
        this.pending.clear();
      });
    });

    return this.connecting;
  }

  handleMessage(raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    const pending = this.pending.get(message.id);
    if (!pending) {
      return;
    }

    this.pending.delete(message.id);

    if (message.error) {
      pending.reject(new Error(message.error.message || 'Unknown bridge error'));
      return;
    }

    pending.resolve(message.result);
  }

  async request(method, params = {}) {
    const socket = await this.connect();
    const id = this.nextId++;

    const payload = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return await new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      socket.send(JSON.stringify(payload), (error) => {
        if (error) {
          this.pending.delete(id);
          reject(error);
        }
      });
    });
  }

  async listTools() {
    const result = await this.request('tools/list');
    return result?.tools ?? [];
  }

  async callTool(name, args) {
    return await this.request('tools/call', {
      name,
      arguments: args ?? {},
    });
  }
}

const bridge = new BridgeClient(BRIDGE_URL);

const server = new Server(
  {
    name: 'soda-dungeon-cocos-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = await bridge.listTools();
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = await bridge.callTool(request.params.name, request.params.arguments ?? {});
  return {
    content: result?.content ?? [],
    structuredContent: result?.structuredContent,
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
