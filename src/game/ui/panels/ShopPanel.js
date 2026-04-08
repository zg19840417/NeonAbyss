import '../styles/variables.css';
import '../styles/components.css';
import ShopSystem, { ShopType, CurrencyConfig } from '../../systems/ShopSystem.js';
import GachaSystem from '../../systems/GachaSystem.js';

const TAB_CONFIG = [
  { key: ShopType.GACHA, icon: '🎴', label: '召唤' },
  { key: ShopType.SOURCE_CORE, icon: '💎', label: '源核' },
  { key: ShopType.MYCELIUM, icon: '🍄', label: '菌丝' },
  { key: ShopType.STAR_COIN, icon: '⭐', label: '星币' },
  { key: ShopType.FRAGMENT, icon: '🧩', label: '碎片' }
];

const GACHA_NAME_MAP = {
  GACHA_SINGLE: '单次召唤',
  GACHA_TEN: '十连召唤'
};

/**
 * DOM 商店面板 — 正式实现
 * 通过 domUI.showPanel() 挂载到 DOM 覆盖层
 */
export function createShopPanel(domUI, scene) {
  const shopSystem = new ShopSystem(scene.baseSystem || window.gameData?.base);
  shopSystem.refreshDaily();

  domUI.showPanel('shop', {
    title: '商店',
    render(content, { close }) {
      // Tab 栏
      const tabsEl = document.createElement('div');
      tabsEl.className = 'ui-tabs';
      content.appendChild(tabsEl);

      // 内容区
      const listEl = document.createElement('div');
      listEl.style.cssText = 'padding: 0 12px;';
      content.appendChild(listEl);

      function renderTabs() {
        tabsEl.innerHTML = '';
        TAB_CONFIG.forEach(tab => {
          const btn = document.createElement('button');
          btn.className = `ui-tab${shopSystem.currentTab === tab.key ? ' active' : ''}`;
          btn.innerHTML = `${tab.icon}<br>${tab.label}`;
          btn.addEventListener('click', () => {
            if (shopSystem.currentTab === tab.key) return;
            shopSystem.setCurrentTab(tab.key);
            renderTabs();
            renderContent();
          });
          tabsEl.appendChild(btn);
        });
      }

      function renderContent() {
        listEl.innerHTML = '';
        const items = shopSystem.getCurrentItems();

        // 抽卡 Tab 显示保底信息
        if (shopSystem.currentTab === ShopType.GACHA) {
          const headerEl = document.createElement('div');
          headerEl.className = 'ui-gacha-header';
          const pity = shopSystem.getGachaPityInfo();
          headerEl.innerHTML = `
            <span class="ui-gacha-header__pity">保底: SR ${pity.srPity}抽 / SSR ${pity.ssrPity}抽 / UR ${pity.urPity}抽</span>
            <button class="ui-gacha-header__history">记录</button>
          `;
          headerEl.querySelector('.ui-gacha-header__history').addEventListener('click', () => showGachaHistory());
          listEl.appendChild(headerEl);
        }

        if (items.length === 0) {
          listEl.innerHTML = '<div class="ui-empty">暂时没有可售商品</div>';
          return;
        }

        items.forEach(item => {
          const card = createShopCard(item);
          listEl.appendChild(card);
        });
      }

      function createShopCard(item) {
        const canPurchase = shopSystem.canPurchase(item);
        const currencyCfg = CurrencyConfig[item.currency] || { icon: '?', color: '#fff' };
        const card = document.createElement('div');
        card.className = 'ui-shop-card';

        const icon = getItemIcon(item);
        const name = getDisplayName(item);
        const limit = getLimitText(item);

        card.innerHTML = `
          <div class="ui-shop-card__icon">${icon}</div>
          <div class="ui-shop-card__info">
            <div class="ui-shop-card__name">${name}</div>
            <div class="ui-shop-card__limit">${limit}</div>
          </div>
          <button class="ui-shop-card__buy" ${canPurchase.can ? '' : 'disabled'}>
            ${currencyCfg.icon} ${item.cost}
          </button>
        `;

        card.querySelector('.ui-shop-card__buy').addEventListener('click', () => {
          if (!canPurchase.can) {
            domUI.showToast(getCannotReason(canPurchase.reason), 'error');
            return;
          }
          purchaseItem(item);
        });

        return card;
      }

      function purchaseItem(item) {
        const result = shopSystem.purchase(item);
        if (!result.success) {
          domUI.showToast(getCannotReason(result.reason), 'error');
          return;
        }
        if (result.reward.type === 'gacha') {
          scene.saveGameData?.();
          showGachaResult(result.reward.fragments || [], result.reward.resultSummary || null);
          return;
        }
        domUI.showToast(`获得 ${getRewardText(result.reward)}`, 'success');
        scene.saveGameData?.();
        renderContent();
      }

      function showGachaResult(fragments, summary) {
        const overlay = document.createElement('div');
        overlay.className = 'ui-gacha-result';

        const isTen = fragments.length >= 10;
        overlay.innerHTML = `
          <div class="ui-gacha-result__title">立绘碎片召唤</div>
          <div class="ui-gacha-result__grid"></div>
          <div class="ui-gacha-result__summary"></div>
          <button class="ui-gacha-result__confirm">确认</button>
        `;

        const grid = overlay.querySelector('.ui-gacha-result__grid');
        fragments.forEach((frag, i) => {
          const qColor = GachaSystem.getQualityColor(frag.fragmentQuality);
          const qName = GachaSystem.getQualityName(frag.fragmentQuality);
          const card = document.createElement('div');
          card.className = 'ui-gacha-card';
          card.style.borderColor = qColor;
          card.style.animationDelay = `${i * 0.04}s`;
          card.innerHTML = `
            <div class="ui-gacha-card__icon">${frag.icon || '🧩'}</div>
            <div class="ui-gacha-card__name">${frag.fusionGirlName}</div>
            <div class="ui-gacha-card__detail">${frag.portraitSetName} / ${frag.fragmentSlot}</div>
            <div class="ui-gacha-card__quality" style="color:${qColor}">${qName}</div>
          `;
          grid.appendChild(card);
        });

        if (summary) {
          const lines = [];
          if (summary.completedSetCount > 0) lines.push(`完成立绘套装 ${summary.completedSetCount} 套`);
          if (summary.qualityUpgradeReadyCount > 0) lines.push(`新增可升品质机会 ${summary.qualityUpgradeReadyCount} 次`);
          const overflowParts = Object.entries(summary.overflowPoints || {})
            .filter(([, a]) => a > 0)
            .map(([k, a]) => `${CurrencyConfig[k]?.name || k}+${a}`);
          if (overflowParts.length) lines.push(overflowParts.join(' / '));
          if (lines.length) overlay.querySelector('.ui-gacha-result__summary').textContent = lines.join('\n');
        }

        overlay.querySelector('.ui-gacha-result__confirm').addEventListener('click', () => {
          overlay.remove();
          renderContent();
        });

        content.appendChild(overlay);
      }

      function showGachaHistory() {
        const history = shopSystem.getGachaHistory();
        domUI.showPanel('gacha-history', {
          title: '召唤记录',
          render(histContent, { close: closeHistory }) {
            if (history.length === 0) {
              histContent.innerHTML = '<div class="ui-empty">暂时没有召唤记录</div>';
              return;
            }
            history.slice(0, 50).forEach(record => {
              const qColor = GachaSystem.getQualityColor(record.fragmentQuality);
              const qName = GachaSystem.getQualityName(record.fragmentQuality);
              const row = document.createElement('div');
              row.className = 'ui-shop-card';
              row.innerHTML = `
                <div class="ui-shop-card__icon">🧩</div>
                <div class="ui-shop-card__info">
                  <div class="ui-shop-card__name" style="color:${qColor}">${record.fusionGirlName}</div>
                  <div class="ui-shop-card__limit">${record.portraitSetName} / ${record.fragmentSlot} / ${qName}</div>
                </div>
                <div style="font-size:10px;color:var(--ui-text-inactive);flex-shrink:0">${formatTime(record.time)}</div>
              `;
              histContent.appendChild(row);
            });
          }
        });
      }

      function getDisplayName(item) {
        if (GACHA_NAME_MAP[item.itemId]) return GACHA_NAME_MAP[item.itemId];
        if (typeof item.itemName === 'string' && /[\u4e00-\u9fa5]/.test(item.itemName)) return item.itemName;
        const info = shopSystem.getItemInfo(item.itemId);
        if (info?.name && /[\u4e00-\u9fa5]/.test(info.name)) return info.name;
        return item.itemId;
      }

      function getLimitText(item) {
        if (item.dailyLimit === 0) return '不限购';
        if (item.dailyLimit === -1) return '限购一次';
        return `剩余 ${shopSystem.getRemainingCount(item)}/${item.dailyLimit}`;
      }

      function getItemIcon(item) {
        if (item.itemId === 'GACHA_SINGLE' || item.itemId === 'GACHA_TEN') return '🎴';
        if (item.currency === 'sourceCore') return '💎';
        if (item.currency === 'mycelium') return '🍄';
        if (item.currency === 'starCoin') return '⭐';
        return '📦';
      }

      function getRewardText(reward) {
        if (reward.type === 'currency') return `${CurrencyConfig[reward.currencyType]?.name || reward.currencyType} x${reward.amount}`;
        if (reward.type === 'item') return shopSystem.getItemInfo(reward.item)?.name || reward.item;
        if (reward.type === 'gacha') return `立绘碎片 x${reward.count}`;
        return '奖励';
      }

      function getCannotReason(reason) {
        const map = {
          daily_limit_reached: '今日购买次数已用尽',
          already_purchased: '该商品已购买',
          not_enough_currency: '货币不足',
          no_unlocked_fragments: '当前还没有开放可召唤的融合姬碎片',
          gacha_failed: '召唤失败'
        };
        return map[reason] || '无法购买';
      }

      function formatTime(ts) {
        const d = new Date(ts);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      }

      renderTabs();
      renderContent();
    },
    onClose() {
      // 面板关闭时无需额外清理
    }
  });
}
