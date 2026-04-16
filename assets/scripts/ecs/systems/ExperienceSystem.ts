import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerTag, AutoAttack, Level,
    EnemyTag, ExpOrbComp,
} from '../Components';
import { createExpOrb } from '../EntityFactory';

/**
 * ExperienceSystem - 敌人死亡掉落经验球 + 经验球吸引/收集 + 升级
 * Priority: 30
 */
export class ExperienceSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        this.handleEnemyDeath(world);
        this.updateInvincibility(dt, world);
        this.attractAndCollectOrbs(dt, world);
    }

    /** 检测死亡敌人，生成经验球并销毁 */
    private handleEnemyDeath(world: ECSWorld): void {
        const enemies = world.query(Transform, EnemyTag, Health);
        for (const eid of enemies) {
            const hp = world.getComponent(eid, Health)!;
            if (hp.hp <= 0) {
                const tf = world.getComponent(eid, Transform)!;
                const enemy = world.getComponent(eid, EnemyTag)!;
                createExpOrb(world, tf.x, tf.y, enemy.expReward);
                world.destroyEntity(eid);
            }
        }
    }

    /** 更新无敌帧计时器 */
    private updateInvincibility(dt: number, world: ECSWorld): void {
        const store = world.getStore(Health);
        if (!store) return;
        for (const [_eid, hp] of store) {
            if (hp.invincibleTimer > 0) {
                hp.invincibleTimer -= dt;
            }
        }
    }

    /** 经验球吸引 + 收集 + 加经验 + 升级 */
    private attractAndCollectOrbs(dt: number, world: ECSWorld): void {
        const player = world.getSingleton(PlayerTag);
        if (!player) return;

        const ptf = world.getComponent(player.eid, Transform);
        if (!ptf) return;

        const orbStore = world.getStore(ExpOrbComp);
        if (!orbStore) return;

        const level = world.getComponent(player.eid, Level);
        const hp = world.getComponent(player.eid, Health);
        const atk = world.getComponent(player.eid, AutoAttack);
        const pTag = player.comp;

        for (const [eid, orb] of orbStore) {
            const otf = world.getComponent(eid, Transform);
            if (!otf) continue;

            const dx = ptf.x - otf.x;
            const dy = ptf.y - otf.y;
            const distSq = dx * dx + dy * dy;

            // 吸引检测
            if (!orb.attracted && distSq < orb.attractRange * orb.attractRange) {
                orb.attracted = true;
            }

            // 飞向玩家
            if (orb.attracted) {
                const dist = Math.sqrt(distSq);
                if (dist < 20) {
                    // 收集
                    if (level) {
                        level.exp += orb.value;
                        // 升级循环
                        while (level.exp >= level.expToNext) {
                            level.level++;
                            level.exp -= level.expToNext;
                            level.expToNext = Math.floor(10 * level.level);
                            // 升级奖励
                            if (hp) {
                                hp.maxHp += 10;
                                hp.hp = hp.maxHp;
                            }
                            if (atk) {
                                atk.damage += 5;
                            }
                            pTag.moveSpeed += 5;
                        }
                    }
                    world.destroyEntity(eid);
                } else if (dist > 0) {
                    otf.x += (dx / dist) * orb.attractSpeed * dt;
                    otf.y += (dy / dist) * orb.attractSpeed * dt;
                }
            }
        }
    }
}
