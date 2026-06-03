/**
 * Component 定义 — bitEcs 标签 + 外部数据存储
 *
 * bitEcs 只存储"标记"（位运算），不存储数据。
 * 所有组件数据通过外部 Map<EntityId, Data> 管理，
 * 由 CleanupSystem 在实体销毁时清理。
 */

import { Node } from 'cc';
import {
    bladeAttackStore, orbitAttackStore, bombAttackStore,
    bladeMarkerStore, orbitingSwordStore,
    bombMarkerStore, explosionMarkerStore, levelUpRequestStore,
} from './SkillComponents';

/** 渲染节点类型（由 RenderSystem 管理） */
export type RenderNode = Node | null;

// ─── 通用基础 ───

/** 位置标签 */
export const Transform = {};
export type TransformData = { x: number; y: number };
export const positionStore = new Map<number, TransformData>();

/** 速度标签 */
export const Velocity = {};
export type VelocityData = { x: number; y: number };
export const velocityStore = new Map<number, VelocityData>();

/** 阵营标签 */
export const Camp = {};
export type CampData = 'player' | 'enemy';
export const campStore = new Map<number, CampData>();

/** 归属者标签 */
export const Owner = {};
export type OwnerData = number; // entityId
export const ownerStore = new Map<number, OwnerData>();

/** 渲染标签 — Render 由 RenderSystem 内部管理 Node 映射 */
export const Render = {};
export type RenderData = {
    prefabName: string;
    rotation: number;
    width: number;
    height: number;
    node: RenderNode | null;
    created: boolean;
};
export const renderStore = new Map<number, RenderData>();

// ─── 战斗 ───

/** 生命值标签 */
export const Health = {};
export type HealthData = {
    hp: number;
    maxHp: number;
    invincibleTimer: number;
    invincibleTime: number;
};
export const healthStore = new Map<number, HealthData>();

/** 伤害源标签 */
export const DamageDealer = {};
export type DamageDealerData = { damage: number; skillId: string };
export const damageDealerStore = new Map<number, DamageDealerData>();

/** 圆形碰撞体标签 */
export const Collider = {};
export type ColliderData = { radius: number };
export const colliderStore = new Map<number, ColliderData>();

/** 已命中记录标签 */
export const HitRecord = {};
export type HitRecordData = Map<number, number>;
export const hitRecordStore = new Map<number, HitRecordData>();

/** 阻力衰减标签 */
export const Drag = {};
export type DragData = { coefficient: number };
export const dragStore = new Map<number, DragData>();

// ─── 生命周期 ───

/** 倒计时销毁标签 */
export const Lifetime = {};
export type LifetimeData = { remaining: number };
export const lifetimeStore = new Map<number, LifetimeData>();

// ─── 玩家 ───

/** 键盘输入标签 */
export const PlayerInput = {};
export type PlayerInputData = { moveX: number; moveY: number };
export const playerInputStore = new Map<number, PlayerInputData>();

/** 自动射击标签 */
export const AutoAttack = {};
export type AutoAttackData = {
    timer: number;
    cooldown: number;
    range: number;
    damage: number;
    bulletSpeed: number;
    count: number;
    spreadAngle: number;
};
export const autoAttackStore = new Map<number, AutoAttackData>();

/** 等级经验标签 */
export const Level = {};
export type LevelData = { level: number; exp: number; expToNext: number };
export const levelStore = new Map<number, LevelData>();

// ─── 敌人 ───

/** 追踪目标标签 */
export const MoveToTarget = {};
export type MoveToTargetData = { targetEntityId: number; moveSpeed: number };
export const moveToTargetStore = new Map<number, MoveToTargetData>();

// ─── 技能 ───

/** 经验球标签 */
export const ExpOrb = {};
export type ExpOrbData = {
    value: number;
    magnetRadius: number;
    magnetSpeed: number;
    floatTimer: number;
    baseY: number;
};
export const expOrbStore = new Map<number, ExpOrbData>();

/** 经验奖励标签（敌人携带，死亡时生成经验球） */
export const ExpReward = {};
export type ExpRewardData = number; // 经验值
export const expRewardStore = new Map<number, ExpRewardData>();

/** 敌人生成器标签 */
export const Spawner = {};
export type SpawnerData = {
    timer: number;
    difficultyTimer: number;
    interval: number;
    maxCount: number;
    difficulty: number;
    spawnRadius: number;
    minSpawnDistance: number;
    playerEntityId: number;
};
export const spawnerStore = new Map<number, SpawnerData>();

// ─── 数据清理 ───

/** 所有外部数据 store 列表，用于实体销毁时清理 */
const ALL_STORES: Map<number, any>[] = [
    positionStore, velocityStore, campStore, ownerStore, renderStore,
    healthStore, damageDealerStore, colliderStore, hitRecordStore, dragStore,
    lifetimeStore, playerInputStore, autoAttackStore, levelStore,
    moveToTargetStore, expOrbStore, expRewardStore, spawnerStore,
    bladeAttackStore, orbitAttackStore, bombAttackStore,
    bladeMarkerStore, orbitingSwordStore,
    bombMarkerStore, explosionMarkerStore, levelUpRequestStore,
];

/** 清除实体在所有外部 store 中的数据（removeEntity 前调用） */
export function clearEntityData(eid: number): void {
    for (const store of ALL_STORES) {
        store.delete(eid);
    }
}
