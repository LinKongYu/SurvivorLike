/**
 * 实体工厂 - 创建预配置的实体
 * 新增英雄/怪物类型只需添加新工厂函数
 *
 * 所有可视实体都通过 Render 组件引用 PrefabPool 中的预制体名称；
 * 外观（Sprite/图片/颜色）由用户在编辑器里的预制体中配置。
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

export function createPlayer(world: ECSWorld, x: number, y: number): number {
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Player'));
    world.addComponent(eid, new Health(100, 100, 0.5));
    world.addComponent(eid, new PlayerTag(200));
    world.addComponent(eid, new PlayerInput());
    world.addComponent(eid, new AutoAttack(0.5, 400, 20, 500));
    world.addComponent(eid, new Level(1, 0, 10));
    return eid;
}

export function createEnemy(
    world: ECSWorld, x: number, y: number,
    playerEid: number, difficulty: number,
): number {
    const hpMul = 1 + (difficulty - 1) * 0.2;
    const dmgMul = 1 + (difficulty - 1) * 0.1;
    const spdMul = 1 + (difficulty - 1) * 0.05;

    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Enemy'));
    world.addComponent(eid, new Health(Math.floor(40 * hpMul), Math.floor(40 * hpMul)));
    world.addComponent(eid, new EnemyTag(
        Math.floor(10 * dmgMul),
        5 + difficulty,
        80 * spdMul,
    ));
    world.addComponent(eid, new ChaseTarget(playerEid));
    world.addComponent(eid, new Collider(18));
    return eid;
}

export function createBullet(
    world: ECSWorld,
    x: number, y: number,
    dirX: number, dirY: number,
    damage: number, speed: number = 500,
): number {
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Bullet'));
    world.addComponent(eid, new BulletComp(damage, 1.5, dirX, dirY, speed));
    return eid;
}

export function createExpOrb(world: ECSWorld, x: number, y: number, value: number): number {
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('ExpOrb'));
    const orb = world.addComponent(eid, new ExpOrbComp(value));
    orb.baseY = y;
    return eid;
}

export function createSpawner(world: ECSWorld, playerEid: number): number {
    const eid = world.createEntity();
    world.addComponent(eid, new SpawnerComp(2.0, 20, 1, 500, 300, playerEid));
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
    damage: number, lifeTime: number = 0.25,
): number {
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
    radius: number, damage: number, lifeTime: number = 0.35,
): number {
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render('Explosion', 0, radius * 2, radius * 2));
    world.addComponent(eid, new Explosion(lifeTime, damage, radius));
    return eid;
}
