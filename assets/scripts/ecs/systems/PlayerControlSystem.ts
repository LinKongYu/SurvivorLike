import { ISystem, ECSWorld } from '../World';
import { Velocity, PlayerInput, Camp, MoveToTarget } from '../Components';

/**
 * PlayerControlSystem — 玩家输入 → Velocity
 * Priority: 2
 *
 * 读取 PlayerInput 的移动方向，结合玩家速度常量设置 Velocity。
 * 玩家实体需要有：Camp(player), PlayerInput, Velocity
 *
 * 设计说明：InputSystem 只负责从键盘读取到 PlayerInput，
 * 本系统负责将"方向意图"转为"物理速度"。
 * 分离后 MovementSystem 不再需要知道输入细节。
 */
export class PlayerControlSystem implements ISystem {

    /** 玩家移动速度（像素/秒） */
    private _moveSpeed: number = 200;

    update(_dt: number, world: ECSWorld): void {
        const entities = world.query(Velocity, PlayerInput, Camp);
        for (const eid of entities) {
            const camp = world.getComponent(eid, Camp)!;
            if (camp.faction !== 'player') continue;

            const inp = world.getComponent(eid, PlayerInput)!;
            const vel = world.getComponent(eid, Velocity)!;

            vel.x = inp.moveX * this._moveSpeed;
            vel.y = inp.moveY * this._moveSpeed;
        }
    }
}
