/**
 * EntityFactory — 使用 bitEcs 创建预设实体
 */

import { addEntity } from '../bitEcs';
import {
    Transform, Velocity, Camp, PlayerInput, AutoAttack, Level,
    Health, DamageDealer, MoveToTarget, Collider, ExpReward, Spawner,
    Render, makeRender,
} from './Components';
import { GameConfig } from './GameConfig';
import { SkillId } from './Skills';
import { GameWorld } from './World';

export function createPlayer(world: GameWorld, x: number, y: number): number {
    const cfg = GameConfig.player;
    const atk = cfg.initialAttack;
    const eid = addEntity(world, Transform, Velocity, Camp, PlayerInput, AutoAttack, Level, Health, Render);
    Transform.x[eid] = x;
    Transform.y[eid] = y;
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;
    Camp.value[eid] = 'player';
    PlayerInput.moveX[eid] = 0;
    PlayerInput.moveY[eid] = 0;
    AutoAttack.timer[eid] = 0;
    AutoAttack.cooldown[eid] = atk.cooldown;
    AutoAttack.range[eid] = atk.range;
    AutoAttack.damage[eid] = atk.damage;
    AutoAttack.bulletSpeed[eid] = atk.bulletSpeed;
    AutoAttack.count[eid] = atk.count;
    AutoAttack.spreadAngle[eid] = atk.spreadAngle;
    Level.level[eid] = 1;
    Level.exp[eid] = 0;
    Level.expToNext[eid] = cfg.level.initialExpToNext;
    Health.hp[eid] = cfg.hp;
    Health.maxHp[eid] = cfg.hp;
    Health.invincibleTimer[eid] = 0;
    Health.invincibleTime[eid] = cfg.invincibleTime;
    Render[eid] = makeRender('Player');
    return eid;
}

export function createEnemy(world: GameWorld, x: number, y: number, playerEid: number, difficulty: number): number {
    const cfg = GameConfig.enemyDefault;
    const step = difficulty - 1;
    const hpMul = 1 + step * cfg.hpScalePerLevel;
    const dmgMul = 1 + step * cfg.damageScalePerLevel;
    const speedMul = 1 + step * cfg.speedScalePerLevel;
    const hp = Math.floor(cfg.baseHp * hpMul);

    const eid = addEntity(world, Transform, Velocity, Camp, Health, DamageDealer, MoveToTarget, Collider, ExpReward, Render);
    Transform.x[eid] = x;
    Transform.y[eid] = y;
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;
    Camp.value[eid] = 'enemy';
    Health.hp[eid] = hp;
    Health.maxHp[eid] = hp;
    Health.invincibleTimer[eid] = 0;
    Health.invincibleTime[eid] = 0;
    DamageDealer.damage[eid] = Math.floor(cfg.baseDamage * dmgMul);
    DamageDealer.skillId[eid] = SkillId.EnemyContact;
    MoveToTarget.targetEntityId[eid] = playerEid;
    MoveToTarget.moveSpeed[eid] = cfg.baseMoveSpeed * speedMul;
    Collider.radius[eid] = cfg.colliderRadius;
    ExpReward.value[eid] = cfg.baseExpReward + step * cfg.expBonusPerLevel;
    Render[eid] = makeRender('Enemy');
    return eid;
}

export function createSpawner(world: GameWorld, playerEid: number): number {
    const cfg = GameConfig.spawner;
    const eid = addEntity(world, Spawner);
    Spawner.timer[eid] = 0;
    Spawner.difficultyTimer[eid] = 0;
    Spawner.interval[eid] = cfg.initialInterval;
    Spawner.maxCount[eid] = cfg.initialMaxCount;
    Spawner.difficulty[eid] = 1;
    Spawner.spawnRadius[eid] = cfg.spawnRadius;
    Spawner.minSpawnDistance[eid] = cfg.minSpawnDistance;
    Spawner.playerEntityId[eid] = playerEid;
    return eid;
}
