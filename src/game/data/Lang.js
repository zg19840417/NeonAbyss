import langData from '../../../assets/data/json/language.json';

const Lang = {};

const translations = {
  zh_cn: {},
  en_us: {}
};

langData.forEach(item => {
  if (item && item.id) {
    translations.zh_cn[item.id] = item.zh_cn || item.id;
    translations.en_us[item.id] = item.en_us || item.zh_cn || item.id;
  }
});

export const SUPPORTED_LANGUAGES = {
  zh_cn: '简体中文',
  en_us: 'English'
};

let currentLanguage = localStorage.getItem('gameLanguage') || 'zh_cn';

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('gameLanguage', lang);
    document.documentElement.lang = lang === 'en_us' ? 'en' : 'zh-CN';
  }
}

export function getLanguage() {
  return currentLanguage;
}

export function t(key, params = {}) {
  let value = translations[currentLanguage]?.[key] || translations.zh_cn[key] || key;
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return Object.entries(params).reduce((str, [k, v]) => {
      return str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }, value);
  }
  return value;
}

export { translations };
export default Lang;
