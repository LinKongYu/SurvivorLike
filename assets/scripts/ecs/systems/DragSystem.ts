import { query, removeComponent } from '../../bitEcs';
import { Velocity, Drag, velocityStore, dragStore } from '../Components';

export class DragSystem {
    update(dt: number, world: any): void {
        const toRemove: number[] = [];
        for (const eid of query(world, [Drag])) {
            const drag = dragStore.get(eid)!;
            const vel = velocityStore.get(eid);
            if (!vel || (vel.x === 0 && vel.y === 0)) continue;
            const decay = Math.exp(-drag.coefficient * dt);
            vel.x *= decay; vel.y *= decay;
            if (vel.x * vel.x + vel.y * vel.y < 1) {
                vel.x = 0; vel.y = 0;
                toRemove.push(eid);
            }
        }
        for (const eid of toRemove) {
            removeComponent(world, eid, Drag);
            dragStore.delete(eid);
        }
    }
}
