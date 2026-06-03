import { query, addEntity, addComponent, removeEntity, entityExists, isNested } from '../../bitEcs';
import {
    Transform, Velocity, PlayerInput, AutoAttack, Camp, Collider,
    DamageDealer, Owner, HitRecord, Drag, Health, Lifetime,
    Render, clearEntityData,
} from '../Components';
import { BladeMarker } from '../SkillComponents';
import { GameConfig } from '../GameConfig';
import { findNearestEnemy } from '../Helpers';

/**
 * CombatSystem - auto attack, damage collision, health and contact damage.
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
            AutoAttack.timer[pid] += dt;
            if (AutoAttack.timer[pid] < AutoAttack.cooldown[pid]) continue;

            const nearest = findNearestEnemy(world, Transform.x[pid], Transform.y[pid], AutoAttack.range[pid]);
            if (!nearest) continue;

            AutoAttack.timer[pid] = 0;
            const baseAngle = Math.atan2(
                Transform.y[nearest.eid] - Transform.y[pid],
                Transform.x[nearest.eid] - Transform.x[pid],
            );
            const count = Math.max(1, AutoAttack.count[pid]);
            const bulletCfg = GameConfig.skills.bullet;

            for (let i = 0; i < count; i++) {
                const offset = count === 1 ? 0 : ((i / (count - 1)) - 0.5) * AutoAttack.spreadAngle[pid];
                const angle = baseAngle + offset;
                const dirX = Math.cos(angle);
                const dirY = Math.sin(angle);

                const eid = addEntity(world, Transform, Velocity, DamageDealer, Owner, Collider, HitRecord, Lifetime, Render);
                Transform.x[eid] = Transform.x[pid];
                Transform.y[eid] = Transform.y[pid];
                Velocity.x[eid] = dirX * AutoAttack.bulletSpeed[pid];
                Velocity.y[eid] = dirY * AutoAttack.bulletSpeed[pid];
                DamageDealer.damage[eid] = AutoAttack.damage[pid];
                DamageDealer.skillId[eid] = 'bullet';
                Owner.eid[eid] = pid;
                Collider.radius[eid] = bulletCfg.hitRadius;
                HitRecord[eid] = new Map();
                Lifetime.remaining[eid] = bulletCfg.lifeTime;
                Render[eid] = { prefabName: 'Bullet', rotation: 0, width: 0, height: 0, node: null, created: false };
            }
        }
    }

    private tickHitRecords(dt: number, world: any): void {
        for (const eid of query(world, [HitRecord])) {
            const records = HitRecord[eid];
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
        for (const damageEid of query(world, [Transform, DamageDealer, Owner, Collider])) {
            const records = HitRecord[damageEid];
            const skillId = DamageDealer.skillId[damageEid];

            for (const enemyEid of query(world, [Transform, Health, Camp, Collider], isNested)) {
                if (Camp.value[enemyEid] !== 'enemy') continue;
                if (Health.hp[enemyEid] <= 0) continue;
                if (records?.has(enemyEid)) continue;

                const dx = Transform.x[enemyEid] - Transform.x[damageEid];
                const dy = Transform.y[enemyEid] - Transform.y[damageEid];
                const distSq = dx * dx + dy * dy;
                const radius = Collider.radius[damageEid] + Collider.radius[enemyEid];
                if (!this.isDamageInRange(damageEid, skillId, distSq, radius, dx, dy)) continue;

                Health.hp[enemyEid] -= DamageDealer.damage[damageEid];
                this.applyKnockback(world, enemyEid, dx, dy, this.getKnockbackSpeed(skillId));

                if (records) records.set(enemyEid, this.getHitCooldown(skillId));
                if (skillId === 'bullet') {
                    if (entityExists(world, damageEid)) {
                        clearEntityData(damageEid);
                        removeEntity(world, damageEid);
                    }
                    break;
                }
            }
        }
    }

    private isDamageInRange(
        damageEid: number, skillId: string, distSq: number, radius: number, dx: number, dy: number,
    ): boolean {
        if (skillId === 'blade') {
            if (distSq > radius * radius) return false;
            const angle = Math.atan2(dy, dx);
            return Math.abs(this.angleDelta(angle, BladeMarker.facingAngle[damageEid])) <= BladeMarker.arc[damageEid] * 0.5;
        }

        return distSq < radius * radius;
    }

    private applyKnockback(world: any, eid: number, dx: number, dy: number, speed: number): void {
        if (speed <= 0) return;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dist > 0.001 ? dx / dist : 1;
        const ny = dist > 0.001 ? dy / dist : 0;
        Velocity.x[eid] += nx * speed;
        Velocity.y[eid] += ny * speed;
        addComponent(world, eid, Drag);
        Drag.coefficient[eid] = 8;
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

        for (const playerEid of query(world, [Transform, Health, PlayerInput])) {
            if (Health.hp[playerEid] <= 0 || Health.invincibleTimer[playerEid] > 0) continue;

            for (const enemyEid of query(world, [Transform, Camp], isNested)) {
                if (Camp.value[enemyEid] !== 'enemy') continue;
                if (Health.hp[enemyEid] <= 0) continue;

                const dx = Transform.x[playerEid] - Transform.x[enemyEid];
                const dy = Transform.y[playerEid] - Transform.y[enemyEid];
                if (dx * dx + dy * dy >= hitDistSq) continue;

                Health.hp[playerEid] -= DamageDealer.damage[enemyEid] || 10;
                Health.invincibleTimer[playerEid] = Health.invincibleTime[playerEid] || 0.5;
                if (Health.hp[playerEid] <= 0) {
                    Health.hp[playerEid] = 0;
                    world.gameOver = true;
                }
                break;
            }
        }
    }
}
