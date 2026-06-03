import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerInput, AutoAttack,
    Camp, Collider, DamageDealer, Owner, Velocity,
    Lifetime, HitRecord, Drag,
} from '../Components';
import { createBullet } from '../EntityFactory';
import { GameConfig } from '../GameConfig';
import { findNearestEnemy } from '../helpers';

/**
 * CombatSystem — 自动射击 + 碰撞检测 + 伤害处理
 * Priority: 20
 *
 * 职责：
 * 1. AutoAttack 冷却管理 + 生成子弹（后续可拆为 AutoAttackSystem）
 * 2. 子弹与敌人碰撞检测 → 生成 HitEvent（后续可拆为 CollisionSystem）
 * 3. 敌人与玩家接触伤害（后续可拆为 EnemyContactSystem）
 * 4. HitEvent → 计算伤害 → DamageEvent
 * 5. DamageEvent → 扣血 → 检测死亡 → DeathEvent
 * 6. DeathEvent → 掉落经验 + 销毁
 *
 * TODO: 拆分为 CollisionSystem / DamageSystem / HealthSystem / DeathSystem
 */
export class CombatSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver() || world.isPaused()) return;

        this.autoAttack(dt, world);
        this.bulletEnemyCollision(world);
        this.enemyPlayerCollision(world);
    }

    // ─── 自动射击 ───

    private autoAttack(dt: number, world: ECSWorld): void {
        const players = world.query(Transform, PlayerInput, AutoAttack);

        for (const pid of players) {
            const atk = world.getComponent(pid, AutoAttack)!;
            atk.timer += dt;
            if (atk.timer < atk.cooldown) continue;

            const ptf = world.getComponent(pid, Transform)!;

            const nearest = findNearestEnemy(world, ptf.x, ptf.y, atk.range);
            if (!nearest) continue;

            atk.timer = 0;
            const etf = world.getComponent(nearest.eid, Transform)!;
            const baseAngle = Math.atan2(etf.y - ptf.y, etf.x - ptf.x);
            const n = Math.max(1, atk.count);

            for (let i = 0; i < n; i++) {
                const offset = n === 1 ? 0 : ((i / (n - 1)) - 0.5) * atk.spreadAngle;
                const angle = baseAngle + offset;
                createBullet(world, ptf.x, ptf.y,
                    Math.cos(angle), Math.sin(angle),
                    atk.damage, atk.bulletSpeed, pid);
            }
        }
    }

    // ─── 碰撞检测 ───

    /** 子弹 vs 敌人碰撞 */
    private bulletEnemyCollision(world: ECSWorld): void {
        const bullets = world.query(Transform, DamageDealer, Owner, Collider);
        const enemies = world.query(Transform, Health, Camp);

        const bulletCfg = GameConfig.skills.bullet;
        const hitDistSq = bulletCfg.hitRadius * bulletCfg.hitRadius;

        for (const bid of bullets) {
            const btf = world.getComponent(bid, Transform)!;
            const dealer = world.getComponent(bid, DamageDealer)!;
            const owner = world.getComponent(bid, Owner)!;

            for (const eid of enemies) {
                const camp = world.getComponent(eid, Camp)!;
                if (camp.faction !== 'enemy') continue;

                const hp = world.getComponent(eid, Health)!;
                if (hp.hp <= 0) continue;

                const etf = world.getComponent(eid, Transform)!;
                const dx = btf.x - etf.x;
                const dy = btf.y - etf.y;
                if (dx * dx + dy * dy >= hitDistSq) continue;

                // 扣血
                hp.hp -= dealer.damage;

                // 击退（沿子弹方向）
                if (dealer.skillId === 'bullet') {
                    const kbSpeed = bulletCfg.knockbackSpeed;
                    const vel = world.getComponent(eid, Velocity)
                        || world.addComponent(eid, new Velocity());
                    vel.x += Math.cos(Math.atan2(dy, dx)) * kbSpeed;
                    vel.y += Math.sin(Math.atan2(dy, dx)) * kbSpeed;
                    if (!world.getComponent(eid, Drag)) {
                        world.addComponent(eid, new Drag(8));
                    }
                }

                world.destroyEntity(bid);
                break;
            }
        }
    }

    /** 敌人 vs 玩家接触伤害 */
    private enemyPlayerCollision(world: ECSWorld): void {
        const players = world.query(Transform, Health, PlayerInput);
        const enemies = world.query(Transform, Camp, Health);

        const hitRadius = GameConfig.skills.contact.enemyPlayerHitRadius;
        const hitDistSq = hitRadius * hitRadius;

        for (const pid of players) {
            const php = world.getComponent(pid, Health)!;
            if (php.hp <= 0 || php.invincibleTimer > 0) continue;

            const ptf = world.getComponent(pid, Transform)!;

            for (const eid of enemies) {
                const camp = world.getComponent(eid, Camp)!;
                if (camp.faction !== 'enemy') continue;

                const ehp = world.getComponent(eid, Health)!;
                if (ehp.hp <= 0) continue;

                const etf = world.getComponent(eid, Transform)!;
                const dx = ptf.x - etf.x;
                const dy = ptf.y - etf.y;
                if (dx * dx + dy * dy >= hitDistSq) continue;

                // 读取敌人的 DamageDealer 作为接触伤害
                const dealer = world.getComponent(eid, DamageDealer)!;
                php.hp -= dealer ? dealer.damage : 10;
                php.invincibleTimer = php.invincibleTime || 0.5;
                if (php.hp <= 0) {
                    php.hp = 0;
                    world.setGameOver();
                }
                break;
            }
        }
    }

}
