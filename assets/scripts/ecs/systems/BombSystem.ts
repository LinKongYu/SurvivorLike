import { query, addEntity } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import {
    Transform, PlayerInput, Collider, DamageDealer, Owner,
    HitRecord, Lifetime, Render, makeRender,
} from '../Components';
import { BombAttack, BombMarker, ExplosionMarker } from '../SkillComponents';
import { GameConfig } from '../GameConfig';
import { destroyEntity, addDamager } from '../Entities';
import { SkillId } from '../Skills';
import { SystemPriority } from '../Schedule';

export class BombSystem implements System {
    readonly priority = SystemPriority.Bomb;

    update(dt: number, world: GameWorld): void {
        this.triggerBombs(dt, world);
        this.tickBombs(dt, world);
    }

    private triggerBombs(dt: number, world: GameWorld): void {
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
                Render[eid] = makeRender('Bomb');
            }
        }
    }

    private tickBombs(dt: number, world: GameWorld): void {
        for (const eid of query(world, [BombMarker])) {
            BombMarker.timer[eid] += dt;
            if (BombMarker.timer[eid] < BombMarker.fuseTime[eid]) continue;

            const lifeTime = GameConfig.skills.bomb.explosion.lifeTime;
            const blastRadius = BombMarker.blastRadius[eid];
            const exid = addEntity(world, Transform, ExplosionMarker, Collider, DamageDealer, Owner, HitRecord, Lifetime, Render);
            Transform.x[exid] = Transform.x[eid];
            Transform.y[exid] = Transform.y[eid];
            ExplosionMarker.lifeTime[exid] = lifeTime;
            ExplosionMarker.damage[exid] = BombMarker.damage[eid];
            ExplosionMarker.radius[exid] = blastRadius;
            addDamager(exid, { damage: BombMarker.damage[eid], skillId: SkillId.Explosion, ownerEid: -1, radius: blastRadius });
            Lifetime.remaining[exid] = lifeTime;
            Render[exid] = makeRender('Explosion', { width: blastRadius * 2, height: blastRadius * 2 });

            destroyEntity(world, eid);
        }
    }
}
