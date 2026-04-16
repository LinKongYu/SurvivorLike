/**
 * 所有 ECS Component 定义
 * Component = 纯数据类，无逻辑方法
 */

import { Node, Color } from 'cc';

// ─── 通用 ───

/** 世界坐标 */
export class Transform {
    constructor(public x: number = 0, public y: number = 0) {}
}

/** Cocos 渲染桥接 */
export class Render {
    /** 由 RenderSystem 创建并管理 */
    node: Node | null = null;
    /** 标记 RenderSystem 是否已经为此组件创建了 Node */
    created: boolean = false;
    constructor(
        public width: number = 40,
        public height: number = 40,
        public color: Color = new Color(255, 255, 255, 255),
        public shape: 'rect' | 'circle' = 'rect',
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
