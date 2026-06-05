/**
 * World — bitEcs 世界包装
 *
 * 在 bitEcs 的 World 上附加游戏级状态，并用 GameWorld 类型暴露这些字段，
 * 让各系统不再到处写 `world: any`。
 */

import { createWorld, World } from '../bitEcs';

/** 游戏世界：bitEcs World + 附加的全局状态 */
export type GameWorld = World<{
    /** 是否暂停（升级面板弹出时为 true） */
    paused: boolean;
    /** 是否游戏结束 */
    gameOver: boolean;
    /** 已存活时长（秒），由 GameEntry 每帧累加，UI/难度共用 */
    time: number;
    /** 主玩家实体 id，-1 表示尚未创建 */
    playerEid: number;
}>;

/** 创建游戏世界，初始化附加状态 */
export function createGameWorld(): GameWorld {
    const world = createWorld() as GameWorld;
    world.paused = false;
    world.gameOver = false;
    world.time = 0;
    world.playerEid = -1;
    return world;
}
