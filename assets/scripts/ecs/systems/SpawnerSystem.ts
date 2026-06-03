import { query } from '../../bitEcs';
import { Camp, Spawner, positionStore, campStore, spawnerStore } from '../Components';
import { GameConfig } from '../GameConfig';
import { createEnemy } from '../EntityFactory';

/**
 * SpawnerSystem — 定时生成敌人 + 难度递增
 * Priority: 40
 */
export class SpawnerSystem {
    update(dt: number, world: any): void {
        const cfg = GameConfig.spawner;
        for (const eid of query(world, [Spawner])) {
            const sp = spawnerStore.get(eid)!;
            sp.difficultyTimer += dt;
            if (sp.difficultyTimer >= cfg.difficultyIntervalSeconds) {
                sp.difficultyTimer -= cfg.difficultyIntervalSeconds;
                sp.difficulty++;
                sp.interval = Math.max(cfg.minInterval, sp.interval * cfg.spawnIntervalDecay);
                sp.maxCount = Math.min(cfg.maxCountCap, sp.maxCount + cfg.maxCountIncrement);
            }

            sp.timer += dt;
            if (sp.timer < sp.interval) continue;
            sp.timer = 0;

            const enemyCount = query(world, [Camp]).filter(id => campStore.get(id) === 'enemy').length;
            if (enemyCount >= sp.maxCount) continue;

            const ptf = positionStore.get(sp.playerEntityId);
            const px = ptf ? ptf.x : 0;
            const py = ptf ? ptf.y : 0;
            const angle = Math.random() * Math.PI * 2;
            const dist = sp.minSpawnDistance + Math.random() * (sp.spawnRadius - sp.minSpawnDistance);

            const x = px + Math.cos(angle) * dist;
            const y = py + Math.sin(angle) * dist;
            createEnemy(world, x, y, sp.playerEntityId, sp.difficulty);
        }
    }
}
