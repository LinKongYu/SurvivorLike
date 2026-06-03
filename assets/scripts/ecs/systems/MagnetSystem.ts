import { query } from '../../bitEcs';
import { Transform, PlayerInput, ExpOrb, Velocity, positionStore, expOrbStore, velocityStore } from '../Components';

export class MagnetSystem {
    update(_dt: number, world: any): void {
        const players = query(world, [Transform, PlayerInput]);
        if (players.length === 0) return;
        const ptf = positionStore.get(players[0])!;
        for (const eid of query(world, [Transform, ExpOrb, Velocity])) {
            const orb = expOrbStore.get(eid)!;
            const otf = positionStore.get(eid)!;
            const vel = velocityStore.get(eid)!;
            const dx = ptf.x - otf.x, dy = ptf.y - otf.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < orb.magnetRadius * orb.magnetRadius) {
                const dist = Math.sqrt(distSq);
                vel.x = dist > 1 ? (dx / dist) * orb.magnetSpeed : 0;
                vel.y = dist > 1 ? (dy / dist) * orb.magnetSpeed : 0;
            } else { vel.x = 0; vel.y = 0; }
        }
    }
}
