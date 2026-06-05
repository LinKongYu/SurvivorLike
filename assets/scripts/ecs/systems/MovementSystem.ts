import { query } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import { Transform, Velocity, ExpOrb } from '../Components';

export class MovementSystem implements System {
    readonly priority = 10;

    update(dt: number, world: GameWorld): void {
        // 有位置，有速度的，处理移动
        for (const eid of query(world, [Transform, Velocity])) {
            Transform.x[eid] += Velocity.x[eid] * dt;
            Transform.y[eid] += Velocity.y[eid] * dt;
        }
        // 经验球的浮动表现：被吸引(有速度)时把当前 Y 记为浮动基准，
        // 停下后绕该基准上下浮动，避免吸引一半后从当前位置弹回出生点。
        for (const eid of query(world, [ExpOrb])) {
            if (Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0) {
                ExpOrb.baseY[eid] = Transform.y[eid];
                continue;
            }
            ExpOrb.floatTimer[eid] += dt;
            Transform.y[eid] = ExpOrb.baseY[eid] + Math.sin(ExpOrb.floatTimer[eid] * 3) * 5;
        }
    }
}
