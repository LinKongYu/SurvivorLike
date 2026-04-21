/**
 * 实体工厂 - 创建预配置的实体
 * 新增英雄/怪物类型只需添加新工厂函数
 *
 * 所有数值默认来自 GameConfig（CSV 配置表）；外观（Sprite/图片/颜色）
 * 由用户在编辑器里的预制体中配置。
 */

import { ECSWorld } from './World';
import {
    Transform, Render, Health, PlayerTag, PlayerInput,
    AutoAttack, Level, EnemyTag, ChaseTarget,
    BulletComp, ExpOrbComp, SpawnerComp, Collider,
} from './Components';
import {
    BladeHitbox, OrbitingSword, Bomb, Explosion,
} from './SkillComponents';
import { GameConfig } from './GameConfig';

export function createPlayer(world: ECSWorld, x: number, y: number): number {
    const cfg = GameConfig.player;
    const atk = cfg.initialAttack;

    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Player'));
    world.addComponent(eid, new Health(cfg.hp, cfg.hp, cfg.invincibleTime));
    world.addComponent(eid, new PlayerTag(cfg.moveSpeed));
    world.addComponent(eid, new PlayerInput());
    world.addComponent(eid, new AutoAttack(
        atk.cooldown, atk.range, atk.damage, atk.bulletSpeed,
        atk.count, atk.spreadAngle,
    ));
    world.addComponent(eid, new Level(1, 0, cfg.level.initialExpToNext));
    return eid;
}

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
    world.addComponent(eid, new EnemyTag(
        Math.floor(cfg.baseDamage * dmgMul),
        cfg.baseExpReward + step * cfg.expBonusPerLevel,
        cfg.baseMoveSpeed * spdMul,
    ));
    world.addComponent(eid, new ChaseTarget(playerEid));
    world.addComponent(eid, new Collider(cfg.colliderRadius));
    return eid;
}

export function createBullet(
    world: ECSWorld,
    x: number, y: number,
    dirX: number, dirY: number,
    damage: number, speed: number = 500,
): number {
    const bulletCfg = GameConfig.skills.bullet;
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Bullet'));
    world.addComponent(eid, new BulletComp(damage, bulletCfg.lifeTime, dirX, dirY, speed));
    return eid;
}

export function createExpOrb(world: ECSWorld, x: number, y: number, value: number): number {
    const orbCfg = GameConfig.skills.expOrb;
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('ExpOrb'));
    const orb = world.addComponent(eid, new ExpOrbComp(
        value, orbCfg.attractRange, orbCfg.attractSpeed,
    ));
    orb.baseY = y;
    return eid;
}

export function createSpawner(world: ECSWorld, playerEid: number): number {
    const cfg = GameConfig.spawner;
    const eid = world.createEntity();
    world.addComponent(eid, new SpawnerComp(
        cfg.initialInterval, cfg.initialMaxCount, 1,
        cfg.spawnRadius, cfg.minSpawnDistance, playerEid,
    ));
    return eid;
}

// ─── 技能效果实体工厂 ───

/**
 * 创建刀的扇形伤害区实体。
 * 尺寸由 range 动态决定，覆盖预制体的默认 contentSize。
 *
 * @param facingAngle 朝向角度（弧度，0 为向右）
 */
export function createBladeHitbox(
    world: ECSWorld,
    x: number, y: number,
    facingAngle: number,
    range: number, arc: number,
    damage: number,
): number {
    const lifeTime = GameConfig.skills.blade.lifeTime;
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    // range 是半径，渲染节点用直径作为 contentSize
    // 预制体应设计为以左边缘为锚点（anchorX=0）的扇形，默认尺寸 100×100
    world.addComponent(eid, new Render(
        'BladeHitbox',
        facingAngle * 180 / Math.PI,
        range * 2, range * 2,
    ));
    world.addComponent(eid, new BladeHitbox(lifeTime, damage, range, facingAngle, arc));
    return eid;
}

/**
 * 创建单个环绕飞剑实体。
 * 位置由 OrbitSystem 每帧根据 ownerEid + angle + orbitRadius 更新。
 */
export function createOrbitingSword(
    world: ECSWorld,
    ownerEid: number,
    initialAngle: number,
    angularSpeed: number,
    orbitRadius: number,
    damage: number,
): number {
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(0, 0));
    world.addComponent(eid, new Render('OrbitingSword'));
    world.addComponent(eid, new OrbitingSword(
        ownerEid, initialAngle, angularSpeed, orbitRadius, damage,
    ));
    return eid;
}

/** 创建落地炸弹实体（计时后爆炸） */
export function createBomb(
    world: ECSWorld, x: number, y: number,
    fuseTime: number, damage: number, blastRadius: number,
): number {
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Bomb'));
    world.addComponent(eid, new Bomb(fuseTime, damage, blastRadius));
    return eid;
}

/**
 * 创建爆炸伤害圈实体（即刻生效，短暂存在）
 * 尺寸由 radius 动态决定，覆盖预制体的默认 contentSize。
 */
export function createExplosion(
    world: ECSWorld, x: number, y: number,
    radius: number, damage: number,
): number {
    const lifeTime = GameConfig.skills.bomb.explosion.lifeTime;
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Explosion', 0, radius * 2, radius * 2));
    world.addComponent(eid, new Explosion(lifeTime, damage, radius));
    return eid;
}
