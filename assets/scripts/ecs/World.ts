/**
 * 轻量级 ECS 框架核心
 *
 * Entity = number (纯 ID)
 * Component = 任意 class 实例 (纯数据)
 * System = 实现 ISystem 接口的对象 (纯逻辑)
 * World = 管理以上三者的容器
 */

/** System 接口，所有 System 必须实现 */
export interface ISystem {
    update(dt: number, world: ECSWorld): void;
}

/** Component 构造函数类型，用于类型安全的泛型约束 */
export type CompType<T = any> = new (...args: any[]) => T;

export class ECSWorld {

    private _nextEid: number = 0;
    private _alive: Set<number> = new Set();
    private _stores: Map<Function, Map<number, any>> = new Map();
    private _destroyQueue: number[] = [];
    private _systems: { sys: ISystem; priority: number }[] = [];
    private _gameOver: boolean = false;

    // ─── Entity ───

    createEntity(): number {
        const eid = this._nextEid++;
        this._alive.add(eid);
        return eid;
    }

    /** 延迟销毁，帧末统一执行 */
    destroyEntity(eid: number): void {
        this._destroyQueue.push(eid);
    }

    entityAlive(eid: number): boolean {
        return this._alive.has(eid);
    }

    // ─── Component ───

    addComponent<T>(eid: number, comp: T): T {
        const type = (comp as any).constructor;
        let store = this._stores.get(type);
        if (!store) {
            store = new Map();
            this._stores.set(type, store);
        }
        store.set(eid, comp);
        return comp;
    }

    getComponent<T>(eid: number, type: CompType<T>): T | null {
        const store = this._stores.get(type);
        return store ? (store.get(eid) ?? null) : null;
    }

    hasComponent(eid: number, type: CompType): boolean {
        const store = this._stores.get(type);
        return store ? store.has(eid) : false;
    }

    removeComponent(eid: number, type: CompType): void {
        const store = this._stores.get(type);
        if (store) store.delete(eid);
    }

    /** 获取某类型 Component 的全部存储 Map（entity → comp），供高频 System 直接遍历 */
    getStore<T>(type: CompType<T>): Map<number, T> | undefined {
        return this._stores.get(type) as Map<number, T> | undefined;
    }

    // ─── Query ───

    /** 返回同时拥有所有指定 Component 类型的实体 ID 列表 */
    query(...types: CompType[]): number[] {
        if (types.length === 0) return [];

        // 以最小 store 为基准遍历，减少迭代次数
        let smallest: Map<number, any> | undefined;
        let smallestType: Function | undefined;
        let smallestSize = Infinity;
        for (const t of types) {
            const store = this._stores.get(t);
            if (!store || store.size === 0) return [];
            if (store.size < smallestSize) {
                smallestSize = store.size;
                smallest = store;
                smallestType = t;
            }
        }

        const result: number[] = [];
        for (const eid of smallest!.keys()) {
            if (!this._alive.has(eid)) continue;
            let hasAll = true;
            for (const t of types) {
                if (t === smallestType) continue;
                const store = this._stores.get(t);
                if (!store || !store.has(eid)) { hasAll = false; break; }
            }
            if (hasAll) result.push(eid);
        }
        return result;
    }

    /** 快捷方法：获取拥有指定 Component 的唯一实体（如 PlayerTag） */
    getSingleton<T>(type: CompType<T>): { eid: number; comp: T } | null {
        const store = this._stores.get(type);
        if (!store) return null;
        for (const [eid, comp] of store) {
            if (this._alive.has(eid)) return { eid, comp };
        }
        return null;
    }

    // ─── System ───

    addSystem(sys: ISystem, priority: number): void {
        this._systems.push({ sys, priority });
        this._systems.sort((a, b) => a.priority - b.priority);
    }

    // ─── Game State ───

    setGameOver(): void { this._gameOver = true; }
    isGameOver(): boolean { return this._gameOver; }

    // ─── Update Loop ───

    update(dt: number): void {
        for (const { sys } of this._systems) {
            sys.update(dt, this);
        }
        this.flushDestroyQueue();
    }

    private flushDestroyQueue(): void {
        for (const eid of this._destroyQueue) {
            for (const store of this._stores.values()) {
                store.delete(eid);
            }
            this._alive.delete(eid);
        }
        this._destroyQueue.length = 0;
    }
}
