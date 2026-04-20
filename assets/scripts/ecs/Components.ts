/**
 * 所有 ECS Component 定义
 * Component = 纯数据类，无逻辑方法
 */

import { Node } from 'cc';

// ─── 通用 ───

/** 世界坐标 */
export class Transform {
    constructor(public x: number = 0, public y: number = 0) {}
}

/**
 * 渲染桥接：引用 PrefabPool 中的预制体名称
 *
 * width/height 为可选覆盖：若 > 0，RenderSystem 会用该尺寸覆盖预制体默认的
 * UITransform.contentSize，用于需要动态改变尺寸的实体（如刀扇形、爆炸圈）。
 */
export class Render {
    /** 由 RenderSystem 创建并管理 */
    node: Node | null = null;
    /** 标记 RenderSystem 是否已经为此组件创建了 Node */
    created: boolean = false;
    constructor(
        public prefabName: string = 'Player',
        /** 节点旋转角度（度），RenderSystem 每帧同步到 node.angle */
        public rotation: number = 0,
        /** 覆盖预制体默认 contentSize 宽（0 = 用预制体原始尺寸） */
        public width: number = 0,
        /** 覆盖预制体默认 contentSize 高（0 = 用预制体原始尺寸） */
        public height: number = 0,
    ) {}
}

/** 生命值 */
export class Health {
    invincibleTimer: number = 0;
    constructor(
        public hp: number = 100,
        public maxHp: number = 100,
        public invincibleTime: number = 0,
    ) {}
}

/** 圆形碰撞体，用于实体间软分离（非触发性碰撞） */
export class Collider {
    constructor(public radius: number = 20) {}
}

/** 瞬时击退速度，会随时间指数衰减，衰减到阈值以下后自动移除 */
export class Knockback {
    constructor(
        public vx: number = 0,
        public vy: number = 0,
        /** 衰减速率，越大衰减越快。8 大约对应 0.3s 衰减到忽略不计 */
        public decayRate: number = 8,
    ) {}
}

// ─── 玩家 ───

/** 标记实体为玩家 */
export class PlayerTag {
    /** 玩家移动速度 */
    constructor(public moveSpeed: number = 200) {}
}

/** 键盘输入状态（由 InputSystem 写入） */
export class PlayerInput {
    moveX: number = 0;
    moveY: number = 0;
}

/** 自动射击 */
export class AutoAttack {
    timer: number = 0;
    constructor(
        public cooldown: number = 0.5,
        public range: number = 400,
        public damage: number = 20,
        public bulletSpeed: number = 500,
        /** 每次射击发射的子弹数；>1 时以 spreadAngle 均匀散射 */
        public count: number = 1,
        /** 散射总角度（弧度） */
        public spreadAngle: number = 0.3,
    ) {}
}

/** 等级与经验 */
export class Level {
    constructor(
        public level: number = 1,
        public exp: number = 0,
        public expToNext: number = 10,
    ) {}
}

// ─── 敌人 ───

/** 标记实体为敌人 */
export class EnemyTag {
    constructor(
        public damage: number = 10,
        public expReward: number = 5,
        public moveSpeed: number = 80,
    ) {}
}

/** 追踪目标实体 */
export class ChaseTarget {
    constructor(public targetEid: number = -1) {}
}

// ─── 子弹 ───

export class BulletComp {
    timer: number = 0;
    constructor(
        public damage: number = 20,
        public lifeTime: number = 1.5,
        public dirX: number = 1,
        public dirY: number = 0,
        public speed: number = 500,
    ) {}
}

// ─── 经验球 ───

export class ExpOrbComp {
    attracted: boolean = false;
    floatTimer: number = Math.random() * Math.PI * 2;
    baseY: number = 0;
    constructor(
        public value: number = 5,
        public attractRange: number = 120,
        public attractSpeed: number = 300,
    ) {}
}

// ─── 生成器 ───

export class SpawnerComp {
    timer: number = 0;
    difficultyTimer: number = 0;
    constructor(
        public interval: number = 2.0,
        public maxCount: number = 20,
        public difficulty: number = 1,
        public radius: number = 500,
        public minDist: number = 300,
        public playerEid: number = -1,
    ) {}
}
