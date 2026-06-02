/**
 * 轻量级 ECS 框架核心
 *
 * Entity = number（纯 ID）
 * Component = 任意 class 实例（纯数据）
 * System = 实现 ISystem 接口的对象（纯逻辑）
 * World  = 管理以上三者的容器 + 事件队列
 *
 * 核心约定：
 * - 实体销毁延迟至帧末，避免遍历中删除
 * - System 按 priority 升序执行
 * - 事件队列在帧末 System 更新完成后处理
 */

import { GameEvent, DeathEvent } from './Events';

/** System 接口 */
export interface ISystem {
    update(dt: number, world: ECSWorld): void;
    destroy?(): void;
}

/** Component 构造函数类型 */
export type CompType<T = any> = new (...args: any[]) => T;

export class ECSWorld {

    private _nextEntityId: number = 0;
    private _aliveEntities: Set<number> = new Set();
    private _componentStores: Map<Function, Map<number, any>> = new Map();
    private _destroyQueue: number[] = [];
    private _systems: { sys: ISystem; priority: number }[] = [];
    private _eventQueue: GameEvent[] = [];
    private _gameOver: boolean = false;
    private _paused: boolean = false;

    // ─── Entity 管理 ───

    createEntity(): number {
        const eid = this._nextEntityId++;
        this._aliveEntities.add(eid);
        return eid;
    }

    destroyEntity(eid: number): void {
        this._destroyQueue.push(eid);
    }

    entityAlive(eid: number): boolean {
        return this._aliveEntities.has(eid);
    }

    get entityCount(): number {
        return this._aliveEntities.size;
    }

    // ─── Component 管理 ───

    addComponent<T>(eid: number, comp: T): T {
        const type = (comp as any).constructor;
        let store = this._componentStores.get(type);
        if (!store) {
            store = new Map();
            this._componentStores.set(type, store);
        }
        store.set(eid, comp);
        return comp;
    }

    getComponent<T>(eid: number, type: CompType<T>): T | null {
        const store = this._componentStores.get(type);
        return store ? (store.get(eid) ?? null) : null;
    }

    hasComponent(eid: number, type: CompType): boolean {
        const store = this._componentStores.get(type);
        return store ? store.has(eid) : false;
    }

    removeComponent(eid: number, type: CompType): void {
        const store = this._componentStores.get(type);
        if (store) store.delete(eid);
    }

    getStore<T>(type: CompType<T>): Map<number, T> | undefined {
        return this._componentStores.get(type) as Map<number, T> | undefined;
    }

    // ─── Query ───

    query(...types: CompType[]): number[] {
        if (types.length === 0) return [];

        let smallest: Map<number, any> | undefined;
        let smallestType: Function | undefined;
        let smallestSize = Infinity;
        for (const t of types) {
            const store = this._componentStores.get(t);
            if (!store || store.size === 0) return [];
            if (store.size < smallestSize) {
                smallestSize = store.size;
                smallest = store;
                smallestType = t;
            }
        }

        const result: number[] = [];
        for (const eid of smallest!.keys()) {
            if (!this._aliveEntities.has(eid)) continue;
            let hasAll = true;
            for (const t of types) {
                if (t === smallestType) continue;
                const store = this._componentStores.get(t);
                if (!store || !store.has(eid)) { hasAll = false; break; }
            }
            if (hasAll) result.push(eid);
        }
        return result;
    }

    getSingleton<T>(type: CompType<T>): { eid: number; comp: T } | null {
        const store = this._componentStores.get(type);
        if (!store) return null;
        for (const [eid, comp] of store) {
            if (this._aliveEntities.has(eid)) return { eid, comp };
        }
        return null;
    }

    // ─── 事件系统 ───

    emitEvent(event: GameEvent): void {
        this._eventQueue.push(event);
    }

    /**
     * 消费并返回指定类型的所有事件
     * 返回后这些事件会从队列中移除（只消费一次）
     */
    consumeEvents<T extends GameEvent>(type: new (...args: any[]) => T): T[] {
        const result: T[] = [];
        const remaining: GameEvent[] = [];
        for (const e of this._eventQueue) {
            if (e instanceof type) {
                result.push(e as T);
            } else {
                remaining.push(e);
            }
        }
        this._eventQueue = remaining;
        return result;
    }

    /** 清空所有未消费事件 */
    clearEvents(): void {
        this._eventQueue = [];
    }

    // ─── System 管理 ───

    addSystem(sys: ISystem, priority: number): void {
        this._systems.push({ sys, priority });
        this._systems.sort((a, b) => a.priority - b.priority);
    }

    // ─── 游戏状态 ───

    setGameOver(): void { this._gameOver = true; }
    isGameOver(): boolean { return this._gameOver; }
    setPaused(p: boolean): void { this._paused = p; }
    isPaused(): boolean { return this._paused; }

    // ─── 主循环 ───

    update(dt: number): void {
        for (const { sys } of this._systems) {
            sys.update(dt, this);
        }
        this.flushDestroyQueue();
    }

    private flushDestroyQueue(): void {
        for (const eid of this._destroyQueue) {
            for (const store of this._componentStores.values()) {
                store.delete(eid);
            }
            this._aliveEntities.delete(eid);
        }
        this._destroyQueue.length = 0;
    }

    destroy(): void {
        for (const { sys } of this._systems) {
            sys.destroy?.();
        }
        this._systems = [];
        this._componentStores.clear();
        this._aliveEntities.clear();
        this._destroyQueue = [];
        this._eventQueue = [];
    }
}
