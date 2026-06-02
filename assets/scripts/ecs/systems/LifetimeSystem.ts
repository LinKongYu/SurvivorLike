import { ISystem, ECSWorld } from '../World';
import { Lifetime } from '../Components';

/**
 * LifetimeSystem — 生命周期管理
 * Priority: 50
 *
 * 对拥有 Lifetime 组件的实体每帧倒计时，
 * 到期后销毁实体。
 *
 * 替代 Bullet 组件的内置 lifetime 逻辑，
 * 任何需要"一段时间后自动销毁"的实体都可使用此组件。
 */
export class LifetimeSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        const store = world.getStore(Lifetime);
        if (!store) return;

        const toDestroy: number[] = [];

        for (const [eid, lifetime] of store) {
            lifetime.remaining -= dt;
            if (lifetime.remaining <= 0) {
                toDestroy.push(eid);
            }
        }

        for (const eid of toDestroy) {
            world.destroyEntity(eid);
        }
    }
}
