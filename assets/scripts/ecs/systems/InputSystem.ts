import { input, Input, EventKeyboard, KeyCode } from 'cc';
import { ISystem, ECSWorld } from '../World';
import { PlayerInput } from '../Components';

/**
 * InputSystem - 读取键盘输入，写入 PlayerInput 组件
 * Priority: 0
 */
export class InputSystem implements ISystem {

    private _keys: Set<number> = new Set();
    private _registered: boolean = false;

    update(_dt: number, world: ECSWorld): void {
        if (!this._registered) {
            input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
            input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
            this._registered = true;
        }

        const store = world.getStore(PlayerInput);
        if (!store) return;

        for (const [_eid, inp] of store) {
            inp.moveX = 0;
            inp.moveY = 0;

            if (this._keys.has(KeyCode.KEY_W) || this._keys.has(KeyCode.ARROW_UP)) inp.moveY += 1;
            if (this._keys.has(KeyCode.KEY_S) || this._keys.has(KeyCode.ARROW_DOWN)) inp.moveY -= 1;
            if (this._keys.has(KeyCode.KEY_A) || this._keys.has(KeyCode.ARROW_LEFT)) inp.moveX -= 1;
            if (this._keys.has(KeyCode.KEY_D) || this._keys.has(KeyCode.ARROW_RIGHT)) inp.moveX += 1;

            // 归一化对角线
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
