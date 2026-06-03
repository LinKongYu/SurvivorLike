/**
 * helpers — 工具函数
 */

import { query } from '../bitEcs';
import { Transform, Health, Camp, positionStore, healthStore, campStore } from './Components';

/**
 * 查找距离指定位置最近的存活敌人
 */
export function findNearestEnemy(
    world: any, fromX: number, fromY: number, maxRange?: number,
): { eid: number; distSq: number } | null {
    let nearestDistSq = Infinity;
    let nearestEid = -1;
    for (const eid of query(world, [Transform, Health, Camp])) {
        if (campStore.get(eid) !== 'enemy') continue;
        const hp = healthStore.get(eid)!;
        if (hp.hp <= 0) continue;
        const etf = positionStore.get(eid)!;
        const dx = etf.x - fromX, dy = etf.y - fromY;
        const dSq = dx * dx + dy * dy;
        if (dSq < nearestDistSq) { nearestDistSq = dSq; nearestEid = eid; }
    }
    if (nearestEid < 0) return null;
    if (maxRange !== undefined && nearestDistSq > maxRange * maxRange) return null;
    return { eid: nearestEid, distSq: nearestDistSq };
}
