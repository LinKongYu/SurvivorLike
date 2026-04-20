import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerTag, EnemyTag, Knockback,
} from '../Components';
import { BombAttack, Bomb, Explosion } from '../SkillComponents';
import { createBomb, createExplosion } from '../EntityFactory';

/**
 * BombSystem - 投掷炸弹 + 爆炸
 * Priority: 24
 *
 * 流程：
 * 1. 玩家持有 BombAttack，冷却结束时在玩家周围投掷 count 枚炸弹
 * 2. Bomb 实体计时到 fuseTime 后：销毁 Bomb、生成 Explosion 实体
 * 3. Explosion 实体第一帧对范围内所有敌人造成伤害 + 向外击退；lifeTime 到期后销毁
 */
export class BombSystem implements ISystem {

    private readonly EXPLOSION_KNOCKBACK = 400;

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver() || world.isPaused()) return;

        this.triggerBombs(dt, world);
        this.tickBombs(dt, world);
        this.resolveExplosions(dt, world);
    }

    /** 为持有 BombAttack 的玩家 tick 冷却，到时投掷 */
    private triggerBombs(dt: number, world: ECSWorld): void {
        const players = world.query(Transform, PlayerTag, BombAttack);
        for (const pid of players) {
            const atk = world.getComponent(pid, BombAttack)!;
            atk.timer += dt;
            if (atk.timer < atk.cooldown) continue;
            atk.timer = 0;

            const ptf = world.getComponent(pid, Transform)!;
            // 多枚炸弹均分角度投掷在玩家附近
            const step = (Math.PI * 2) / atk.count;
            const throwDist = atk.count > 1 ? 60 : 0;
            for (let i = 0; i < atk.count; i++) {
                const angle = i * step + Math.random() * 0.3;
                const ox = Math.cos(angle) * throwDist;
                const oy = Math.sin(angle) * throwDist;
                createBomb(world, ptf.x + ox, ptf.y + oy,
                    atk.fuseTime, atk.damage, atk.blastRadius);
            }
        }
    }

    /** tick 所有炸弹，引信到 -> 爆炸 */
    private tickBombs(dt: number, world: ECSWorld): void {
        const store = world.getStore(Bomb);
        if (!store) return;

        for (const [bid, bomb] of store) {
            bomb.timer += dt;

            if (bomb.timer >= bomb.fuseTime) {
                const tf = world.getComponent(bid, Transform)!;
                createExplosion(world, tf.x, tf.y, bomb.blastRadius, bomb.damage);
                world.destroyEntity(bid);
            }
        }
    }

    /** 处理 Explosion：第一帧范围伤害，到期销毁 */
    private resolveExplosions(dt: number, world: ECSWorld): void {
        const store = world.getStore(Explosion);
        if (!store) return;

        const enemies = world.query(Transform, EnemyTag, Health);

        for (const [exid, exp] of store) {
            exp.timer += dt;
            const extf = world.getComponent(exid, Transform);
            if (!extf) {
                world.destroyEntity(exid);
                continue;
            }

            // 首帧造成伤害
            if (!exp.dealtDamage) {
                exp.dealtDamage = true;
                const rSq = exp.radius * exp.radius;

                for (const eid of enemies) {
                    const hp = world.getComponent(eid, Health)!;
                    if (hp.hp <= 0) continue;

                    const etf = world.getComponent(eid, Transform)!;
                    const dx = etf.x - extf.x;
                    const dy = etf.y - extf.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq > rSq) continue;

                    hp.hp -= exp.damage;

                    // 向外强力击退
                    const dist = Math.sqrt(distSq) || 1;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const kb = world.getComponent(eid, Knockback);
                    if (kb) {
                        kb.vx += nx * this.EXPLOSION_KNOCKBACK;
                        kb.vy += ny * this.EXPLOSION_KNOCKBACK;
                    } else {
                        world.addComponent(eid, new Knockback(
                            nx * this.EXPLOSION_KNOCKBACK,
                            ny * this.EXPLOSION_KNOCKBACK,
                            7,
                        ));
                    }
                }
            }

            if (exp.timer >= exp.lifeTime) {
                world.destroyEntity(exid);
            }
        }
    }
}
