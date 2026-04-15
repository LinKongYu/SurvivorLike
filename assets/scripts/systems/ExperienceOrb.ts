import { _decorator, Component, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ExperienceOrb')
export class ExperienceOrb extends Component {

    public experienceValue: number = 5;

    @property
    public attractRange: number = 120;

    @property
    public attractSpeed: number = 300;

    private _isAttracted: boolean = false;
    private _collected: boolean = false;
    private _time: number = 0;
    private _baseY: number = 0;

    protected onLoad(): void {
        this._baseY = this.node.position.y;
        this._time = Math.random() * Math.PI * 2;
    }

    init(expValue: number): void {
        this.experienceValue = expValue;
    }

    update(deltaTime: number): void {
        if (this._collected) return;

        this._time += deltaTime;

        if (!this._isAttracted) {
            // Floating animation
            const pos = this.node.position;
            this.node.setPosition(pos.x, this._baseY + Math.sin(this._time * 3) * 5, pos.z);
        }
    }

    tryAttract(playerPos: Vec3): boolean {
        if (this._collected) return false;

        const pos = this.node.position;
        const dx = playerPos.x - pos.x;
        const dy = playerPos.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.attractRange) {
            this._isAttracted = true;
        }

        return false;
    }

    moveToward(playerPos: Vec3, deltaTime: number): boolean {
        if (this._collected || !this._isAttracted) return false;

        const pos = this.node.position;
        const dx = playerPos.x - pos.x;
        const dy = playerPos.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
            this._collected = true;
            return true;
        }

        if (dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            this.node.setPosition(
                pos.x + nx * this.attractSpeed * deltaTime,
                pos.y + ny * this.attractSpeed * deltaTime,
                pos.z
            );
        }

        return false;
    }

    get isAttracted(): boolean { return this._isAttracted; }
    get collected(): boolean { return this._collected; }
}
