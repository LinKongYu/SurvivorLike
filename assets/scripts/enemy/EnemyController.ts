import { _decorator, Component, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EnemyController')
export class EnemyController extends Component {

    @property
    public moveSpeed: number = 80;

    @property
    public damage: number = 10;

    @property
    public experienceReward: number = 5;

    private _maxHealth: number = 40;
    private _currentHealth: number = 40;
    private _isAlive: boolean = true;
    private _targetPos: Vec3 = new Vec3();

    init(maxHealth: number, damage: number, moveSpeed: number, expReward: number): void {
        this._maxHealth = maxHealth;
        this._currentHealth = maxHealth;
        this.damage = damage;
        this.moveSpeed = moveSpeed;
        this.experienceReward = expReward;
        this._isAlive = true;
    }

    setTarget(pos: Vec3): void {
        this._targetPos.set(pos);
    }

    update(deltaTime: number): void {
        if (!this._isAlive) return;

        const pos = this.node.position;
        const dx = this._targetPos.x - pos.x;
        const dy = this._targetPos.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            const nx = dx / dist;
            const ny = dy / dist;
            this.node.setPosition(
                pos.x + nx * this.moveSpeed * deltaTime,
                pos.y + ny * this.moveSpeed * deltaTime,
                pos.z
            );
        }
    }

    takeDamage(damage: number): void {
        if (!this._isAlive) return;

        this._currentHealth -= damage;
        if (this._currentHealth <= 0) {
            this._currentHealth = 0;
            this._isAlive = false;
        }
    }

    get isAlive(): boolean { return this._isAlive; }
    get currentHealth(): number { return this._currentHealth; }
    get maxHealth(): number { return this._maxHealth; }
}
