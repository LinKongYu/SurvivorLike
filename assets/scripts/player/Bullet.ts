import { _decorator, Component, Vec3 } from 'cc';
const { ccclass } = _decorator;

@ccclass('Bullet')
export class Bullet extends Component {

    public direction: Vec3 = new Vec3(1, 0, 0);
    public speed: number = 500;
    public damage: number = 20;
    public lifeTime: number = 2.0;

    private _timer: number = 0;

    update(deltaTime: number): void {
        this._timer += deltaTime;
        if (this._timer >= this.lifeTime) {
            this.node.destroy();
            return;
        }

        const pos = this.node.position;
        this.node.setPosition(
            pos.x + this.direction.x * this.speed * deltaTime,
            pos.y + this.direction.y * this.speed * deltaTime,
            pos.z
        );
    }
}
