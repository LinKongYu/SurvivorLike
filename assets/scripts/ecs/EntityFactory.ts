/**
 * 实体工厂 — 创建预配置的实体
 *
 * 使用新组件体系：
 * - Camp 替代 PlayerTag / EnemyTag
 * - Velocity + Drag 替代 Knockback
 * - DamageDealer + Owner + HitRecord + Collider + Lifetime 作为通用伤害实体
 */

import { ECSWorld } from './World';
import {
    Transform, Render, Health, Camp, PlayerInput,
    AutoAttack, Level, MoveToTarget, Velocity, Lifetime,
    Collider, DamageDealer, Owner, HitRecord, ExpOrb, Spawner,
} from './Components';
import { BladeMarker, OrbitingSword, BombMarker, ExplosionMarker } from './SkillComponents';
import { GameConfig } from './GameConfig';

/** 创建玩家实体 */
export function createPlayer(world: ECSWorld, x: number, y: number): number {
    const cfg = GameConfig.player;
    const atk = cfg.initialAttack;

    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Player'));
    world.addComponent(eid, new Health(cfg.hp, cfg.hp, cfg.invincibleTime));
    world.addComponent(eid, new Camp('player'));
    world.addComponent(eid, new PlayerInput());
    world.addComponent(eid, new Velocity());
    world.addComponent(eid, new AutoAttack(
        atk.cooldown, atk.range, atk.damage, atk.bulletSpeed,
        atk.count, atk.spreadAngle,
    ));
    world.addComponent(eid, new Level(1, 0, cfg.level.initialExpToNext));
    return eid;
}

/** 创建敌人实体 */
export function createEnemy(
    world: ECSWorld, x: number, y: number,
    playerEid: number, difficulty: number,
): number {
    const cfg = GameConfig.enemyDefault;
    const step = difficulty - 1;
    const hpMul = 1 + step * cfg.hpScalePerLevel;
    const dmgMul = 1 + step * cfg.damageScalePerLevel;
    const spdMul = 1 + step * cfg.speedScalePerLevel;
    const hp = Math.floor(cfg.baseHp * hpMul);

    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Enemy'));
    world.addComponent(eid, new Health(hp, hp));
    world.addComponent(eid, new Camp('enemy'));
    world.addComponent(eid, new DamageDealer(
        Math.floor(cfg.baseDamage * dmgMul),
        'enemy_contact',
    ));
    // 敌人经验值暂存在实体上，后续可用 ExpReward 组件
    world.addComponent(eid, new MoveToTarget(playerEid));
    world.addComponent(eid, new Collider(cfg.colliderRadius));
    world.addComponent(eid, new Velocity());
    world.addComponent(eid, new Level(1, 0, cfg.baseExpReward));
    return eid;
}

/** 创建子弹实体 */
export function createBullet(
    world: ECSWorld,
    x: number, y: number,
    dirX: number, dirY: number,
    damage: number, speed: number = 500,
    ownerEid: number = -1,
): number {
    const bulletCfg = GameConfig.skills.bullet;
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Bullet'));
    world.addComponent(eid, new Velocity(dirX * speed, dirY * speed));
    world.addComponent(eid, new DamageDealer(damage, 'bullet'));
    world.addComponent(eid, new Owner(ownerEid));
    world.addComponent(eid, new Collider(bulletCfg.hitRadius));
    world.addComponent(eid, new Lifetime(bulletCfg.lifeTime));
    world.addComponent(eid, new HitRecord());
    return eid;
}

/** 创建经验球实体 */
export function createExpOrb(world: ECSWorld, x: number, y: number, value: number): number {
    const orbCfg = GameConfig.skills.expOrb;
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('ExpOrb'));
    const orb = world.addComponent(eid, new ExpOrb(value, orbCfg.attractRange, orbCfg.attractSpeed));
    orb.baseY = y;
    world.addComponent(eid, new Velocity());
    return eid;
}

/** 创建敌人生成器 */
export function createSpawner(world: ECSWorld, playerEid: number): number {
    const cfg = GameConfig.spawner;
    const eid = world.createEntity();
    world.addComponent(eid, new Spawner(
        cfg.initialInterval, cfg.initialMaxCount, 1,
        cfg.spawnRadius, cfg.minSpawnDistance, playerEid,
    ));
    return eid;
}
