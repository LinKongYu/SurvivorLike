import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerTag, EnemyTag, Knockback,
} from '../Components';
import { BladeAttack, BladeHitbox } from '../SkillComponents';
import { createBladeHitbox } from '../EntityFactory';

/**
 * BladeSystem - 扇形挥砍
 * Priority: 22
 *
 * 流程：
 * 1. 为每个持有 BladeAttack 的玩家 tick 冷却
 * 2. 冷却结束时找最近敌人，沿该方向生成扇形 Hitbox（若 count>1，均分 360° 生成多个）
 * 3. 每帧检查所有存活 Hitbox：范围内 + 角度内的敌人受伤 + 击退
 * 4. Hitbox.lifeTime 到期后销毁
 */
export class BladeSystem implements ISystem {

    private readonly KNOCKBACK_SPEED = 250;

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver() || world.isPaused()) return;

        this.triggerBlades(dt, world);
        this.resolveBladeHits(dt, world);
    }

    private triggerBlades(dt: number, world: ECSWorld): void {
        const players = world.query(Transform, PlayerTag, BladeAttack);
        if (players.length === 0) return;

        const enemies = world.query(Transform, EnemyTag, Health);

        for (const pid of players) {
            const atk = world.getComponent(pid, BladeAttack)!;
            atk.timer += dt;
            if (atk.timer < atk.cooldown) continue;

            // 找最近敌人决定主朝向
            const ptf = world.getComponent(pid, Transform)!;
            let nearestDistSq = Infinity;
            let nearestEid = -1;
            for (const eid of enemies) {
                const hp = world.getComponent(eid, Health)!;
                if (hp.hp <= 0) continue;
                const etf = world.getComponent(eid, Transform)!;
                const dx = etf.x - ptf.x;
                const dy = etf.y - ptf.y;
                const dSq = dx * dx + dy * dy;
                if (dSq < nearestDistSq) {
                    nearestDistSq = dSq;
                    nearestEid = eid;
                }
            }

            // 附近无敌人就不挥砍（避免无意义闪屏）
            if (nearestEid < 0) continue;

            atk.timer = 0;
            const etf = world.getComponent(nearestEid, Transform)!;
            const baseAngle = Math.atan2(etf.y - ptf.y, etf.x - ptf.x);

            // count 多个挥砍均分 360°，第 0 个朝主方向
            const step = (Math.PI * 2) / atk.count;
            for (let i = 0; i < atk.count; i++) {
                const angle = baseAngle + i * step;
                createBladeHitbox(world, ptf.x, ptf.y, angle, atk.range, atk.arc, atk.damage);
            }
        }
    }

    private resolveBladeHits(dt: number, world: ECSWorld): void {
        const store = world.getStore(BladeHitbox);
        if (!store) return;

        const enemies = world.query(Transform, EnemyTag, Health);

        for (const [hid, hitbox] of store) {
            const htf = world.getComponent(hid, Transform);
            if (!htf) continue;

            hitbox.timer += dt;
            if (hitbox.timer >= hitbox.lifeTime) {
                world.destroyEntity(hid);
                continue;
            }

            // 只在第一帧造成伤害（通过 hitEids 记录，同一扇形不会 DOT）
            const halfArc = hitbox.arc * 0.5;
            const rangeSq = hitbox.range * hitbox.range;

            for (const eid of enemies) {
                if (hitbox.hitEids.has(eid)) continue;
                const hp = world.getComponent(eid, Health)!;
                if (hp.hp <= 0) continue;

                const etf = world.getComponent(eid, Transform)!;
                const dx = etf.x - htf.x;
                const dy = etf.y - htf.y;
                const distSq = dx * dx + dy * dy;
                if (distSq > rangeSq || distSq < 0.0001) continue;

                // 检查角度是否在扇形内
                const enemyAngle = Math.atan2(dy, dx);
                let deltaAngle = enemyAngle - hitbox.facingAngle;
                // 归一化到 [-π, π]
                while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
                while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
                if (Math.abs(deltaAngle) > halfArc) continue;

                // 命中
                hp.hp -= hitbox.damage;
                hitbox.hitEids.add(eid);

                // 沿扇形朝向施加击退
                const cos = Math.cos(hitbox.facingAngle);
                const sin = Math.sin(hitbox.facingAngle);
                const kb = world.getComponent(eid, Knockback);
                if (kb) {
                    kb.vx += cos * this.KNOCKBACK_SPEED;
                    kb.vy += sin * this.KNOCKBACK_SPEED;
                } else {
                    world.addComponent(eid, new Knockback(
                        cos * this.KNOCKBACK_SPEED,
                        sin * this.KNOCKBACK_SPEED,
                        8,
                    ));
                }
            }
        }
    }
}
