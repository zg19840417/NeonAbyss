export const SoundType = {
  BGM: 'bgm',
  SE: 'se',
  VOICE: 'voice'
};

export const BGMList = {
  MAIN_MENU: 'main_menu',
  BASE: 'base',
  DUNGEON: 'dungeon',
  BATTLE: 'battle',
  BOSS: 'boss',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
};

export const SEList = {
  UI_CLICK: 'ui_click',
  UI_HOVER: 'ui_hover',
  UI_POPUP: 'ui_popup',
  UI_CLOSE: 'ui_close',
  BATTLE_ATTACK: 'battle_attack',
  BATTLE_HIT: 'battle_hit',
  BATTLE_CRITICAL: 'battle_critical',
  BATTLE_SKILL: 'battle_skill',
  BATTLE_HEAL: 'battle_heal',
  BATTLE_DEBUFF: 'battle_debuff',
  BATTLE_BUFF: 'battle_buff',
  BATTLE_DEATH: 'battle_death',
  BATTLE_VICTORY: 'battle_victory',
  PLAYER_DEFEAT: 'player_defeat',
  ITEM_USE: 'item_use',
  EQUIP_ENHANCE: 'equip_enhance',
  EQUIP_SUCCESS: 'equip_success',
  COIN_GET: 'coin_get',
  LEVEL_UP: 'level_up',
  DOOR_OPEN: 'door_open',
  CHEST_OPEN: 'chest_open',
  SHOP_PURCHASE: 'shop_purchase',
  NOTIFICATION: 'notification',
  ERROR: 'error'
};

export default class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = new Map();
    this.bgm = null;
    this.currentBgm = null;
    this.settings = {
      masterVolume: 1.0,
      bgmVolume: 0.7,
      seVolume: 0.8,
      voiceVolume: 1.0,
      muted: false
    };
    this.initialized = false;
  }
  
  initialize() {
    if (this.initialized) return;
    
    if (!this.scene.game.sound.locked) {
      this.initialized = true;
    }
  }
  
  loadSound(key, path, type = SoundType.SE) {
    if (!this.scene.load.exists(key)) {
      this.scene.load.audio(key, path);
    }
  }
  
  loadAllSounds() {
    this.scene.load.on('complete', () => {
      this.initialized = true;
    });
  }
  
  play(key, config = {}) {
    if (!this.settings.muted && this.initialized) {
      const sound = this.scene.sound.add(key, {
        volume: this.getVolume(config.type || SoundType.SE),
        loop: config.loop || false,
        delay: config.delay || 0
      });
      
      sound.play();
      
      if (config.onComplete) {
        sound.on('complete', config.onComplete);
      }
      
      return sound;
    }
    return null;
  }
  
  playBGM(key, config = {}) {
    if (this.bgm) {
      this.bgm.stop();
      this.bgm = null;
    }
    
    if (!this.settings.muted) {
      this.bgm = this.play(key, {
        type: SoundType.BGM,
        loop: true,
        ...config
      });
      this.currentBgm = key;
    }
    
    return this.bgm;
  }
  
  stopBGM() {
    if (this.bgm) {
      this.bgm.stop();
      this.bgm = null;
      this.currentBgm = null;
    }
  }
  
  pauseBGM() {
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.pause();
    }
  }
  
  resumeBGM() {
    if (this.bgm && this.bgm.isPaused) {
      this.bgm.resume();
    }
  }
  
  fadeOutBGM(duration = 1000) {
    if (!this.bgm) return;
    
    const startVolume = this.getVolume(SoundType.BGM);
    const startTime = Date.now();
    
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const newVolume = startVolume * (1 - progress);
      
      if (this.bgm) {
        this.bgm.setVolume(newVolume);
      }
      
      if (progress >= 1) {
        clearInterval(fadeInterval);
        this.stopBGM();
      }
    }, 50);
  }
  
  playSE(seKey, volume = 1.0) {
    return this.play(seKey, {
      type: SoundType.SE,
      volume: volume
    });
  }
  
  getVolume(type) {
    let baseVolume = 1.0;
    
    switch (type) {
      case SoundType.BGM:
        baseVolume = this.settings.bgmVolume;
        break;
      case SoundType.SE:
        baseVolume = this.settings.seVolume;
        break;
      case SoundType.VOICE:
        baseVolume = this.settings.voiceVolume;
        break;
    }
    
    return baseVolume * this.settings.masterVolume;
  }
  
  setVolume(type, volume) {
    switch (type) {
      case SoundType.BGM:
        this.settings.bgmVolume = Math.max(0, Math.min(1, volume));
        break;
      case SoundType.SE:
        this.settings.seVolume = Math.max(0, Math.min(1, volume));
        break;
      case SoundType.VOICE:
        this.settings.voiceVolume = Math.max(0, Math.min(1, volume));
        break;
      case 'master':
        this.settings.masterVolume = Math.max(0, Math.min(1, volume));
        break;
    }
    
    if (this.bgm) {
      this.bgm.setVolume(this.getVolume(SoundType.BGM));
    }
    
    return this.settings;
  }
  
  toggleMute() {
    this.settings.muted = !this.settings.muted;
    
    if (this.settings.muted) {
      this.stopBGM();
    }
    
    return this.settings.muted;
  }
  
  isMuted() {
    return this.settings.muted;
  }
  
  getSettings() {
    return { ...this.settings };
  }
  
  loadSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    
    if (this.bgm) {
      this.bgm.setVolume(this.getVolume(SoundType.BGM));
    }
  }
  
  destroy() {
    this.stopBGM();
    this.sounds.forEach(sound => {
      if (sound.stop) sound.stop();
    });
    this.sounds.clear();
  }
}

export class SoundGenerator {
  static generateSimpleTone(frequency, duration, type = 'sine') {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
    
    return { audioContext, oscillator, gainNode };
  }
  
  static playUIClick() {
    return this.generateSimpleTone(800, 0.1, 'square');
  }
  
  static playHit() {
    return this.generateSimpleTone(200, 0.15, 'sawtooth');
  }
  
  static playHeal() {
    return this.generateSimpleTone(600, 0.3, 'sine');
  }
  
  static playCoin() {
    this.generateSimpleTone(1200, 0.05, 'square');
    setTimeout(() => this.generateSimpleTone(1500, 0.05, 'square'), 50);
  }
  
  static playVictory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.generateSimpleTone(freq, 0.2, 'sine'), i * 100);
    });
  }
  
  static playDefeat() {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => this.generateSimpleTone(freq, 0.3, 'sawtooth'), i * 150);
    });
  }
}
