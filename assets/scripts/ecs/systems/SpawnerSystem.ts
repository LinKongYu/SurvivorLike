import { ISystem, ECSWorld } from '../World';
import { Transform, EnemyTag, SpawnerComp } from '../Components';
import { createEnemy } from '../EntityFactory';

/**
 * SpawnerSystem - 定时生成敌人 + 难度递增
 * Priority: 40
 */
export class SpawnerSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver() || world.isPaused()) return;

        const store = world.getStore(SpawnerComp);
        if (!store) return;

        for (const [_eid, spawner] of store) {
            // 难度递增：每 15 秒
            spawner.difficultyTimer += dt;
            if (spawner.difficultyTimer >= 15) {
                spawner.difficultyTimer -= 15;
                spawner.difficulty++;
                spawner.interval = Math.max(0.5, spawner.interval * 0.9);
                spawner.maxCount = Math.min(50, spawner.maxCount + 3);
            }

            // 生成计时
            spawner.timer += dt;
            if (spawner.timer < spawner.interval) continue;
            spawner.timer = 0;

            // 统计当前敌人数：直接用 store.size (O(1))，允许 1 帧死亡窗口的微量误差
            const enemyStore = world.getStore(EnemyTag);
            const enemyCount = enemyStore ? enemyStore.size : 0;

            if (enemyCount >= spawner.maxCount) continue;

            // 获取玩家位置
            const ptf = world.getComponent(spawner.playerEid, Transform);
            const px = ptf ? ptf.x : 0;
            const py = ptf ? ptf.y : 0;

            // 在玩家周围随机位置生成
            const angle = Math.random() * Math.PI * 2;
            const dist = spawner.minDist + Math.random() * (spawner.radius - spawner.minDist);
            const sx = px + Math.cos(angle) * dist;
            const sy = py + Math.sin(angle) * dist;

            createEnemy(world, sx, sy, spawner.playerEid, spawner.difficulty);
        }
    }
}
