export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.components = new Map();
    this.modals = [];
  }

  createCenteredHitArea(width, height) {
    return new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
  }
  
  createButton(x, y, text, config = {}) {
    const {
      width = 140,
      height = 50,
      backgroundColor = 0x2a2520,
      textColor = '#d4ccc0',
      hoverColor = '#d4a574',
      borderColor = 0x4a4540,
      borderWidth = 1,
      fontSize = 14,
      onClick = null
    } = config;
    
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, width, height, backgroundColor);
    bg.setStrokeStyle(borderWidth, borderColor);
    
    const label = this.scene.add.text(0, 0, text, {
      fontSize: fontSize + 'px',
      fill: textColor,
      fontFamily: 'Noto Sans SC'
    }).setOrigin(0.5);
    
    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive(this.createCenteredHitArea(width, height), Phaser.Geom.Rectangle.Contains);
    
    const originalBg = backgroundColor;
    
    container.on('pointerover', () => {
      bg.setFillStyle(0x3a3530);
      label.setColor(hoverColor);
      container.setScale(1.02);
    });
    
    container.on('pointerout', () => {
      bg.setFillStyle(originalBg);
      label.setColor(textColor);
      container.setScale(1);
    });
    
    container.on('pointerdown', () => {
      container.setScale(0.98);
    });
    
    container.on('pointerup', () => {
      container.setScale(1);
      if (onClick) onClick();
    });
    
    this.components.set('button_' + Date.now(), container);
    
    return container;
  }
  
  createCard(x, y, config = {}) {
    const {
      width = 140,
      height = 240,
      backgroundColor = 0x1a1815,
      borderColor = 0x4a4540,
      borderWidth = 1
    } = config;
    
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, width, height, backgroundColor);
    bg.setStrokeStyle(borderWidth, borderColor);
    
    container.add(bg);
    container.setSize(width, height);
    
    return container;
  }
  
  createHPBar(x, y, config = {}) {
    const {
      width = 120,
      height = 14,
      currentHp = 100,
      maxHp = 100,
      barColor = 0xa8d8a8,
      bgColor = 0x1a1815,
      textColor = '#ffffff'
    } = config;
    
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, width, height, bgColor);
    
    const barWidth = Math.max(0, (currentHp / maxHp) * width);
    const bar = this.scene.add.rectangle(-width/2 + barWidth/2, 0, barWidth, height, barColor);
    
    const text = this.scene.add.text(0, 0, `${currentHp}/${maxHp}`, {
      fontSize: '9px',
      fill: textColor,
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    container.add([bg, bar, text]);
    container.setSize(width, height);
    
    container.updateHP = (hp, max) => {
      const newWidth = Math.max(0, (hp / max) * width);
      bar.setDisplaySize(newWidth, height);
      bar.setX(-width/2 + newWidth/2);
      text.setText(`${hp}/${max}`);
    };
    
    return container;
  }
  
  createSkillButton(x, y, skill, config = {}) {
    const {
      size = 50,
      cooldown = 0,
      onClick = null
    } = config;
    
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.circle(0, 0, size/2, 0x2a2520);
    bg.setStrokeStyle(2, 0x4a4540);
    
    const icon = this.scene.add.text(0, 0, skill.icon || '⚔️', {
      fontSize: '24px'
    }).setOrigin(0.5);
    
    container.add([bg, icon]);
    container.setSize(size, size);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, size/2), Phaser.Geom.Circle.Contains);
    
    let cooldownOverlay = null;
    
    if (cooldown > 0) {
      cooldownOverlay = this.scene.add.graphics();
      cooldownOverlay.fillStyle(0x000000, 0.7);
      cooldownOverlay.fillCircle(0, 0, size/2);
      
      const cdText = this.scene.add.text(0, 0, cooldown.toString(), {
        fontSize: '16px',
        fill: '#ffffff',
        fontFamily: 'Noto Sans SC',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      cooldownOverlay.add(cdText);
      container.add(cooldownOverlay);
    }
    
    container.on('pointerover', () => {
      bg.setStrokeStyle(2, 0xd4a574);
    });
    
    container.on('pointerout', () => {
      bg.setStrokeStyle(2, 0x4a4540);
    });
    
    container.on('pointerdown', onClick);
    
    container.updateCooldown = (cd) => {
      if (cooldownOverlay) {
        cooldownOverlay.clear();
        if (cd > 0) {
          cooldownOverlay.fillStyle(0x000000, 0.7);
          cooldownOverlay.fillCircle(0, 0, size/2);
          cooldownOverlay.setVisible(true);
        } else {
          cooldownOverlay.setVisible(false);
        }
      }
    };
    
    return container;
  }
  
  createModal(title, content, config = {}) {
    const {
      width = 300,
      height = 200,
      titleColor = '#d4a574',
      textColor = '#d4ccc0',
      closeOnClickOutside = true
    } = config;
    
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    
    const overlay = this.scene.add.rectangle(centerX, centerY, 
      this.scene.cameras.main.width, 
      this.scene.cameras.main.height, 
      0x000000, 0.8);
    overlay.setInteractive();
    
    const modalBg = this.scene.add.rectangle(centerX, centerY, width, height, 0x2a2520);
    modalBg.setStrokeStyle(2, 0x4a4540);
    
    const titleText = this.scene.add.text(centerX, centerY - height/2 + 30, title, {
      fontSize: '18px',
      fill: titleColor,
      fontFamily: 'Noto Sans SC',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const closeBtn = this.scene.add.text(centerX + width/2 - 20, centerY - height/2 + 20, '✕', {
      fontSize: '20px',
      fill: '#888888'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    closeBtn.on('pointerover', () => closeBtn.setColor('#d4a574'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#888888'));
    closeBtn.on('pointerdown', () => this.closeModal());
    
    const container = this.scene.add.container(0, 0, [overlay, modalBg, titleText, closeBtn]);
    
    if (closeOnClickOutside) {
      overlay.on('pointerdown', () => this.closeModal());
    }
    
    this.modals.push(container);
    
    container.content = content;
    container.close = () => this.closeModal();
    
    return container;
  }
  
  closeModal() {
    if (this.modals.length > 0) {
      const modal = this.modals.pop();
      modal.destroy();
    }
  }
  
  closeAllModals() {
    while (this.modals.length > 0) {
      const modal = this.modals.pop();
      modal.destroy();
    }
  }
  
  createProgressBar(x, y, config = {}) {
    const {
      width = 200,
      height = 20,
      progress = 0,
      bgColor = 0x1a1815,
      barColor = 0xd4a574,
      borderColor = 0x4a4540
    } = config;
    
    const container = this.scene.add.container(x, y);
    
    const bg = this.scene.add.rectangle(0, 0, width, height, bgColor);
    bg.setStrokeStyle(1, borderColor);
    
    const barWidth = Math.min(width, progress * width);
    const bar = this.scene.add.rectangle(-width/2 + barWidth/2, 0, barWidth, height, barColor);
    
    container.add([bg, bar]);
    container.setSize(width, height);
    
    container.setProgress = (value) => {
      const newWidth = Math.min(width, value * width);
      bar.setDisplaySize(newWidth, height);
      bar.setX(-width/2 + newWidth/2);
    };
    
    return container;
  }
  
  createTooltip(x, y, text, config = {}) {
    const {
      maxWidth = 200,
      fontSize = 12,
      backgroundColor = 0x2a2520,
      textColor = '#d4ccc0',
      borderColor = 0x4a4540
    } = config;
    
    const padding = 10;
    
    const textObj = this.scene.add.text(0, 0, text, {
      fontSize: fontSize + 'px',
      fill: textColor,
      fontFamily: 'Noto Sans SC',
      wordWrap: { width: maxWidth - padding * 2 },
      align: 'left'
    }).setOrigin(0, 0.5);
    
    const bg = this.scene.add.rectangle(
      textObj.width/2 + padding,
      0,
      textObj.width + padding * 2,
      textObj.height + padding * 2,
      backgroundColor
    );
    bg.setStrokeStyle(1, borderColor);
    
    textObj.setPosition(padding, 0);
    
    const container = this.scene.add.container(x, y, [bg, textObj]);
    container.setSize(bg.width, bg.height);
    container.setVisible(false);
    
    container.show = (showX, showY) => {
      container.setPosition(showX, showY);
      container.setVisible(true);
    };
    
    container.hide = () => {
      container.setVisible(false);
    };
    
    return container;
  }
  
  createCharacterPortrait(x, y, character, config = {}) {
    const {
      width = 140,
      height = 240,
      showHp = true,
      showName = true,
      showLevel = true
    } = config;
    
    const container = this.scene.add.container(x, y);
    
    const cardBg = this.scene.add.rectangle(0, 0, width, height, 0x1a1815);
    cardBg.setStrokeStyle(1, 0x4a4540);
    
    const avatarArea = this.scene.add.rectangle(0, -height/2 + height * 0.35, width, height * 0.65, 0x2d2824);
    
    const avatar = this.scene.add.text(0, -height/2 + height * 0.35, character.avatar || '👤', {
      fontSize: '48px'
    }).setOrigin(0.5);
    
    let nameText = null;
    if (showName) {
      nameText = this.scene.add.text(0, height/2 - 60, character.name || '角色', {
        fontSize: '11px',
        fill: '#a8d8a8',
        fontFamily: 'Noto Sans SC',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
    
    let hpBar = null;
    if (showHp) {
      hpBar = this.createHPBar(0, height/2 - 30, {
        width: width - 10,
        height: 14,
        currentHp: character.hp || 0,
        maxHp: character.maxHp || 100,
        barColor: character.isEnemy ? 0xd8a8a8 : 0xa8d8a8
      });
    }
    
    let levelText = null;
    if (showLevel) {
      levelText = this.scene.add.text(width/2 - 15, -height/2 + 15, `Lv.${character.level || 1}`, {
        fontSize: '9px',
        fill: '#888888',
        fontFamily: 'Noto Sans SC'
      }).setOrigin(1, 0.5);
    }
    
    container.add([cardBg, avatarArea, avatar]);
    if (nameText) container.add(nameText);
    if (hpBar) container.add(hpBar);
    if (levelText) container.add(levelText);
    
    container.setSize(width, height);
    
    container.updateCharacter = (char) => {
      if (hpBar) {
        hpBar.updateHP(char.hp, char.maxHp);
      }
      if (nameText) {
        nameText.setText(char.name || '角色');
      }
    };
    
    return container;
  }
  
  destroyAll() {
    this.components.forEach(comp => comp.destroy());
    this.components.clear();
    this.closeAllModals();
  }
}
