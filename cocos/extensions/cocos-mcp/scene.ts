/// <reference path="../../temp/declarations/cc.d.ts" />

import { Button, Label, Node, Sprite, UITransform, Vec3, director } from 'cc';

type PositionInput = {
  x?: number;
  y?: number;
  z?: number;
};

type CreateNodeArgs = {
  name: string;
  parentPath?: string;
  position?: PositionInput;
  components?: string[];
};

type HierarchyNode = {
  name: string;
  path: string;
  active: boolean;
  children: HierarchyNode[];
};

const COMPONENT_MAP: Record<string, new () => unknown> = {
  'cc.UITransform': UITransform,
  'cc.Sprite': Sprite,
  'cc.Label': Label,
  'cc.Button': Button,
};

export function sceneGetCurrent() {
  const scene = getScene();
  return {
    name: scene.name,
    childCount: scene.children.length,
    children: scene.children.map((child) => child.name),
  };
}

export function sceneGetHierarchy(depth = 5) {
  const scene = getScene();
  return {
    name: scene.name,
    hierarchy: scene.children.map((child) => serializeNode(child, 1, depth)),
  };
}

export function nodeFind(name: string) {
  const scene = getScene();
  const matches: Node[] = [];
  visitNode(scene, (node) => {
    if (node !== scene && node.name === name) {
      matches.push(node);
    }
  });

  return {
    name,
    count: matches.length,
    matches: matches.map((node) => ({
      name: node.name,
      path: getNodePath(node),
      active: node.active,
      children: node.children.map((child) => child.name),
    })),
  };
}

export function nodeCreate(args: CreateNodeArgs) {
  if (!args?.name) {
    throw new Error('name is required');
  }

  const parent = args.parentPath ? findNodeByPath(args.parentPath) : getScene();
  if (!parent) {
    throw new Error(`Parent node not found: ${args.parentPath}`);
  }

  const node = new Node(args.name);
  parent.addChild(node);

  if (args.position) {
    node.setPosition(toVec3(args.position));
  }

  const addedComponents: string[] = [];
  for (const componentType of args.components ?? []) {
    addComponentToNode(node, componentType);
    addedComponents.push(componentType);
  }

  return {
    success: true,
    node: {
      name: node.name,
      path: getNodePath(node),
      active: node.active,
    },
    addedComponents,
  };
}

export function nodeDelete(nodePath: string) {
  const node = requireNode(nodePath);
  const targetPath = getNodePath(node);
  node.removeFromParent();
  node.destroy();

  return {
    success: true,
    deleted: targetPath,
  };
}

export function nodeSetPosition(nodePath: string, position: PositionInput) {
  const node = requireNode(nodePath);
  node.setPosition(toVec3(position));

  return {
    success: true,
    nodePath: getNodePath(node),
    position: {
      x: node.position.x,
      y: node.position.y,
      z: node.position.z,
    },
  };
}

export function nodeSetActive(nodePath: string, active: boolean) {
  const node = requireNode(nodePath);
  node.active = !!active;

  return {
    success: true,
    nodePath: getNodePath(node),
    active: node.active,
  };
}

export function componentAdd(nodePath: string, componentType: string) {
  const node = requireNode(nodePath);
  const component = addComponentToNode(node, componentType) as { constructor?: { name?: string } };

  return {
    success: true,
    nodePath: getNodePath(node),
    componentType,
    componentName: component.constructor?.name ?? 'UnknownComponent',
  };
}

export function labelSetText(nodePath: string, text: string) {
  const node = requireNode(nodePath);
  const label =
    (node.getComponent(Label as never) as Label | null) ?? (node.addComponent(Label as never) as Label);
  label.string = text;

  return {
    success: true,
    nodePath: getNodePath(node),
    text: label.string,
  };
}

function getScene() {
  const scene = director.getScene();
  if (!scene) {
    throw new Error('No scene is currently open');
  }
  return scene;
}

function requireNode(nodePath: string) {
  const node = findNodeByPath(nodePath);
  if (!node) {
    throw new Error(`Node not found: ${nodePath}`);
  }
  return node;
}

function findNodeByPath(nodePath: string) {
  const scene = getScene();
  const trimmed = String(nodePath ?? '').trim();

  if (!trimmed || trimmed === '/' || trimmed === scene.name) {
    return scene;
  }

  const parts = trimmed
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  let current: Node | null = scene;
  const startIndex = parts[0] === scene.name ? 1 : 0;

  for (let index = startIndex; index < parts.length; index += 1) {
    const part = parts[index];
    current = current?.children.find((child) => child.name === part) ?? null;
    if (!current) {
      return null;
    }
  }

  return current;
}

function getNodePath(node: Node) {
  const scene = getScene();
  if (node === scene) {
    return scene.name;
  }

  const parts: string[] = [];
  let current: Node | null = node;
  while (current && current !== scene) {
    parts.unshift(current.name);
    current = current.parent;
  }

  return parts.join('/');
}

function visitNode(node: Node, visitor: (node: Node) => void) {
  visitor(node);
  for (const child of node.children) {
    visitNode(child, visitor);
  }
}

function serializeNode(node: Node, level: number, maxDepth: number): HierarchyNode {
  if (level >= maxDepth) {
    return {
      name: node.name,
      path: getNodePath(node),
      active: node.active,
      children: [],
    };
  }

  return {
    name: node.name,
    path: getNodePath(node),
    active: node.active,
    children: node.children.map((child) => serializeNode(child, level + 1, maxDepth)),
  };
}

function addComponentToNode(node: Node, componentType: string) {
  const ComponentClass = COMPONENT_MAP[componentType];
  if (!ComponentClass) {
    throw new Error(`Unsupported component type: ${componentType}`);
  }

  const existing = node.getComponent(ComponentClass as never) as unknown;
  if (existing) {
    return existing;
  }

  return node.addComponent(ComponentClass as never) as unknown;
}

function toVec3(position: PositionInput = {}) {
  return new Vec3(position.x ?? 0, position.y ?? 0, position.z ?? 0);
}
