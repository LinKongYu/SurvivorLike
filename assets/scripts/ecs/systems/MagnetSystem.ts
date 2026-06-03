import { query } from '../../bitEcs';
import { Transform, PlayerInput, ExpOrb, Velocity } from '../Components';

export class MagnetSystem {
    update(_dt: number, world: any): void {
        const players = query(world, [Transform, PlayerInput]);
        if (players.length === 0) return;
        const playerEid = players[0];
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
