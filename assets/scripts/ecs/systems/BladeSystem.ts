import { query, addEntity } from '../../bitEcs';
import { Transform, PlayerInput, Collider, DamageDealer, Owner, HitRecord, Lifetime, positionStore, colliderStore, damageDealerStore, ownerStore, hitRecordStore, lifetimeStore } from '../Components';
import { BladeAttack, BladeMarker, bladeAttackStore, bladeMarkerStore } from '../SkillComponents';
import { Render, renderStore } from '../Components';
import { GameConfig } from '../GameConfig';
import { findNearestEnemy } from '../helpers';

export class BladeSystem {
    update(dt: number, world: any): void {
        this.triggerBlades(dt, world);
    }
    private triggerBlades(dt: number, world: any): void {
        for (const pid of query(world, [Transform, PlayerInput, BladeAttack])) {
            const atk = bladeAttackStore.get(pid)!;
            atk.timer += dt;
            if (atk.timer < atk.cooldown) continue;
            const ptf = positionStore.get(pid)!;
            const nearest = findNearestEnemy(world, ptf.x, ptf.y);
            if (!nearest) continue;
            atk.timer = 0;
            const etf = positionStore.get(nearest.eid)!;
            const baseAngle = Math.atan2(etf.y - ptf.y, etf.x - ptf.x);
            const step = (Math.PI * 2) / atk.count;
            const lt = GameConfig.skills.blade.lifeTime;
            for (let i = 0; i < atk.count; i++) {
                const angle = baseAngle + i * step;
                const eid = addEntity(world, Transform, BladeMarker, Collider, DamageDealer, Owner, HitRecord, Lifetime, Render);
                positionStore.set(eid, { x: ptf.x, y: ptf.y });
                bladeMarkerStore.set(eid, { facingAngle: angle, arc: atk.arc, range: atk.range });
                colliderStore.set(eid, { radius: atk.range });
                damageDealerStore.set(eid, { damage: atk.damage, skillId: 'blade' });
                ownerStore.set(eid, pid);
                hitRecordStore.set(eid, new Map());
                lifetimeStore.set(eid, { remaining: lt });
                renderStore.set(eid, { prefabName: 'BladeHitbox', rotation: angle * 180 / Math.PI, width: atk.range * 2, height: atk.range * 2, node: null, created: false });
            }
        }
    }
}
