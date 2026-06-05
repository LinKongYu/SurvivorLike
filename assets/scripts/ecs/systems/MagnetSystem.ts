import { entityExists, query } from '../../bitEcs';
import { Transform, ExpOrb, Velocity } from '../Components';
import { System } from '../System';
import { GameWorld } from '../World';

export class MagnetSystem implements System {
    readonly priority = 4;
    update(_dt: number, world: GameWorld): void {
        const playerEid = world.playerEid;
        if (playerEid < 0 || !entityExists(world, playerEid)) return;
        for (const eid of query(world, [Transform, ExpOrb, Velocity])) {
            const dx = Transform.x[playerEid] - Transform.x[eid], dy = Transform.y[playerEid] - Transform.y[eid];
            const distSq = dx * dx + dy * dy;
            if (distSq < ExpOrb.magnetRadius[eid] * ExpOrb.magnetRadius[eid]) {
                const dist = Math.sqrt(distSq);
                Velocity.x[eid] = dist > 1 ? (dx / dist) * ExpOrb.magnetSpeed[eid] : 0;
                Velocity.y[eid] = dist > 1 ? (dy / dist) * ExpOrb.magnetSpeed[eid] : 0;
            } else {
                Velocity.x[eid] = 0;
                Velocity.y[eid] = 0;
            }
        }
    }
}
