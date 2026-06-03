/**
 * World — bitEcs 世界包装
 *
 * 使用 bitEcs 的 createWorld，添加暂停/游戏结束状态。
 */

import { createWorld } from '../bitEcs';

/**
 * 创建游戏世界
 * world.paused / world.gameOver 为附加状态
 */
export function createGameWorld(): any {
    const world: any = createWorld();
    world.paused = false;
    world.gameOver = false;
    return world;
}
