import { query } from '../../bitEcs';
import { Transform, Velocity, Camp, MoveToTarget } from '../Components';
import { GameConfig } from '../GameConfig';

export class MonsterChaseSystem {
    update(_dt: number, world: any): void {
        for (const eid of query(world, [Transform, Velocity, Camp, MoveToTarget])) {
            if (Camp.value[eid] !== 'enemy') continue;
            const targetEid = MoveToTarget.targetEntityId[eid];
            const dx = Transform.x[targetEid] - Transform.x[eid];
            const dy = Transform.y[targetEid] - Transform.y[eid];
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
