import { ISystem, ECSWorld } from '../World';
import { Transform, Spawner, Camp } from '../Components';
import { createEnemy } from '../EntityFactory';
import { GameConfig } from '../GameConfig';

/**
 * SpawnerSystem — 定时生成敌人 + 难度递增
 * Priority: 40
 */
export class SpawnerSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver() || world.isPaused()) return;

        const store = world.getStore(Spawner);
        if (!store) return;

        const cfg = GameConfig.spawner;

        for (const [_eid, spawner] of store) {
            spawner.difficultyTimer += dt;
            if (spawner.difficultyTimer >= cfg.difficultyIntervalSeconds) {
                spawner.difficultyTimer -= cfg.difficultyIntervalSeconds;
                spawner.difficulty++;
                spawner.interval = Math.max(cfg.minInterval, spawner.interval * cfg.spawnIntervalDecay);
                spawner.maxCount = Math.min(cfg.maxCountCap, spawner.maxCount + cfg.maxCountIncrement);
            }

            spawner.timer += dt;
            if (spawner.timer < spawner.interval) continue;
            spawner.timer = 0;

            const enemyStore = world.getStore(Camp);
            const enemyCount = enemyStore ? enemyStore.size : 0;
            if (enemyCount >= spawner.maxCount) continue;

            const ptf = world.getComponent(spawner.playerEntityId, Transform);
            const px = ptf ? ptf.x : 0;
            const py = ptf ? ptf.y : 0;

            const angle = Math.random() * Math.PI * 2;
            const dist = spawner.minSpawnDistance + Math.random() * (spawner.spawnRadius - spawner.minSpawnDistance);
            createEnemy(world, px + Math.cos(angle) * dist, py + Math.sin(angle) * dist,
                spawner.playerEntityId, spawner.difficulty);
        }
    }
}
