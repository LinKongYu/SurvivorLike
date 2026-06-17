import { query, addEntity, addComponent, isNested } from '../../bitEcs';
import {
    Transform, Velocity, PlayerInput, AutoAttack, Camp, Collider,
    DamageDealer, Owner, HitRecord, Drag, Health, Lifetime, HitFlash,
    Render, makeRender,
} from '../Components';
import { BladeMarker } from '../SkillComponents';
import { GameConfig } from '../GameConfig';
import { findNearestEnemy } from '../Helpers';
import { destroyEntity, addDamager } from '../Entities';
import { SkillId, skillKnockbackSpeed, skillHitCooldown, HIT_FLASH } from '../Skills';
import { System } from '../System';
import { GameWorld } from '../World';
import { SystemPriority } from '../Schedule';

/**
 * CombatSystem - auto attack, damage collision, health and contact damage.
 */
export class CombatSystem implements System {
    readonly priority = SystemPriority.Combat;

    update(dt: number, world: GameWorld): void {
        this.tickHitRecords(dt, world);
        this.autoAttack(dt, world);
        this.damageEnemyCollision(world);
        this.enemyPlayerCollision(world);
    }

    private autoAttack(dt: number, world: GameWorld): void {
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
                addDamager(eid, { damage: AutoAttack.damage[pid], skillId: SkillId.Bullet, ownerEid: pid, radius: bulletCfg.hitRadius });
                Lifetime.remaining[eid] = bulletCfg.lifeTime;
                Render[eid] = makeRender('Bullet');
            }
        }
    }

    private tickHitRecords(dt: number, world: GameWorld): void {
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

    private damageEnemyCollision(world: GameWorld): void {
        // 伤害源查询带 commit，会先冲刷上一帧的待删除实体；敌人集合每帧只查一次，
        // 避免在外层循环里为每个伤害实体重复构建查询。
        const damagers = query(world, [Transform, DamageDealer, Owner, Collider]);
        const enemies = query(world, [Transform, Health, Camp, Collider], isNested);
        for (const damageEid of damagers) {
            const records = HitRecord[damageEid];
            const skillId = DamageDealer.skillId[damageEid];

            for (const enemyEid of enemies) {
                if (Camp.value[enemyEid] !== 'enemy') continue;
                if (Health.hp[enemyEid] <= 0) continue;
                if (records?.has(enemyEid)) continue;

                const dx = Transform.x[enemyEid] - Transform.x[damageEid];
                const dy = Transform.y[enemyEid] - Transform.y[damageEid];
                const distSq = dx * dx + dy * dy;
                const radius = Collider.radius[damageEid] + Collider.radius[enemyEid];
                if (!this.isDamageInRange(damageEid, skillId, distSq, radius, dx, dy)) continue;

                Health.hp[enemyEid] -= DamageDealer.damage[damageEid];
                this.applyKnockback(world, enemyEid, dx, dy, skillKnockbackSpeed(skillId));

                if (records) records.set(enemyEid, skillHitCooldown(skillId));
                if (skillId === SkillId.Bullet) {
                    destroyEntity(world, damageEid);
                    break;
                }
            }
        }
    }

    private isDamageInRange(
        damageEid: number, skillId: string, distSq: number, radius: number, dx: number, dy: number,
    ): boolean {
        if (skillId === SkillId.Blade) {
            if (distSq > radius * radius) return false;
            const angle = Math.atan2(dy, dx);
            return Math.abs(this.angleDelta(angle, BladeMarker.facingAngle[damageEid])) <= BladeMarker.arc[damageEid] * 0.5;
        }

        return distSq < radius * radius;
    }

    private applyKnockback(world: GameWorld, eid: number, _dx: number, _dy: number, speed: number): void {
        if (speed <= 0) return;

        const vx = Velocity.x[eid] ?? 0;
        const vy = Velocity.y[eid] ?? 0;
        const vLen = Math.sqrt(vx * vx + vy * vy);

        let nx: number;
        let ny: number;
        if (vLen > 0.01) {
            nx = -vx / vLen;
            ny = -vy / vLen;
        } else {
            const dist = Math.sqrt(_dx * _dx + _dy * _dy);
            nx = dist > 0.001 ? _dx / dist : 1;
            ny = dist > 0.001 ? _dy / dist : 0;
        }

        Velocity.x[eid] += nx * speed;
        Velocity.y[eid] += ny * speed;
        addComponent(world, eid, Drag);
        Drag.coefficient[eid] = GameConfig.skills.knockback.drag;

        this._triggerHitFlash(world, eid);
    }

    private _triggerHitFlash(world: GameWorld, eid: number): void {
        addComponent(world, eid, HitFlash);
        HitFlash.color[eid] = HIT_FLASH.color;
        HitFlash.remaining[eid] = HIT_FLASH.duration;
        HitFlash.totalDuration[eid] = HIT_FLASH.duration;
    }

    private angleDelta(a: number, b: number): number {
        let d = (a - b) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        return d;
    }

    private enemyPlayerCollision(world: GameWorld): void {
        const hitRadius = GameConfig.skills.contact.enemyPlayerHitRadius;
        const hitDistSq = hitRadius * hitRadius;

        const players = query(world, [Transform, Health, PlayerInput]);
        const enemies = query(world, [Transform, Camp], isNested);
        for (const playerEid of players) {
            if (Health.hp[playerEid] <= 0 || Health.invincibleTimer[playerEid] > 0) continue;

            for (const enemyEid of enemies) {
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
