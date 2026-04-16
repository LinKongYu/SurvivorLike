import { ISystem, ECSWorld } from '../World';
import {
    Transform, PlayerTag, PlayerInput,
    EnemyTag, ChaseTarget, BulletComp, ExpOrbComp,
} from '../Components';

/**
 * MovementSystem - 处理所有实体的位置更新
 * Priority: 10
 *
 * - 玩家：根据 PlayerInput 移动
 * - 敌人：追踪 ChaseTarget 指定的实体
 * - 子弹：沿 direction 直线飞行
 * - 经验球：未被吸引时原地浮动
 */
export class MovementSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        this.movePlayer(dt, world);
        this.moveEnemies(dt, world);
        this.moveBullets(dt, world);
        this.floatOrbs(dt, world);
    }

    private movePlayer(dt: number, world: ECSWorld): void {
        const entities = world.query(Transform, PlayerTag, PlayerInput);
        for (const eid of entities) {
            const tf = world.getComponent(eid, Transform)!;
            const tag = world.getComponent(eid, PlayerTag)!;
            const inp = world.getComponent(eid, PlayerInput)!;

            if (inp.moveX !== 0 || inp.moveY !== 0) {
                tf.x += inp.moveX * tag.moveSpeed * dt;
                tf.y += inp.moveY * tag.moveSpeed * dt;
            }
        }
    }

    private moveEnemies(dt: number, world: ECSWorld): void {
        const entities = world.query(Transform, EnemyTag, ChaseTarget);
        for (const eid of entities) {
            const tf = world.getComponent(eid, Transform)!;
            const enemy = world.getComponent(eid, EnemyTag)!;
            const chase = world.getComponent(eid, ChaseTarget)!;

            const targetTf = world.getComponent(chase.targetEid, Transform);
            if (!targetTf) continue;

            const dx = targetTf.x - tf.x;
            const dy = targetTf.y - tf.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 1) {
                tf.x += (dx / dist) * enemy.moveSpeed * dt;
                tf.y += (dy / dist) * enemy.moveSpeed * dt;
            }
        }
    }

    private moveBullets(dt: number, world: ECSWorld): void {
        const store = world.getStore(BulletComp);
        if (!store) return;

        for (const [eid, bullet] of store) {
            const tf = world.getComponent(eid, Transform);
            if (!tf) continue;

            tf.x += bullet.dirX * bullet.speed * dt;
            tf.y += bullet.dirY * bullet.speed * dt;

            bullet.timer += dt;
            if (bullet.timer >= bullet.lifeTime) {
                world.destroyEntity(eid);
            }
        }
    }

    private floatOrbs(dt: number, world: ECSWorld): void {
        const store = world.getStore(ExpOrbComp);
        if (!store) return;

        for (const [eid, orb] of store) {
            if (orb.attracted) continue;

            const tf = world.getComponent(eid, Transform);
            if (!tf) continue;

            orb.floatTimer += dt;
            tf.y = orb.baseY + Math.sin(orb.floatTimer * 3) * 5;
        }
    }
}
