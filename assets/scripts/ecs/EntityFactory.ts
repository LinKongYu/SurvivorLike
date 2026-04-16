/**
 * 实体工厂 - 创建预配置的实体
 * 新增英雄/怪物类型只需添加新工厂函数
 */

import { Color } from 'cc';
import { ECSWorld } from './World';
import {
    Transform, Render, Health, PlayerTag, PlayerInput,
    AutoAttack, Level, EnemyTag, ChaseTarget,
    BulletComp, ExpOrbComp, SpawnerComp,
} from './Components';

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
