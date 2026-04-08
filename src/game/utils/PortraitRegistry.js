const fusionPortraitUrls = import.meta.glob('../../../assets/images/characters/fusion/*.png', {
  eager: true,
  import: 'default'
});

const bossPortraitUrls = import.meta.glob('../../../assets/images/characters/boss/*.png', {
  eager: true,
  import: 'default'
});

function getFileStem(filePath) {
  return filePath.split('/').pop().replace(/\.[^.]+$/, '');
}

const portraitUrlMap = {};

Object.entries(fusionPortraitUrls).forEach(([filePath, assetUrl]) => {
  portraitUrlMap[getFileStem(filePath)] = assetUrl;
});

Object.entries(bossPortraitUrls).forEach(([filePath, assetUrl]) => {
  portraitUrlMap[getFileStem(filePath)] = assetUrl;
});

export function extractPortraitKey(portraitPath) {
  if (!portraitPath) return null;
  return portraitPath.split('/').pop().replace(/\.[^.]+$/, '');
}

export function getPortraitAssetUrlByKey(key) {
  return key ? portraitUrlMap[key] || null : null;
}

export function getPortraitAssetUrl(portraitPath) {
  return getPortraitAssetUrlByKey(extractPortraitKey(portraitPath));
}
