import { query, isNested } from '../../bitEcs';
import { Camp, Spawner, Transform } from '../Components';
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
            Spawner.difficultyTimer[eid] += dt;
            if (Spawner.difficultyTimer[eid] >= cfg.difficultyIntervalSeconds) {
                Spawner.difficultyTimer[eid] -= cfg.difficultyIntervalSeconds;
                Spawner.difficulty[eid]++;
                Spawner.interval[eid] = Math.max(cfg.minInterval, Spawner.interval[eid] * cfg.spawnIntervalDecay);
                Spawner.maxCount[eid] = Math.min(cfg.maxCountCap, Spawner.maxCount[eid] + cfg.maxCountIncrement);
            }

            Spawner.timer[eid] += dt;
            if (Spawner.timer[eid] < Spawner.interval[eid]) continue;
            Spawner.timer[eid] = 0;

            const enemyCount = query(world, [Camp], isNested).filter(id => Camp.value[id] === 'enemy').length;
            if (enemyCount >= Spawner.maxCount[eid]) continue;

            const playerEid = Spawner.playerEntityId[eid];
            const px = Transform.x[playerEid] ?? 0;
            const py = Transform.y[playerEid] ?? 0;
            const angle = Math.random() * Math.PI * 2;
            const dist = Spawner.minSpawnDistance[eid] + Math.random() * (Spawner.spawnRadius[eid] - Spawner.minSpawnDistance[eid]);

            const x = px + Math.cos(angle) * dist;
            const y = py + Math.sin(angle) * dist;
            createEnemy(world, x, y, playerEid, Spawner.difficulty[eid]);
        }
    }
}
