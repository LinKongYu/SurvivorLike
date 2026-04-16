import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerTag, AutoAttack,
    EnemyTag, BulletComp,
} from '../Components';
import { createBullet } from '../EntityFactory';

/**
 * CombatSystem - 自动射击 + 碰撞检测 + 伤害处理 + 死亡
 * Priority: 20
 */
export class CombatSystem implements ISystem {

    private readonly BULLET_HIT_DIST_SQ = 30 * 30;
    private readonly ENEMY_HIT_DIST_SQ = 40 * 40;

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver()) return;

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

            // 发射子弹
            atk.timer = 0;
            const etf = world.getComponent(nearestEid, Transform)!;
            const dx = etf.x - ptf.x;
            const dy = etf.y - ptf.y;
            const dist = Math.sqrt(nearestDistSq);
            if (dist > 0) {
                createBullet(world, ptf.x, ptf.y, dx / dist, dy / dist, atk.damage, atk.bulletSpeed);
            }
        }
    }

    private bulletEnemyCollision(world: ECSWorld): void {
        const bulletStore = world.getStore(BulletComp);
        if (!bulletStore) return;

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

                if (dx * dx + dy * dy < this.BULLET_HIT_DIST_SQ) {
                    hp.hp -= bullet.damage;
                    world.destroyEntity(bid);
                    break;
                }
            }
        }
    }

    private enemyPlayerCollision(world: ECSWorld): void {
        const players = world.query(Transform, PlayerTag, Health);
        const enemies = world.query(Transform, EnemyTag, Health);

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

                if (dx * dx + dy * dy < this.ENEMY_HIT_DIST_SQ) {
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
