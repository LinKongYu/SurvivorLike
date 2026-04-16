import { Node, Label, UITransform, Color, Size, Graphics } from 'cc';
import { ISystem, ECSWorld } from '../World';
import { Health, PlayerTag, Level, SpawnerComp } from '../Components';

/**
 * UISystem - HUD 显示
 * Priority: 95
 */
export class UISystem implements ISystem {

    private _rootNode: Node;
    private _initialized: boolean = false;

    // UI 元素
    private _hpBarG: Graphics = null!;
    private _expBarG: Graphics = null!;
    private _levelLabel: Label = null!;
    private _timeLabel: Label = null!;
    private _gameOverPanel: Node = null!;
    private _gameOverLabel: Label = null!;

    // 缓存值，避免每帧重绘
    private _cachedHpRatio: number = -1;
    private _cachedExpRatio: number = -1;
    private _cachedLevel: number = -1;

    private _gameTime: number = 0;
    private _gameOverShown: boolean = false;

    constructor(rootNode: Node) {
        this._rootNode = rootNode;
    }

    update(dt: number, world: ECSWorld): void {
        if (!this._initialized) {
            this.createUI();
            this._initialized = true;
        }

        if (!world.isGameOver()) {
            this._gameTime += dt;
        }

        const player = world.getSingleton(PlayerTag);
        if (!player) return;

        const hp = world.getComponent(player.eid, Health);
        const level = world.getComponent(player.eid, Level);

        // HP bar
        if (hp) {
            const ratio = hp.maxHp > 0 ? hp.hp / hp.maxHp : 0;
            if (Math.abs(ratio - this._cachedHpRatio) > 0.001) {
                this._cachedHpRatio = ratio;
                this.drawHPBar(ratio);
            }
        }

        // EXP bar
        if (level) {
            const ratio = level.expToNext > 0 ? level.exp / level.expToNext : 0;
            if (Math.abs(ratio - this._cachedExpRatio) > 0.01) {
                this._cachedExpRatio = ratio;
                this.drawExpBar(ratio);
            }
            if (level.level !== this._cachedLevel) {
                this._cachedLevel = level.level;
                this._levelLabel.string = `Lv.${level.level}`;
            }
        }

        // Time
        const min = Math.floor(this._gameTime / 60);
        const sec = Math.floor(this._gameTime % 60);
        this._timeLabel.string = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

        // Game Over
        if (world.isGameOver() && !this._gameOverShown) {
            this._gameOverShown = true;
            this._gameOverPanel.active = true;
            this._gameOverLabel.string = `Survived: ${min}m ${sec}s`;
        }
    }

    // ─── UI Creation ───

    private createUI(): void {
        this.createHPBar();
        this.createExpBar();
        this.createLevelLabel();
        this.createTimeLabel();
        this.createGameOverPanel();
    }

    private createHPBar(): void {
        // Background
        const bg = new Node('HPBarBg');
        bg.setParent(this._rootNode);
        bg.setPosition(-200, 320, 0);
        bg.addComponent(UITransform);
        const bgG = bg.addComponent(Graphics);
        bgG.fillColor = new Color(80, 0, 0, 255);
        bgG.rect(0, -8, 200, 16);
        bgG.fill();

        // Fill
        const fill = new Node('HPBarFill');
        fill.setParent(this._rootNode);
        fill.setPosition(-200, 320, 0);
        fill.addComponent(UITransform);
        this._hpBarG = fill.addComponent(Graphics);
        this.drawHPBar(1);

        // Label
        const lbl = new Node('HPLabel');
        lbl.setParent(this._rootNode);
        lbl.setPosition(-100, 338, 0);
        lbl.addComponent(UITransform);
        const l = lbl.addComponent(Label);
        l.string = 'HP';
        l.fontSize = 14;
        l.color = new Color(255, 255, 255, 255);
    }

    private drawHPBar(ratio: number): void {
        this._hpBarG.clear();
        if (ratio > 0.6) this._hpBarG.fillColor = new Color(0, 200, 0, 255);
        else if (ratio > 0.3) this._hpBarG.fillColor = new Color(200, 200, 0, 255);
        else this._hpBarG.fillColor = new Color(200, 0, 0, 255);
        this._hpBarG.rect(0, -8, 200 * Math.max(0, ratio), 16);
        this._hpBarG.fill();
    }

    private createExpBar(): void {
        const bg = new Node('ExpBarBg');
        bg.setParent(this._rootNode);
        bg.setPosition(-200, 298, 0);
        bg.addComponent(UITransform);
        const bgG = bg.addComponent(Graphics);
        bgG.fillColor = new Color(0, 0, 80, 255);
        bgG.rect(0, -5, 200, 10);
        bgG.fill();

        const fill = new Node('ExpBarFill');
        fill.setParent(this._rootNode);
        fill.setPosition(-200, 298, 0);
        fill.addComponent(UITransform);
        this._expBarG = fill.addComponent(Graphics);
    }

    private drawExpBar(ratio: number): void {
        this._expBarG.clear();
        this._expBarG.fillColor = new Color(50, 100, 255, 255);
        this._expBarG.rect(0, -5, 200 * Math.min(1, Math.max(0, ratio)), 10);
        this._expBarG.fill();
    }

    private createLevelLabel(): void {
        const node = new Node('LevelText');
        node.setParent(this._rootNode);
        node.setPosition(50, 320, 0);
        node.addComponent(UITransform);
        this._levelLabel = node.addComponent(Label);
        this._levelLabel.string = 'Lv.1';
        this._levelLabel.fontSize = 20;
        this._levelLabel.color = new Color(255, 255, 0, 255);
    }

    private createTimeLabel(): void {
        const node = new Node('TimeText');
        node.setParent(this._rootNode);
        node.setPosition(150, 320, 0);
        node.addComponent(UITransform);
        this._timeLabel = node.addComponent(Label);
        this._timeLabel.string = '00:00';
        this._timeLabel.fontSize = 18;
        this._timeLabel.color = new Color(255, 255, 255, 255);
    }

    private createGameOverPanel(): void {
        this._gameOverPanel = new Node('GameOverPanel');
        this._gameOverPanel.setParent(this._rootNode);
        this._gameOverPanel.setPosition(0, 0, 0);
        this._gameOverPanel.active = false;

        const bg = new Node('GOBg');
        bg.setParent(this._gameOverPanel);
        bg.setPosition(0, 0, 0);
        bg.addComponent(UITransform).contentSize = new Size(960, 640);
        const bgG = bg.addComponent(Graphics);
        bgG.fillColor = new Color(0, 0, 0, 150);
        bgG.rect(-480, -320, 960, 640);
        bgG.fill();

        const title = new Node('GOTitle');
        title.setParent(this._gameOverPanel);
        title.setPosition(0, 50, 0);
        title.addComponent(UITransform);
        const tl = title.addComponent(Label);
        tl.string = 'GAME OVER';
        tl.fontSize = 48;
        tl.color = new Color(255, 50, 50, 255);

        const info = new Node('GOInfo');
        info.setParent(this._gameOverPanel);
        info.setPosition(0, -20, 0);
        info.addComponent(UITransform);
        this._gameOverLabel = info.addComponent(Label);
        this._gameOverLabel.string = '';
        this._gameOverLabel.fontSize = 24;
        this._gameOverLabel.color = new Color(255, 255, 255, 255);
    }
}
