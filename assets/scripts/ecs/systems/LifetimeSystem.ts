import { query, removeEntity, entityExists } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import { Lifetime, clearEntityData } from '../Components';

export class LifetimeSystem implements System {
    readonly priority = 50;

    update(dt: number, world: GameWorld): void {
        const toDestroy: number[] = [];
        for (const eid of query(world, [Lifetime])) {
            Lifetime.remaining[eid] -= dt;
            if (Lifetime.remaining[eid] <= 0) toDestroy.push(eid);
        }
        for (const eid of toDestroy) {
            if (entityExists(world, eid)) { clearEntityData(eid); removeEntity(world, eid); }
        }
    }
}
