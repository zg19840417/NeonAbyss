import AnimationHelper from './AnimationHelper.js';
import Const from '../data/Const.js';

const QUALITY_COLOR_MAP = {
  N: 0x888888,
  R: 0x4a90d9,
  SR: 0x9b59b6,
  SSR: 0xf39c12,
  UR: 0xff4444,
  LE: 0xff00ff
};

const ELEMENT_EMOJI_MAP = {
  water: '💧',
  fire: '🔥',
  wind: '🍃',
  light: '✨',
  dark: '🌑'
};

const ELEMENT_NAME_MAP = {
  water: '水',
  fire: '火',
  wind: '风',
  light: '光',
  dark: '暗'
};

export default class CardRenderer {
  static createMinionCard(scene, options = {}) {
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

    const cardW = Const.MINION.CARD_WIDTH;
    const cardH = Const.MINION.CARD_HEIGHT;
    const infoH = 74;
    const portraitInset = 10;
    const portraitBoxY = -22;
    const portraitBoxW = cardW - portraitInset * 2;
    const portraitBoxH = cardH - infoH - 26;
    const colorInt = QUALITY_COLOR_MAP[quality] || QUALITY_COLOR_MAP.N;
    const qualityConfig = Const.CHIP_QUALITY[quality] || Const.CHIP_QUALITY.N;

    const container = scene.add.container(x, y);
    container.setSize(cardW, cardH);

    const shadow = scene.add.graphics();
    shadow.fillStyle(colorInt, 0.14);
    shadow.fillRoundedRect(-cardW / 2 - 4, -cardH / 2 - 4, cardW + 8, cardH + 8, 18);
    container.add(shadow);

    const frame = scene.add.graphics();
    frame.fillStyle(0x11131f, 0.98);
    frame.lineStyle(2, colorInt, 0.9);
    frame.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
    frame.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
    frame.lineStyle(1, colorInt, 0.22);
    frame.strokeRoundedRect(-cardW / 2 + 6, -cardH / 2 + 6, cardW - 12, cardH - 12, 12);
    container.add(frame);

    const portraitBack = scene.add.graphics();
    portraitBack.fillStyle(0xe9edf6, 0.96);
    portraitBack.lineStyle(1, colorInt, 0.4);
    portraitBack.fillRoundedRect(-portraitBoxW / 2, -cardH / 2 + portraitInset, portraitBoxW, portraitBoxH, 12);
    portraitBack.strokeRoundedRect(-portraitBoxW / 2, -cardH / 2 + portraitInset, portraitBoxW, portraitBoxH, 12);
    container.add(portraitBack);

    const portraitContainer = scene.add.container(0, portraitBoxY);

    if (portraitKey && scene.textures.exists(portraitKey)) {
      const image = scene.add.image(0, 0, portraitKey);
      const frame = scene.textures.getFrame(portraitKey, '__BASE');
      const sourceWidth = frame?.width || portraitBoxW;
      const sourceHeight = frame?.height || portraitBoxH;
      const fitScale = Math.min(portraitBoxW / sourceWidth, portraitBoxH / sourceHeight);
      image.setScale(fitScale);
      portraitContainer.add(image);
    } else {
      portraitContainer.add(scene.add.text(0, 0, ELEMENT_EMOJI_MAP[element] || '•', {
        fontSize: '56px'
      }).setOrigin(0.5));
    }
    container.add(portraitContainer);

    const infoPanel = scene.add.graphics();
    infoPanel.fillStyle(0x0b0f18, 0.92);
    infoPanel.lineStyle(1.5, colorInt, 0.75);
    infoPanel.fillRoundedRect(-cardW / 2 + 8, cardH / 2 - infoH - 8, cardW - 16, infoH, 14);
    infoPanel.strokeRoundedRect(-cardW / 2 + 8, cardH / 2 - infoH - 8, cardW - 16, infoH, 14);
    infoPanel.lineStyle(1, colorInt, 0.18);
    infoPanel.strokeRoundedRect(-cardW / 2 + 14, cardH / 2 - infoH - 2, cardW - 28, infoH - 12, 10);
    container.add(infoPanel);

    const starStr = '★'.repeat(Math.min(star, 5));
    const nameText = scene.add.text(-cardW / 2 + 16, cardH / 2 - 66, name, {
      fontSize: '13px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityConfig.textColor
    }).setOrigin(0, 0.5);
    nameText.setWordWrapWidth(cardW - 32);
    container.add(nameText);

    container.add(scene.add.text(cardW / 2 - 16, cardH / 2 - 66, starStr, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_EN,
      fontStyle: 'bold',
      color: '#ffd166'
    }).setOrigin(1, 0.5));

