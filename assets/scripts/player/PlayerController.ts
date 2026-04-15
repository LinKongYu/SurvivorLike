import { _decorator, Component, Vec3, input, Input, EventKeyboard, KeyCode } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {

    @property
    public moveSpeed: number = 200;

    @property
    public maxHealth: number = 100;

    @property
    public attackDamage: number = 20;

    @property
    public attackCooldown: number = 0.5;

    private _currentHealth: number = 100;
    private _currentExp: number = 0;
    private _level: number = 1;
    private _expToNext: number = 10;

    private _moveDir: Vec3 = new Vec3();
    private _attackTimer: number = 0;
    private _isAlive: boolean = true;
    private _invincibleTimer: number = 0;

    private _keysPressed: Set<number> = new Set();

    protected onLoad(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    init(): void {
        this._currentHealth = this.maxHealth;
        this._currentExp = 0;
        this._level = 1;
        this._expToNext = 10;
        this._isAlive = true;
        this._attackTimer = 0;
        this._invincibleTimer = 0;
    }

    update(deltaTime: number): void {
        if (!this._isAlive) return;

        if (this._invincibleTimer > 0) {
            this._invincibleTimer -= deltaTime;
        }

        this._attackTimer += deltaTime;
        this.updateMovement(deltaTime);
    }

    private updateMovement(deltaTime: number): void {
        this._moveDir.set(0, 0, 0);

        if (this._keysPressed.has(KeyCode.KEY_W) || this._keysPressed.has(KeyCode.ARROW_UP)) {
            this._moveDir.y += 1;
        }
        if (this._keysPressed.has(KeyCode.KEY_S) || this._keysPressed.has(KeyCode.ARROW_DOWN)) {
            this._moveDir.y -= 1;
        }
        if (this._keysPressed.has(KeyCode.KEY_A) || this._keysPressed.has(KeyCode.ARROW_LEFT)) {
            this._moveDir.x -= 1;
        }
        if (this._keysPressed.has(KeyCode.KEY_D) || this._keysPressed.has(KeyCode.ARROW_RIGHT)) {
            this._moveDir.x += 1;
        }

        if (this._moveDir.lengthSqr() > 0) {
            this._moveDir.normalize();
            const pos = this.node.position;
            this.node.setPosition(
                pos.x + this._moveDir.x * this.moveSpeed * deltaTime,
                pos.y + this._moveDir.y * this.moveSpeed * deltaTime,
                pos.z
            );
        }
    }

    canAttack(): boolean {
        return this._isAlive && this._attackTimer >= this.attackCooldown;
    }

    resetAttackTimer(): void {
        this._attackTimer = 0;
    }

    takeDamage(damage: number): void {
        if (!this._isAlive || this._invincibleTimer > 0) return;

        this._currentHealth -= damage;
        this._invincibleTimer = 0.5;

        if (this._currentHealth <= 0) {
            this._currentHealth = 0;
            this._isAlive = false;
        }
    }

    addExperience(exp: number): void {
        if (!this._isAlive) return;

        this._currentExp += exp;
        while (this._currentExp >= this._expToNext) {
            this.levelUp();
        }
    }

    private levelUp(): void {
        this._level++;
        this._currentExp -= this._expToNext;
        this._expToNext = Math.floor(10 * this._level);
        this.maxHealth += 10;
        this._currentHealth = this.maxHealth;
        this.attackDamage += 5;
        this.moveSpeed += 5;
    }

    private onKeyDown(event: EventKeyboard): void {
        this._keysPressed.add(event.keyCode);
    }

    private onKeyUp(event: EventKeyboard): void {
        this._keysPressed.delete(event.keyCode);
    }

    get currentHealth(): number { return this._currentHealth; }
    get isAlive(): boolean { return this._isAlive; }
    get level(): number { return this._level; }
    get currentExp(): number { return this._currentExp; }
    get expToNext(): number { return this._expToNext; }
}
