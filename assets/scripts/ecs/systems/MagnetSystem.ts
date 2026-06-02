import { ISystem, ECSWorld } from '../World';
import { Transform, Velocity, ExpOrb, PlayerInput } from '../Components';

/**
 * MagnetSystem — 经验球吸附 → Velocity
 * Priority: 4
 *
 * 当经验球进入玩家吸引范围，设置朝向玩家的吸引速度。
 * 经验球还需要 ExpOrb + Transform + Velocity 组件。
 *
 * 收集逻辑在 ExperienceSystem 中处理。
 */
export class MagnetSystem implements ISystem {

    update(_dt: number, world: ECSWorld): void {
        const playerEntities = world.query(Transform, PlayerInput);
        if (playerEntities.length === 0) return;

        const ptf = world.getComponent(playerEntities[0], Transform)!;

        const orbs = world.query(Transform, ExpOrb, Velocity);
        for (const eid of orbs) {
            const orb = world.getComponent(eid, ExpOrb)!;
            const otf = world.getComponent(eid, Transform)!;
            const vel = world.getComponent(eid, Velocity)!;

            const dx = ptf.x - otf.x;
            const dy = ptf.y - otf.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < orb.magnetRadius * orb.magnetRadius) {
                const dist = Math.sqrt(distSq);
                if (dist > 1) {
                    vel.x = (dx / dist) * orb.magnetSpeed;
                    vel.y = (dy / dist) * orb.magnetSpeed;
                } else {
                    vel.x = 0;
                    vel.y = 0;
                }
            } else {
                // 超出吸引范围则不动（浮动动画由 MovementSystem 处理）
                vel.x = 0;
                vel.y = 0;
            }
        }
    }
}
