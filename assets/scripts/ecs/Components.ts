/**
 * 所有 ECS Component 定义
 *
 * Component = 纯数据类，无逻辑方法。
 * System 不关心实体类型，只关心组件组合。
 *
 * 分组：
 * - 通用基础：Transform, Render, Velocity, Camp, Owner
 * - 战斗：Health, DamageDealer, Collider, HitRecord, PeriodicDamage, Drag
 * - 生命周期：Lifetime
 * - 玩家：PlayerInput, AutoAttack, Level
 * - 敌人：MoveToTarget
 * - 技能：ExpOrb, Spawner
 */

import { Node } from 'cc';

// ─── 通用基础 ───

/** 世界坐标位置 */
export class Transform {
    constructor(public x: number = 0, public y: number = 0) {}
}

/**
 * 速度向量
 *
 * 由 AI 类系统（PlayerControl、MonsterAI、Homing、Magnet）每帧设置，
 * MovementSystem 每帧统一 → position += velocity × dt。
 * DragSystem 提供指数衰减。
 */
export class Velocity {
    constructor(public x: number = 0, public y: number = 0) {}
}

/** 阵营 */
export class Camp {
    constructor(public faction: 'player' | 'enemy') {}
}

/**
 * 归属者
 * 标记实体归属于谁（如子弹是谁射出的、刀光是谁的）
 */
export class Owner {
    constructor(public entityId: number = -1) {}
}

/**
 * 渲染桥接：引用 PrefabPool 中的预制体名称
 *
 * width / height 可选覆盖预制体默认大小，由 RenderSystem 处理。
 */
export class Render {
    node: Node | null = null;
    created: boolean = false;
    constructor(
        public prefabName: string = 'Player',
        public rotation: number = 0,
        public width: number = 0,
        public height: number = 0,
    ) {}
}

// ─── 战斗 ───

/** 生命值 */
export class Health {
    invincibleTimer: number = 0;
    constructor(
        public hp: number = 100,
        public maxHp: number = 100,
        public invincibleTime: number = 0,
    ) {}
}

/** 伤害源：标记实体可造成伤害 */
export class DamageDealer {
    constructor(
        public damage: number = 10,
        public skillId: string = '',
    ) {}
}

/** 圆形碰撞体（逻辑碰撞，非 Cocos Physics） */
export class Collider {
    constructor(public radius: number = 20) {}
}

/** 已命中记录，避免同一伤害判定多次命中同一目标 */
export class HitRecord {
    hitEntityIds: Set<number> = new Set();
}

/**
 * 周期性范围伤害
 * 用于阵法、爆炸残留等持续伤害效果
 */
export class PeriodicDamage {
    timer: number = 0;
    lastHitEntityIds: Set<number> = new Set();
    constructor(
        public interval: number = 0.5,
        public damage: number = 10,
        public radius: number = 100,
    ) {}
}

/**
 * 阻力/衰减
 * 对 Velocity 做指数衰减，替代旧 Knockback 组件。
 * coefficient 越大衰减越快，8 约 0.3s 衰减到忽略不计。
 */
export class Drag {
    constructor(public coefficient: number = 8) {}
}

// ─── 生命周期 ───

/** 倒计时后销毁实体 */
export class Lifetime {
    constructor(public remaining: number = 0) {}
}

// ─── 玩家 ───

/** 键盘输入方向（由 InputSystem 写入） */
export class PlayerInput {
    moveX: number = 0;
    moveY: number = 0;
}

/** 自动射击配置与冷却计时 */
export class AutoAttack {
    timer: number = 0;
    constructor(
        public cooldown: number = 0.5,
        public range: number = 400,
        public damage: number = 20,
        public bulletSpeed: number = 500,
        public count: number = 1,
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

/** 追踪目标：AI 根据此组件朝目标移动 */
export class MoveToTarget {
    constructor(public targetEntityId: number = -1) {}
}

// ─── 技能 ───

/** 经验奖励值：敌人携带，死亡时生成对应价值的经验球 */
export class ExpReward {
    constructor(public value: number = 5) {}
}

/** 经验球 */
export class ExpOrb {
    /** 浮动动画相位 */
    floatTimer: number = Math.random() * Math.PI * 2;
    baseY: number = 0;
    constructor(
        public value: number = 5,
        public magnetRadius: number = 120,
        public magnetSpeed: number = 300,
    ) {}
}

/** 敌人生成器 */
export class Spawner {
    timer: number = 0;
    difficultyTimer: number = 0;
    constructor(
        public interval: number = 2.0,
        public maxCount: number = 20,
        public difficulty: number = 1,
        public spawnRadius: number = 500,
        public minSpawnDistance: number = 300,
        public playerEntityId: number = -1,
    ) {}
}
