import { ISystem, ECSWorld } from '../World';
import { Transform, EnemyTag, Collider } from '../Components';

/**
 * SeparationSystem - 敌人之间的软分离（物理碰撞）
 * Priority: 15 (在 MovementSystem 之后、CombatSystem 之前)
 *
 * 实现思路：
 * 1. O(n²) 两两检测所有带 Collider 的敌人
 * 2. 若两敌人中心距离 < (ra + rb)，则沿连线方向各推开半重叠量
 * 3. 避免强制求解物理冲量，只做位置修正，视觉上"软"推开
 *
 * 注：对于 <50 个敌人的幸存者like游戏，O(n²) 完全够用。
 * 若后期敌人规模 >100，可切换到空间哈希分块（Spatial Hashing）。
 */
export class SeparationSystem implements ISystem {

    update(_dt: number, world: ECSWorld): void {
        const enemies = world.query(Transform, EnemyTag, Collider);
        const n = enemies.length;
        if (n < 2) return;

        for (let i = 0; i < n; i++) {
            const aid = enemies[i];
            const atf = world.getComponent(aid, Transform)!;
            const ac = world.getComponent(aid, Collider)!;

            for (let j = i + 1; j < n; j++) {
                const bid = enemies[j];
                const btf = world.getComponent(bid, Transform)!;
                const bc = world.getComponent(bid, Collider)!;

                const dx = btf.x - atf.x;
                const dy = btf.y - atf.y;
                const minDist = ac.radius + bc.radius;
                const minDistSq = minDist * minDist;
                const distSq = dx * dx + dy * dy;

                if (distSq >= minDistSq) continue;

                // 完全重叠时随机给一个方向，避免除零
                if (distSq < 0.0001) {
                    const angle = Math.random() * Math.PI * 2;
                    const push = minDist * 0.5;
                    atf.x -= Math.cos(angle) * push;
                    atf.y -= Math.sin(angle) * push;
                    btf.x += Math.cos(angle) * push;
                    btf.y += Math.sin(angle) * push;
                    continue;
                }

                const dist = Math.sqrt(distSq);
                const overlap = (minDist - dist) * 0.5;
                const nx = dx / dist;
                const ny = dy / dist;

                atf.x -= nx * overlap;
                atf.y -= ny * overlap;
                btf.x += nx * overlap;
                btf.y += ny * overlap;
            }
        }
    }
}
