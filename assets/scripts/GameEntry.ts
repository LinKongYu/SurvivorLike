import { _decorator, Component } from 'cc';
import { ECSWorld } from './ecs/World';
import { PrefabPool } from './ecs/PrefabPool';
import { createPlayer, createSpawner, createEnemy } from './ecs/EntityFactory';
import { InputSystem } from './ecs/systems/InputSystem';
import { MovementSystem } from './ecs/systems/MovementSystem';
import { SeparationSystem } from './ecs/systems/SeparationSystem';
import { CombatSystem } from './ecs/systems/CombatSystem';
import { BladeSystem } from './ecs/systems/BladeSystem';
import { OrbitSystem } from './ecs/systems/OrbitSystem';
import { BombSystem } from './ecs/systems/BombSystem';
import { ExperienceSystem } from './ecs/systems/ExperienceSystem';
import { SpawnerSystem } from './ecs/systems/SpawnerSystem';
import { RenderSystem } from './ecs/systems/RenderSystem';
import { UISystem } from './ecs/systems/UISystem';
import { Transform } from './ecs/Components';
const { ccclass } = _decorator;

/**
 * GameEntry - Cocos Creator 与 ECS 的桥接入口
 *
 * 使用方式：在 Cocos Creator 编辑器中新建场景，
 * 将此组件挂载到 Canvas 节点上，然后运行。
 *
 * 启动流程：
 * 1. start() 先加载所有实体预制体（PrefabPool.loadAll）
 * 2. 加载完毕后再构建 World、注册 System、创建初始实体
 * 3. 加载期间 update() 跳过（_world 为空）
 */
@ccclass('GameEntry')
export class GameEntry extends Component {

    private _world: ECSWorld | null = null;

    start(): void {
        PrefabPool.loadAll()
            .then(() => this.initGame())
            .catch(err => {
                console.error('[GameEntry] 预制体加载失败，游戏无法启动', err);
            });
    }

    private initGame(): void {
        const world = new ECSWorld();

        // 注册 System（按 priority 排序）
        world.addSystem(new InputSystem(), 0);
        world.addSystem(new MovementSystem(), 10);
        world.addSystem(new SeparationSystem(), 15);
        world.addSystem(new CombatSystem(), 20);
        world.addSystem(new BladeSystem(), 22);
        world.addSystem(new OrbitSystem(), 23);
        world.addSystem(new BombSystem(), 24);
        world.addSystem(new ExperienceSystem(), 30);
        world.addSystem(new SpawnerSystem(), 40);
        world.addSystem(new RenderSystem(this.node), 90);
        world.addSystem(new UISystem(this.node), 95);

        // 创建初始实体
        const playerEid = createPlayer(world, 0, 0);
        createSpawner(world, playerEid);

        // 初始生成 3 个敌人
        const ptf = world.getComponent(playerEid, Transform)!;
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 300 + Math.random() * 200;
            createEnemy(
                world,
                ptf.x + Math.cos(angle) * dist,
                ptf.y + Math.sin(angle) * dist,
                playerEid, 1,
            );
        }

        this._world = world;
    }

    update(dt: number): void {
        if (this._world) {
            this._world.update(dt);
        }
    }
}
