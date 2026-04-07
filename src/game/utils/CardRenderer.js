import AnimationHelper from './AnimationHelper.js';
import Const from '../data/Const.js';

/**
 * 品质颜色映射（Phaser 数值格式）
 */
const QUALITY_COLOR_MAP = {
  N:   0x888888,
  R:   0x4a90d9,
  SR:  0x9b59b6,
  SSR: 0xf39c12,
  UR:  0xff4444,
  LE:  0xff00ff
};

/**
 * 元素 emoji 占位映射
 */
const ELEMENT_EMOJI_MAP = {
  water: '\u{1F4A7}',
  fire:  '\u{1F525}',
  wind:  '\u{1F343}',
  light: '\u2728',
  dark:  '\u{1F311}'
};

/**
 * 元素中文名映射
 */
const ELEMENT_NAME_MAP = {
  water: '水',
  fire:  '火',
  wind:  '风',
  light: '光',
  dark:  '暗'
};

export default class CardRenderer {

  // ==================== 随从卡片 ====================

  /**
   * 创建一张完整的随从卡片
   * @param {Phaser.Scene} scene - 场景实例
   * @param {object} options - 配置项
   * @param {number} options.x - X坐标
   * @param {number} options.y - Y坐标
   * @param {string} options.quality - 品质 (N/R/SR/SSR/UR/LE)
   * @param {string} options.name - 角色名称
   * @param {number} options.star - 星级 (1-5)
   * @param {number} options.hp - 生命值
   * @param {number} options.atk - 攻击力
   * @param {string} options.element - 元素 (water/fire/wind/light/dark)
   * @param {string} [options.portraitKey] - 立绘纹理key
   * @param {boolean} [options.interactive=false] - 是否可交互
   * @param {Function} [options.onClick] - 点击回调
   * @param {number} [options.scale=1] - 缩放比例
   * @returns {Phaser.GameObjects.Container} 卡片容器
   */
  static createMinionCard(scene, options) {
    const {
      x = 0,
      y = 0,
      quality = 'N',
      name = '???',
      star = 1,
      hp = 0,
      atk = 0,
      element = 'water',
      portraitKey = null,
      interactive = false,
      onClick = null,
      scale = 1
    } = options;

    const cardW = Const.MINION.CARD_WIDTH;   // 160
    const cardH = Const.MINION.CARD_HEIGHT;   // 240
    const infoH = Math.floor(cardH * 0.3);    // 72
    const portraitH = cardH - infoH;          // 168

    // 容器
    const container = scene.add.container(x, y);
    container.setSize(cardW, cardH);

    // --- 品质光效（最底层） ---
    const glow = CardRenderer.createQualityGlow(scene, cardW, cardH, quality);
    container.add(glow);

    // --- 卡框 ---
    const frameKey = `card-frame-${quality}`;
    let frame;
    if (scene.textures.exists(frameKey)) {
      frame = scene.add.image(0, 0, frameKey);
      frame.setDisplaySize(cardW, cardH);
    } else {
      frame = CardRenderer._drawFallbackFrame(scene, cardW, cardH, quality);
    }
    container.add(frame);

    // --- 立绘区域 ---
    const portraitArea = scene.add.container(0, -(infoH / 2));

    if (portraitKey && scene.textures.exists(portraitKey)) {
      const portrait = scene.add.image(0, 0, portraitKey);
      portrait.setDisplaySize(Const.MINION.PORTRAIT_WIDTH, Const.MINION.PORTRAIT_HEIGHT);
      portraitArea.add(portrait);
    } else {
      // 使用元素 emoji 作为占位
      const emoji = ELEMENT_EMOJI_MAP[element] || ELEMENT_EMOJI_MAP.water;
      const emojiText = scene.add.text(0, 0, emoji, {
        fontSize: '48px'
      }).setOrigin(0.5);
      portraitArea.add(emojiText);
    }

    container.add(portraitArea);

    // --- 信息栏背景 ---
    const infoBg = scene.add.graphics();
    infoBg.fillStyle(0x000000, 0.6);
    infoBg.fillRoundedRect(
      -cardW / 2 + 2,
      portraitH - infoH / 2,
      cardW - 4,
      infoH - 2,
      Const.UI.CARD_RADIUS_SMALL
    );
    container.add(infoBg);

    // --- 信息栏文字 ---
    const infoY = portraitH - infoH / 2;
    const qualityConfig = Const.CHIP_QUALITY[quality] || Const.CHIP_QUALITY.N;
    const starStr = '\u2B50'.repeat(Math.min(star, 5));

    // 星级 + 名称
    const nameText = scene.add.text(
      -cardW / 2 + 8,
      infoY + 6,
      `${starStr} ${name}`,
      {
        fontSize: Const.MINION.NAME_TEXT_SIZE,
        fontFamily: Const.FONT.FAMILY_CN,
        color: qualityConfig.textColor,
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0);
    nameText.setWordWrapWidth(cardW - 16);
    container.add(nameText);

    // HP / ATK
    const statText = scene.add.text(
      -cardW / 2 + 8,
      infoY + 26,
      `HP: ${hp}  ATK: ${atk}`,
      {
        fontSize: Const.MINION.RACE_TEXT_SIZE,
        fontFamily: Const.FONT.FAMILY_EN,
        color: Const.TEXT_COLORS.SECONDARY
      }
    ).setOrigin(0, 0);
    container.add(statText);

    // 元素标签
    const elementEmoji = ELEMENT_EMOJI_MAP[element] || '';
    const elementName = ELEMENT_NAME_MAP[element] || '';
    const elementText = scene.add.text(
      -cardW / 2 + 8,
      infoY + 44,
      `${elementEmoji} ${elementName}`,
      {
        fontSize: Const.MINION.RACE_TEXT_SIZE,
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.PRIMARY
      }
    ).setOrigin(0, 0);
    container.add(elementText);

    // --- 缩放 ---
    container.setScale(scale);

    // --- 交互 ---
    if (interactive) {
      CardRenderer.addInteraction(scene, container, onClick);
    }

    // 存储元数据
    container.cardData = { quality, name, star, hp, atk, element };

    return container;
  }

  // ==================== 芯片卡片 ====================

  /**
   * 创建一张装备/芯片卡片（较小尺寸）
   * @param {Phaser.Scene} scene - 场景实例
   * @param {object} options - 配置项
   * @param {number} options.x - X坐标
   * @param {number} options.y - Y坐标
   * @param {string} options.quality - 品质
   * @param {string} options.name - 芯片名称
   * @param {number} options.star - 星级
   * @param {string} [options.description] - 描述文本 (如 HP+10% ATK+5%)
   * @param {string} [options.element] - 元素
   * @param {string} [options.chipIconKey] - 芯片图标纹理key
   * @param {boolean} [options.interactive=false] - 是否可交互
   * @param {Function} [options.onClick] - 点击回调
   * @param {number} [options.scale=1] - 缩放比例
   * @returns {Phaser.GameObjects.Container} 卡片容器
   */
  static createChipCard(scene, options) {
    const {
      x = 0,
      y = 0,
      quality = 'N',
      name = '???',
      star = 1,
      description = '',
      element = null,
      chipIconKey = null,
      interactive = false,
      onClick = null,
      scale = 1
    } = options;

    const cardW = 120;
    const cardH = 160;
    const iconAreaH = 100;
    const infoH = cardH - iconAreaH; // 60

    const container = scene.add.container(x, y);
    container.setSize(cardW, cardH);

    // --- 品质光效 ---
    const glow = CardRenderer.createQualityGlow(scene, cardW, cardH, quality);
    container.add(glow);

    // --- 卡框 ---
    const frameKey = `card-frame-${quality}`;
    let frame;
    if (scene.textures.exists(frameKey)) {
      frame = scene.add.image(0, 0, frameKey);
      frame.setDisplaySize(cardW, cardH);
    } else {
      frame = CardRenderer._drawFallbackFrame(scene, cardW, cardH, quality);
    }
    container.add(frame);

    // --- 图标区域 ---
    const iconArea = scene.add.container(0, -(infoH / 2));

    if (chipIconKey && scene.textures.exists(chipIconKey)) {
      const icon = scene.add.image(0, 0, chipIconKey);
      icon.setDisplaySize(60, 60);
      iconArea.add(icon);
    } else if (element && ELEMENT_EMOJI_MAP[element]) {
      const emoji = scene.add.text(0, 0, ELEMENT_EMOJI_MAP[element], {
        fontSize: '42px'
      }).setOrigin(0.5);
      iconArea.add(emoji);
    } else {
      const placeholder = scene.add.text(0, 0, '\u{1F48E}', {
        fontSize: '42px'
      }).setOrigin(0.5);
      iconArea.add(placeholder);
    }

    container.add(iconArea);

    // --- 信息栏背景 ---
    const infoBg = scene.add.graphics();
    infoBg.fillStyle(0x000000, 0.6);
    infoBg.fillRoundedRect(
      -cardW / 2 + 2,
      iconAreaH - infoH / 2,
      cardW - 4,
      infoH - 2,
      Const.UI.CARD_RADIUS_SMALL
    );
    container.add(infoBg);

    // --- 信息栏文字 ---
    const infoY = iconAreaH - infoH / 2;
    const qualityConfig = Const.CHIP_QUALITY[quality] || Const.CHIP_QUALITY.N;
    const starStr = '\u2B50'.repeat(Math.min(star, 5));

    // 星级 + 名称
    const nameText = scene.add.text(
      -cardW / 2 + 8,
      infoY + 8,
      `${starStr} ${name}`,
      {
        fontSize: '11px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: qualityConfig.textColor,
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0);
    nameText.setWordWrapWidth(cardW - 16);
    container.add(nameText);

    // 描述
    if (description) {
      const descText = scene.add.text(
        -cardW / 2 + 8,
        infoY + 28,
        description,
        {
          fontSize: '9px',
          fontFamily: Const.FONT.FAMILY_CN,
          color: Const.TEXT_COLORS.SECONDARY
        }
      ).setOrigin(0, 0);
      descText.setWordWrapWidth(cardW - 16);
      container.add(descText);
    }

    // --- 缩放 ---
    container.setScale(scale);

    // --- 交互 ---
    if (interactive) {
      CardRenderer.addInteraction(scene, container, onClick);
    }

    // 存储元数据
    container.cardData = { quality, name, star, description, element };

    return container;
  }

  // ==================== 出场动画 ====================

  /**
   * 为卡片添加出场动画
   * @param {Phaser.Scene} scene - 场景实例
   * @param {Phaser.GameObjects.Container} card - 卡片容器
   * @param {number} [delay=0] - 延迟毫秒
   */
  static animateEntry(scene, card, delay = 0) {
    AnimationHelper.tweenScaleIn(scene, card, 300, delay);
  }

  // ==================== 交互 ====================

  /**
   * 为卡片添加悬停和点击交互
   * @param {Phaser.Scene} scene - 场景实例
   * @param {Phaser.GameObjects.Container} card - 卡片容器
   * @param {Function} [onClick] - 点击回调
   */
  static addInteraction(scene, card, onClick) {
    card.setInteractive();

    card.on('pointerover', () => {
      AnimationHelper.tweenCardHover(scene, card, true);
    });

    card.on('pointerout', () => {
      AnimationHelper.tweenCardHover(scene, card, false);
    });

    card.on('pointerdown', () => {
      AnimationHelper.tweenPulse(scene, card, 0.95, 100);
      if (typeof onClick === 'function') {
        onClick(card);
      }
    });
  }

  // ==================== 品质光效 ====================

  /**
   * 创建品质光效叠加层
   * @param {Phaser.Scene} scene - 场景实例
   * @param {number} width - 卡片宽度
   * @param {number} height - 卡片高度
   * @param {string} quality - 品质 (N/R/SR/SSR/UR/LE)
   * @returns {Phaser.GameObjects.Graphics} 光效图形对象
   */
  static createQualityGlow(scene, width, height, quality) {
    const qualityConfig = Const.CHIP_QUALITY[quality] || Const.CHIP_QUALITY.N;
    const colorInt = QUALITY_COLOR_MAP[quality] || QUALITY_COLOR_MAP.N;
    const glowAlpha = qualityConfig.glow * 0.3;
    const padding = 6;

    const graphics = scene.add.graphics();
    graphics.fillStyle(colorInt, glowAlpha);
    graphics.fillRoundedRect(
      -(width / 2) - padding,
      -(height / 2) - padding,
      width + padding * 2,
      height + padding * 2,
      Const.UI.CARD_RADIUS + 2
    );

    // SSR 及以上品质：添加脉冲动画
    if (['SSR', 'UR', 'LE'].includes(quality)) {
      const pulseTimeline = scene.tweens.add({
        targets: graphics,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    return graphics;
  }

  // ==================== 内部工具方法 ====================

  /**
   * 绘制 fallback 卡框（当纹理不存在时）
   * @private
   */
  static _drawFallbackFrame(scene, width, height, quality) {
    const colorInt = QUALITY_COLOR_MAP[quality] || QUALITY_COLOR_MAP.N;
    const graphics = scene.add.graphics();

    // 外框
    graphics.lineStyle(2, colorInt, 0.8);
    graphics.fillStyle(0x111122, 0.9);
    graphics.fillRoundedRect(
      -(width / 2),
      -(height / 2),
      width,
      height,
      Const.UI.CARD_RADIUS
    );
    graphics.strokeRoundedRect(
      -(width / 2),
      -(height / 2),
      width,
      height,
      Const.UI.CARD_RADIUS
    );

    // 内边框装饰线
    graphics.lineStyle(1, colorInt, 0.3);
    graphics.strokeRoundedRect(
      -(width / 2) + 3,
      -(height / 2) + 3,
      width - 6,
      height - 6,
      Const.UI.CARD_RADIUS - 1
    );

    return graphics;
  }
}
