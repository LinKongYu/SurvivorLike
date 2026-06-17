import { query, addEntity } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import {
    Transform, PlayerInput, Collider, DamageDealer, Owner,
    HitRecord, Lifetime, Render, makeRender,
} from '../Components';
import { BladeAttack, BladeMarker } from '../SkillComponents';
import { GameConfig } from '../GameConfig';
import { findNearestEnemy } from '../Helpers';
import { addDamager } from '../Entities';
import { SkillId } from '../Skills';
import { SystemPriority } from '../Schedule';

export class BladeSystem implements System {
    readonly priority = SystemPriority.Blade;

    update(dt: number, world: GameWorld): void {
        this.triggerBlades(dt, world);
    }

    private triggerBlades(dt: number, world: GameWorld): void {
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
                const range = BladeAttack.range[pid];
                const eid = addEntity(world, Transform, BladeMarker, Collider, DamageDealer, Owner, HitRecord, Lifetime, Render);
                Transform.x[eid] = Transform.x[pid];
                Transform.y[eid] = Transform.y[pid];
                BladeMarker.facingAngle[eid] = angle;
                BladeMarker.arc[eid] = BladeAttack.arc[pid];
                BladeMarker.range[eid] = range;
                addDamager(eid, { damage: BladeAttack.damage[pid], skillId: SkillId.Blade, ownerEid: pid, radius: range });
                Lifetime.remaining[eid] = lifeTime;
                Render[eid] = makeRender('BladeHitbox', {
                    rotation: angle * 180 / Math.PI,
                    width: range * 2,
                    height: range * 2,
                });
            }
        }
    }
}
