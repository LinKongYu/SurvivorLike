/**
 * 实体工厂 - 创建预配置的实体
 * 新增英雄/怪物类型只需添加新工厂函数
 */

import { Color } from 'cc';
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
    world.addComponent(eid, new Render(40, 40, new Color(50, 180, 50, 255), 'rect'));
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
    world.addComponent(eid, new Render(40, 40, new Color(220, 50, 50, 255), 'rect'));
    world.addComponent(eid, new Health(Math.floor(40 * hpMul), Math.floor(40 * hpMul)));
    world.addComponent(eid, new EnemyTag(
        Math.floor(10 * dmgMul),
        5 + difficulty,
        80 * spdMul,
    ));
    world.addComponent(eid, new ChaseTarget(playerEid));
    // 碰撞半径略小于 Render 半宽，让视觉上可以有少量重叠，避免贴身时僵硬
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
    world.addComponent(eid, new Render(10, 10, new Color(255, 220, 50, 255), 'circle'));
    world.addComponent(eid, new BulletComp(damage, 1.5, dirX, dirY, speed));
    return eid;
}

export function createExpOrb(world: ECSWorld, x: number, y: number, value: number): number {
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render(14, 14, new Color(80, 150, 255, 255), 'circle'));
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
 * 通过 Render 的 sector 形状 + rotation 实现可视化。
 *
 * @param facingAngle 朝向角度（弧度），0 为向右
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
    // 扇形半透明白色，旋转到目标角度（弧度转度）
    const render = new Render(
        range * 2, range * 2,
        new Color(255, 255, 255, 140),
        'sector',
        facingAngle * 180 / Math.PI,
        arc,
    );
    world.addComponent(eid, render);
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
    // 初始位置会被 OrbitSystem 立即覆盖，先填 0,0
    world.addComponent(eid, new Transform(0, 0));
    world.addComponent(eid, new Render(16, 16, new Color(200, 230, 255, 255), 'circle'));
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
    world.addComponent(eid, new Render(24, 24, new Color(60, 60, 60, 255), 'circle'));
    world.addComponent(eid, new Bomb(fuseTime, damage, blastRadius));
    return eid;
}

/** 创建爆炸伤害圈实体（即刻生效，短暂存在） */
export function createExplosion(
    world: ECSWorld, x: number, y: number,
    radius: number, damage: number, lifeTime: number = 0.35,
): number {
    const eid = world.createEntity();
    world.addComponent(eid, new Transform(x, y));
    world.addComponent(eid, new Render(radius * 2, radius * 2, new Color(255, 130, 30, 180), 'circle'));
    world.addComponent(eid, new Explosion(lifeTime, damage, radius));
    return eid;
}
