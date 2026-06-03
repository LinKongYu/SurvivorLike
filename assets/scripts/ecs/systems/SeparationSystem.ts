import { query } from '../../bitEcs';
import { Transform, Collider, Camp, positionStore, colliderStore, campStore } from '../Components';

export class SeparationSystem {
    update(_dt: number, world: any): void {
        const enemies = query(world, [Transform, Collider, Camp]);
        const n = enemies.length;
        if (n < 2) return;
        for (let i = 0; i < n; i++) {
            const aid = enemies[i];
            if (campStore.get(aid) !== 'enemy') continue;
            const atf = positionStore.get(aid)!;
            const ac = colliderStore.get(aid)!;
            for (let j = i + 1; j < n; j++) {
                const bid = enemies[j];
                if (campStore.get(bid) !== 'enemy') continue;
                const btf = positionStore.get(bid)!;
                const bc = colliderStore.get(bid)!;
                const dx = btf.x - atf.x, dy = btf.y - atf.y;
                const minDist = ac.radius + bc.radius;
                const distSq = dx * dx + dy * dy;
                if (distSq >= minDist * minDist) continue;
                if (distSq < 0.0001) {
                    const a = Math.random() * Math.PI * 2, p = minDist * 0.5;
                    atf.x -= Math.cos(a) * p; atf.y -= Math.sin(a) * p;
                    btf.x += Math.cos(a) * p; btf.y += Math.sin(a) * p;
                    continue;
                }
                const dist = Math.sqrt(distSq);
                const overlap = (minDist - dist) * 0.5;
                const nx = dx / dist, ny = dy / dist;
                atf.x -= nx * overlap; atf.y -= ny * overlap;
                btf.x += nx * overlap; btf.y += ny * overlap;
            }
        }
    }
}
