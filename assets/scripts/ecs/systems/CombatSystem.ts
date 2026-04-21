import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerTag, AutoAttack,
    EnemyTag, BulletComp, Knockback,
} from '../Components';
import { createBullet } from '../EntityFactory';
import { GameConfig } from '../GameConfig';

/**
 * CombatSystem - 自动射击 + 碰撞检测 + 伤害处理 + 死亡
 * Priority: 20
 *
 * 所有命中半径 / 击退速度从 GameConfig（CSV）读取。
 */
export class CombatSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver() || world.isPaused()) return;

        this.autoAttack(dt, world);
        this.bulletEnemyCollision(world);
        this.enemyPlayerCollision(world);
    }

    private autoAttack(dt: number, world: ECSWorld): void {
        const players = world.query(Transform, PlayerTag, AutoAttack);
        const enemies = world.query(Transform, EnemyTag, Health);

        for (const pid of players) {
            const atk = world.getComponent(pid, AutoAttack)!;
            atk.timer += dt;
            if (atk.timer < atk.cooldown) continue;

            const ptf = world.getComponent(pid, Transform)!;

            // 查找最近敌人
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

            if (nearestEid < 0 || nearestDistSq > atk.range * atk.range) continue;

            // 发射 count 发子弹，以主方向为中心均匀散射
            atk.timer = 0;
            const etf = world.getComponent(nearestEid, Transform)!;
            const baseAngle = Math.atan2(etf.y - ptf.y, etf.x - ptf.x);

            const n = Math.max(1, atk.count);
            for (let i = 0; i < n; i++) {
                // i=0 居中；n>1 时在 [-spread/2, +spread/2] 之间均分
                const offset = n === 1 ? 0 : ((i / (n - 1)) - 0.5) * atk.spreadAngle;
                const angle = baseAngle + offset;
                const dirX = Math.cos(angle);
                const dirY = Math.sin(angle);
                createBullet(world, ptf.x, ptf.y, dirX, dirY, atk.damage, atk.bulletSpeed);
            }
        }
    }

    private bulletEnemyCollision(world: ECSWorld): void {
        const bulletStore = world.getStore(BulletComp);
        if (!bulletStore) return;

        const hitRadius = GameConfig.skills.bullet.hitRadius;
        const hitDistSq = hitRadius * hitRadius;
        const knockbackSpeed = GameConfig.skills.bullet.knockbackSpeed;

        const enemies = world.query(Transform, EnemyTag, Health);

        for (const [bid, bullet] of bulletStore) {
            const btf = world.getComponent(bid, Transform);
            if (!btf) continue;

            for (const eid of enemies) {
                const hp = world.getComponent(eid, Health)!;
                if (hp.hp <= 0) continue;

                const etf = world.getComponent(eid, Transform)!;
                const dx = btf.x - etf.x;
                const dy = btf.y - etf.y;

                if (dx * dx + dy * dy < hitDistSq) {
                    hp.hp -= bullet.damage;

                    // 施加击退：沿子弹飞行方向推开敌人
                    const existing = world.getComponent(eid, Knockback);
                    if (existing) {
                        // 叠加到已有击退上（多发子弹命中会累积，有上限由衰减自然控制）
                        existing.vx += bullet.dirX * knockbackSpeed;
                        existing.vy += bullet.dirY * knockbackSpeed;
                    } else {
                        world.addComponent(eid, new Knockback(
                            bullet.dirX * knockbackSpeed,
                            bullet.dirY * knockbackSpeed,
                            8,
                        ));
                    }

                    world.destroyEntity(bid);
                    break;
                }
            }
        }
    }

    private enemyPlayerCollision(world: ECSWorld): void {
        const players = world.query(Transform, PlayerTag, Health);
        const enemies = world.query(Transform, EnemyTag, Health);

        const hitRadius = GameConfig.skills.contact.enemyPlayerHitRadius;
        const hitDistSq = hitRadius * hitRadius;

        for (const pid of players) {
            const php = world.getComponent(pid, Health)!;
            if (php.hp <= 0 || php.invincibleTimer > 0) continue;

            const ptf = world.getComponent(pid, Transform)!;

            for (const eid of enemies) {
                const ehp = world.getComponent(eid, Health)!;
                if (ehp.hp <= 0) continue;

                const etf = world.getComponent(eid, Transform)!;
                const dx = ptf.x - etf.x;
                const dy = ptf.y - etf.y;

                if (dx * dx + dy * dy < hitDistSq) {
                    const enemy = world.getComponent(eid, EnemyTag)!;
                    php.hp -= enemy.damage;
                    php.invincibleTimer = php.invincibleTime;
                    if (php.hp <= 0) {
                        php.hp = 0;
                        world.setGameOver();
                    }
                    break;
                }
            }
        }
    }
}
