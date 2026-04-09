declare module 'cc' {
  export class Vec3 {
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): void;
  }
  
  export class Node {
    name: string;
    uuid: string;
    active: boolean;
    parent: Node | null;
    children: Node[];
    position: Vec3;
    
    constructor(name?: string);
    addChild(child: Node): void;
    removeChild(child: Node): void;
    getComponent<T>(type: new (...args: any[]) => T): T | null;
    addComponent<T>(type: new (...args: any[]) => T): T;
  }
  
  export class Component {
    name: string;
    node: Node;
  }
  
  export class Scene extends Node {}
  
  export class UITransform extends Component {}
  export class Sprite extends Component {}
  export class Label extends Component {}
  export class Button extends Component {}
  
  export namespace editor {
    namespace Scene {
      const scene: Scene | null;
    }
    
    namespace SceneUtils {
      function requestOpenScene(path: string): Promise<void>;
      function saveScene(): Promise<void>;
    }
    
    namespace assetdb {
      function queryAssets(pattern: string, type: string): Promise<any[]>;
      function queryAssetInfo(path: string): Promise<any>;
      function loadWithArgs(path: string, callback: (err: any, asset: any) => void): any;
    }
    
    namespace Builder {
      function build(options: any): Promise<void>;
    }
  }
}

declare module 'ws' {
  export class WebSocketServer {
    constructor(options: { port: number });
    on(event: string, callback: (...args: any[]) => void): void;
    close(): void;
  }
  
  export class WebSocket {
    send(data: string | Buffer): void;
    on(event: string, callback: (...args: any[]) => void): void;
    close(): void;
  }
}
