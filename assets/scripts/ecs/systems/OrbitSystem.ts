import { query, addEntity, removeEntity, entityExists } from '../../bitEcs';
import { Transform, PlayerInput, Collider, DamageDealer, Owner, HitRecord, positionStore, colliderStore, damageDealerStore, ownerStore, hitRecordStore, clearEntityData } from '../Components';
import { OrbitAttack, OrbitingSword, orbitAttackStore, orbitingSwordStore } from '../SkillComponents';
import { Render, renderStore } from '../Components';
import { GameConfig } from '../GameConfig';

export class OrbitSystem {
    update(dt: number, world: any): void {
        this.rebuildIfDirty(world);
        this.updateSwords(dt, world);
    }
    private rebuildIfDirty(world: any): void {
        for (const eid of query(world, [OrbitAttack])) {
            const atk = orbitAttackStore.get(eid)!;
            if (!atk.dirty) continue;
            atk.dirty = false;
            for (const sid of atk.swordEntityIds) { if (entityExists(world, sid)) { clearEntityData(sid); removeEntity(world, sid); } }
            atk.swordEntityIds = [];
            const orbitCfg = GameConfig.skills.orbit;
            const step = (Math.PI * 2) / atk.count;
            for (let i = 0; i < atk.count; i++) {
                const eid2 = addEntity(world, Transform, OrbitingSword, Collider, DamageDealer, Owner, HitRecord, Render);
                positionStore.set(eid2, { x: 0, y: 0 });
                orbitingSwordStore.set(eid2, { ownerEntityId: eid, angle: i * step, angularSpeed: atk.angularSpeed, orbitRadius: atk.orbitRadius, damage: atk.damage, hitCooldown: orbitCfg.hitCooldown });
                colliderStore.set(eid2, { radius: orbitCfg.hitRadius });
                damageDealerStore.set(eid2, { damage: atk.damage, skillId: 'orbit' });
                ownerStore.set(eid2, eid);
                hitRecordStore.set(eid2, new Map());
                renderStore.set(eid2, { prefabName: 'OrbitingSword', rotation: 0, width: 0, height: 0, node: null, created: false });
                atk.swordEntityIds.push(eid2);
            }
        }
    }
    private updateSwords(dt: number, world: any): void {
        for (const eid of query(world, [OrbitingSword])) {
            const sword = orbitingSwordStore.get(eid)!;
            const otf = positionStore.get(sword.ownerEntityId);
            if (!otf) { clearEntityData(eid); removeEntity(world, eid); continue; }
            sword.angle += sword.angularSpeed * dt;
            const stf = positionStore.get(eid)!;
            stf.x = otf.x + Math.cos(sword.angle) * sword.orbitRadius;
            stf.y = otf.y + Math.sin(sword.angle) * sword.orbitRadius;
        }
    }
}
