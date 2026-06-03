import { query } from '../../bitEcs';
import { Transform, Velocity, ExpOrb, positionStore, velocityStore, expOrbStore } from '../Components';

export class MovementSystem {
    update(dt: number, world: any): void {
        for (const eid of query(world, [Transform, Velocity])) {
            const tf = positionStore.get(eid)!;
            const vel = velocityStore.get(eid)!;
            tf.x += vel.x * dt;
            tf.y += vel.y * dt;
        }
        for (const eid of query(world, [ExpOrb])) {
            const vel = velocityStore.get(eid);
            if (vel && (vel.x !== 0 || vel.y !== 0)) continue;
            const tf = positionStore.get(eid);
            if (!tf) continue;
            const orb = expOrbStore.get(eid)!;
            orb.floatTimer += dt;
            tf.y = orb.baseY + Math.sin(orb.floatTimer * 3) * 5;
        }
    }
}
