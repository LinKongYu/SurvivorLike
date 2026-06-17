/**
 * Components - bitECS 0.4 style component stores.
 *
 * bitECS uses the component object itself as the query key. Data can live on
 * that object in any shape; this project uses SoA arrays for hot numeric data
 * and AoS arrays for Cocos objects or small structured records.
 *
 * 每个存数据的组件都用 registerData(...) 包裹一次，登记到 ComponentRegistry，
 * 这样 clearEntityData / destroyEntity 能在实体销毁时清掉它的残留数据，无需
 * 再维护一份手动同步的清单（详见 ComponentRegistry.ts）。
 */

import { Node } from 'cc';
import { registerData } from './ComponentRegistry';

/** 实体销毁前清理其全部组件数据；从单一登记表实现处转出，保持历史 import 路径可用。 */
export { clearEntityData } from './ComponentRegistry';

export type RenderNode = Node | null;

// ─── 通用基础 ───

export const Transform = registerData({
    x: [] as number[],
    y: [] as number[],
});

export const Velocity = registerData({
    x: [] as number[],
    y: [] as number[],
});

export type CampData = 'player' | 'enemy';
export const Camp = registerData({
    value: [] as CampData[],
});

export const Owner = registerData({
    eid: [] as number[],
});

export type RenderData = {
    prefabName: string;
    rotation: number;
    width: number;
    height: number;
    node: RenderNode;
    created: boolean;
};
export const Render = registerData([] as RenderData[]);

/**
 * 构造一份标准 RenderData。替代散落各处的 `{ prefabName, rotation:0, ... }` 字面量。
 * @param prefabName resources/prefabs/ 下的预制体名
 * @param opts 仅在需要时覆盖旋转角度(度)/尺寸(像素，0 表示用预制体自带尺寸)
 */
export function makeRender(
    prefabName: string,
    opts?: { rotation?: number; width?: number; height?: number },
): RenderData {
    return {
        prefabName,
        rotation: opts?.rotation ?? 0,
        width: opts?.width ?? 0,
        height: opts?.height ?? 0,
        node: null,
        created: false,
    };
}

// ─── 战斗 ───

export const Health = registerData({
    hp: [] as number[],
    maxHp: [] as number[],
    invincibleTimer: [] as number[],
    invincibleTime: [] as number[],
});

export const DamageDealer = registerData({
    damage: [] as number[],
    skillId: [] as string[],
});

export const Collider = registerData({
    radius: [] as number[],
});

export const HitRecord = registerData([] as Map<number, number>[]);

export const Drag = registerData({
    coefficient: [] as number[],
});

// ─── 生命周期 ───

export const Lifetime = registerData({
    remaining: [] as number[],
});

// ─── 玩家 ───

export const PlayerInput = registerData({
    moveX: [] as number[],
    moveY: [] as number[],
});

export const AutoAttack = registerData({
    timer: [] as number[],
    cooldown: [] as number[],
    range: [] as number[],
    damage: [] as number[],
    bulletSpeed: [] as number[],
    count: [] as number[],
    spreadAngle: [] as number[],
});

export const Level = registerData({
    level: [] as number[],
    exp: [] as number[],
    expToNext: [] as number[],
});

// ─── 敌人 ───

export const MoveToTarget = registerData({
    targetEntityId: [] as number[],
    moveSpeed: [] as number[],
});

// ─── 技能/生成 ───

export const ExpOrb = registerData({
    value: [] as number[],
    magnetRadius: [] as number[],
    magnetSpeed: [] as number[],
    floatTimer: [] as number[],
    baseY: [] as number[],
});

export const ExpReward = registerData({
    value: [] as number[],
});

export const Spawner = registerData({
    timer: [] as number[],
    difficultyTimer: [] as number[],
    interval: [] as number[],
    maxCount: [] as number[],
    difficulty: [] as number[],
    spawnRadius: [] as number[],
    minSpawnDistance: [] as number[],
    playerEntityId: [] as number[],
});

export const HitFlash = registerData({
    color: [] as [number, number, number, number][],
    remaining: [] as number[],
    totalDuration: [] as number[],
});
