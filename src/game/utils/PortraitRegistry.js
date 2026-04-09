const fusionPortraitUrls = import.meta.glob('../../../assets/images/characters/fusion/*.png', {
  eager: false,
  import: 'default'
});

const bossPortraitUrls = import.meta.glob('../../../assets/images/characters/boss/*.png', {
  eager: false,
  import: 'default'
});

function getFileStem(filePath) {
  return filePath.split('/').pop().replace(/\.[^.]+$/, '');
}

const urlCache = new Map();

export function extractPortraitKey(portraitPath) {
  if (!portraitPath) return null;
  return portraitPath.split('/').pop().replace(/\.[^.]+$/, '');
}

export async function getPortraitAssetUrlByKey(key) {
  if (!key) return null;
  if (urlCache.has(key)) return urlCache.get(key);
  const loader = fusionPortraitUrls[key] || bossPortraitUrls[key];
  if (!loader) return null;
  const url = await loader();
  urlCache.set(key, url);
  return url;
}

export function getPortraitAssetUrlSync(key) {
  if (!key) return null;
  if (urlCache.has(key)) return urlCache.get(key);
  return null;
}

export function getPortraitAssetUrl(portraitPath) {
  return getPortraitAssetUrlSync(extractPortraitKey(portraitPath));
}
