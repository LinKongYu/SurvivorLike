import { query, addEntity } from '../../bitEcs';
import {
    Transform, PlayerInput, Collider, DamageDealer, Owner,
    HitRecord, Lifetime, Render,
} from '../Components';
import { BladeAttack, BladeMarker } from '../SkillComponents';
import { GameConfig } from '../GameConfig';
import { findNearestEnemy } from '../Helpers';

export class BladeSystem {
    update(dt: number, world: any): void {
        this.triggerBlades(dt, world);
    }

    private triggerBlades(dt: number, world: any): void {
        for (const pid of query(world, [Transform, PlayerInput, BladeAttack])) {
            BladeAttack.timer[pid] += dt;
            if (BladeAttack.timer[pid] < BladeAttack.cooldown[pid]) continue;

            const nearest = findNearestEnemy(world, Transform.x[pid], Transform.y[pid]);
            if (!nearest) continue;

            BladeAttack.timer[pid] = 0;
            const baseAngle = Math.atan2(
                Transform.y[nearest.eid] - Transform.y[pid],
                Transform.x[nearest.eid] - Transform.x[pid],
            );
            const count = Math.max(1, BladeAttack.count[pid]);
            const step = (Math.PI * 2) / count;
            const lifeTime = GameConfig.skills.blade.lifeTime;

            for (let i = 0; i < count; i++) {
                const angle = baseAngle + i * step;
                const eid = addEntity(world, Transform, BladeMarker, Collider, DamageDealer, Owner, HitRecord, Lifetime, Render);
                Transform.x[eid] = Transform.x[pid];
                Transform.y[eid] = Transform.y[pid];
                BladeMarker.facingAngle[eid] = angle;
                BladeMarker.arc[eid] = BladeAttack.arc[pid];
                BladeMarker.range[eid] = BladeAttack.range[pid];
                Collider.radius[eid] = BladeAttack.range[pid];
                DamageDealer.damage[eid] = BladeAttack.damage[pid];
                DamageDealer.skillId[eid] = 'blade';
                Owner.eid[eid] = pid;
                HitRecord[eid] = new Map();
                Lifetime.remaining[eid] = lifeTime;
                Render[eid] = {
                    prefabName: 'BladeHitbox',
                    rotation: angle * 180 / Math.PI,
                    width: BladeAttack.range[pid] * 2,
                    height: BladeAttack.range[pid] * 2,
                    node: null,
                    created: false,
                };
            }
        }
    }
}
