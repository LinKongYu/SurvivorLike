import { _decorator, Component, Node, Vec3, UITransform, Color, Size, Graphics } from 'cc';
import { PlayerController } from '../player/PlayerController';
import { Bullet } from '../player/Bullet';
import { EnemyController } from '../enemy/EnemyController';
import { EnemySpawner } from '../enemy/EnemySpawner';
import { ExperienceOrb } from '../systems/ExperienceOrb';
import { UIManager } from '../ui/UIManager';
const { ccclass } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    private _playerNode: Node = null;
    private _player: PlayerController = null;
    private _spawnerNode: Node = null;
    private _spawner: EnemySpawner = null;
    private _bulletContainer: Node = null;
    private _orbContainer: Node = null;
    private _uiNode: Node = null;
    private _ui: UIManager = null;

    private _isGameRunning: boolean = false;
    private _gameTime: number = 0;
    private _lastDifficultyTime: number = 0;

    private readonly BULLET_HIT_DIST = 30;
    private readonly ENEMY_HIT_DIST = 40;

    start(): void {
        this.initGame();
    }

    private initGame(): void {
        this.createPlayer();
        this.createSpawner();
        this.createBulletContainer();
        this.createOrbContainer();
        this.createUI();

        this._isGameRunning = true;
        this._gameTime = 0;
        this._lastDifficultyTime = 0;

        this._player.init();
        this._spawner.setPlayerNode(this._playerNode);
        this._spawner.startSpawning();
        this._ui.init();
    }

    private createPlayer(): void {
        this._playerNode = new Node('Player');
        this._playerNode.setParent(this.node);
        this._playerNode.setPosition(0, 0, 0);

        const uiTransform = this._playerNode.addComponent(UITransform);
        uiTransform.contentSize = new Size(40, 40);

        const g = this._playerNode.addComponent(Graphics);
        g.fillColor = new Color(50, 180, 50, 255);
        g.rect(-20, -20, 40, 40);
        g.fill();

        this._player = this._playerNode.addComponent(PlayerController);
    }

    private createSpawner(): void {
        this._spawnerNode = new Node('EnemySpawner');
        this._spawnerNode.setParent(this.node);
        this._spawner = this._spawnerNode.addComponent(EnemySpawner);
    }

    private createBulletContainer(): void {
        this._bulletContainer = new Node('Bullets');
        this._bulletContainer.setParent(this.node);
    }

    private createOrbContainer(): void {
        this._orbContainer = new Node('Orbs');
        this._orbContainer.setParent(this.node);
    }

    private createUI(): void {
        this._uiNode = new Node('UI');
        this._uiNode.setParent(this.node);
        this._uiNode.addComponent(UITransform);
        this._ui = this._uiNode.addComponent(UIManager);
    }

    update(deltaTime: number): void {
        if (!this._isGameRunning) return;

        this._gameTime += deltaTime;

        this.updateEnemyTargets();
        this.autoFire();
        this.checkBulletEnemyCollision();
        this.checkEnemyPlayerCollision();
        this.checkOrbCollection(deltaTime);

        // Difficulty scaling every 15 seconds
        const diffTime = Math.floor(this._gameTime / 15);
        if (diffTime > this._lastDifficultyTime) {
            this._lastDifficultyTime = diffTime;
            this._spawner.increaseDifficulty();
        }

        // Update UI
        this._ui.updateHealth(this._player.currentHealth, this._player.maxHealth);
        this._ui.updateExp(this._player.currentExp, this._player.expToNext);
        this._ui.updateLevel(this._player.level);
        this._ui.updateTime(this._gameTime);

        if (!this._player.isAlive) {
            this.gameOver();
        }
    }

    private updateEnemyTargets(): void {
        const playerPos = this._playerNode.position;
        const enemies = this._spawnerNode.children;
        for (let i = 0; i < enemies.length; i++) {
            const ctrl = enemies[i].getComponent(EnemyController);
            if (ctrl && ctrl.isAlive) {
                ctrl.setTarget(playerPos);
            }
        }
    }

    private autoFire(): void {
        if (!this._player.canAttack()) return;

        const playerPos = this._playerNode.position;
        const enemies = this._spawnerNode.children;

        let nearestDistSq = Infinity;
        let nearestEnemy: Node = null;

        for (let i = 0; i < enemies.length; i++) {
            const ctrl = enemies[i].getComponent(EnemyController);
            if (!ctrl || !ctrl.isAlive) continue;

            const ePos = enemies[i].position;
            const dx = ePos.x - playerPos.x;
            const dy = ePos.y - playerPos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < nearestDistSq) {
                nearestDistSq = distSq;
                nearestEnemy = enemies[i];
            }
        }

        // Only fire if enemy is within 400px range
        if (!nearestEnemy || nearestDistSq > 400 * 400) return;

        this._player.resetAttackTimer();

        const ePos = nearestEnemy.position;
        const dx = ePos.x - playerPos.x;
        const dy = ePos.y - playerPos.y;
        const dist = Math.sqrt(nearestDistSq);
        if (dist <= 0) return;

        const bulletNode = new Node('Bullet');
        bulletNode.setParent(this._bulletContainer);
        bulletNode.setPosition(playerPos.x, playerPos.y, 0);

        const uiTransform = bulletNode.addComponent(UITransform);
        uiTransform.contentSize = new Size(10, 10);

        const g = bulletNode.addComponent(Graphics);
        g.fillColor = new Color(255, 220, 50, 255);
        g.circle(0, 0, 5);
        g.fill();

        const bullet = bulletNode.addComponent(Bullet);
        bullet.direction = new Vec3(dx / dist, dy / dist, 0);
        bullet.speed = 500;
        bullet.damage = this._player.attackDamage;
        bullet.lifeTime = 1.5;
    }

    private checkBulletEnemyCollision(): void {
        const bullets = this._bulletContainer.children;
        const enemies = this._spawnerNode.children;

        for (let i = bullets.length - 1; i >= 0; i--) {
            const bNode = bullets[i];
            if (!bNode.isValid) continue;
            const bPos = bNode.position;
            const bullet = bNode.getComponent(Bullet);
            if (!bullet) continue;

            for (let j = enemies.length - 1; j >= 0; j--) {
                const eNode = enemies[j];
                if (!eNode.isValid) continue;
                const ctrl = eNode.getComponent(EnemyController);
                if (!ctrl || !ctrl.isAlive) continue;

                const ePos = eNode.position;
                const dx = bPos.x - ePos.x;
                const dy = bPos.y - ePos.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < this.BULLET_HIT_DIST * this.BULLET_HIT_DIST) {
                    ctrl.takeDamage(bullet.damage);
                    bNode.destroy();

                    if (!ctrl.isAlive) {
                        this.spawnExpOrb(ePos, ctrl.experienceReward);
                        eNode.destroy();
                    }
                    break;
                }
            }
        }
    }

    private checkEnemyPlayerCollision(): void {
        const playerPos = this._playerNode.position;
        const enemies = this._spawnerNode.children;

        for (let i = 0; i < enemies.length; i++) {
            const eNode = enemies[i];
            if (!eNode.isValid) continue;
            const ctrl = eNode.getComponent(EnemyController);
            if (!ctrl || !ctrl.isAlive) continue;

            const ePos = eNode.position;
            const dx = playerPos.x - ePos.x;
            const dy = playerPos.y - ePos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < this.ENEMY_HIT_DIST * this.ENEMY_HIT_DIST) {
                this._player.takeDamage(ctrl.damage);
            }
        }
    }

    private checkOrbCollection(deltaTime: number): void {
        const playerPos = this._playerNode.position;
        const orbs = this._orbContainer.children;

        for (let i = orbs.length - 1; i >= 0; i--) {
            const orbNode = orbs[i];
            if (!orbNode.isValid) continue;
            const orb = orbNode.getComponent(ExperienceOrb);
            if (!orb || orb.collected) continue;

            orb.tryAttract(playerPos);

            if (orb.isAttracted) {
                const collected = orb.moveToward(playerPos, deltaTime);
                if (collected) {
                    this._player.addExperience(orb.experienceValue);
                    orbNode.destroy();
                }
            }
        }
    }

    private spawnExpOrb(pos: Vec3, expValue: number): void {
        const orbNode = new Node('ExpOrb');
        orbNode.setParent(this._orbContainer);
        orbNode.setPosition(pos.x, pos.y, 0);

        const uiTransform = orbNode.addComponent(UITransform);
        uiTransform.contentSize = new Size(14, 14);

        const g = orbNode.addComponent(Graphics);
        g.fillColor = new Color(80, 150, 255, 255);
        g.circle(0, 0, 7);
        g.fill();

        const orb = orbNode.addComponent(ExperienceOrb);
        orb.init(expValue);
    }

    private gameOver(): void {
        this._isGameRunning = false;
        this._spawner.stopSpawning();
        this._ui.showGameOver(0, this._gameTime);
    }
}
