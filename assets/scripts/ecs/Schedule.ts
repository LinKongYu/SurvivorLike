/**
 * Schedule — 系统执行顺序的单一数据源
 *
 * 每帧系统按 priority 升序执行（数值小先跑）。过去这 17 个数字分散写死在各系统
 * 文件里，想看清整帧顺序得逐个打开。现在集中在此一处，按阶段排好并加注释；各系统
 * 用 `readonly priority = SystemPriority.Xxx` 引用，调整顺序只改这里。
 *
 * 本文件是「叶子」模块：只依赖 System 类型，不 import 任何具体系统，因此系统反向
 * 依赖它（取常量）不会形成运行期循环依赖。
 *
 * 各阶段（数值区间仅为留白，便于插入新系统）：
 *   输入/控制/AI (0–9) → 物理移动 (10–19) → 战斗与技能 (20–29) →
 *   经验/生成/清理 (30–59) → 渲染/UI 表现 (90–99)
 */

import { System } from './System';

export const SystemPriority = {
    // —— 输入 / 控制 / AI ——
    Input: 0,
    PlayerControl: 2,
    MonsterChase: 3,
    Magnet: 4,
    // —— 物理移动 ——
    Movement: 10,
    Drag: 11,
    Separation: 15,
    // —— 战斗与技能 ——
    Combat: 20,
    Blade: 22,
    Orbit: 23,
    Bomb: 24,
    HitFlash: 25,
    // —— 经验 / 生成 / 清理 ——
    Experience: 30,
    Spawner: 40,
    Lifetime: 50,
    // —— 渲染 / UI 表现 ——
    Render: 90,
    UI: 95,
} as const;

/** 按 priority 升序返回新数组（数值小先执行）。正式游戏与技能测试共用同一规则。 */
export function sortSystems(systems: System[]): System[] {
    return systems.slice().sort((a, b) => a.priority - b.priority);
}
