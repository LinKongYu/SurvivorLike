import { ISystem, ECSWorld } from '../World';
import { Transform, Velocity, Camp, MoveToTarget } from '../Components';

/**
 * MonsterChaseSystem — 怪物追逐玩家 → Velocity
 * Priority: 3
 *
 * 持有 MoveToTarget 的怪物每帧重新计算朝向目标的 Velocity，
 * 实现"追逐"行为。
 *
 * 速度值从 Camp 携带的参数中获取，
 * 但目前 Camp 只有 faction 字段，速度值暂从系统常量读取。
 * 后续可改为独立的 Speed 组件。
 */
export class MonsterChaseSystem implements ISystem {

    /** 怪物默认移动速度 */
    private _defaultSpeed: number = 80;

    update(_dt: number, world: ECSWorld): void {
        const entities = world.query(Transform, Velocity, Camp, MoveToTarget);
        for (const eid of entities) {
            const camp = world.getComponent(eid, Camp)!;
            if (camp.faction !== 'enemy') continue;

            const tf = world.getComponent(eid, Transform)!;
            const chase = world.getComponent(eid, MoveToTarget)!;
            const targetTf = world.getComponent(chase.targetEntityId, Transform);
            if (!targetTf) continue;

            const dx = targetTf.x - tf.x;
            const dy = targetTf.y - tf.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const vel = world.getComponent(eid, Velocity)!;
            if (dist > 1) {
                vel.x = (dx / dist) * this._defaultSpeed;
                vel.y = (dy / dist) * this._defaultSpeed;
            } else {
                vel.x = 0;
                vel.y = 0;
            }
        }
    }
}
