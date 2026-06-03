import { query, addEntity, removeEntity, entityExists } from '../../bitEcs';
import {
    Transform, Velocity, PlayerInput, AutoAttack, Camp, Collider,
    DamageDealer, Owner, HitRecord, Drag, Health, Lifetime,
    positionStore, velocityStore, autoAttackStore, campStore,
    colliderStore, damageDealerStore, ownerStore, hitRecordStore,
    dragStore, healthStore, lifetimeStore, clearEntityData,
} from '../Components';
import { Render, renderStore } from '../Components';
import { bladeMarkerStore } from '../SkillComponents';
import { GameConfig } from '../GameConfig';
import { findNearestEnemy } from '../helpers';

/**
 * CombatSystem — 自动射击 + 碰撞检测 + 伤害处理
 * Priority: 20
 *
 * TODO: 拆分为 Collision / Damage / Health / Death 独立 System
 */
export class CombatSystem {
    update(dt: number, world: any): void {
        this.tickHitRecords(dt, world);
        this.autoAttack(dt, world);
        this.damageEnemyCollision(world);
        this.enemyPlayerCollision(world);
    }

    private autoAttack(dt: number, world: any): void {
        for (const pid of query(world, [Transform, PlayerInput, AutoAttack])) {
            const atk = autoAttackStore.get(pid)!;
            atk.timer += dt;
            if (atk.timer < atk.cooldown) continue;

            const ptf = positionStore.get(pid)!;
            const nearest = findNearestEnemy(world, ptf.x, ptf.y, atk.range);
            if (!nearest) continue;

            atk.timer = 0;
            const etf = positionStore.get(nearest.eid)!;
            const baseAngle = Math.atan2(etf.y - ptf.y, etf.x - ptf.x);
            const n = Math.max(1, atk.count);
            const bulletCfg = GameConfig.skills.bullet;

            for (let i = 0; i < n; i++) {
                const offset = n === 1 ? 0 : ((i / (n - 1)) - 0.5) * atk.spreadAngle;
                const angle = baseAngle + offset;
                const dirX = Math.cos(angle);
                const dirY = Math.sin(angle);

                const eid = addEntity(world, Transform, Velocity, DamageDealer, Owner, Collider, HitRecord, Lifetime, Render);
                positionStore.set(eid, { x: ptf.x, y: ptf.y });
                velocityStore.set(eid, { x: dirX * atk.bulletSpeed, y: dirY * atk.bulletSpeed });
                damageDealerStore.set(eid, { damage: atk.damage, skillId: 'bullet' });
                ownerStore.set(eid, pid);
                colliderStore.set(eid, { radius: bulletCfg.hitRadius });
                hitRecordStore.set(eid, new Map());
                lifetimeStore.set(eid, { remaining: bulletCfg.lifeTime });
                renderStore.set(eid, { prefabName: 'Bullet', rotation: 0, width: 0, height: 0, node: null, created: false });
            }
        }
    }

    private tickHitRecords(dt: number, world: any): void {
        for (const eid of query(world, [HitRecord])) {
            const records = hitRecordStore.get(eid);
            if (!records) continue;
            for (const [targetEid, remaining] of records) {
                if (remaining === Infinity) continue;
                const next = remaining - dt;
                if (next <= 0) records.delete(targetEid);
                else records.set(targetEid, next);
            }
        }
    }

    private damageEnemyCollision(world: any): void {
        for (const bid of query(world, [Transform, DamageDealer, Owner, Collider])) {
            const btf = positionStore.get(bid)!;
            const dealer = damageDealerStore.get(bid)!;
            const bc = colliderStore.get(bid)!;
            const records = hitRecordStore.get(bid);

            for (const eid of query(world, [Transform, Health, Camp, Collider])) {
                if (campStore.get(eid) !== 'enemy') continue;
                const hp = healthStore.get(eid)!;
                if (hp.hp <= 0) continue;
                if (records?.has(eid)) continue;

                const etf = positionStore.get(eid)!;
                const ec = colliderStore.get(eid)!;
                const dx = etf.x - btf.x;
                const dy = etf.y - btf.y;
                const distSq = dx * dx + dy * dy;
                if (!this.isDamageInRange(bid, dealer.skillId, distSq, bc.radius + ec.radius, dx, dy)) continue;

                hp.hp -= dealer.damage;
                this.applyKnockback(eid, dx, dy, this.getKnockbackSpeed(dealer.skillId));

                if (records) records.set(eid, this.getHitCooldown(dealer.skillId));
                if (dealer.skillId === 'bullet') {
                    if (entityExists(world, bid)) { clearEntityData(bid); removeEntity(world, bid); }
                    break;
                }
            }
        }
    }

    private isDamageInRange(
        damageEid: number, skillId: string, distSq: number, radius: number, dx: number, dy: number,
    ): boolean {
        if (skillId === 'blade') {
            const blade = bladeMarkerStore.get(damageEid);
            if (!blade) return false;
            if (distSq > radius * radius) return false;
            const angle = Math.atan2(dy, dx);
            return Math.abs(this.angleDelta(angle, blade.facingAngle)) <= blade.arc * 0.5;
        }

        return distSq < radius * radius;
    }

    private applyKnockback(eid: number, dx: number, dy: number, speed: number): void {
        if (speed <= 0) return;
        let vel = velocityStore.get(eid);
        if (!vel) {
            vel = { x: 0, y: 0 };
            velocityStore.set(eid, vel);
        }
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dist > 0.001 ? dx / dist : 1;
        const ny = dist > 0.001 ? dy / dist : 0;
        vel.x += nx * speed;
        vel.y += ny * speed;
        if (!dragStore.has(eid)) dragStore.set(eid, { coefficient: 8 });
    }

    private getKnockbackSpeed(skillId: string): number {
        if (skillId === 'bullet') return GameConfig.skills.bullet.knockbackSpeed;
        if (skillId === 'blade') return GameConfig.skills.blade.knockbackSpeed;
        if (skillId === 'orbit') return GameConfig.skills.orbit.knockbackSpeed;
        if (skillId === 'explosion') return GameConfig.skills.bomb.explosion.knockbackSpeed;
        return 0;
    }

    private getHitCooldown(skillId: string): number {
        if (skillId === 'orbit') return GameConfig.skills.orbit.hitCooldown;
        return Infinity;
    }

    private angleDelta(a: number, b: number): number {
        let d = (a - b) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        return d;
    }

    private enemyPlayerCollision(world: any): void {
        const hitRadius = GameConfig.skills.contact.enemyPlayerHitRadius;
        const hitDistSq = hitRadius * hitRadius;

        for (const pid of query(world, [Transform, Health, PlayerInput])) {
            const php = healthStore.get(pid)!;
            if (php.hp <= 0 || php.invincibleTimer > 0) continue;
            const ptf = positionStore.get(pid)!;

            for (const eid of query(world, [Transform, Camp])) {
                if (campStore.get(eid) !== 'enemy') continue;
                const ehp = healthStore.get(eid);
                if (!ehp || ehp.hp <= 0) continue;

                const etf = positionStore.get(eid)!;
                const dx = ptf.x - etf.x;
                const dy = ptf.y - etf.y;
                if (dx * dx + dy * dy >= hitDistSq) continue;

                const dealer = damageDealerStore.get(eid);
                php.hp -= dealer ? dealer.damage : 10;
                php.invincibleTimer = php.invincibleTime || 0.5;
                if (php.hp <= 0) {
                    php.hp = 0;
                    (world as any).gameOver = true;
                }
                break;
            }
        }
    }
}
