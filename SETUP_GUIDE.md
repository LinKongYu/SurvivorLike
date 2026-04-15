# 幸存者Like游戏框架 - 安装和使用指南

## 环境要求

- **Cocos Creator**: 3.8.8 或更高版本
- **Node.js**: 14.x 或更高版本
- **TypeScript**: 4.x 或更高版本

## 快速安装

### 1. 导入项目到Cocos Creator

1. 打开Cocos Creator
2. 点击"打开其他项目"
3. 选择本项目的根目录 (`/mnt/d/CoocosProject/SurvivorLike`)
4. 等待项目加载完成

### 2. 创建基本场景

如果项目中没有现成场景，请按以下步骤创建：

#### 步骤1: 创建新场景
1. 在"资源管理器"中右键点击"assets"文件夹
2. 选择"创建" -> "场景"
3. 命名为`Main.scene`

#### 步骤2: 添加游戏管理器
1. 在"层级管理器"中右键点击"Canvas"
2. 选择"创建节点" -> "创建空节点"
3. 重命名为`GameManager`
4. 在"属性检查器"中点击"添加组件"
5. 选择"自定义脚本" -> `GameManager`

#### 步骤3: 添加玩家角色
1. 创建新节点并重命名为`Player`
2. 添加以下组件：
   - `Sprite` (设置一个玩家图片)
   - `RigidBody2D` (类型: Dynamic)
   - `Collider2D` (根据图片形状选择Box或Circle)
   - `PlayerController` (自定义脚本)

#### 步骤4: 添加敌人生成器
1. 创建新节点并重命名为`EnemySpawner`
2. 添加`EnemySpawner`组件

#### 步骤5: 添加UI管理器
1. 创建新节点并重命名为`UIManager`
2. 添加`UIManager`组件
3. 创建UI元素并连接到组件属性

#### 步骤6: 添加技能系统
1. 创建新节点并重命名为`SkillSystem`
2. 添加`SkillSystem`组件

### 3. 创建预制体

#### 敌人预制体
1. 创建新节点并重命名为`EnemyPrefab`
2. 添加以下组件：
   - `Sprite` (设置敌人图片)
   - `RigidBody2D` (类型: Dynamic)
   - `Collider2D`
   - `EnemyController`
3. 拖拽到"资源管理器"的`assets/prefabs`文件夹中创建预制体

#### 经验球预制体
1. 创建新节点并重命名为`ExperienceOrbPrefab`
2. 添加以下组件：
   - `Sprite` (设置经验球图片)
   - `Collider2D` (设置为触发器)
   - `ExperienceOrb`
3. 拖拽到"资源管理器"的`assets/prefabs`文件夹中创建预制体

### 4. 配置组件属性

#### GameManager配置
- `player`: 拖拽Player节点到这里
- `enemySpawner`: 拖拽EnemySpawner节点到这里
- `uiManager`: 拖拽UIManager节点到这里

#### EnemySpawner配置
- `enemyPrefab`: 拖拽敌人预制体到这里
- `experienceOrbPrefab`: 拖拽经验球预制体到这里
- `spawnInterval`: 2.0 (生成间隔)
- `maxEnemies`: 20 (最大敌人数)
- `spawnRadius`: 500 (生成半径)

#### PlayerController配置
- `moveSpeed`: 300 (移动速度)
- `maxHealth`: 100 (最大血量)
- `attackDamage`: 10 (攻击伤害)
- `attackRange`: 100 (攻击范围)
- `attackCooldown`: 0.5 (攻击冷却)

### 5. 运行测试

#### 方法1: 使用GameTest组件
1. 在场景中创建新节点并重命名为`GameTest`
2. 添加`GameTest`组件
3. 运行场景，查看控制台输出

#### 方法2: 手动测试
1. 点击Cocos Creator的"预览"按钮
2. 使用WASD或方向键移动玩家
3. 观察敌人是否正常生成和追逐玩家
4. 检查UI是否正常显示

## 常见问题

### Q1: 玩家无法移动
- 检查PlayerController组件是否正确添加
- 检查RigidBody2D组件是否存在
- 查看控制台是否有错误信息

### Q2: 敌人生成失败
- 检查EnemySpawner组件配置
- 确认敌人预制体已正确设置
- 检查生成半径是否合适

### Q3: UI不显示
- 检查UIManager组件配置
- 确认UI元素已正确连接到组件属性
- 检查Canvas的渲染设置

### Q4: 经验系统不工作
- 检查经验球预制体配置
- 确认Collider2D设置为触发器
- 检查玩家和经验球的碰撞层设置

### Q5: 技能系统无法使用
- 检查SkillSystem组件是否正确添加
- 确认玩家节点已正确设置
- 检查技能选择事件是否正确触发

## 调试技巧

### 1. 使用控制台日志
所有脚本都有详细的日志输出，可以在Cocos Creator的控制台面板查看。

### 2. 启用调试模式
在GameManager组件中可以添加调试标志：
```typescript
public debugMode: boolean = true;
```

### 3. 使用GameTest组件
GameTest组件可以自动验证所有系统的基本功能。

### 4. 性能监控
在Cocos Creator的"分析器"面板中监控游戏性能。

## 扩展开发

### 添加新功能
1. 在对应的脚本目录中创建新脚本
2. 实现功能逻辑
3. 在场景中添加和配置组件
4. 测试功能

### 修改现有功能
1. 找到对应的脚本文件
2. 修改逻辑代码
3. 运行测试确保没有破坏现有功能
4. 更新文档

### 资源管理
- 图片资源放在`assets/textures`文件夹
- 音效资源放在`assets/audio`文件夹
- 预制体放在`assets/prefabs`文件夹
- 脚本放在`assets/scripts`文件夹

## 下一步

完成基本框架搭建后，可以：
1. 添加更多技能类型
2. 实现多种敌人类型
3. 添加关卡系统
4. 实现成就系统
5. 添加音效和音乐
6. 优化游戏性能
7. 添加移动设备支持

## 获取帮助

如果遇到问题：
1. 查看控制台错误信息
2. 检查组件配置
3. 参考脚本中的注释
4. 查看README.md文档
5. 在GitHub上提交Issue

## 更新日志

### v1.0.0 (初始版本)
- 基本游戏框架搭建
- 玩家移动和自动攻击系统
- 敌人生成和AI系统
- 经验收集和升级系统
- 技能系统框架
- 完整的UI系统
- 游戏状态管理
- 测试框架