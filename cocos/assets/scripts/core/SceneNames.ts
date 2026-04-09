export const SceneNames = {
  Boot: 'BootScene',
  MainMenu: 'MainMenuScene',
  Shelter: 'ShelterScene',
  Team: 'TeamScene',
  Map: 'MapScene',
  Shop: 'ShopScene',
  Settings: 'SettingsScene',
  Battle: 'BattleScene',
  Story: 'StoryScene',
} as const;

export type SceneName = (typeof SceneNames)[keyof typeof SceneNames];
