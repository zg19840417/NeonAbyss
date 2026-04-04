import langData from '../../../assets/data/json/language.json';

const Lang = {};

langData.forEach(item => {
  if (item && item.id) {
    Lang[item.id] = item.zh_cn;
  }
});

export function t(key, params = {}) {
  let value = Lang[key] || key;
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return Object.entries(params).reduce((str, [k, v]) => {
      return str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }, value);
  }
  return value;
}

export { Lang };
export default Lang;
