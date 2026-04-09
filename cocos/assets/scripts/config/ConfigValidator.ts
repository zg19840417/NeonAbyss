import type { RawConfigBundle } from './ConfigTypes';

function assertArray(name: string, value: unknown): void {
  if (!Array.isArray(value)) {
    throw new Error(`Config "${name}" must be an array.`);
  }
}

function assertObject(name: string, value: unknown): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Config "${name}" must be an object.`);
  }
}

export function validateRawConfigBundle(bundle: RawConfigBundle): void {
  assertArray('fusionGirls', bundle.fusionGirls);
  assertArray('portraitSets', bundle.portraitSets);
  assertArray('portraitFragments', bundle.portraitFragments);
  assertArray('stages', bundle.stages);
  assertArray('enemies', bundle.enemies);
  assertArray('enemyGroups', bundle.enemyGroups);
  assertArray('dropGroups', bundle.dropGroups);
  assertArray('items', bundle.items);
  assertArray('shopItems', bundle.shopItems);
  assertObject('globalConfig', bundle.globalConfig);
}
