/**
 * System — 游戏系统统一接口
 *
 * 每个系统自带 priority（数值越小越先执行），由 GameEntry 排序后逐帧调用。
 * 想新增系统：实现 System，在 GameEntry 的列表里 new 一下即可，无需在别处维护优先级表。
 *
 * runWhenPaused / runWhenGameOver 默认 false：
 *   - 暂停时（升级面板）只跑标记了 runWhenPaused 的系统（如渲染、UI）。
 *   - 游戏结束后只跑标记了 runWhenGameOver 的系统。
 */

import { GameWorld } from './World';

export interface System {
    /** 执行顺序，越小越先跑 */
    readonly priority: number;
    /** 暂停时是否仍执行（默认 false） */
    readonly runWhenPaused?: boolean;
    /** 游戏结束后是否仍执行（默认 false） */
    readonly runWhenGameOver?: boolean;

    update(dt: number, world: GameWorld): void;

    /** 可选：场景销毁时清理监听/节点 */
    destroy?(): void;
}
