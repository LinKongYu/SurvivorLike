import { query, addEntity, addComponent, removeEntity, entityExists } from '../../bitEcs';
import {
    Transform, Velocity, Health, Camp, Level, ExpOrb, ExpReward,
    clearEntityData,
} from '../Components';
import { System } from '../System';
import { GameWorld } from '../World';
import { LevelUpRequest } from '../SkillComponents';
import { Render } from '../Components';
import { pickRandomUpgrades } from '../UpgradePool';
import { GameConfig } from '../GameConfig';

/**
 * ExperienceSystem — 经验系统
 * Priority: 30
 */
export class ExperienceSystem implements System {
    readonly priority = 30;

    update(dt: number, world: GameWorld): void {
        this.handleEnemyDeath(world);
        this.updateInvincibility(dt, world);
        this.collectExpOrbs(dt, world);
    }

    private handleEnemyDeath(world: GameWorld): void {
        for (const eid of query(world, [Transform, Health, Camp])) {
            if (Camp.value[eid] !== 'enemy') continue;
            if (Health.hp[eid] <= 0) {
                const value = ExpReward.value[eid] ?? 5;

                const orb = addEntity(world, Transform, Velocity, ExpOrb, Render);
                Transform.x[orb] = Transform.x[eid];
                Transform.y[orb] = Transform.y[eid];
                Velocity.x[orb] = 0;
                Velocity.y[orb] = 0;
                const cfg = GameConfig.skills.expOrb;
                ExpOrb.value[orb] = value;
                ExpOrb.magnetRadius[orb] = cfg.attractRange;
                ExpOrb.magnetSpeed[orb] = cfg.attractSpeed;
                ExpOrb.floatTimer[orb] = Math.random() * Math.PI * 2;
                ExpOrb.baseY[orb] = Transform.y[eid];
                Render[orb] = { prefabName: 'ExpOrb', rotation: 0, width: 0, height: 0, node: null, created: false };

                if (entityExists(world, eid)) { clearEntityData(eid); removeEntity(world, eid); }
            }
        }
    }

    private updateInvincibility(dt: number, world: GameWorld): void {
        for (const eid of query(world, [Health])) {
            if (Health.invincibleTimer[eid] > 0) Health.invincibleTimer[eid] -= dt;
        }
    }

    private collectExpOrbs(dt: number, world: GameWorld): void {
        const playerEid = world.playerEid;
        if (playerEid < 0 || !entityExists(world, playerEid)) return;
        const collectDist = GameConfig.skills.expOrb.collectDistance;
        const growth = GameConfig.player.level.expGrowthFactor;

        for (const eid of query(world, [Transform, ExpOrb])) {
            const dx = Transform.x[playerEid] - Transform.x[eid];
            const dy = Transform.y[playerEid] - Transform.y[eid];
            if (dx * dx + dy * dy < collectDist * collectDist) {
                Level.exp[playerEid] += ExpOrb.value[eid];
                while (Level.exp[playerEid] >= Level.expToNext[playerEid]) {
                    Level.level[playerEid]++;
                    Level.exp[playerEid] -= Level.expToNext[playerEid];
                    // 至少为 1，避免配置异常(growth=0)时 expToNext=0 造成 while 死循环
                    Level.expToNext[playerEid] = Math.max(1, Math.floor(growth * Level.level[playerEid]));
                    this.triggerLevelUp(world, playerEid);
                }
                if (entityExists(world, eid)) { clearEntityData(eid); removeEntity(world, eid); }
            }
        }
    }

    private triggerLevelUp(world: GameWorld, playerEid: number): void {
        Health.hp[playerEid] = Health.maxHp[playerEid];

        const existing = LevelUpRequest[playerEid];
        if (existing) {
            existing.pendingCount += 1;
            return;
        }

        const currentChoices = pickRandomUpgrades(world, playerEid, 3).map(u => u.id);
        if (currentChoices.length === 0) return;

        const req = { currentChoices, pendingCount: 1 };
        // Add LevelUpRequest as component tag
        addComponent(world, playerEid, LevelUpRequest);
        LevelUpRequest[playerEid] = req;
        world.paused = true;
    }
}
