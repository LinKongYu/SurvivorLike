import { query, removeEntity, entityExists } from '../../bitEcs';
import { Lifetime, lifetimeStore, clearEntityData } from '../Components';

export class LifetimeSystem {
    update(dt: number, world: any): void {
        const toDestroy: number[] = [];
        for (const eid of query(world, [Lifetime])) {
            const lt = lifetimeStore.get(eid)!;
            lt.remaining -= dt;
            if (lt.remaining <= 0) toDestroy.push(eid);
        }
        for (const eid of toDestroy) {
            if (entityExists(world, eid)) { clearEntityData(eid); removeEntity(world, eid); }
        }
    }
}
