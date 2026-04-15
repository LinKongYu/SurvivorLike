import { _decorator, Component, Node, Vec3, UITransform, Color, Size, Graphics, randomRange } from 'cc';
import { EnemyController } from './EnemyController';
const { ccclass, property } = _decorator;

@ccclass('EnemySpawner')
export class EnemySpawner extends Component {

    @property
    public spawnInterval: number = 2.0;

    @property
    public maxEnemies: number = 20;

    @property
    public spawnRadius: number = 500;

    @property
    public minSpawnDistance: number = 300;

    private _spawnTimer: number = 0;
    private _isSpawning: boolean = false;
    private _difficultyLevel: number = 1;
    private _playerNode: Node = null;

    setPlayerNode(node: Node): void {
        this._playerNode = node;
    }

    startSpawning(): void {
        this._isSpawning = true;
        this._spawnTimer = 0;
        this._difficultyLevel = 1;

        const pos = this._playerNode ? this._playerNode.position : Vec3.ZERO;
        for (let i = 0; i < 3; i++) {
            this.spawnEnemy(pos);
        }
    }

    stopSpawning(): void {
        this._isSpawning = false;
    }

    update(deltaTime: number): void {
        if (!this._isSpawning) return;

        this._spawnTimer += deltaTime;

        const enemyCount = this.node.children.length;
        if (this._spawnTimer >= this.spawnInterval && enemyCount < this.maxEnemies) {
            this._spawnTimer = 0;
            const pos = this._playerNode ? this._playerNode.position : Vec3.ZERO;
            this.spawnEnemy(pos);
        }
    }

    spawnEnemy(playerPos: Vec3): void {
        const angle = randomRange(0, Math.PI * 2);
        const distance = randomRange(this.minSpawnDistance, this.spawnRadius);

        const spawnX = playerPos.x + Math.cos(angle) * distance;
        const spawnY = playerPos.y + Math.sin(angle) * distance;

        const enemyNode = new Node('Enemy');
        enemyNode.setParent(this.node);
        enemyNode.setPosition(spawnX, spawnY, 0);

        const uiTransform = enemyNode.addComponent(UITransform);
        uiTransform.contentSize = new Size(40, 40);

        const g = enemyNode.addComponent(Graphics);
        g.fillColor = new Color(220, 50, 50, 255);
        g.rect(-20, -20, 40, 40);
        g.fill();

        const ctrl = enemyNode.addComponent(EnemyController);
        const hpMul = 1 + (this._difficultyLevel - 1) * 0.2;
        const dmgMul = 1 + (this._difficultyLevel - 1) * 0.1;
        const spdMul = 1 + (this._difficultyLevel - 1) * 0.05;
        ctrl.init(
            Math.floor(40 * hpMul),
            Math.floor(10 * dmgMul),
            80 * spdMul,
            5 + this._difficultyLevel
        );
    }

    increaseDifficulty(): void {
        this._difficultyLevel++;
        this.spawnInterval = Math.max(0.5, this.spawnInterval * 0.9);
        this.maxEnemies = Math.min(50, this.maxEnemies + 3);
    }

    get difficultyLevel(): number { return this._difficultyLevel; }
}
