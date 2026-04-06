const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('❌ ERROR:', msg.text());
  });

  console.log('🎮 卡组管理详细测试\n');

  try {
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(3000);

    console.log('1. 清除存档');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(3000);

    console.log('2. 开始游戏');
    await page.mouse.click(187, 400);
    await page.waitForTimeout(3000);

    console.log('3. 进入商店');
    await page.mouse.click(262, 760);
    await page.waitForTimeout(3000);

    console.log('4. 购买多张随从卡');
    for (let i = 0; i < 3; i++) {
      await page.mouse.click(187, 250);
      await page.waitForTimeout(1000);
      await page.mouse.click(187, 320);
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: 'detail-01-shop.png', fullPage: true });

    console.log('5. 进入队伍');
    await page.mouse.click(112, 760);
    await page.waitForTimeout(3000);

    console.log('6. 点击卡牌左侧查看详情（培养模式）');
    await page.mouse.click(100, 425); // 左侧区域
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'detail-02-card-detail.png', fullPage: true });

    console.log('7. 关闭详情，尝试升星');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);

    console.log('8. 上阵2张随从');
    await page.mouse.click(300, 425);
    await page.waitForTimeout(1000);
    await page.mouse.click(300, 500);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'detail-03-deployed.png', fullPage: true });

    console.log('9. 下阵一张随从');
    await page.mouse.click(300, 200);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'detail-04-undeploy.png', fullPage: true });

    console.log('10. 进入禁区');
    await page.mouse.click(187, 760);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'detail-05-dungeon.png', fullPage: true });

    console.log('11. 开始战斗');
    await page.mouse.click(187, 480);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'detail-06-battle-start.png', fullPage: true });

    console.log('12. 等待战斗进行');
    await page.waitForTimeout(15000);
    await page.screenshot({ path: 'detail-07-battle-mid.png', fullPage: true });

    console.log('\n✅ 测试完成');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
})();
