import { input, Input, EventKeyboard, KeyCode } from 'cc';
import { query } from '../../bitEcs';
import { PlayerInput } from '../Components';

/**
 * InputSystem — 键盘 → PlayerInput
 * Priority: 0
 *
 * 每帧读取键盘状态，写入所有玩家实体的 PlayerInput 数据。
 */
export class InputSystem {
    private _keys: Set<number> = new Set();
    private _registered = false;

    update(_dt: number, world: any): void {
        if (!this._registered) {
            input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
            input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
            this._registered = true;
        }

        for (const eid of query(world, [PlayerInput])) {
            PlayerInput.moveX[eid] = 0;
            PlayerInput.moveY[eid] = 0;

            if (this._keys.has(KeyCode.KEY_W) || this._keys.has(KeyCode.ARROW_UP)) PlayerInput.moveY[eid] += 1;
            if (this._keys.has(KeyCode.KEY_S) || this._keys.has(KeyCode.ARROW_DOWN)) PlayerInput.moveY[eid] -= 1;
            if (this._keys.has(KeyCode.KEY_A) || this._keys.has(KeyCode.ARROW_LEFT)) PlayerInput.moveX[eid] -= 1;
            if (this._keys.has(KeyCode.KEY_D) || this._keys.has(KeyCode.ARROW_RIGHT)) PlayerInput.moveX[eid] += 1;

            if (PlayerInput.moveX[eid] !== 0 && PlayerInput.moveY[eid] !== 0) {
                const len = Math.sqrt(PlayerInput.moveX[eid] * PlayerInput.moveX[eid] + PlayerInput.moveY[eid] * PlayerInput.moveY[eid]);
                PlayerInput.moveX[eid] /= len;
                PlayerInput.moveY[eid] /= len;
            }
        }
    }

    private onKeyDown(e: EventKeyboard): void { this._keys.add(e.keyCode); }
    private onKeyUp(e: EventKeyboard): void { this._keys.delete(e.keyCode); }

    destroy(): void {
        if (this._registered) {
            input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
            input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
            this._registered = false;
        }
    }
}
