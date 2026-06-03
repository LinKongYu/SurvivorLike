import { query, removeComponent } from '../../bitEcs';
import { Velocity, Drag } from '../Components';

export class DragSystem {
    update(dt: number, world: any): void {
        const toRemove: number[] = [];
        for (const eid of query(world, [Drag])) {
            if (Velocity.x[eid] === 0 && Velocity.y[eid] === 0) continue;
            const decay = Math.exp(-Drag.coefficient[eid] * dt);
            Velocity.x[eid] *= decay;
            Velocity.y[eid] *= decay;
            if (Velocity.x[eid] * Velocity.x[eid] + Velocity.y[eid] * Velocity.y[eid] < 1) {
                Velocity.x[eid] = 0;
                Velocity.y[eid] = 0;
                toRemove.push(eid);
            }
        }
        for (const eid of toRemove) {
            removeComponent(world, eid, Drag);
            delete Drag.coefficient[eid];
        }
    }
}
