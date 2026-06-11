import { _decorator, Component } from 'cc';
import { addEntity, entityExists, query, removeEntity } from '../bitEcs';
import { createGameWorld, GameWorld } from '../ecs/World';
import { System } from '../ecs/System';
import { PrefabPool } from '../ecs/PrefabPool';
import { GameConfig } from '../ecs/GameConfig';
import { createEnemy } from '../ecs/EntityFactory';
import {
    Transform, Render, Camp, Health, MoveToTarget,
    clearEntityData,
} from '../ecs/Components';

import { MonsterChaseSystem } from '../ecs/systems/MonsterChaseSystem';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { DragSystem } from '../ecs/systems/DragSystem';
import { SeparationSystem } from '../ecs/systems/SeparationSystem';
import { CombatSystem } from '../ecs/systems/CombatSystem';
import { LifetimeSystem } from '../ecs/systems/LifetimeSystem';
import { RenderSystem } from '../ecs/systems/RenderSystem';

const { ccclass, property } = _decorator;

/**
 * SkillTestBase — 技能测试基类
 *
 * 提供公用的游戏世界搭建、敌人生成追逐、战斗碰撞和渲染管线。
 * 子类只需：
 *   1. 暴露技能 @property 属性
 *   2. 实现 _getSkillSystems / _applySkill / _reapplySkill
 *   3. 实现 _snapshotSkillProperties / _hasSkillPropertiesChanged
 */
@ccclass('SkillTestBase')
export abstract class SkillTestBase extends Component {

    @property({ displayName: '启用敌人生成' })
    spawnEnabled: boolean = true;

    @property({ displayName: '生成间隔 (秒)', range: [0.2, 10, 0.1] })
    spawnInterval: number = 2;

    @property({ displayName: '最大敌人数', range: [1, 100, 1] })
    maxEnemyCount: number = 30;

    @property({ displayName: '敌人生命值', range: [1, 1000, 5] })
    enemyHP: number = 20;

    @property({ displayName: '敌人移动速度', range: [20, 500, 5] })
    enemySpeed: number = 150;

    @property({ displayName: '生成半径', tooltip: '敌人出现的最远距离', range: [200, 1500, 10] })
    spawnRadius: number = 600;

    @property({ displayName: '最小生成距离', range: [50, 800, 10] })
    minSpawnDistance: number = 400;

    @property({ displayName: '碰触销毁敌人', tooltip: '敌人碰到主角时自动销毁' })
    destroyEnemyOnReach: boolean = true;

    protected _world: GameWorld | null = null;
    protected _systems: System[] = [];
    protected _playerEid: number = -1;
    protected _ready: boolean = false;

    private _spawnTimer: number = 0;

    start(): void {
        Promise.all([PrefabPool.loadAll(), GameConfig.loadAll()])
            .then(() => this._init())
            .catch(err => console.error('[SkillTestBase] 启动失败', err));
    }

    update(dt: number): void {
        const world = this._world;
        if (!world || !this._ready) return;

        if (this._hasSkillPropertiesChanged()) {
            this._reapplySkill(world, this._playerEid);
            this._snapshotSkillProperties();
        }

        world.time += dt;

        for (const sys of this._systems) {
            sys.update(dt, world);
        }

        if (this.spawnEnabled) {
            this._tickSpawning(dt, world);
        }

        this._cleanupEnemies(world);
    }

    onDestroy(): void {
        for (const sys of this._systems) {
            sys.destroy?.();
        }
    }

    protected abstract _getSkillSystems(): System[];

    protected abstract _applySkill(world: GameWorld, eid: number): void;

    protected abstract _reapplySkill(world: GameWorld, eid: number): void;

    protected abstract _hasSkillPropertiesChanged(): boolean;

    protected abstract _snapshotSkillProperties(): void;

    private _init(): void {
        const world = createGameWorld();
        world.paused = false;
        world.gameOver = false;

        const playerEid = addEntity(world, Transform, Render, Camp, Health);
        Transform.x[playerEid] = 0;
        Transform.y[playerEid] = 0;
        Render[playerEid] = {
            prefabName: 'Player',
            rotation: 0, width: 0, height: 0, node: null, created: false,
        };
        Camp.value[playerEid] = 'player';
        Health.hp[playerEid] = 999999;
        Health.maxHp[playerEid] = 999999;
        Health.invincibleTimer[playerEid] = 99999;
        Health.invincibleTime[playerEid] = 0;

        this._applySkill(world, playerEid);
        this._snapshotSkillProperties();

        world.playerEid = playerEid;

        const common: System[] = [
            new MonsterChaseSystem(),
            new MovementSystem(),
            new DragSystem(),
            new SeparationSystem(),
            new CombatSystem(),
            new LifetimeSystem(),
            new RenderSystem(this.node),
        ];
        this._systems = [...common, ...this._getSkillSystems()]
            .sort((a, b) => a.priority - b.priority);

        this._world = world;
        this._playerEid = playerEid;
        this._ready = true;
    }

    private _tickSpawning(dt: number, world: GameWorld): void {
        this._spawnTimer += dt;
        if (this._spawnTimer < this.spawnInterval) return;
        this._spawnTimer = 0;

        if (this._countLivingEnemies(world) >= this.maxEnemyCount) return;

        const px = Transform.x[this._playerEid];
        const py = Transform.y[this._playerEid];
        const angle = Math.random() * Math.PI * 2;
        const dist = this.minSpawnDistance + Math.random() * (this.spawnRadius - this.minSpawnDistance);

        const eid = createEnemy(world, px + Math.cos(angle) * dist, py + Math.sin(angle) * dist, this._playerEid, 1);
        Health.hp[eid] = this.enemyHP;
        Health.maxHp[eid] = this.enemyHP;
        MoveToTarget.moveSpeed[eid] = this.enemySpeed;
    }

    private _countLivingEnemies(world: GameWorld): number {
        let count = 0;
        for (const eid of query(world, [Health, Camp])) {
            if (Camp.value[eid] === 'enemy' && Health.hp[eid] > 0) count++;
        }
        return count;
    }

    private _cleanupEnemies(world: GameWorld): void {
        const reachRadius = this.destroyEnemyOnReach
            ? GameConfig.skills.contact.enemyPlayerHitRadius
            : 0;
        const px = Transform.x[this._playerEid];
        const py = Transform.y[this._playerEid];
        const thresholdSq = reachRadius * reachRadius;

        for (const eid of query(world, [Transform, Health, Camp])) {
            if (Camp.value[eid] !== 'enemy') continue;

            const dead = Health.hp[eid] <= 0;
            let reached = false;
            if (!dead && this.destroyEnemyOnReach) {
                const dx = Transform.x[eid] - px;
                const dy = Transform.y[eid] - py;
                reached = dx * dx + dy * dy < thresholdSq;
            }

            if (dead || reached) {
                if (entityExists(world, eid)) {
                    clearEntityData(eid);
                    removeEntity(world, eid);
                }
            }
        }
    }
}
