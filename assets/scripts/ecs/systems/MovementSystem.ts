import { ISystem, ECSWorld } from '../World';
import { Transform, Velocity, ExpOrb } from '../Components';

/**
 * MovementSystem — 纯位置更新
 * Priority: 10
 *
 * 只关心 Position(Transform) + Velocity。
 * 所有设置 Velocity 的系统（PlayerControl、MonsterChase、Magnet 等）在此前完成。
 * MovementSystem 统一执行：position += velocity × dt。
 *
 * 额外职责：
 * - 经验球的浮动动画（在 velocity 为 0 时叠加正弦浮动）
 */
export class MovementSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        if (world.isPaused() || world.isGameOver()) return;

        // 核心：所有带 Transform + Velocity 的实体统一移动
        const movers = world.query(Transform, Velocity);
        for (const eid of movers) {
            const tf = world.getComponent(eid, Transform)!;
            const vel = world.getComponent(eid, Velocity)!;

            tf.x += vel.x * dt;
            tf.y += vel.y * dt;
        }

        // 经验球浮动（纯视觉效果，不影响其他）
        this.floatOrbs(dt, world);
    }

    /** 未被吸引的经验球原地正弦浮动 */
    private floatOrbs(dt: number, world: ECSWorld): void {
        const store = world.getStore(ExpOrb);
        if (!store) return;

        for (const [eid, orb] of store) {
            const vel = world.getComponent(eid, Velocity);
            if (vel && (vel.x !== 0 || vel.y !== 0)) continue;

            const tf = world.getComponent(eid, Transform);
            if (!tf) continue;

            orb.floatTimer += dt;
            tf.y = orb.baseY + Math.sin(orb.floatTimer * 3) * 5;
        }
    }
}
