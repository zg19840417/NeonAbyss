# Cocos工程结构与目录规范

> 版本：Cocos v1.0  
> 日期：2026-04-08  
> 用途：定义新项目 `cocos/` 的工程结构与目录规则。  
> 面向：程序 AI

## 1. 技术路线

- 引擎：Cocos Creator 3.x
- 语言：TypeScript
- 项目目录：`cocos/`
- 设计基准分辨率：`1080 x 1920`
- 目标平台：
  - 微信小游戏
  - 抖音小游戏

## 2. 设计原则

- Phaser 项目只作参考，不迁移旧代码
- 新项目按模块重建
- UI 使用 Cocos 节点系统，不继续手写 Canvas UI 热区
- Excel 继续作为唯一数值源头
- JSON 由表导出后供程序读取

## 3. 推荐目录结构

```text
cocos/
  assets/
    art/
      portraits/
      ui/
      maps/
      icons/
      effects/
    audio/
    data/
      excel/
      json/
    scenes/
    prefabs/
    scripts/
      core/
      config/
      data/
      managers/
      runtime/
      ui/
      scenes/
      battle/
      story/
      utils/
  settings/
  package.json
```

## 4. 脚本分层

### 4.1 core

- 启动入口
- 全局配置
- 平台适配
- 全局事件

### 4.2 config

- 由 JSON 读取后的静态配置访问层
- 不放运行时状态

### 4.3 data

- TypeScript 类型定义
- 例如：
  - FusionGirlConfig
  - StageConfig
  - DropGroupConfig
  - ItemConfig
  - SaveData

### 4.4 managers

- 存档管理
- 资源管理
- 战斗管理
- 剧情管理
- 队伍管理
- 商店管理

### 4.5 runtime

- 玩家当前运行时数据
- 例如：
  - 当前融合姬列表
  - 当前碎片进度
  - 当前资源
  - 当前章节进度

### 4.6 ui

- 通用 UI 组件
- 标签页、按钮、血条、资源栏、弹窗等

### 4.7 scenes

- 主菜单
- 庇护所
- 队伍
- 主线地图
- 商店
- 设置

### 4.8 battle

- 战斗入口
- 战斗单位快照
- 战斗流程控制
- 日志系统

### 4.9 story

- 开场剧情
- 章节脚本
- 剧情驱动奖励与解锁

## 5. UI 结构原则

- 顶部资源栏常驻
- 底部导航常驻
- 庇护所作为主落点首页
- 队伍和战斗详情页采用统一三页签结构：
  - 基础
  - 技能
  - 能力

## 6. 第一阶段必建场景

- 主菜单
- 庇护所
- 队伍
- 主线地图
- 商店
- 设置
- 战斗

## 7. 第一阶段不做的东西

- 完整世界地图背景
- 抽卡系统
- 图鉴可见页面
- 活动玩法本体
- 每日任务

## 8. 执行原则

- 优先搭骨架，再做内容
- 优先主循环，再做外围
- 优先统一数据结构，再写 UI
