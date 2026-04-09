# Excel 文件命名与目录规范

> 版本：Cocos v1.0  
> 日期：2026-04-08  
> 用途：定义新 Cocos 项目 Excel -> JSON 的目录、命名与导出规则。  
> 面向：程序 AI / 策划 AI

## 1. 数据目录
- Excel：`cocos/assets/data/excel`
- JSON：`cocos/assets/data/json`

## 2. 第一阶段 10 张 Excel 文件名
1. `fusion_girls.xlsx`
2. `portrait_sets.xlsx`
3. `portrait_fragments.xlsx`
4. `stages.xlsx`
5. `enemies.xlsx`
6. `enemy_groups.xlsx`
7. `drop_groups.xlsx`
8. `items.xlsx`
9. `global_config.xlsx`
10. `shop_items.xlsx`

## 3. 对应 JSON 文件名
1. `fusion_girls.json`
2. `portrait_sets.json`
3. `portrait_fragments.json`
4. `stages.json`
5. `enemies.json`
6. `enemy_groups.json`
7. `drop_groups.json`
8. `items.json`
9. `global_config.json`
10. `shop_items.json`

## 4. 命名原则
- 全部使用小写 snake_case
- Excel 与 JSON 一一对应
- 不使用中文文件名
- 程序层只读取 JSON，不直接读取 Excel
