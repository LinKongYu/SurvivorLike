import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerInput, Level, Camp, ExpOrb, ExpReward,
} from '../Components';
import { LevelUpRequest } from '../SkillComponents';
import { pickRandomUpgrades } from '../UpgradePool';
import { createExpOrb } from '../EntityFactory';
import { GameConfig } from '../GameConfig';

/**
 * ExperienceSystem — 经验系统
 * Priority: 30
 *
 * 职责：
 * 1. 检测 hp ≤ 0 的敌人 → 生成经验球 → 销毁敌人
 * 2. 经验球收集（靠近玩家时）→ 加经验 → 升级判断
 * 3. 无敌帧计时器更新
 * 4. 升级触发（满血 + LevelUpRequest + 暂停）
 *
 * TODO: 敌人死亡检测后续应移到 DeathSystem（事件驱动）
 */
export class ExperienceSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver()) return;

        if (!world.isPaused()) {
            this.handleEnemyDeath(world);
        }
        this.updateInvincibility(dt, world);
        if (!world.isPaused()) {
            this.collectExpOrbs(dt, world);
        }
    }

    /** 检测 hp ≤ 0 的敌人，生成经验球并销毁 */
    private handleEnemyDeath(world: ECSWorld): void {
        const enemies = world.query(Transform, Health, Camp);
        for (const eid of enemies) {
            const camp = world.getComponent(eid, Camp)!;
            if (camp.faction !== 'enemy') continue;

            const hp = world.getComponent(eid, Health)!;
            if (hp.hp <= 0) {
                const tf = world.getComponent(eid, Transform)!;
                const reward = world.getComponent(eid, ExpReward);
                const expValue = reward ? reward.value : 5;
                createExpOrb(world, tf.x, tf.y, expValue);
                world.destroyEntity(eid);
            }
        }
    }

    /** 更新所有实体的无敌帧计时器 */
    private updateInvincibility(dt: number, world: ECSWorld): void {
        const store = world.getStore(Health);
        if (!store) return;
        for (const [_eid, hp] of store) {
            if (hp.invincibleTimer > 0) {
                hp.invincibleTimer -= dt;
            }
        }
    }

    /** 经验球收集 */
    private collectExpOrbs(dt: number, world: ECSWorld): void {
        const players = world.query(Transform, PlayerInput, Level);
        if (players.length === 0) return;

        const playerEid = players[0];
        const ptf = world.getComponent(playerEid, Transform)!;
        const level = world.getComponent(playerEid, Level)!;

        const collectDist = GameConfig.skills.expOrb.collectDistance;
        const growth = GameConfig.player.level.expGrowthFactor;

        const orbs = world.query(Transform, ExpOrb);
        for (const eid of orbs) {
            const orb = world.getComponent(eid, ExpOrb)!;
            const otf = world.getComponent(eid, Transform)!;

            const dx = ptf.x - otf.x;
            const dy = ptf.y - otf.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < collectDist * collectDist) {
                level.exp += orb.value;
                while (level.exp >= level.expToNext) {
                    level.level++;
                    level.exp -= level.expToNext;
                    level.expToNext = Math.floor(growth * level.level);
                    this.triggerLevelUp(world, playerEid);
                }
                world.destroyEntity(eid);
            }
        }
    }

    /** 升级触发 */
    private triggerLevelUp(world: ECSWorld, playerEid: number): void {
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
