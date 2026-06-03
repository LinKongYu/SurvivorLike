import { query } from '../../bitEcs';
import { Transform, Velocity, Camp, MoveToTarget, positionStore, velocityStore, campStore, moveToTargetStore } from '../Components';
import { GameConfig } from '../GameConfig';

export class MonsterChaseSystem {
    update(_dt: number, world: any): void {
        for (const eid of query(world, [Transform, Velocity, Camp, MoveToTarget])) {
            if (campStore.get(eid) !== 'enemy') continue;
            const tf = positionStore.get(eid);
            const chase = moveToTargetStore.get(eid);
            if (!tf || !chase) continue;
            const targetTf = positionStore.get(chase.targetEntityId);
            if (!targetTf) continue;
            const dx = targetTf.x - tf.x;
            const dy = targetTf.y - tf.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const vel = velocityStore.get(eid)!;
            const speed = chase.moveSpeed || GameConfig.enemyDefault.baseMoveSpeed;
            if (dist > 1) { vel.x = (dx / dist) * speed; vel.y = (dy / dist) * speed; }
            else { vel.x = 0; vel.y = 0; }
        }
    }
}
