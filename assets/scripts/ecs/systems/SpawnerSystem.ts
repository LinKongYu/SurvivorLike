import { entityExists, query, isNested } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import { Camp, Spawner, Transform } from '../Components';
import { GameConfig } from '../GameConfig';
import { createEnemy } from '../EntityFactory';
import { SystemPriority } from '../Schedule';

/**
 * SpawnerSystem — 定时生成敌人 + 难度递增
 */
export class SpawnerSystem implements System {
    readonly priority = SystemPriority.Spawner;

    update(dt: number, world: GameWorld): void {
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

            let enemyCount = 0;
            for (const id of query(world, [Camp], isNested)) {
                if (Camp.value[id] === 'enemy') enemyCount++;
            }
            if (enemyCount >= Spawner.maxCount[eid]) continue;

            const playerEid = Spawner.playerEntityId[eid];
            if (!entityExists(world, playerEid)) continue;
            const px = Transform.x[playerEid];
            const py = Transform.y[playerEid];
            if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
            const angle = Math.random() * Math.PI * 2;
            const dist = Spawner.minSpawnDistance[eid] + Math.random() * (Spawner.spawnRadius[eid] - Spawner.minSpawnDistance[eid]);

            const x = px + Math.cos(angle) * dist;
            const y = py + Math.sin(angle) * dist;
            createEnemy(world, x, y, playerEid, Spawner.difficulty[eid]);
        }
    }
}
