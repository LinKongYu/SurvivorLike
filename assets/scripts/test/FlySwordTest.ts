import { _decorator, Component } from 'cc';
import { addEntity, addComponent } from '../bitEcs';
import { createGameWorld, GameWorld } from '../ecs/World';
import { System } from '../ecs/System';
import { PrefabPool } from '../ecs/PrefabPool';
import { GameConfig } from '../ecs/GameConfig';
import { Transform, Render } from '../ecs/Components';
import { OrbitAttack } from '../ecs/SkillComponents';
import { OrbitSystem } from '../ecs/systems/OrbitSystem';
import { RenderSystem } from '../ecs/systems/RenderSystem';

const { ccclass, property } = _decorator;

/**
 * FlySwordTest — 飞剑表现测试脚本
 *
 * 挂载到任意场景节点上即可独立运行，不依赖 GameEntry。
 * 会在场景中心生成一个 Player 实体并附加 OrbitAttack（飞剑环绕技能），
 * 所有飞剑属性均暴露在编辑器面板中，可实时手动调整。
 *
 * 运行前提：`assets/resources/prefabs/` 下需存在以下预制体：
 *   - Player（玩家显示）
 *   - OrbitingSword（飞剑显示）
 */
@ccclass('FlySwordTest')
export class FlySwordTest extends Component {

    @property({ displayName: '飞剑数量', tooltip: '环绕的飞剑把数', range: [1, 12, 1] })
    swordCount: number = 3;

    @property({ displayName: '伤害', tooltip: '每把飞剑的单次伤害', range: [1, 200, 1] })
    damage: number = 15;

    @property({ displayName: '环绕半径', tooltip: '飞剑距玩家的距离', range: [30, 500, 5] })
    orbitRadius: number = 150;

    @property({ displayName: '环绕速度 (rad/s)', tooltip: '飞剑绕行角速度', range: [0.2, 10, 0.1] })
    angularSpeed: number = 2;

    @property({ displayName: '碰撞半径', tooltip: '飞剑伤害判定范围', range: [5, 80, 1] })
    hitRadius: number = 20;

    @property({ displayName: '命中冷却 (秒)', tooltip: '对同一敌人两次命中之间的最小间隔', range: [0.05, 2, 0.05] })
    hitCooldown: number = 0.15;

    @property({ displayName: '击退速度', tooltip: '命中敌人时的击退力度（0 = 不击退）', range: [0, 500, 10] })
    knockbackSpeed: number = 100;

    private _world: GameWorld | null = null;
    private _systems: System[] = [];
    private _playerEid: number = -1;
    private _ready: boolean = false;

    private _lastSwordCount: number = -1;
    private _lastDamage: number = -1;
    private _lastOrbitRadius: number = -1;
    private _lastAngularSpeed: number = -1;

    start(): void {
        Promise.all([PrefabPool.loadAll(), GameConfig.loadAll()])
            .then(() => this._init())
            .catch(err => console.error('[FlySwordTest] 启动失败', err));
    }

    update(dt: number): void {
        const world = this._world;
        if (!world || !this._ready) return;

        if (this._hasPropertyChanged()) {
            this._applyOrbitAttack(world, this._playerEid);
            this._snapshotProperties();
        }

        world.time += dt;

        for (const sys of this._systems) {
            sys.update(dt, world);
        }
    }

    onDestroy(): void {
        for (const sys of this._systems) {
            sys.destroy?.();
        }
    }

    private _init(): void {
        const world = createGameWorld();
        world.paused = false;
        world.gameOver = false;

        const playerEid = addEntity(world, Transform, Render);
        Transform.x[playerEid] = 0;
        Transform.y[playerEid] = 0;
        Render[playerEid] = {
            prefabName: 'Player',
            rotation: 0,
            width: 0,
            height: 0,
            node: null,
            created: false,
        };

        this._applyOrbitAttack(world, playerEid);
        this._snapshotProperties();

        world.playerEid = playerEid;

        this._systems = [
            new OrbitSystem(),
            new RenderSystem(this.node),
        ].sort((a, b) => a.priority - b.priority);

        this._world = world;
        this._playerEid = playerEid;
        this._ready = true;
    }

    /**
     * 将当前编辑器属性写入 OrbitAttack 组件并置 dirty，触发 OrbitSystem 重建。
     * 注意：不覆盖 swordEntityIds，由 OrbitSystem.rebuildIfDirty 自行清理旧实体。
     */
    private _applyOrbitAttack(world: GameWorld, eid: number): void {
        addComponent(world, eid, OrbitAttack);

        if (OrbitAttack.swordEntityIds[eid] === undefined) {
            OrbitAttack.swordEntityIds[eid] = [];
        }

        OrbitAttack.dirty[eid] = true;
        OrbitAttack.count[eid] = this.swordCount;
        OrbitAttack.damage[eid] = this.damage;
        OrbitAttack.orbitRadius[eid] = this.orbitRadius;
        OrbitAttack.angularSpeed[eid] = this.angularSpeed;
    }

    private _hasPropertyChanged(): boolean {
        return (
            this._lastSwordCount !== this.swordCount ||
            this._lastDamage !== this.damage ||
            this._lastOrbitRadius !== this.orbitRadius ||
            this._lastAngularSpeed !== this.angularSpeed
        );
    }

    private _snapshotProperties(): void {
        this._lastSwordCount = this.swordCount;
        this._lastDamage = this.damage;
        this._lastOrbitRadius = this.orbitRadius;
        this._lastAngularSpeed = this.angularSpeed;
    }
}
