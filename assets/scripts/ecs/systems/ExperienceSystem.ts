import { query, addEntity, addComponent, removeEntity, entityExists } from '../../bitEcs';
import {
    Transform, Velocity, Health, PlayerInput, Camp, Level, ExpOrb, ExpReward,
    positionStore, healthStore, campStore, levelStore, expOrbStore, expRewardStore, clearEntityData,
} from '../Components';
import { LevelUpRequest, levelUpRequestStore } from '../SkillComponents';
import { Render, renderStore, velocityStore } from '../Components';
import { pickRandomUpgrades } from '../UpgradePool';
import { GameConfig } from '../GameConfig';

/**
 * ExperienceSystem — 经验系统
 * Priority: 30
 */
export class ExperienceSystem {
    update(dt: number, world: any): void {
        this.handleEnemyDeath(world);
        this.updateInvincibility(dt, world);
        this.collectExpOrbs(dt, world);
    }

    private handleEnemyDeath(world: any): void {
        for (const eid of query(world, [Transform, Health, Camp])) {
            if (campStore.get(eid) !== 'enemy') continue;
            const hp = healthStore.get(eid)!;
            if (hp.hp <= 0) {
                const tf = positionStore.get(eid)!;
                const reward = expRewardStore.get(eid);
                const value = reward ?? 5;

                const orb = addEntity(world, Transform, Velocity, ExpOrb, Render);
                positionStore.set(orb, { x: tf.x, y: tf.y });
                velocityStore.set(orb, { x: 0, y: 0 });
                const cfg = GameConfig.skills.expOrb;
                expOrbStore.set(orb, {
                    value, magnetRadius: cfg.attractRange, magnetSpeed: cfg.attractSpeed,
                    floatTimer: Math.random() * Math.PI * 2, baseY: tf.y,
                });
                renderStore.set(orb, { prefabName: 'ExpOrb', rotation: 0, width: 0, height: 0, node: null, created: false });

                if (entityExists(world, eid)) { clearEntityData(eid); removeEntity(world, eid); }
            }
        }
    }

    private updateInvincibility(dt: number, _world: any): void {
        for (const [eid, hp] of healthStore) {
            if (hp.invincibleTimer > 0) hp.invincibleTimer -= dt;
        }
    }

    private collectExpOrbs(dt: number, world: any): void {
        const players = query(world, [Transform, PlayerInput, Level]);
        if (players.length === 0) return;
        const playerEid = players[0];
        const ptf = positionStore.get(playerEid)!;
        const level = levelStore.get(playerEid)!;
        const collectDist = GameConfig.skills.expOrb.collectDistance;
        const growth = GameConfig.player.level.expGrowthFactor;

        for (const eid of query(world, [Transform, ExpOrb])) {
            const orb = expOrbStore.get(eid)!;
            const otf = positionStore.get(eid)!;
            const dx = ptf.x - otf.x;
            const dy = ptf.y - otf.y;
            if (dx * dx + dy * dy < collectDist * collectDist) {
                level.exp += orb.value;
                while (level.exp >= level.expToNext) {
                    level.level++;
                    level.exp -= level.expToNext;
                    level.expToNext = Math.floor(growth * level.level);
                    this.triggerLevelUp(world, playerEid);
                }
                if (entityExists(world, eid)) { clearEntityData(eid); removeEntity(world, eid); }
            }
        }
    }

    private triggerLevelUp(world: any, playerEid: number): void {
        const hp = healthStore.get(playerEid);
        if (hp) hp.hp = hp.maxHp;

        const existing = levelUpRequestStore.get(playerEid);
        if (existing) {
            existing.pendingCount += 1;
            return;
        }

        const req = { currentChoices: pickRandomUpgrades(world, playerEid, 3).map(u => u.id), pendingCount: 1 };
        // Add LevelUpRequest as component tag
        addComponent(world, playerEid, LevelUpRequest);
        levelUpRequestStore.set(playerEid, req);
        (world as any).paused = true;
    }
}
