/**
 * ComponentRegistry — 组件数据存储的单一登记表
 *
 * 背景：组件数据按 entity id 存放在两种容器里：
 *   - SoA（对象套数组）：如 `Transform = { x: [], y: [] }`，热点数值数据
 *   - AoS（裸数组）：如 `Render = []`、`HitRecord = []`，存 Cocos 对象或结构体
 * bitECS 会回收复用 entity id；删除实体时若不清掉其残留数据，新实体复用该 id
 * 就会读到上一个实体的脏数据（经典 ECS bug）。
 *
 * 过去 Components.ts 与 SkillComponents.ts 各维护一份「需清理组件清单」+ 一份
 * 逐字复制的清理函数，新增组件极易漏登记。现在改为单一数据源：每个组件在定义处
 * 用 {@link registerData} 包裹一次（就近、显眼），{@link clearEntityData} 只遍历
 * 这一张表。新增组件 = 在定义处加一层 registerData(...)，不可能再漏。
 */

type DataStore = Record<string, unknown[]> | unknown[];

/** 所有「按 eid 存数据」的组件容器；由各组件定义处调用 registerData 填充。 */
const REGISTRY: DataStore[] = [];

/**
 * 登记一个组件数据容器并**原样返回**（保持对象身份与形状不变，
 * 因此 `const Foo = registerData({ x: [] as number[] })` 后 `Foo.x[eid]` 照常可用，
 * bitECS 以对象身份作查询键的语义也不受影响）。SoA 与 AoS 容器都适用。
 */
export function registerData<T extends object>(component: T): T {
    REGISTRY.push(component as unknown as DataStore);
    return component;
}

function clearOne(eid: number, component: DataStore): void {
    if (Array.isArray(component)) {
        delete component[eid];
        return;
    }
    for (const value of Object.values(component)) {
        if (Array.isArray(value)) delete value[eid];
    }
}

/** 清除实体在所有已登记组件容器中的数据。务必在 removeEntity 前调用。 */
export function clearEntityData(eid: number): void {
    for (const component of REGISTRY) clearOne(eid, component);
}
