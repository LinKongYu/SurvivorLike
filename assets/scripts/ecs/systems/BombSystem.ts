import { query, addEntity, removeEntity, entityExists } from '../../bitEcs';
import { Transform, PlayerInput, Collider, DamageDealer, Owner, HitRecord, Lifetime, positionStore, colliderStore, damageDealerStore, ownerStore, hitRecordStore, lifetimeStore, clearEntityData } from '../Components';
import { BombAttack, BombMarker, ExplosionMarker, bombAttackStore, bombMarkerStore, explosionMarkerStore } from '../SkillComponents';
import { Render, renderStore } from '../Components';
import { GameConfig } from '../GameConfig';

export class BombSystem {
    update(dt: number, world: any): void {
        this.triggerBombs(dt, world);
        this.tickBombs(dt, world);
    }
    private triggerBombs(dt: number, world: any): void {
        for (const pid of query(world, [Transform, PlayerInput, BombAttack])) {
            const atk = bombAttackStore.get(pid)!;
            atk.timer += dt;
            if (atk.timer < atk.cooldown) continue;
            atk.timer = 0;
            const ptf = positionStore.get(pid)!;
            const step = (Math.PI * 2) / atk.count;
            const td = atk.count > 1 ? GameConfig.skills.bomb.throwDistance : 0;
            for (let i = 0; i < atk.count; i++) {
                const a = i * step + Math.random() * 0.3;
                const eid = addEntity(world, Transform, BombMarker, Render);
                positionStore.set(eid, { x: ptf.x + Math.cos(a) * td, y: ptf.y + Math.sin(a) * td });
                bombMarkerStore.set(eid, { timer: 0, fuseTime: atk.fuseTime, damage: atk.damage, blastRadius: atk.blastRadius });
                renderStore.set(eid, { prefabName: 'Bomb', rotation: 0, width: 0, height: 0, node: null, created: false });
            }
        }
    }
    private tickBombs(dt: number, world: any): void {
        for (const eid of query(world, [BombMarker])) {
            const bomb = bombMarkerStore.get(eid)!;
            bomb.timer += dt;
            if (bomb.timer >= bomb.fuseTime) {
                const tf = positionStore.get(eid)!;
                const lt = GameConfig.skills.bomb.explosion.lifeTime;
                const exid = addEntity(world, Transform, ExplosionMarker, Collider, DamageDealer, Owner, HitRecord, Lifetime, Render);
                positionStore.set(exid, { x: tf.x, y: tf.y });
                explosionMarkerStore.set(exid, { lifeTime: lt, damage: bomb.damage, radius: bomb.blastRadius });
                colliderStore.set(exid, { radius: bomb.blastRadius });
                damageDealerStore.set(exid, { damage: bomb.damage, skillId: 'explosion' });
                ownerStore.set(exid, -1);
                hitRecordStore.set(exid, new Map());
                lifetimeStore.set(exid, { remaining: lt });
                renderStore.set(exid, { prefabName: 'Explosion', rotation: 0, width: bomb.blastRadius * 2, height: bomb.blastRadius * 2, node: null, created: false });
                if (entityExists(world, eid)) { clearEntityData(eid); removeEntity(world, eid); }
            }
        }
    }
}
