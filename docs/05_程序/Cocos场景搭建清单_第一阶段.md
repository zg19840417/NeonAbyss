# Cocos场景搭建清单（第一阶段）

本清单面向 AI 与独立开发者执行。
目标：先让 `Boot -> 主菜单 -> 开场剧情 -> 庇护所` 这条链在 Cocos Creator 3.8.8 内可运行。

## 1. 必建场景

在 `cocos/assets/scenes` 中创建以下场景：

- `BootScene`
- `MainMenuScene`
- `StoryScene`
- `ShelterScene`
- `TeamScene`
- `MapScene`
- `ShopScene`
- `SettingsScene`
- `BattleScene`

将 `BootScene` 设为启动场景。

## 2. 通用 UI 预制结构

后续多数页面共用 2 个区域：

- 顶部资源栏
- 底部导航栏

建议在 `cocos/assets/prefabs` 中创建：

- `TopResourceBar.prefab`
- `BottomNavBar.prefab`
- `CommonButton.prefab`

第一阶段如果不想先做 prefab，也可以先在每个场景内直接摆节点。

## 3. BootScene

### 根节点结构

- `Canvas`
  - `BootRoot`

### 挂载脚本

- `BootRoot`
  - 挂：`BootSceneController`

### 说明

- 此场景不需要顶部资源栏
- 不需要底部导航
- 不需要任何按钮
- 进入场景后自动执行：
  - 读取 JSON
  - 初始化运行时
  - 进入 `MainMenuScene`

## 4. MainMenuScene

### 根节点结构

- `Canvas`
  - `MainMenuRoot`
    - `TitleLabel`
    - `StartButton`

### 挂载脚本

- `MainMenuRoot`
  - 挂：`MainMenuSceneController`
- `StartButton`
  - 挂：`CommonButton`

### 需要手动绑定

`StartButton/CommonButton`
- `label`
- `background`
- `button`

### 按钮文案

- `开始游戏`

### 调用方式

后续在编辑器中给 `MainMenuRoot` 增加一个按钮点击事件：
- 目标：`MainMenuRoot`
- 方法：`startGame`

## 5. StoryScene

### 根节点结构

- `Canvas`
  - `StoryRoot`
    - `TopBar`
    - `StoryPanel`
      - `PageText`
      - `NextButton`
      - `SkipInfo`

### 挂载脚本

- `StoryRoot`
  - 挂：`StorySceneController`
- `TopBar`
  - 挂：`TopResourceBar`
- `NextButton`
  - 挂：`CommonButton`

### 说明

- 第一阶段开场剧情不可跳过
- `NextButton` 用于逐页推进
- 最后一页点击后调用：
  - `completeOpeningStory`

## 6. ShelterScene

### 根节点结构

- `Canvas`
  - `ShelterRoot`
    - `TopBar`
    - `HomePanel`
      - `MascotPortrait`
      - `CurrentStageLabel`
      - `ContinueMainlineButton`
      - `EventEntry`
    - `BottomNav`

### 挂载脚本

- `ShelterRoot`
  - 挂：`ShelterSceneController`
- `TopBar`
  - 挂：`TopResourceBar`
- `BottomNav`
  - 挂：`BottomNavBar`
- `ContinueMainlineButton`
  - 挂：`CommonButton`

### 说明

- 庇护所是首页
- 看板娘展示区在中部
- 活动入口先做未开放态
- `ContinueMainlineButton` 后续跳转 `MapScene`

## 7. TeamScene

### 根节点结构

- `Canvas`
  - `TeamRoot`
    - `TopBar`
    - `TeamPanel`
    - `BottomNav`

### 挂载脚本

- `TeamRoot`
  - 挂：`TeamSceneController`
- `TopBar`
  - 挂：`TopResourceBar`
- `BottomNav`
  - 挂：`BottomNavBar`

### 说明

- 第一阶段至少先能显示：
  - 3 个融合姬上阵位
  - 1 个战斗芯片位

## 8. MapScene

### 根节点结构

- `Canvas`
  - `MapRoot`
    - `TopBar`
    - `ChapterMapPanel`
    - `BottomNav`
    - `StageDetailModal`

### 挂载脚本

- `MapRoot`
  - 挂：`MapSceneController`
- `TopBar`
  - 挂：`TopResourceBar`
- `BottomNav`
  - 挂：`BottomNavBar`
- `StageDetailModal`
  - 挂：`ModalPanel`

### 说明

- 第一阶段只做第一章 10 个节点
- 节点点击后显示：
  - 敌方预览
  - 体力消耗
  - 1/2/3 星首通奖励
  - 重复挑战奖励

## 9. ShopScene

### 根节点结构

- `Canvas`
  - `ShopRoot`
    - `TopBar`
    - `TabHeader`
    - `ShopPanel`
    - `BottomNav`

### 挂载脚本

- `ShopRoot`
  - 挂：`ShopSceneController`
- `TopBar`
  - 挂：`TopResourceBar`
- `BottomNav`
  - 挂：`BottomNavBar`
- `TabHeader`
  - 挂：`TabHeader`

### 说明

- 页签预留 3 个：
  - 基础商店
  - 元素点商店
  - 活动商店
- 第一阶段只启用：
  - 基础商店

## 10. SettingsScene

### 根节点结构

- `Canvas`
  - `SettingsRoot`
    - `TopBar`
    - `SettingsPanel`
    - `BottomNav`

### 挂载脚本

- `SettingsRoot`
  - 挂：`SettingsSceneController`
- `TopBar`
  - 挂：`TopResourceBar`
- `BottomNav`
  - 挂：`BottomNavBar`

### 说明

- 第一阶段只有：
  - 绑定账号（预留）
  - 重置账号

## 11. BattleScene

### 根节点结构

- `Canvas`
  - `BattleRoot`
    - `TopBar`
    - `BattleField`
    - `BattleLogBar`
    - `BattleControlBar`

### 挂载脚本

- `BattleRoot`
  - 挂：`BattleSceneController`
- `TopBar`
  - 挂：`TopResourceBar`

### 说明

- 第一阶段结构：
  - 顶部：关卡名 + 回合数
  - 中部：敌 3 / 我 3
  - 下方：日志
  - 底部：1x/2x、暂停

## 12. 第一条最小可运行链

优先验证：

1. `BootScene`
2. 自动进入 `MainMenuScene`
3. 点击“开始游戏”
4. 若未完成开场剧情，进入 `StoryScene`
5. 剧情完成后发放 3 个初始融合姬
6. 自动进入 `ShelterScene`

只要这条链跑通，就算新项目第一次真正“跑起来”。
