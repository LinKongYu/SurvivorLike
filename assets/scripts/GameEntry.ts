import { _decorator, Component } from 'cc';
import { ECSWorld } from './ecs/World';
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
 * 玩家初始只有射击（AutoAttack），其他三种攻击方式（刀/飞剑/炸弹）
 * 需要在升级时从三选一卡片中选择解锁。
 */
@ccclass('GameEntry')
export class GameEntry extends Component {

    private _world: ECSWorld = null!;

    start(): void {
        this._world = new ECSWorld();

        // 注册 System（按 priority 排序）
        this._world.addSystem(new InputSystem(), 0);
        this._world.addSystem(new MovementSystem(), 10);
        this._world.addSystem(new SeparationSystem(), 15);
        this._world.addSystem(new CombatSystem(), 20);
        this._world.addSystem(new BladeSystem(), 22);
        this._world.addSystem(new OrbitSystem(), 23);
        this._world.addSystem(new BombSystem(), 24);
        this._world.addSystem(new ExperienceSystem(), 30);
        this._world.addSystem(new SpawnerSystem(), 40);
        this._world.addSystem(new RenderSystem(this.node), 90);
        this._world.addSystem(new UISystem(this.node), 95);

        // 创建初始实体
        const playerEid = createPlayer(this._world, 0, 0);
        createSpawner(this._world, playerEid);

        // 初始生成 3 个敌人
        const ptf = this._world.getComponent(playerEid, Transform)!;
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 300 + Math.random() * 200;
            createEnemy(
                this._world,
                ptf.x + Math.cos(angle) * dist,
                ptf.y + Math.sin(angle) * dist,
                playerEid, 1,
            );
        }
    }

    update(dt: number): void {
        if (this._world) {
            this._world.update(dt);
        }
    }
}
