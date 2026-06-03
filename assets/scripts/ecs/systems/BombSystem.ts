import { query, addEntity, removeEntity, entityExists } from '../../bitEcs';
import {
    Transform, PlayerInput, Collider, DamageDealer, Owner,
    HitRecord, Lifetime, Render, clearEntityData,
} from '../Components';
import { BombAttack, BombMarker, ExplosionMarker } from '../SkillComponents';
import { GameConfig } from '../GameConfig';

export class BombSystem {
    update(dt: number, world: any): void {
        this.triggerBombs(dt, world);
        this.tickBombs(dt, world);
    }

    private triggerBombs(dt: number, world: any): void {
        for (const pid of query(world, [Transform, PlayerInput, BombAttack])) {
            BombAttack.timer[pid] += dt;
            if (BombAttack.timer[pid] < BombAttack.cooldown[pid]) continue;

            BombAttack.timer[pid] = 0;
            const count = Math.max(1, BombAttack.count[pid]);
            const step = (Math.PI * 2) / count;
            const throwDistance = count > 1 ? GameConfig.skills.bomb.throwDistance : 0;

            for (let i = 0; i < count; i++) {
                const angle = i * step + Math.random() * 0.3;
                const eid = addEntity(world, Transform, BombMarker, Render);
                Transform.x[eid] = Transform.x[pid] + Math.cos(angle) * throwDistance;
                Transform.y[eid] = Transform.y[pid] + Math.sin(angle) * throwDistance;
                BombMarker.timer[eid] = 0;
                BombMarker.fuseTime[eid] = BombAttack.fuseTime[pid];
                BombMarker.damage[eid] = BombAttack.damage[pid];
                BombMarker.blastRadius[eid] = BombAttack.blastRadius[pid];
                Render[eid] = { prefabName: 'Bomb', rotation: 0, width: 0, height: 0, node: null, created: false };
            }
        }
    }

    private tickBombs(dt: number, world: any): void {
        for (const eid of query(world, [BombMarker])) {
            BombMarker.timer[eid] += dt;
            if (BombMarker.timer[eid] < BombMarker.fuseTime[eid]) continue;

            const lifeTime = GameConfig.skills.bomb.explosion.lifeTime;
            const exid = addEntity(world, Transform, ExplosionMarker, Collider, DamageDealer, Owner, HitRecord, Lifetime, Render);
            Transform.x[exid] = Transform.x[eid];
            Transform.y[exid] = Transform.y[eid];
            ExplosionMarker.lifeTime[exid] = lifeTime;
            ExplosionMarker.damage[exid] = BombMarker.damage[eid];
            ExplosionMarker.radius[exid] = BombMarker.blastRadius[eid];
            Collider.radius[exid] = BombMarker.blastRadius[eid];
            DamageDealer.damage[exid] = BombMarker.damage[eid];
            DamageDealer.skillId[exid] = 'explosion';
            Owner.eid[exid] = -1;
            HitRecord[exid] = new Map();
            Lifetime.remaining[exid] = lifeTime;
            Render[exid] = {
                prefabName: 'Explosion',
                rotation: 0,
                width: BombMarker.blastRadius[eid] * 2,
                height: BombMarker.blastRadius[eid] * 2,
                node: null,
                created: false,
            };

            if (entityExists(world, eid)) {
                clearEntityData(eid);
                removeEntity(world, eid);
            }
        }
    }
}
