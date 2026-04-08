/**
 * DOM 商店面板示例
 * 演示如何用 DOM 实现复杂的商店列表UI
 * 注意：这是示例/参考代码，不替换现有的 Canvas ShopView
 */
export function createShopPanel(domUI, shopSystem) {
  domUI.showPanel('shop', {
    title: '🏪 商店',
    render(container, { close }) {
      // Tab 切换
      const tabs = ['源核', '菌丝', '星币', '碎片', '抽卡'];
      const tabBar = document.createElement('div');
      tabBar.style.cssText = 'display:flex; gap:4px; margin-bottom:12px; overflow-x:auto;';

      tabs.forEach((tab, i) => {
        const btn = document.createElement('button');
        btn.style.cssText = `
          flex-shrink:0; padding:6px 14px; border-radius:16px; border:1px solid rgba(212,165,116,0.3);
          background:${i === 0 ? 'rgba(212,165,116,0.2)' : 'transparent'};
          color:#d4a574; font-size:12px; cursor:pointer; white-space:nowrap;
        `;
        btn.textContent = tab;
        btn.addEventListener('click', () => {
          tabBar.querySelectorAll('button').forEach(b => b.style.background = 'transparent');
          btn.style.background = 'rgba(212,165,116,0.2)';
          // 切换内容...
        });
        tabBar.appendChild(btn);
      });
      container.appendChild(tabBar);

      // 商品列表
      const list = document.createElement('div');
      list.style.cssText = 'display:flex; flex-direction:column; gap:8px;';

      const items = shopSystem.getCurrentItems() || [];
      items.forEach(item => {
        const card = document.createElement('div');
        card.style.cssText = `
          display:flex; align-items:center; padding:10px 12px; border-radius:8px;
          background:rgba(42,38,33,0.8); border:1px solid rgba(212,165,116,0.15);
        `;
        card.innerHTML = `
          <div style="width:40px;height:40px;border-radius:8px;background:rgba(212,165,116,0.1);
            display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">
            📦
          </div>
          <div style="flex:1;margin-left:10px;">
            <div style="font-size:13px;color:#d4ccc0;">${item.itemName || item.name || '未知物品'}</div>
            <div style="font-size:11px;color:#8a7a6a;margin-top:2px;">${item.description || ''}</div>
          </div>
          <button style="padding:4px 14px;border-radius:12px;border:1px solid rgba(212,165,116,0.4);
            background:rgba(212,165,116,0.15);color:#d4a574;font-size:12px;cursor:pointer;flex-shrink:0;">
            💎 ${item.cost || 0}
          </button>
        `;
        list.appendChild(card);
      });

      if (items.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#8a7a6a;padding:40px;">暂无商品</div>';
      }

      container.appendChild(list);
    }
  });
}