    container.add(scene.add.text(-cardW / 2 + 16, cardH / 2 - 44, `HP ${hp}   ATK ${atk}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_EN,
      color: Const.TEXT_COLORS.PRIMARY
    }).setOrigin(0, 0.5));

    container.add(scene.add.text(-cardW / 2 + 16, cardH / 2 - 24, `${ELEMENT_EMOJI_MAP[element] || ''} ${ELEMENT_NAME_MAP[element] || element || ''}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      color: Const.TEXT_COLORS.SECONDARY
    }).setOrigin(0, 0.5));

    container.setScale(scale);
    container.__baseScaleX = scale;
    container.__baseScaleY = scale;

    if (interactive) {
      CardRenderer.addInteraction(scene, container, onClick);
    }

    container.cardData = { quality, name, star, hp, atk, element };
    return container;
  }

  static createChipCard(scene, options = {}) {
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
    const colorInt = QUALITY_COLOR_MAP[quality] || QUALITY_COLOR_MAP.N;
    const qualityConfig = Const.CHIP_QUALITY[quality] || Const.CHIP_QUALITY.N;
    const container = scene.add.container(x, y);
    container.setSize(cardW, cardH);

    const glow = CardRenderer.createQualityGlow(scene, cardW, cardH, quality);
    container.add(glow);

    const frame = scene.add.graphics();
    frame.fillStyle(0x11131f, 0.96);
    frame.lineStyle(2, colorInt, 0.9);
    frame.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
    frame.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
    container.add(frame);

    const iconBox = scene.add.graphics();
    iconBox.fillStyle(0x161b28, 1);
    iconBox.lineStyle(1, colorInt, 0.45);
    iconBox.fillRoundedRect(-48, -62, 96, 84, 12);
    iconBox.strokeRoundedRect(-48, -62, 96, 84, 12);
    container.add(iconBox);

    if (chipIconKey && scene.textures.exists(chipIconKey)) {
      const icon = scene.add.image(0, -20, chipIconKey);
      const texture = scene.textures.get(chipIconKey)?.getSourceImage();
      const fitScale = Math.min(72 / (texture?.width || 72), 72 / (texture?.height || 72));
      icon.setScale(fitScale);
      container.add(icon);
    } else if (element && ELEMENT_EMOJI_MAP[element]) {
      container.add(scene.add.text(0, -20, ELEMENT_EMOJI_MAP[element], { fontSize: '42px' }).setOrigin(0.5));
    } else {
      container.add(scene.add.text(0, -20, '💎', { fontSize: '42px' }).setOrigin(0.5));
    }

    const infoPanel = scene.add.graphics();
    infoPanel.fillStyle(0x0b0f18, 0.92);
    infoPanel.lineStyle(1.2, colorInt, 0.75);
    infoPanel.fillRoundedRect(-52, 28, 104, 52, 12);
    infoPanel.strokeRoundedRect(-52, 28, 104, 52, 12);
    container.add(infoPanel);

    const starStr = '★'.repeat(Math.min(star, 5));
    const nameText = scene.add.text(-44, 38, `${starStr} ${name}`, {
      fontSize: '11px',
      fontFamily: Const.FONT.FAMILY_CN,
      fontStyle: 'bold',
      color: qualityConfig.textColor
    }).setOrigin(0, 0);
    nameText.setWordWrapWidth(88);
    container.add(nameText);

    if (description) {
      const descText = scene.add.text(-44, 58, description, {
        fontSize: '9px',
        fontFamily: Const.FONT.FAMILY_CN,
        color: Const.TEXT_COLORS.SECONDARY
      }).setOrigin(0, 0);
      descText.setWordWrapWidth(88);
      container.add(descText);
    }

    container.setScale(scale);
    container.__baseScaleX = scale;
    container.__baseScaleY = scale;

    if (interactive) {
      CardRenderer.addInteraction(scene, container, onClick);
    }

    container.cardData = { quality, name, star, description, element };
    return container;
  }

  static animateEntry(scene, card, delay = 0) {
    AnimationHelper.tweenScaleIn(scene, card, 300, delay);
  }

  static addInteraction(scene, card, onClick) {
    card.__baseScaleX = card.__baseScaleX ?? card.scaleX ?? 1;
    card.__baseScaleY = card.__baseScaleY ?? card.scaleY ?? 1;
    card.setInteractive();

    card.on('pointerover', () => {
      AnimationHelper.tweenCardHover(scene, card, true);
    });

    card.on('pointerout', () => {
      AnimationHelper.tweenCardHover(scene, card, false);
    });

    card.on('pointerdown', () => {
      AnimationHelper.tweenPulse(scene, card, 1.03, 90);
      if (typeof onClick === 'function') {
        onClick(card);
      }
    });
  }

  static createQualityGlow(scene, width, height, quality) {
    const qualityConfig = Const.CHIP_QUALITY[quality] || Const.CHIP_QUALITY.N;
    const colorInt = QUALITY_COLOR_MAP[quality] || QUALITY_COLOR_MAP.N;
    const glowAlpha = qualityConfig.glow * 0.28;
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

    if (['SSR', 'UR', 'LE'].includes(quality)) {
      scene.tweens.add({
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
}
