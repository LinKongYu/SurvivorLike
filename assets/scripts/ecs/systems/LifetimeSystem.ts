import { query } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import { Lifetime } from '../Components';
import { destroyEntity } from '../Entities';
import { SystemPriority } from '../Schedule';

export class LifetimeSystem implements System {
    readonly priority = SystemPriority.Lifetime;

    update(dt: number, world: GameWorld): void {
        const toDestroy: number[] = [];
        for (const eid of query(world, [Lifetime])) {
            Lifetime.remaining[eid] -= dt;
            if (Lifetime.remaining[eid] <= 0) toDestroy.push(eid);
        }
        for (const eid of toDestroy) destroyEntity(world, eid);
    }
}
