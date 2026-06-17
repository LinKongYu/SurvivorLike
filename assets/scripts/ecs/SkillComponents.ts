/**
 * Skill components - attack trigger data and spawned skill effect data.
 *
 * 与 Components.ts 一样，每个存数据的组件用 registerData(...) 登记到
 * ComponentRegistry，统一由 clearEntityData / destroyEntity 清理。
 */

import { registerData } from './ComponentRegistry';

// ─── 攻击触发（挂在玩家身上） ───

export const BladeAttack = registerData({
    timer: [] as number[],
    cooldown: [] as number[],
    damage: [] as number[],
    range: [] as number[],
    arc: [] as number[],
    count: [] as number[],
});

export const OrbitAttack = registerData({
    dirty: [] as boolean[],
    swordEntityIds: [] as number[][],
    count: [] as number[],
    damage: [] as number[],
    orbitRadius: [] as number[],
    angularSpeed: [] as number[],
});

export const BombAttack = registerData({
    timer: [] as number[],
    cooldown: [] as number[],
    damage: [] as number[],
    fuseTime: [] as number[],
    blastRadius: [] as number[],
    count: [] as number[],
});

// ─── 技能效果实体 ───

export const BladeMarker = registerData({
    facingAngle: [] as number[],
    arc: [] as number[],
    range: [] as number[],
});

export const OrbitingSword = registerData({
    ownerEntityId: [] as number[],
    angle: [] as number[],
    angularSpeed: [] as number[],
    orbitRadius: [] as number[],
    damage: [] as number[],
    hitCooldown: [] as number[],
});

export const BombMarker = registerData({
    timer: [] as number[],
    fuseTime: [] as number[],
    damage: [] as number[],
    blastRadius: [] as number[],
});

export const ExplosionMarker = registerData({
    lifeTime: [] as number[],
    damage: [] as number[],
    radius: [] as number[],
});

// ─── 升级选择 ───

export type LevelUpRequestData = {
    currentChoices: string[];
    pendingCount: number;
};
export const LevelUpRequest = registerData([] as LevelUpRequestData[]);
