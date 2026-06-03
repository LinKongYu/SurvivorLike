import { _decorator, Component } from 'cc';
import { createGameWorld } from './ecs/World';
import { PrefabPool } from './ecs/PrefabPool';
import { GameConfig } from './ecs/GameConfig';
import { createPlayer, createSpawner, createEnemy } from './ecs/EntityFactory';
import { positionStore } from './ecs/Components';
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

const { ccclass } = _decorator;

type GameSystemRunner = {
    sys: { update(dt: number, world: any): void; destroy?(): void };
    priority: number;
    runWhenPaused?: boolean;
    runWhenGameOver?: boolean;
};

@ccclass('GameEntry')
export class GameEntry extends Component {
    private _world: any = null;
    private _systems: GameSystemRunner[] = [];

    start(): void {
        Promise.all([PrefabPool.loadAll(), GameConfig.loadAll()])
            .then(() => this.initGame())
            .catch(err => console.error('[GameEntry] 启动失败', err));
    }

    private initGame(): void {
        const world = createGameWorld();

        this._systems = [
            { sys: new InputSystem(), priority: 0 },
            { sys: new PlayerControlSystem(), priority: 2 },
            { sys: new MonsterChaseSystem(), priority: 3 },
            { sys: new MagnetSystem(), priority: 4 },
            { sys: new MovementSystem(), priority: 10 },
            { sys: new DragSystem(), priority: 11 },
            { sys: new SeparationSystem(), priority: 15 },
            { sys: new CombatSystem(), priority: 20 },
            { sys: new BladeSystem(), priority: 22 },
            { sys: new OrbitSystem(), priority: 23 },
            { sys: new BombSystem(), priority: 24 },
            { sys: new ExperienceSystem(), priority: 30 },
            { sys: new SpawnerSystem(), priority: 40 },
            { sys: new LifetimeSystem(), priority: 50 },
            { sys: new RenderSystem(this.node), priority: 90, runWhenPaused: true, runWhenGameOver: true },
            { sys: new UISystem(this.node), priority: 95, runWhenPaused: true, runWhenGameOver: true },
        ].sort((a, b) => a.priority - b.priority);

        const playerEid = createPlayer(world, 0, 0);
        createSpawner(world, playerEid);

        const ptf = positionStore.get(playerEid)!;
        const cfg = GameConfig.spawner;
        for (let i = 0; i < cfg.initialSpawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = cfg.minSpawnDistance + Math.random() * (cfg.spawnRadius - cfg.minSpawnDistance);
            createEnemy(world, ptf.x + Math.cos(angle) * dist, ptf.y + Math.sin(angle) * dist, playerEid, 1);
        }

        this._world = world;
    }

    update(dt: number): void {
        if (!this._world) return;
        for (const { sys, runWhenPaused, runWhenGameOver } of this._systems) {
            if (this._world.gameOver && !runWhenGameOver) continue;
            if (this._world.paused && !runWhenPaused) continue;
            sys.update(dt, this._world);
        }
    }

    onDestroy(): void {
        for (const { sys } of this._systems) {
            sys.destroy?.();
        }
    }
}
