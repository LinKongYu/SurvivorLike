import { query, removeComponent } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import { Velocity, Drag } from '../Components';

export class DragSystem implements System {
    readonly priority = 11;

    update(dt: number, world: GameWorld): void {
        const toRemove: number[] = [];
        for (const eid of query(world, [Drag])) {
            if (Velocity.x[eid] === 0 && Velocity.y[eid] === 0) {
                toRemove.push(eid);
                continue;
            }
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
