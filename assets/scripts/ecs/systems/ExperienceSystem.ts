import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerTag, Level, EnemyTag, ExpOrbComp,
} from '../Components';
import { LevelUpRequest } from '../SkillComponents';
import { pickRandomUpgrades } from '../UpgradePool';
import { createExpOrb } from '../EntityFactory';
import { GameConfig } from '../GameConfig';

/**
 * ExperienceSystem - 敌人死亡掉落经验球 + 经验球吸引/收集 + 升级触发
 * Priority: 30
 *
 * 升级流程改造：
 * 不再自动应用血量/伤害成长，而是升级时：
 * 1. 玩家血量回满（保留这个基本反馈）
 * 2. 挂上 LevelUpRequest 组件 + 暂停世界
 * 3. UISystem 检测到 LevelUpRequest 显示三选一卡片，应用升级后解除暂停
 *
 * 若升级期间再次升级（多个经验球同帧拾取），pendingCount 递增排队。
 */
export class ExperienceSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        // 即使暂停也要处理死亡敌人生成经验球？否则暂停期间世界"卡住"。
        // 但 CombatSystem 暂停时不扣血，所以 hp 不会新降到 0。
        // 安全起见：暂停时只跳过吸引/收集逻辑，其他例行清理仍执行。
        if (world.isGameOver()) return;

        if (!world.isPaused()) {
            this.handleEnemyDeath(world);
        }
        this.updateInvincibility(dt, world);
        if (!world.isPaused()) {
            this.attractAndCollectOrbs(dt, world);
        }
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
        const collectDist = GameConfig.skills.expOrb.collectDistance;
        const growth = GameConfig.player.level.expGrowthFactor;

        for (const [eid, orb] of orbStore) {
            const otf = world.getComponent(eid, Transform);
            if (!otf) continue;

            const dx = ptf.x - otf.x;
            const dy = ptf.y - otf.y;
            const distSq = dx * dx + dy * dy;

            if (!orb.attracted && distSq < orb.attractRange * orb.attractRange) {
                orb.attracted = true;
            }

            if (orb.attracted) {
                const dist = Math.sqrt(distSq);
                if (dist < collectDist) {
                    // 收集
                    if (level) {
                        level.exp += orb.value;
                        // 处理可能的连续升级
                        while (level.exp >= level.expToNext) {
                            level.level++;
                            level.exp -= level.expToNext;
                            level.expToNext = Math.floor(growth * level.level);
                            this.triggerLevelUp(world, player.eid);
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

    /**
     * 升级触发：
     * 1. 玩家血量回满
     * 2. 若已有 LevelUpRequest：pendingCount+1（排队）
     * 3. 否则：新建 LevelUpRequest，抽 3 个升级，暂停世界
     */
    private triggerLevelUp(world: ECSWorld, playerEid: number): void {
        // 回满血
        const hp = world.getComponent(playerEid, Health);
        if (hp) hp.hp = hp.maxHp;

        const existing = world.getComponent(playerEid, LevelUpRequest);
        if (existing) {
            existing.pendingCount += 1;
            return;
        }

        const req = new LevelUpRequest();
        req.pendingCount = 1;
        req.currentChoices = pickRandomUpgrades(world, playerEid, 3).map(u => u.id);
        world.addComponent(playerEid, req);
        world.setPaused(true);
    }
}
