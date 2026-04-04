export const BattleSpeed = {
  NORMAL: 1,
  FAST: 2,
  FASTEST: 3
};

export const SpeedConfig = {
  [BattleSpeed.NORMAL]: {
    name: '1x',
    multiplier: 1.0,
    animationDuration: {
      attack: 500,
      skill: 800,
      heal: 600,
      damage: 300,
      float: 1000
    }
  },
  [BattleSpeed.FAST]: {
    name: '2x',
    multiplier: 2.0,
    animationDuration: {
      attack: 250,
      skill: 400,
      heal: 300,
      damage: 150,
      float: 500
    }
  },
  [BattleSpeed.FASTEST]: {
    name: '3x',
    multiplier: 3.0,
    animationDuration: {
      attack: 167,
      skill: 267,
      heal: 200,
      damage: 100,
      float: 333
    }
  }
};

export default class BattleSpeedManager {
  constructor(scene) {
    this.scene = scene;
    this.currentSpeed = BattleSpeed.NORMAL;
    this.button = null;
  }
  
  createSpeedButton(x, y, config = {}) {
    const {
      size = 60,
      onSpeedChange = null
    } = config;
    
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.circle(0, 0, size / 2, 0x2a2520);
    bg.setStrokeStyle(2, 0x4a4540);
    
    const speedText = this.scene.add.text(0, -5, this.getSpeedName(), {
      fontSize: '18px',
      fill: '#d4a574',
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const indicator = this.scene.add.text(0, 10, '▶', {
      fontSize: '12px',
      fill: '#888888',
      fontFamily: 'Noto Sans SC'
    }).setOrigin(0.5);
    
    container.add([bg, speedText, indicator]);
    container.setSize(size, size);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, size / 2), Phaser.Geom.Circle.Contains);
    
    container.on('pointerdown', () => {
      this.cycleSpeed();
      this.updateDisplay(speedText, indicator);
      if (onSpeedChange) {
        onSpeedChange(this.currentSpeed);
      }
    });
    
    container.on('pointerover', () => {
      bg.setStrokeStyle(2, 0xd4a574);
    });
    
    container.on('pointerout', () => {
      bg.setStrokeStyle(2, 0x4a4540);
    });
    
    this.button = container;
    this.speedText = speedText;
    this.indicator = indicator;
    
    return container;
  }
  
  cycleSpeed() {
    const speeds = [BattleSpeed.NORMAL, BattleSpeed.FAST, BattleSpeed.FASTEST];
    const currentIndex = speeds.indexOf(this.currentSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    this.currentSpeed = speeds[nextIndex];
    return this.currentSpeed;
  }
  
  setSpeed(speed) {
    if (SpeedConfig[speed]) {
      this.currentSpeed = speed;
      if (this.speedText && this.indicator) {
        this.updateDisplay(this.speedText, this.indicator);
      }
      return true;
    }
    return false;
  }
  
  getSpeed() {
    return this.currentSpeed;
  }
  
  getSpeedName() {
    return SpeedConfig[this.currentSpeed].name;
  }
  
  getMultiplier() {
    return SpeedConfig[this.currentSpeed].multiplier;
  }
  
  getAnimationDuration(animationType) {
    return SpeedConfig[this.currentSpeed].animationDuration[animationType] || 500;
  }
  
  updateDisplay(speedText, indicator) {
    if (speedText) {
      speedText.setText(this.getSpeedName());
    }
    if (indicator) {
      const indicators = ['▶', '▶▶', '▶▶▶'];
      const speeds = [BattleSpeed.NORMAL, BattleSpeed.FAST, BattleSpeed.FASTEST];
      const index = speeds.indexOf(this.currentSpeed);
      indicator.setText(indicators[index]);
    }
  }
  
  getDelay(baseDelay) {
    return baseDelay / this.getMultiplier();
  }
  
  pause() {
    this.previousSpeed = this.currentSpeed;
    this.currentSpeed = BattleSpeed.NORMAL;
  }
  
  resume() {
    if (this.previousSpeed) {
      this.currentSpeed = this.previousSpeed;
      this.previousSpeed = null;
    }
  }
  
  reset() {
    this.currentSpeed = BattleSpeed.NORMAL;
    if (this.speedText && this.indicator) {
      this.updateDisplay(this.speedText, this.indicator);
    }
  }
}

export function createSpeedToggle(scene, x, y, config = {}) {
  const {
    size = 50,
    onChange = null
  } = config;
  
  const manager = new BattleSpeedManager(scene);
  return manager.createSpeedButton(x, y, { size, onSpeedChange: onChange });
}
