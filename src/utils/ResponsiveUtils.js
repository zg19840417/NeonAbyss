export const DesignWidth = 375;
export const DesignHeight = 812;

export const ScaleMode = {
  FIT: 'fit',
  FILL: 'fill',
  FIXED_WIDTH: 'fixedWidth',
  FIXED_HEIGHT: 'fixedHeight'
};

export default class ResponsiveUtils {
  constructor(baseWidth = DesignWidth, baseHeight = DesignHeight) {
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.currentWidth = baseWidth;
    this.currentHeight = baseHeight;
    this.scaleFactor = 1;
    this.orientation = 'portrait';
  }

  update(screenWidth, screenHeight) {
    this.currentWidth = screenWidth;
    this.currentHeight = screenHeight;
    
    this.scaleFactor = Math.min(
      screenWidth / this.baseWidth,
      screenHeight / this.baseHeight
    );
    
    this.orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
  }

  getScaleFactor() {
    return this.scaleFactor;
  }

  getWidth() {
    return this.currentWidth;
  }

  getHeight() {
    return this.currentHeight;
  }

  getOrientation() {
    return this.orientation;
  }

  isLandscape() {
    return this.orientation === 'landscape';
  }

  isPortrait() {
    return this.orientation === 'portrait';
  }

  scale(value) {
    return value * this.scaleFactor;
  }

  scaleX(value) {
    return value * (this.currentWidth / this.baseWidth);
  }

  scaleY(value) {
    return value * (this.currentHeight / this.baseHeight);
  }

  getScaledRect(x, y, width, height) {
    return {
      x: this.scaleX(x),
      y: this.scaleY(y),
      width: this.scaleX(width),
      height: this.scaleY(height)
    };
  }

  getCenterX() {
    return this.currentWidth / 2;
  }

  getCenterY() {
    return this.currentHeight / 2;
  }

  getRelativeX(absoluteX) {
    return absoluteX / this.currentWidth * this.baseWidth;
  }

  getRelativeY(absoluteY) {
    return absoluteY / this.currentHeight * this.baseHeight;
  }

  getSafeArea() {
    const padding = Math.min(this.currentWidth, this.currentHeight) * 0.02;
    return {
      left: padding,
      right: this.currentWidth - padding,
      top: padding,
      bottom: this.currentHeight - padding,
      padding: padding
    };
  }

  getBottomSafeArea() {
    const bottomPadding = this.orientation === 'portrait' 
      ? this.currentHeight * 0.05 
      : this.currentHeight * 0.02;
    return this.currentHeight - bottomPadding;
  }

  getTopSafeArea() {
    const topPadding = this.orientation === 'portrait'
      ? this.currentHeight * 0.03
      : this.currentHeight * 0.02;
    return topPadding;
  }

  layoutPortrait() {
    return {
      topBarHeight: this.scaleY(60),
      bottomBarHeight: this.scaleY(80),
      contentTop: this.getTopSafeArea() + this.scaleY(60),
      contentBottom: this.getBottomSafeArea() - this.scaleY(80),
      centerY: this.currentHeight / 2,
      playerArea: {
        y: this.currentHeight - this.scaleY(180),
        height: this.scaleY(120)
      },
      enemyArea: {
        y: this.scaleY(150),
        height: this.scaleY(180)
      },
      infoArea: {
        y: this.currentHeight / 2,
        height: this.scaleY(200)
      }
    };
  }

  layoutLandscape() {
    const isWide = this.currentWidth > this.currentHeight * 1.5;
    
    return {
      topBarHeight: this.scaleY(40),
      bottomBarHeight: this.scaleY(50),
      contentTop: this.getTopSafeArea() + this.scaleY(40),
      contentBottom: this.getBottomSafeArea() - this.scaleY(50),
      centerY: this.currentHeight / 2,
      playerArea: isWide
        ? { y: this.currentHeight / 2 + this.scaleY(20), height: this.scaleY(100) }
        : { y: this.currentHeight - this.scaleY(140), height: this.scaleY(100) },
      enemyArea: isWide
        ? { y: this.currentHeight / 2 - this.scaleY(100), height: this.scaleY(160) }
        : { y: this.scaleY(120), height: this.scaleY(160) },
      infoArea: isWide
        ? { x: this.currentWidth * 0.7, y: this.currentHeight / 2, height: this.scaleY(180) }
        : { x: this.currentWidth / 2, y: this.currentHeight / 2, height: this.scaleY(180) }
    };
  }

  getLayout() {
    return this.orientation === 'portrait'
      ? this.layoutPortrait()
      : this.layoutLandscape();
  }

  getFontSize(baseSize) {
    const minSize = baseSize * 0.8;
    const maxSize = baseSize * 1.2;
    return Math.max(minSize, Math.min(maxSize, baseSize * this.scaleFactor));
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  getResponsiveValue(portraitValue, landscapeValue) {
    return this.orientation === 'portrait' ? portraitValue : landscapeValue;
  }

  getCardSizes() {
    if (this.orientation === 'portrait') {
      return {
        enemyCard: {
          width: this.scaleX(100),
          height: this.scaleY(130)
        },
        playerCard: {
          width: this.scaleX(70),
          height: this.scaleY(90)
        },
        enemyGap: this.scaleX(10),
        playerGap: this.scaleX(8)
      };
    } else {
      const isWide = this.currentWidth > this.currentHeight * 1.5;
      if (isWide) {
        return {
          enemyCard: {
            width: this.scaleX(90),
            height: this.scaleY(110)
          },
          playerCard: {
            width: this.scaleX(65),
            height: this.scaleY(85)
          },
          enemyGap: this.scaleX(15),
          playerGap: this.scaleX(10)
        };
      } else {
        return {
          enemyCard: {
            width: this.scaleX(85),
            height: this.scaleY(115)
          },
          playerCard: {
            width: this.scaleX(60),
            height: this.scaleY(80)
          },
          enemyGap: this.scaleX(8),
          playerGap: this.scaleX(6)
        };
      }
    }
  }

  static instance = null;

  static getInstance() {
    if (!ResponsiveUtils.instance) {
      ResponsiveUtils.instance = new ResponsiveUtils();
    }
    return ResponsiveUtils.instance;
  }
}
