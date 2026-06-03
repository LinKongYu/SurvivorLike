import { query } from '../../bitEcs';
import { Transform, Velocity, ExpOrb } from '../Components';

export class MovementSystem {
    update(dt: number, world: any): void {
        // 有位置，有速度的，处理移动
        for (const eid of query(world, [Transform, Velocity])) {
            Transform.x[eid] += Velocity.x[eid] * dt;
            Transform.y[eid] += Velocity.y[eid] * dt;
        }
        // 经验球的移动表现
        for (const eid of query(world, [ExpOrb])) {
            if (Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0) continue;
            ExpOrb.floatTimer[eid] += dt;
            Transform.y[eid] = ExpOrb.baseY[eid] + Math.sin(ExpOrb.floatTimer[eid] * 3) * 5;
        }
    }
}
