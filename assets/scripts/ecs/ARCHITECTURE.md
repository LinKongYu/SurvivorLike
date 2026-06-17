# SurvivorLike ECS 架构说明

面向后续开发者：读完这页即可知道代码怎么组织、每帧怎么跑、以及「加一个技能/系统/组件/敌人」该改哪里。

## 总览

- 引擎 **Cocos Creator 3.8**；逻辑层是基于 vendored **bitECS 0.4** 的自研 ECS。
- 全部游戏逻辑在 `assets/scripts/ecs/`；唯一场景入口是 `assets/scripts/GameEntry.ts`（挂在 MainScene 根节点）。
- `assets/scripts/bitEcs/` 是**第三方库，禁止改动**。
- 数据驱动：数值放在 `assets/resources/configs/*.csv`，运行时由 `GameConfig` 读成类型化配置。

## 目录速查

| 路径 | 职责 |
| --- | --- |
| `GameEntry.ts` | 场景入口：加载配置/预制体 → 建世界 → 逐帧驱动系统 |
| `ecs/World.ts` | `GameWorld` 类型（bitECS world + paused/gameOver/time/playerEid） |
| `ecs/System.ts` | `System` 接口（priority / runWhenPaused / runWhenGameOver / update / destroy） |
| `ecs/Schedule.ts` | **系统执行顺序单一数据源**：`SystemPriority` 常量 + `sortSystems` |
| `ecs/GameSystems.ts` | 正式游戏的系统流水线工厂 `createGameSystems(rootNode)` |
| `ecs/Components.ts` | 通用组件数据容器 + `makeRender` 工厂 |
| `ecs/SkillComponents.ts` | 技能相关组件（攻击触发 / 效果实体 / 升级请求） |
| `ecs/ComponentRegistry.ts` | **组件登记单一机制**：`registerData` + `clearEntityData` |
| `ecs/Entities.ts` | 实体生命周期 `destroyEntity` + 伤害实体公共字段 `addDamager` |
| `ecs/Skills.ts` | **技能元数据单一数据源**：`SkillId` 常量、击退/命中冷却查表、`HIT_FLASH` |
| `ecs/EntityFactory.ts` | `createPlayer / createEnemy / createSpawner` |
| `ecs/GameConfig.ts` | CSV 解析 + 类型化配置 + 加载后数值校验 |
| `ecs/UpgradePool.ts` | 升级项定义 + 随机抽取 |
| `ecs/PrefabPool.ts` | 预制体批量加载与实例化 |
| `ecs/Helpers.ts` | 查询工具（`findNearestEnemy`） |
| `ecs/systems/*.ts` | 各系统（每帧逻辑） |
| `ecs/ui/*.ts` | UI 组件（`UiPrimitives / Hud / LevelUpPanel / GameOverPanel`），由 `UISystem` 编排 |

## 每帧循环

`GameEntry.update(dt)` 累加存活时间（仅非暂停/未结束时），然后按 `priority` 升序依次调用各系统的 `update(dt, world)`：

- 暂停时（升级面板弹出，`world.paused`）只跑 `runWhenPaused` 的系统（渲染、UI）。
- 结束后（`world.gameOver`）只跑 `runWhenGameOver` 的系统。

**完整执行顺序见 `ecs/Schedule.ts`**（输入/控制/AI → 物理移动 → 战斗与技能 → 经验/生成/清理 → 渲染/UI）。系统不再各自写死优先级数字，统一引用 `SystemPriority.Xxx`。

## 组件数据存储约定

bitECS 用「组件对象本身」作查询键；数据由游戏侧按 entity id 存放：

- **SoA**（热点数值）：`Transform = registerData({ x: [], y: [] })`，访问 `Transform.x[eid]`。
- **AoS**（Cocos 对象/结构体）：`Render = registerData([] as RenderData[])`，访问 `Render[eid]`。

每个存数据的组件都用 `registerData(...)` 包裹（见 `ComponentRegistry.ts`）。这样 `clearEntityData(eid)` 能遍历唯一登记表清理残留——**新增组件务必用 `registerData` 包裹**，否则 entity id 被回收复用时会读到脏数据。

## 实体生命周期

- 创建：`addEntity(world, ...组件)` 后逐字段赋值；渲染用 `makeRender(prefabName, opts?)`。
- 销毁：一律走 `destroyEntity(world, eid)`（存在性检查 → `clearEntityData` → `removeEntity`）。需要回收材质的（如带命中闪白的敌人）先调 `resetHitFlashMaterial(eid)` 再 `destroyEntity`。

## 配方：如何扩展

**加一个系统**：在 `ecs/systems/` 新建实现 `System` 的类，`priority` 用 `SystemPriority` 里的常量（必要时在 `Schedule.ts` 新增一档），然后在 `GameSystems.ts` 的列表里 `new` 一下。

**加一个组件**：在 `Components.ts` / `SkillComponents.ts` 用 `registerData({...})` 定义即可（自动纳入清理）。

**加一个伤害技能**：
1. `Skills.ts` 的 `SkillId` 加常量；`skillKnockbackSpeed` / `skillHitCooldown` 各补一行映射（数值仍只写在配置表）。
2. 新建一个触发系统（参考 `BladeSystem`）：创建伤害实体时调 `addDamager(eid, { damage, skillId: SkillId.Xxx, ownerEid, radius })` + `makeRender(...)`。
3. `GameConfig.ts` 的 `SkillsConfig` 加字段、`validate()` 加校验路径、`Skill.csv` 加数值行。
4. 解锁项加到 `UpgradePool.ts`。

**加一种敌人**：`Enemy.csv` 加一行（按 `id` 索引），`createEnemy` 取对应配置即可。

## Cocos 注意事项（重要）

- 场景/预制体通过**压缩 UUID**（存于 `.meta`）引用挂在节点上的脚本。`GameEntry` 与 `FlySwordTest` 被场景引用，**不可改其 `@ccclass(...)` 类名，也不可改/删其 `.ts.meta` 的 uuid**；改文件内容安全。
- 新增 `.ts` 由编辑器导入时会自动生成 `.meta`；移动已有脚本须连同 `.meta` 一起移动以保留 uuid。

## 已知交互点（改动当心）

- **击退与追逐**：命中后 `CombatSystem` 给敌人加 `Drag` 并赋初速；`MonsterChaseSystem` 见 `Drag` 即跳过（不覆盖击退速度）；`DragSystem` 速度衰减到阈值以下后移除 `Drag`，敌人恢复追逐。三者联动，改其一需顾及另两个。
- **碰撞查询时序**：`CombatSystem` 的伤害查询带 commit、敌人集合每帧只查一次（`isNested`），用于先冲刷上一帧待删除实体。改查询参数需谨慎。
