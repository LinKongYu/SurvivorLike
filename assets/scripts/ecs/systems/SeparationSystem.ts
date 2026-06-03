import { query } from '../../bitEcs';
import { Transform, Collider, Camp } from '../Components';

export class SeparationSystem {
    update(_dt: number, world: any): void {
        const enemies = query(world, [Transform, Collider, Camp]);
        const n = enemies.length;
        if (n < 2) return;
        for (let i = 0; i < n; i++) {
            const aid = enemies[i];
            if (Camp.value[aid] !== 'enemy') continue;
            for (let j = i + 1; j < n; j++) {
                const bid = enemies[j];
                if (Camp.value[bid] !== 'enemy') continue;
                const dx = Transform.x[bid] - Transform.x[aid], dy = Transform.y[bid] - Transform.y[aid];
                const minDist = Collider.radius[aid] + Collider.radius[bid];
                const distSq = dx * dx + dy * dy;
                if (distSq >= minDist * minDist) continue;
                if (distSq < 0.0001) {
                    const a = Math.random() * Math.PI * 2, p = minDist * 0.5;
                    Transform.x[aid] -= Math.cos(a) * p; Transform.y[aid] -= Math.sin(a) * p;
                    Transform.x[bid] += Math.cos(a) * p; Transform.y[bid] += Math.sin(a) * p;
                    continue;
                }
                const dist = Math.sqrt(distSq);
                const overlap = (minDist - dist) * 0.5;
                const nx = dx / dist, ny = dy / dist;
                Transform.x[aid] -= nx * overlap; Transform.y[aid] -= ny * overlap;
                Transform.x[bid] += nx * overlap; Transform.y[bid] += ny * overlap;
            }
        }
    }
}
