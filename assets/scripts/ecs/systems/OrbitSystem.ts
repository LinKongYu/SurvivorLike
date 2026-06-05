import { query, addEntity, removeEntity, entityExists } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import {
    Transform, Collider, DamageDealer, Owner,
    HitRecord, Render, clearEntityData,
} from '../Components';
import { OrbitAttack, OrbitingSword } from '../SkillComponents';
import { GameConfig } from '../GameConfig';

export class OrbitSystem implements System {
    readonly priority = 23;

    update(dt: number, world: GameWorld): void {
        this.rebuildIfDirty(world);
        this.updateSwords(dt, world);
    }

    private rebuildIfDirty(world: GameWorld): void {
        for (const eid of query(world, [OrbitAttack])) {
            if (!OrbitAttack.dirty[eid]) continue;
            OrbitAttack.dirty[eid] = false;

            for (const sid of OrbitAttack.swordEntityIds[eid] ?? []) {
                if (entityExists(world, sid)) {
                    clearEntityData(sid);
                    removeEntity(world, sid);
                }
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
                Collider.radius[swordEid] = orbitCfg.hitRadius;
                DamageDealer.damage[swordEid] = OrbitAttack.damage[eid];
                DamageDealer.skillId[swordEid] = 'orbit';
                Owner.eid[swordEid] = eid;
                HitRecord[swordEid] = new Map();
                Render[swordEid] = { prefabName: 'OrbitingSword', rotation: 0, width: 0, height: 0, node: null, created: false };
                OrbitAttack.swordEntityIds[eid].push(swordEid);
            }
        }
    }

    private updateSwords(dt: number, world: GameWorld): void {
        for (const eid of query(world, [OrbitingSword])) {
            const ownerEid = OrbitingSword.ownerEntityId[eid];
            if (!entityExists(world, ownerEid)) {
                clearEntityData(eid);
                removeEntity(world, eid);
                continue;
            }

            OrbitingSword.angle[eid] += OrbitingSword.angularSpeed[eid] * dt;
            Transform.x[eid] = Transform.x[ownerEid] + Math.cos(OrbitingSword.angle[eid]) * OrbitingSword.orbitRadius[eid];
            Transform.y[eid] = Transform.y[ownerEid] + Math.sin(OrbitingSword.angle[eid]) * OrbitingSword.orbitRadius[eid];
        }
    }
}
