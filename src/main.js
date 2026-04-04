import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'
import PreloadScene from './scenes/PreloadScene.js'
import MainMenuScene from './scenes/MainMenuScene.js'
import BaseScene from './scenes/BaseScene.js'
import DungeonScene from './scenes/DungeonScene.js'
import BattleScene from './scenes/BattleScene.js'

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 375,
  height: 812,
  backgroundColor: '#1a1815',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, MainMenuScene, BaseScene, DungeonScene, BattleScene]
}

window.addEventListener('load', () => {
  const game = new Phaser.Game(config)
})
