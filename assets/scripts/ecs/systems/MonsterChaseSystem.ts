import { entityExists, hasComponent, query } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import { Transform, Velocity, Camp, MoveToTarget, Drag } from '../Components';
import { GameConfig } from '../GameConfig';
import { SystemPriority } from '../Schedule';

export class MonsterChaseSystem implements System {
    readonly priority = SystemPriority.MonsterChase;

    update(_dt: number, world: GameWorld): void {
        for (const eid of query(world, [Transform, Velocity, Camp, MoveToTarget])) {
            if (Camp.value[eid] !== 'enemy') continue;
            if (hasComponent(world, eid, Drag)) continue;
            const targetEid = MoveToTarget.targetEntityId[eid];
            if (!entityExists(world, targetEid)) {
                Velocity.x[eid] = 0;
                Velocity.y[eid] = 0;
                continue;
            }
            const dx = Transform.x[targetEid] - Transform.x[eid];
            const dy = Transform.y[targetEid] - Transform.y[eid];
            if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
                Velocity.x[eid] = 0;
                Velocity.y[eid] = 0;
                continue;
            }
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = MoveToTarget.moveSpeed[eid] || GameConfig.enemyDefault.baseMoveSpeed;
            if (dist > 1) {
                Velocity.x[eid] = (dx / dist) * speed;
                Velocity.y[eid] = (dy / dist) * speed;
            } else {
                Velocity.x[eid] = 0;
                Velocity.y[eid] = 0;
            }
        }
    }
}
