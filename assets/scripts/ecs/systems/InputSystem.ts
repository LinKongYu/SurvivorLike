import { input, Input, EventKeyboard, KeyCode } from 'cc';
import { query } from '../../bitEcs';
import { PlayerInput, playerInputStore } from '../Components';

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
            const inp = playerInputStore.get(eid)!;
            inp.moveX = 0;
            inp.moveY = 0;

            if (this._keys.has(KeyCode.KEY_W) || this._keys.has(KeyCode.ARROW_UP)) inp.moveY += 1;
            if (this._keys.has(KeyCode.KEY_S) || this._keys.has(KeyCode.ARROW_DOWN)) inp.moveY -= 1;
            if (this._keys.has(KeyCode.KEY_A) || this._keys.has(KeyCode.ARROW_LEFT)) inp.moveX -= 1;
            if (this._keys.has(KeyCode.KEY_D) || this._keys.has(KeyCode.ARROW_RIGHT)) inp.moveX += 1;

            if (inp.moveX !== 0 && inp.moveY !== 0) {
                const len = Math.sqrt(inp.moveX * inp.moveX + inp.moveY * inp.moveY);
                inp.moveX /= len;
                inp.moveY /= len;
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
