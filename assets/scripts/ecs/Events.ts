/**
 * 事件系统 — System 间通信机制
 *
 * 使用方式：
 * 1. System A 调用 world.emitEvent(new HitEvent(...))
 * 2. System B 调用 events = world.consumeEvents(HitEvent)
 * 3. 事件在 World.update() 帧末逐出（先更新所有 System，再处理事件）
 *
 * 核心事件流：
 * CollisionSystem → HitEvent → DamageSystem → DamageEvent → HealthSystem → DeathEvent → DeathSystem
 */

import { ECSWorld } from './World';

/** 事件基类 */
export abstract class GameEvent {}

// ─── 事件类型 ───

/** 命中事件：碰撞检测系统检测到碰撞时发出 */
export class HitEvent extends GameEvent {
    constructor(
        /** 攻击者实体 ID（子弹、刀光等） */
        public attackerId: number,
        /** 被攻击者实体 ID */
        public targetId: number,
    ) {
        super();
    }
}

/** 伤害事件：DamageSystem 计算出最终伤害后发出 */
export class DamageEvent extends GameEvent {
    constructor(
        public targetId: number,
        public damage: number,
    ) {
        super();
    }
}

/** 死亡事件：HealthSystem 检测到 hp ≤ 0 时发出 */
export class DeathEvent extends GameEvent {
    constructor(
        public entityId: number,
        /** 击杀者实体 ID（可用于掉落归属） */
        public killerId: number,
    ) {
        super();
    }
}

// ─── World 事件接口扩展 ───

/**
 * 将事件支持混入 ECSWorld
 * 使用 getPrototypeOf 扩展，由 World.ts 内部调用
 */
export function installEventSystem(world: ECSWorld): void {
    const w = world as any;
    if (!w._eventQueue) {
        w._eventQueue = [];
    }
}

/**
 * 判断事件队列中是否有指定类型的事件
 */
export function hasEvent<T extends GameEvent>(
    world: ECSWorld,
    type: new (...args: any[]) => T,
): boolean {
    const queue: GameEvent[] = (world as any)._eventQueue || [];
    return queue.some(e => e instanceof type);
}
