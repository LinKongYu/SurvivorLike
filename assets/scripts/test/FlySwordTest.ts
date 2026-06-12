import { _decorator } from 'cc';
import { addComponent } from '../bitEcs';
import { GameWorld } from '../ecs/World';
import { System } from '../ecs/System';
import { OrbitAttack } from '../ecs/SkillComponents';
import { OrbitSystem } from '../ecs/systems/OrbitSystem';
import { SkillTestBase } from './SkillTestBase';

const { ccclass, property } = _decorator;

/**
 * FlySwordTest — 飞剑表现测试脚本
 *
 * 在场景中心生成 Player 并附加 OrbitAttack，同时不断生成敌人追逐主角。
 * 主角无敌、不会死亡；飞剑可击杀敌人；敌人碰到主角时自动销毁。
 * 所有飞剑属性在编辑器面板中可实时手动调整。
 *
 * 运行前提：`assets/resources/prefabs/` 下需存在：
 *   - Player / OrbitingSword / Enemy（预制体）
 */
@ccclass('FlySwordTest')
export class FlySwordTest extends SkillTestBase {

    @property({ displayName: '飞剑数量', range: [1, 12, 1] })
    swordCount: number = 10;

    @property({ displayName: '伤害', range: [1, 200, 1] })
    damage: number = 15;

    @property({ displayName: '环绕半径', range: [30, 500, 5] })
    orbitRadius: number = 150;

    @property({ displayName: '环绕速度 (rad/s)', range: [0.2, 100, 0.1] })
    angularSpeed: number = 10;

    private _lastSwordCount: number = -1;
    private _lastDamage: number = -1;
    private _lastOrbitRadius: number = -1;
    private _lastAngularSpeed: number = -1;

    protected _getSkillSystems(): System[] {
        return [new OrbitSystem()];
    }

    protected _applySkill(world: GameWorld, eid: number): void {
        addComponent(world, eid, OrbitAttack);
        OrbitAttack.swordEntityIds[eid] = [];
        OrbitAttack.dirty[eid] = true;
        OrbitAttack.count[eid] = this.swordCount;
        OrbitAttack.damage[eid] = this.damage;
        OrbitAttack.orbitRadius[eid] = this.orbitRadius;
        OrbitAttack.angularSpeed[eid] = this.angularSpeed;
    }

    protected _reapplySkill(world: GameWorld, eid: number): void {
        OrbitAttack.dirty[eid] = true;
        OrbitAttack.count[eid] = this.swordCount;
        OrbitAttack.damage[eid] = this.damage;
        OrbitAttack.orbitRadius[eid] = this.orbitRadius;
        OrbitAttack.angularSpeed[eid] = this.angularSpeed;
    }

    protected _hasSkillPropertiesChanged(): boolean {
        return (
            this._lastSwordCount !== this.swordCount ||
            this._lastDamage !== this.damage ||
            this._lastOrbitRadius !== this.orbitRadius ||
            this._lastAngularSpeed !== this.angularSpeed
        );
    }

    protected _snapshotSkillProperties(): void {
        this._lastSwordCount = this.swordCount;
        this._lastDamage = this.damage;
        this._lastOrbitRadius = this.orbitRadius;
        this._lastAngularSpeed = this.angularSpeed;
    }
}
