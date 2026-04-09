# Cocos Rebuild

This directory contains the new Cocos Creator 3.x rebuild.

Current status:
- Excel -> JSON data pipeline is ready
- TypeScript config/runtime/manager skeleton is ready
- Scene controller skeleton is ready
- Project shell files are scaffolded

Open steps:
1. Open this `cocos/` directory in Cocos Creator 3.x
2. Let Creator generate `library/`, `local/`, `profiles/`, and `temp/`
3. Create the initial scenes:
   - `BootScene`
   - `MainMenuScene`
   - `StoryScene`
   - `ShelterScene`
   - `TeamScene`
   - `MapScene`
   - `ShopScene`
   - `SettingsScene`
   - `BattleScene`
4. Bind the existing scene controllers under `assets/scripts/scenes`
5. Use `BootScene` as the launch scene

Notes:
- Design baseline: `1080 x 1920`
- Data source: `assets/data/excel`
- Exported JSON: `assets/data/json`
