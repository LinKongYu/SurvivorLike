/**
 * EntityFactory — 使用 bitEcs 创建预设实体
 */

import { addEntity } from '../bitEcs';
import {
    Transform, Velocity, Camp, PlayerInput, AutoAttack, Level,
    Health, DamageDealer, MoveToTarget, Collider, ExpReward, Spawner,
    Render,
    positionStore, velocityStore, campStore, playerInputStore,
    autoAttackStore, levelStore, healthStore, damageDealerStore,
    moveToTargetStore, colliderStore, expRewardStore, spawnerStore,
    renderStore,
} from './Components';
import { GameConfig } from './GameConfig';

export function createPlayer(world: any, x: number, y: number): number {
    const cfg = GameConfig.player;
    const atk = cfg.initialAttack;
    const eid = addEntity(world, Transform, Velocity, Camp, PlayerInput, AutoAttack, Level, Health, Render);
    positionStore.set(eid, { x, y });
    velocityStore.set(eid, { x: 0, y: 0 });
    campStore.set(eid, 'player');
    playerInputStore.set(eid, { moveX: 0, moveY: 0 });
    autoAttackStore.set(eid, { timer: 0, cooldown: atk.cooldown, range: atk.range, damage: atk.damage, bulletSpeed: atk.bulletSpeed, count: atk.count, spreadAngle: atk.spreadAngle });
    levelStore.set(eid, { level: 1, exp: 0, expToNext: cfg.level.initialExpToNext });
    healthStore.set(eid, { hp: cfg.hp, maxHp: cfg.hp, invincibleTimer: 0, invincibleTime: cfg.invincibleTime });
    renderStore.set(eid, { prefabName: 'Player', rotation: 0, width: 0, height: 0, node: null, created: false });
    return eid;
}

export function createEnemy(world: any, x: number, y: number, playerEid: number, difficulty: number): number {
    const cfg = GameConfig.enemyDefault;
    const step = difficulty - 1;
    const hpMul = 1 + step * cfg.hpScalePerLevel;
    const dmgMul = 1 + step * cfg.damageScalePerLevel;
    const speedMul = 1 + step * cfg.speedScalePerLevel;
    const hp = Math.floor(cfg.baseHp * hpMul);

    const eid = addEntity(world, Transform, Velocity, Camp, Health, DamageDealer, MoveToTarget, Collider, ExpReward, Render);
    positionStore.set(eid, { x, y });
    velocityStore.set(eid, { x: 0, y: 0 });
    campStore.set(eid, 'enemy');
    healthStore.set(eid, { hp, maxHp: hp, invincibleTimer: 0, invincibleTime: 0 });
    damageDealerStore.set(eid, { damage: Math.floor(cfg.baseDamage * dmgMul), skillId: 'enemy_contact' });
    moveToTargetStore.set(eid, { targetEntityId: playerEid, moveSpeed: cfg.baseMoveSpeed * speedMul });
    colliderStore.set(eid, { radius: cfg.colliderRadius });
    expRewardStore.set(eid, cfg.baseExpReward + step * cfg.expBonusPerLevel);
    renderStore.set(eid, { prefabName: 'Enemy', rotation: 0, width: 0, height: 0, node: null, created: false });
    return eid;
}

export function createSpawner(world: any, playerEid: number): number {
    const cfg = GameConfig.spawner;
    const eid = addEntity(world, Spawner);
    spawnerStore.set(eid, { timer: 0, difficultyTimer: 0, interval: cfg.initialInterval, maxCount: cfg.initialMaxCount, difficulty: 1, spawnRadius: cfg.spawnRadius, minSpawnDistance: cfg.minSpawnDistance, playerEntityId: playerEid });
    return eid;
}
