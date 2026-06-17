import { query, addEntity, entityExists } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import {
    Transform, Collider, DamageDealer, Owner,
    HitRecord, Render, makeRender,
} from '../Components';
import { OrbitAttack, OrbitingSword } from '../SkillComponents';
import { GameConfig } from '../GameConfig';
import { destroyEntity, addDamager } from '../Entities';
import { SkillId } from '../Skills';
import { SystemPriority } from '../Schedule';

export class OrbitSystem implements System {
    readonly priority = SystemPriority.Orbit;

    update(dt: number, world: GameWorld): void {
        this.rebuildIfDirty(world);
        this.updateSwords(dt, world);
    }

    private rebuildIfDirty(world: GameWorld): void {
        for (const eid of query(world, [OrbitAttack])) {
            if (!OrbitAttack.dirty[eid]) continue;
            OrbitAttack.dirty[eid] = false;

            for (const sid of OrbitAttack.swordEntityIds[eid] ?? []) {
                destroyEntity(world, sid);
            }

            OrbitAttack.swordEntityIds[eid] = [];
            const orbitCfg = GameConfig.skills.orbit;
            const count = Math.max(1, OrbitAttack.count[eid]);
            const step = (Math.PI * 2) / count;

            for (let i = 0; i < count; i++) {
                const swordEid = addEntity(world, Transform, OrbitingSword, Collider, DamageDealer, Owner, HitRecord, Render);
                Transform.x[swordEid] = 0;
                Transform.y[swordEid] = 0;
                OrbitingSword.ownerEntityId[swordEid] = eid;
                OrbitingSword.angle[swordEid] = i * step;
                OrbitingSword.angularSpeed[swordEid] = OrbitAttack.angularSpeed[eid];
                OrbitingSword.orbitRadius[swordEid] = OrbitAttack.orbitRadius[eid];
                OrbitingSword.damage[swordEid] = OrbitAttack.damage[eid];
                OrbitingSword.hitCooldown[swordEid] = orbitCfg.hitCooldown;
                addDamager(swordEid, { damage: OrbitAttack.damage[eid], skillId: SkillId.Orbit, ownerEid: eid, radius: orbitCfg.hitRadius });
                Render[swordEid] = makeRender('OrbitingSword');
                OrbitAttack.swordEntityIds[eid].push(swordEid);
            }
        }
    }

    private updateSwords(dt: number, world: GameWorld): void {
        for (const eid of query(world, [OrbitingSword])) {
            const ownerEid = OrbitingSword.ownerEntityId[eid];
            if (!entityExists(world, ownerEid)) {
                destroyEntity(world, eid);
                continue;
            }

            OrbitingSword.angle[eid] += OrbitingSword.angularSpeed[eid] * dt;
            Transform.x[eid] = Transform.x[ownerEid] + Math.cos(OrbitingSword.angle[eid]) * OrbitingSword.orbitRadius[eid];
            Transform.y[eid] = Transform.y[ownerEid] + Math.sin(OrbitingSword.angle[eid]) * OrbitingSword.orbitRadius[eid];
        }
    }
}
