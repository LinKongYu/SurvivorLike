/**
 * 技能组件 — bitEcs 标签 + 外部数据存储
 *
 * 分两类：
 * 1. 攻击触发（挂在玩家身上）：冷却管理、参数配置
 * 2. 效果标记（挂在技能效果实体上）：标识和参数
 */

// ─── 攻击触发标签（挂在玩家身上） ───

/** 扇形挥砍 — 冷却到时生成刀光 */
export const BladeAttack = {};
export type BladeAttackData = {
    timer: number;
    cooldown: number;
    damage: number;
    range: number;
    arc: number;
    count: number;
};
export const bladeAttackStore = new Map<number, BladeAttackData>();

/** 环绕飞剑 — 管理一圈飞剑 */
export const OrbitAttack = {};
export type OrbitAttackData = {
    dirty: boolean;
    swordEntityIds: number[];
    count: number;
    damage: number;
    orbitRadius: number;
    angularSpeed: number;
};
export const orbitAttackStore = new Map<number, OrbitAttackData>();

/** 投掷炸弹 */
export const BombAttack = {};
export type BombAttackData = {
    timer: number;
    cooldown: number;
    damage: number;
    fuseTime: number;
    blastRadius: number;
    count: number;
};
export const bombAttackStore = new Map<number, BombAttackData>();

// ─── 效果标记标签（挂在独立实体上） ───

/** 刀光标记 */
export const BladeMarker = {};
export type BladeMarkerData = {
    facingAngle: number;
    arc: number;
    range: number;
};
export const bladeMarkerStore = new Map<number, BladeMarkerData>();

/** 环绕飞剑标记 */
export const OrbitingSword = {};
export type OrbitingSwordData = {
    ownerEntityId: number;
    angle: number;
    angularSpeed: number;
    orbitRadius: number;
    damage: number;
    hitCooldown: number;
};
export const orbitingSwordStore = new Map<number, OrbitingSwordData>();

/** 炸弹标记 */
export const BombMarker = {};
export type BombMarkerData = {
    timer: number;
    fuseTime: number;
    damage: number;
    blastRadius: number;
};
export const bombMarkerStore = new Map<number, BombMarkerData>();

/** 爆炸标记 */
export const ExplosionMarker = {};
export type ExplosionMarkerData = {
    lifeTime: number;
    damage: number;
    radius: number;
};
export const explosionMarkerStore = new Map<number, ExplosionMarkerData>();

// ─── 升级选择 ───

/** 升级待处理请求（挂在玩家身上） */
export const LevelUpRequest = {};
export type LevelUpRequestData = {
    currentChoices: string[];
    pendingCount: number;
};
export const levelUpRequestStore = new Map<number, LevelUpRequestData>();

