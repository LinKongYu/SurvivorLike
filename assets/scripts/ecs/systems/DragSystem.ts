import { ISystem, ECSWorld } from '../World';
import { Velocity, Drag } from '../Components';

/**
 * DragSystem — 速度阻力衰减
 * Priority: 11
 *
 * 对同时拥有 Velocity + Drag 的实体做指数衰减，
 * 替代旧 Knockback 组件的逻辑。
 *
 * 用法：创建子弹/击退效果时，同时挂上 Velocity + Drag，
 * DragSystem 每帧衰减速度，降为 0 时保留组件但不再运动。
 * 当速度极小时由系统自动移除 Drag 组件。
 *
 * 注：此系统运行在 MovementSystem 之后，
 * 所以阻力影响的是下一帧的速度。
 */
export class DragSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        const store = world.getStore(Drag);
        if (!store || store.size === 0) return;

        const toRemove: number[] = [];

        for (const [eid, drag] of store) {
            const vel = world.getComponent(eid, Velocity);
            if (!vel) {
                toRemove.push(eid);
                continue;
            }

            if (vel.x === 0 && vel.y === 0) continue;

            const decay = Math.exp(-drag.coefficient * dt);
            vel.x *= decay;
            vel.y *= decay;

            if (vel.x * vel.x + vel.y * vel.y < 1) {
                vel.x = 0;
                vel.y = 0;
                toRemove.push(eid);
            }
        }

        for (const eid of toRemove) {
            world.removeComponent(eid, Drag);
        }
    }
}
