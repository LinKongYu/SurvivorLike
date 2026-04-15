# 幸存者Like游戏框架

这是一个基于Cocos Creator的幸存者Like游戏基本框架，模仿《Vampire Survivors》等游戏的玩法。

## 功能特性

### 核心系统
- ✅ 玩家角色控制（WASD/方向键移动）
- ✅ 自动攻击系统
- ✅ 敌人生成和AI（追逐玩家）
- ✅ 经验收集和升级系统
- ✅ 技能系统（5种基础技能）
- ✅ 游戏状态管理
- ✅ 完整的UI系统（血量、经验、分数、时间）

### 游戏机制
- 自动攻击：玩家角色会自动攻击周围的敌人
- 经验系统：击败敌人掉落经验球，收集后获得经验
- 升级系统：积累经验升级，获得属性提升和技能选择
- 难度递增：随时间增加敌人生成频率和强度
- 技能进化：技能可以升级，提升效果

## 项目结构

```
assets/
├── scripts/
│   ├── core/
│   │   └── GameManager.ts          # 游戏管理器
│   ├── player/
│   │   └── PlayerController.ts     # 玩家控制器
│   ├── enemy/
│   │   ├── EnemyController.ts      # 敌人控制器
│   │   └── EnemySpawner.ts         # 敌人生成器
│   ├── systems/
│   │   ├── ExperienceOrb.ts        # 经验球
│   │   └── SkillSystem.ts          # 技能系统
│   └── ui/
│       └── UIManager.ts            # UI管理器
├── prefabs/
│   ├── Hero.prefab                 # 玩家预制体
│   └── Monster.prefab              # 敌人预制体
└── resources/                      # 资源文件
```

## 快速开始

### 1. 设置场景
1. 在Cocos Creator中创建新场景
2. 添加以下节点：
   - `Player` (玩家角色)
   - `EnemySpawner` (敌人生成器)
   - `UIManager` (UI管理器)
   - `GameManager` (游戏管理器)
   - `SkillSystem` (技能系统)

### 2. 配置组件
为每个节点添加对应的脚本组件：

**GameManager节点：**
- 添加 `GameManager` 脚本
- 拖拽Player、EnemySpawner、UIManager节点到对应属性

**Player节点：**
- 添加 `PlayerController` 脚本
- 添加RigidBody2D和Collider2D组件
- 设置移动速度、血量、攻击力等属性

**EnemySpawner节点：**
- 添加 `EnemySpawner` 脚本
- 创建敌人预制体和经验球预制体
- 设置生成间隔、最大敌人数等参数

**UIManager节点：**
- 添加 `UIManager` 脚本
- 创建UI元素并拖拽到对应属性

### 3. 创建预制体
1. 创建敌人预制体：
   - 添加Sprite组件显示敌人
   - 添加 `EnemyController` 脚本
   - 添加RigidBody2D和Collider2D组件

2. 创建经验球预制体：
   - 添加Sprite组件显示经验球
   - 添加 `ExperienceOrb` 脚本
   - 添加Collider2D组件

### 4. 运行游戏
1. 点击Cocos Creator的预览按钮
2. 使用WASD或方向键控制玩家移动
3. 玩家会自动攻击靠近的敌人
4. 击败敌人获得经验，升级后选择新技能

## 脚本说明

### GameManager
游戏总控制器，管理游戏状态、分数、时间，协调各个系统。

### PlayerController
玩家控制脚本，处理：
- 键盘输入移动
- 自动攻击
- 血量管理
- 经验收集和升级
- 碰撞检测

### EnemyController
敌人AI脚本，处理：
- 追逐玩家行为
- 血量管理
- 死亡掉落经验

### EnemySpawner
敌人生成器，处理：
- 定时生成敌人
- 难度递增
- 经验球生成

### ExperienceOrb
经验球脚本，处理：
- 浮动动画效果
- 玩家吸引机制
- 收集逻辑

### UIManager
UI管理器，处理：
- 血量、经验、分数显示
- 游戏结束界面
- 技能选择界面
- UI动画效果

### SkillSystem
技能系统，包含：
- 5种基础技能定义
- 技能学习和升级
- 技能冷却管理
- 技能效果执行

## 扩展开发

### 添加新技能
1. 在 `SkillSystem.ts` 的 `SKILLS` 对象中添加新技能定义
2. 在 `executeSkillEffect` 方法中添加技能效果实现
3. 在 `upgradeSkill` 方法中添加技能升级逻辑

### 添加新敌人类型
1. 创建新的敌人预制体
2. 扩展 `EnemyController` 或创建新的敌人控制器
3. 在 `EnemySpawner` 中支持生成新敌人类型

### 添加新游戏模式
1. 扩展 `GameManager` 类
2. 添加新的游戏状态和规则
3. 更新UI以支持新模式

## 控制说明

- **移动**: WASD 或 方向键
- **自动攻击**: 无需操作，自动进行
- **技能使用**: 升级后自动获得（完整版可绑定按键）
- **重新开始**: 游戏结束后点击重新开始按钮

## 开发计划

### 短期目标
- [ ] 添加更多技能类型
- [ ] 实现技能进化系统
- [ ] 添加多种敌人类型
- [ ] 实现关卡系统
- [ ] 添加音效和音乐

### 长期目标
- [ ] 添加本地化支持
- [ ] 实现成就系统
- [ ] 添加在线排行榜
- [ ] 支持移动设备控制
- [ ] 添加剧情模式

## 技术栈

- **游戏引擎**: Cocos Creator 3.8.8
- **编程语言**: TypeScript
- **物理引擎**: Built-in 2D Physics
- **UI系统**: Cocos Creator UI

## 许可证

MIT License - 详见 LICENSE 文件

## 贡献指南

欢迎提交Issue和Pull Request来改进这个框架！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request