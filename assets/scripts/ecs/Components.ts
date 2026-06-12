/**
 * Components - bitECS 0.4 style component stores.
 *
 * bitECS uses the component object itself as the query key. Data can live on
 * that object in any shape; this project uses SoA arrays for hot numeric data
 * and AoS arrays for Cocos objects or small structured records.
 */

import { Node } from 'cc';
import { clearSkillComponentData } from './SkillComponents';

export type RenderNode = Node | null;

// ─── 通用基础 ───

export const Transform = {
    x: [] as number[],
    y: [] as number[],
};

export const Velocity = {
    x: [] as number[],
    y: [] as number[],
};

export type CampData = 'player' | 'enemy';
export const Camp = {
    value: [] as CampData[],
};

export const Owner = {
    eid: [] as number[],
};

export type RenderData = {
    prefabName: string;
    rotation: number;
    width: number;
    height: number;
    node: RenderNode;
    created: boolean;
};
export const Render = [] as RenderData[];

// ─── 战斗 ───

export const Health = {
    hp: [] as number[],
    maxHp: [] as number[],
    invincibleTimer: [] as number[],
    invincibleTime: [] as number[],
};

export const DamageDealer = {
    damage: [] as number[],
    skillId: [] as string[],
};

export const Collider = {
    radius: [] as number[],
};

export const HitRecord = [] as Map<number, number>[];

export const Drag = {
    coefficient: [] as number[],
};

// ─── 生命周期 ───

export const Lifetime = {
    remaining: [] as number[],
};

// ─── 玩家 ───

export const PlayerInput = {
    moveX: [] as number[],
    moveY: [] as number[],
};

export const AutoAttack = {
    timer: [] as number[],
    cooldown: [] as number[],
    range: [] as number[],
    damage: [] as number[],
    bulletSpeed: [] as number[],
    count: [] as number[],
    spreadAngle: [] as number[],
};

export const Level = {
    level: [] as number[],
    exp: [] as number[],
    expToNext: [] as number[],
};

// ─── 敌人 ───

export const MoveToTarget = {
    targetEntityId: [] as number[],
    moveSpeed: [] as number[],
};

// ─── 技能/生成 ───

export const ExpOrb = {
    value: [] as number[],
    magnetRadius: [] as number[],
    magnetSpeed: [] as number[],
    floatTimer: [] as number[],
    baseY: [] as number[],
};

export const ExpReward = {
    value: [] as number[],
};

export const Spawner = {
    timer: [] as number[],
    difficultyTimer: [] as number[],
    interval: [] as number[],
    maxCount: [] as number[],
    difficulty: [] as number[],
    spawnRadius: [] as number[],
    minSpawnDistance: [] as number[],
    playerEntityId: [] as number[],
};

export const HitFlash = {
    color: [] as [number, number, number, number][],
    remaining: [] as number[],
    totalDuration: [] as number[],
};

const COMPONENTS_WITH_DATA = [
    Transform, Velocity, Camp, Owner, Render,
    Health, DamageDealer, Collider, HitRecord, Drag,
    Lifetime, PlayerInput, AutoAttack, Level,
    MoveToTarget, ExpOrb, ExpReward, Spawner, HitFlash,
];

function clearComponentData(eid: number, component: any): void {
    if (Array.isArray(component)) {
        delete component[eid];
        return;
    }

    for (const value of Object.values(component)) {
        if (Array.isArray(value)) delete value[eid];
    }
}

/** 清除实体在所有组件数据容器中的数据（removeEntity 前调用）。 */
export function clearEntityData(eid: number): void {
    for (const component of COMPONENTS_WITH_DATA) {
        clearComponentData(eid, component);
    }
    clearSkillComponentData(eid);
}
