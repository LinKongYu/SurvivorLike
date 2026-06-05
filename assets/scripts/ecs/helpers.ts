/**
 * Helpers — 工具函数
 */

import { query } from '../bitEcs';
import { Transform, Health, Camp } from './Components';
import { GameWorld } from './World';

/**
 * 查找距离指定位置最近的存活敌人
 */
export function findNearestEnemy(
    world: GameWorld, fromX: number, fromY: number, maxRange?: number,
): { eid: number; distSq: number } | null {
    let nearestDistSq = Infinity;
    let nearestEid = -1;
    for (const eid of query(world, [Transform, Health, Camp])) {
        if (Camp.value[eid] !== 'enemy') continue;
        if (Health.hp[eid] <= 0) continue;
        const dx = Transform.x[eid] - fromX, dy = Transform.y[eid] - fromY;
        const dSq = dx * dx + dy * dy;
        if (dSq < nearestDistSq) { nearestDistSq = dSq; nearestEid = eid; }
    }
    if (nearestEid < 0) return null;
    if (maxRange !== undefined && nearestDistSq > maxRange * maxRange) return null;
    return { eid: nearestEid, distSq: nearestDistSq };
}
