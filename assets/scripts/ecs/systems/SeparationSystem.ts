import { ISystem, ECSWorld } from '../World';
import { Transform, Camp, Collider } from '../Components';

/**
 * SeparationSystem — 友方实体间软分离
 * Priority: 15
 *
 * 查询所有带 Collider 的同阵营实体，做 O(n²) 两两分离，
 * 防止实体堆叠。
 *
 * 当前只处理敌人之间的分离。
 */
export class SeparationSystem implements ISystem {

    update(_dt: number, world: ECSWorld): void {
        if (world.isPaused() || world.isGameOver()) return;

        // 敌人之间分离
        const enemies = world.query(Transform, Collider, Camp);
        const n = enemies.length;
        if (n < 2) return;

        for (let i = 0; i < n; i++) {
            const aid = enemies[i];
            const aCamp = world.getComponent(aid, Camp)!;
            if (aCamp.faction !== 'enemy') continue;

            const atf = world.getComponent(aid, Transform)!;
            const ac = world.getComponent(aid, Collider)!;

            for (let j = i + 1; j < n; j++) {
                const bid = enemies[j];
                const bCamp = world.getComponent(bid, Camp)!;
                if (bCamp.faction !== 'enemy') continue;

                const btf = world.getComponent(bid, Transform)!;
                const bc = world.getComponent(bid, Collider)!;

                const dx = btf.x - atf.x;
                const dy = btf.y - atf.y;
                const minDist = ac.radius + bc.radius;
                const minDistSq = minDist * minDist;
                const distSq = dx * dx + dy * dy;

                if (distSq >= minDistSq) continue;

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
