import { _decorator, Component } from 'cc';
import { ECSWorld } from './ecs/World';
import { PrefabPool } from './ecs/PrefabPool';
import { GameConfig } from './ecs/GameConfig';
import { createPlayer, createSpawner, createEnemy } from './ecs/EntityFactory';
import { InputSystem } from './ecs/systems/InputSystem';
import { PlayerControlSystem } from './ecs/systems/PlayerControlSystem';
import { MonsterChaseSystem } from './ecs/systems/MonsterChaseSystem';
import { MagnetSystem } from './ecs/systems/MagnetSystem';
import { MovementSystem } from './ecs/systems/MovementSystem';
import { DragSystem } from './ecs/systems/DragSystem';
import { SeparationSystem } from './ecs/systems/SeparationSystem';
import { CombatSystem } from './ecs/systems/CombatSystem';
import { BladeSystem } from './ecs/systems/BladeSystem';
import { OrbitSystem } from './ecs/systems/OrbitSystem';
import { BombSystem } from './ecs/systems/BombSystem';
import { ExperienceSystem } from './ecs/systems/ExperienceSystem';
import { SpawnerSystem } from './ecs/systems/SpawnerSystem';
import { LifetimeSystem } from './ecs/systems/LifetimeSystem';
import { RenderSystem } from './ecs/systems/RenderSystem';
import { UISystem } from './ecs/systems/UISystem';
import { Transform, Camp } from './ecs/Components';

const { ccclass } = _decorator;

/**
 * GameEntry — Cocos Creator 与 ECS 的桥接入口
 */
@ccclass('GameEntry')
export class GameEntry extends Component {

    private _world: ECSWorld | null = null;

    start(): void {
        Promise.all([
            PrefabPool.loadAll(),
            GameConfig.loadAll(),
        ])
            .then(() => this.initGame())
            .catch(err => {
                console.error('[GameEntry] 启动资源加载失败', err);
            });
    }

    private initGame(): void {
        const world = new ECSWorld();

        // 注册 System（按执行顺序）
        world.addSystem(new InputSystem(), 0);               // 键盘 → PlayerInput
        world.addSystem(new PlayerControlSystem(), 2);       // PlayerInput → Velocity
        world.addSystem(new MonsterChaseSystem(), 3);        // MoveToTarget → Velocity
        world.addSystem(new MagnetSystem(), 4);              // 经验球吸引 → Velocity
        world.addSystem(new MovementSystem(), 10);           // Position += Velocity × dt
        world.addSystem(new DragSystem(), 11);               // 速度阻力衰减
        world.addSystem(new SeparationSystem(), 15);         // 软分离
        world.addSystem(new CombatSystem(), 20);             // 碰撞 + 伤害
        world.addSystem(new BladeSystem(), 22);              // 剑光生成
        world.addSystem(new OrbitSystem(), 23);              // 飞剑环绕
        world.addSystem(new BombSystem(), 24);               // 炸弹 + 爆炸
        world.addSystem(new ExperienceSystem(), 30);         // 经验 + 升级
        world.addSystem(new SpawnerSystem(), 40);            // 敌人生成
        world.addSystem(new LifetimeSystem(), 50);           // 生命周期
        world.addSystem(new RenderSystem(this.node), 90);    // ECS → Node
        world.addSystem(new UISystem(this.node), 95);        // UI

        // 创建初始实体
        const playerEid = createPlayer(world, 0, 0);
        createSpawner(world, playerEid);

        // 初始生成若干敌人
        const ptf = world.getComponent(playerEid, Transform)!;
        const spawnerCfg = GameConfig.spawner;
        const initialCount = spawnerCfg.initialSpawnCount;
        for (let i = 0; i < initialCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = spawnerCfg.minSpawnDistance
                + Math.random() * (spawnerCfg.spawnRadius - spawnerCfg.minSpawnDistance);
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
