import { _decorator, Component } from 'cc';
import { createGameWorld, GameWorld } from './ecs/World';
import { System } from './ecs/System';
import { PrefabPool } from './ecs/PrefabPool';
import { GameConfig } from './ecs/GameConfig';
import { createPlayer, createSpawner, createEnemy } from './ecs/EntityFactory';
import { Transform } from './ecs/Components';
import { InputSystem } from './ecs/systems/InputSystem';
import { PlayerControlSystem } from './ecs/systems/PlayerControlSystem';
import { MonsterChaseSystem } from './ecs/systems/MonsterChaseSystem';
import { MagnetSystem } from './ecs/systems/MagnetSystem';
import { MovementSystem } from './ecs/systems/MovementSystem';
import { DragSystem } from './ecs/systems/DragSystem';
import { SeparationSystem } from './ecs/systems/SeparationSystem';
import { CombatSystem } from './ecs/systems/CombatSystem';
import { HitFlashSystem } from './ecs/systems/HitFlashSystem';
import { BladeSystem } from './ecs/systems/BladeSystem';
import { OrbitSystem } from './ecs/systems/OrbitSystem';
import { BombSystem } from './ecs/systems/BombSystem';
import { ExperienceSystem } from './ecs/systems/ExperienceSystem';
import { SpawnerSystem } from './ecs/systems/SpawnerSystem';
import { LifetimeSystem } from './ecs/systems/LifetimeSystem';
import { RenderSystem } from './ecs/systems/RenderSystem';
import { UISystem } from './ecs/systems/UISystem';

const { ccclass } = _decorator;

/**
 * GameEntry — 挂在场景根节点上的唯一入口组件。
 *
 * 职责：加载资源/配置 → 创建世界与所有系统 → 每帧按 priority 驱动系统。
 * 想新增/调整系统：只需在 initGame 的列表里增删一行；执行顺序由各系统自带的
 * priority 决定（见各 System 类），这里不再维护任何优先级数字。
 */
@ccclass('GameEntry')
export class GameEntry extends Component {
    private _world: GameWorld | null = null;
    private _systems: System[] = [];

    start(): void {
        Promise.all([PrefabPool.loadAll(), GameConfig.loadAll()])
            .then(() => this.initGame())
            .catch(err => console.error('[GameEntry] 启动失败', err));
    }

    private initGame(): void {
        const world = createGameWorld();

        // 系统清单：在此 new 一下即可接入；顺序无所谓，下面会按 priority 排序。
        this._systems = [
            new InputSystem(),
            new PlayerControlSystem(),
            new MonsterChaseSystem(),
            new MagnetSystem(),
            new MovementSystem(),
            new DragSystem(),
            new SeparationSystem(),
            new CombatSystem(),
            new HitFlashSystem(),
            new BladeSystem(),
            new OrbitSystem(),
            new BombSystem(),
            new ExperienceSystem(),
            new SpawnerSystem(),
            new LifetimeSystem(),
            new RenderSystem(this.node),
            new UISystem(this.node),
        ].sort((a, b) => a.priority - b.priority);

        world.playerEid = createPlayer(world, 0, 0);
        createSpawner(world, world.playerEid);

        const cfg = GameConfig.spawner;
        const px = Transform.x[world.playerEid];
        const py = Transform.y[world.playerEid];
        for (let i = 0; i < cfg.initialSpawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = cfg.minSpawnDistance + Math.random() * (cfg.spawnRadius - cfg.minSpawnDistance);
            createEnemy(world, px + Math.cos(angle) * dist, py + Math.sin(angle) * dist, world.playerEid, 1);
        }

        this._world = world;
    }

    update(dt: number): void {
        const world = this._world;
        if (!world) return;

        // 全局存活计时：仅正常游玩时累加（暂停/结束时冻结），供 UI 与难度读取。
        if (!world.paused && !world.gameOver) world.time += dt;

        for (const sys of this._systems) {
            if (world.gameOver && !sys.runWhenGameOver) continue;
            if (world.paused && !sys.runWhenPaused) continue;
            sys.update(dt, world);
        }
    }

    onDestroy(): void {
        for (const sys of this._systems) {
            sys.destroy?.();
        }
    }
}
