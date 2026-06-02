/**
 * ECS 工具函数
 */

import { ECSWorld } from './World';
import { Transform, Health, Camp } from './Components';

/**
 * 查找距离指定位置最近的存活敌人
 */
export function findNearestEnemy(
    world: ECSWorld,
    fromX: number, fromY: number,
    maxRange?: number,
): { eid: number; distSq: number } | null {
    const enemies = world.query(Transform, Health, Camp);
    let nearestDistSq = Infinity;
    let nearestEid = -1;

    for (const eid of enemies) {
        const camp = world.getComponent(eid, Camp)!;
        if (camp.faction !== 'enemy') continue;

        const hp = world.getComponent(eid, Health)!;
        if (hp.hp <= 0) continue;

        const etf = world.getComponent(eid, Transform)!;
        const dx = etf.x - fromX;
        const dy = etf.y - fromY;
        const dSq = dx * dx + dy * dy;
        if (dSq < nearestDistSq) {
            nearestDistSq = dSq;
            nearestEid = eid;
        }
    }

    if (nearestEid < 0) return null;
    if (maxRange !== undefined && nearestDistSq > maxRange * maxRange) return null;
    return { eid: nearestEid, distSq: nearestDistSq };
}
