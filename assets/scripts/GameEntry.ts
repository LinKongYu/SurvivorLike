import { _decorator, Component } from 'cc';
import { createGameWorld, GameWorld } from './ecs/World';
import { System } from './ecs/System';
import { PrefabPool } from './ecs/PrefabPool';
import { GameConfig } from './ecs/GameConfig';
import { createPlayer, createSpawner, createEnemy } from './ecs/EntityFactory';
import { Transform } from './ecs/Components';
import { createGameSystems } from './ecs/GameSystems';

const { ccclass } = _decorator;

/**
 * GameEntry — 挂在场景根节点上的唯一入口组件。
 *
 * 职责：加载资源/配置 → 创建世界与所有系统 → 每帧按 priority 驱动系统。
 * 系统清单与执行顺序集中在 ecs/GameSystems.ts（优先级见 ecs/Schedule.ts）；
 * 想新增/调整系统改那里即可，这里只负责创建世界、铺初始实体、逐帧驱动。
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
        this._systems = createGameSystems(this.node);

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
