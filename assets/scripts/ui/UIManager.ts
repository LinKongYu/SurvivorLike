import { _decorator, Component, Node, Label, UITransform, Color, Size, Graphics } from 'cc';
const { ccclass } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {

    private _hpBarFillGraphics: Graphics = null;
    private _expBarFillGraphics: Graphics = null;
    private _levelLabel: Label = null;
    private _timeLabel: Label = null;
    private _gameOverPanel: Node = null;
    private _gameOverLabel: Label = null;

    private _hpRatio: number = 1;
    private _expRatio: number = 0;

    init(): void {
        this.createHPBar();
        this.createExpBar();
        this.createLevelLabel();
        this.createTimeLabel();
        this.createGameOverPanel();
    }

    private createHPBar(): void {
        // HP bar background
        const bgNode = new Node('HPBarBg');
        bgNode.setParent(this.node);
        bgNode.setPosition(-200, 320, 0);
        bgNode.addComponent(UITransform);
        const bgG = bgNode.addComponent(Graphics);
        bgG.fillColor = new Color(80, 0, 0, 255);
        bgG.rect(0, -8, 200, 16);
        bgG.fill();

        // HP bar fill
        const fillNode = new Node('HPBarFill');
        fillNode.setParent(this.node);
        fillNode.setPosition(-200, 320, 0);
        fillNode.addComponent(UITransform);
        this._hpBarFillGraphics = fillNode.addComponent(Graphics);
        this.drawHPBar(1);

        // HP label
        const labelNode = new Node('HPLabel');
        labelNode.setParent(this.node);
        labelNode.setPosition(-100, 338, 0);
        labelNode.addComponent(UITransform);
        const hpLabel = labelNode.addComponent(Label);
        hpLabel.string = 'HP';
        hpLabel.fontSize = 14;
        hpLabel.color = new Color(255, 255, 255, 255);
    }

    private drawHPBar(ratio: number): void {
        if (!this._hpBarFillGraphics) return;
        this._hpBarFillGraphics.clear();
        if (ratio > 0.6) {
            this._hpBarFillGraphics.fillColor = new Color(0, 200, 0, 255);
        } else if (ratio > 0.3) {
            this._hpBarFillGraphics.fillColor = new Color(200, 200, 0, 255);
        } else {
            this._hpBarFillGraphics.fillColor = new Color(200, 0, 0, 255);
        }
        this._hpBarFillGraphics.rect(0, -8, 200 * Math.max(0, ratio), 16);
        this._hpBarFillGraphics.fill();
    }

    private createExpBar(): void {
        // EXP bar background
        const bgNode = new Node('ExpBarBg');
        bgNode.setParent(this.node);
        bgNode.setPosition(-200, 298, 0);
        bgNode.addComponent(UITransform);
        const bgG = bgNode.addComponent(Graphics);
        bgG.fillColor = new Color(0, 0, 80, 255);
        bgG.rect(0, -5, 200, 10);
        bgG.fill();

        // EXP bar fill
        const fillNode = new Node('ExpBarFill');
        fillNode.setParent(this.node);
        fillNode.setPosition(-200, 298, 0);
        fillNode.addComponent(UITransform);
        this._expBarFillGraphics = fillNode.addComponent(Graphics);
    }

    private drawExpBar(ratio: number): void {
        if (!this._expBarFillGraphics) return;
        this._expBarFillGraphics.clear();
        this._expBarFillGraphics.fillColor = new Color(50, 100, 255, 255);
        this._expBarFillGraphics.rect(0, -5, 200 * Math.min(1, Math.max(0, ratio)), 10);
        this._expBarFillGraphics.fill();
    }

    private createLevelLabel(): void {
        const node = new Node('LevelText');
        node.setParent(this.node);
        node.setPosition(50, 320, 0);
        node.addComponent(UITransform);
        this._levelLabel = node.addComponent(Label);
        this._levelLabel.string = 'Lv.1';
        this._levelLabel.fontSize = 20;
        this._levelLabel.color = new Color(255, 255, 0, 255);
    }

    private createTimeLabel(): void {
        const node = new Node('TimeText');
        node.setParent(this.node);
        node.setPosition(150, 320, 0);
        node.addComponent(UITransform);
        this._timeLabel = node.addComponent(Label);
        this._timeLabel.string = '00:00';
        this._timeLabel.fontSize = 18;
        this._timeLabel.color = new Color(255, 255, 255, 255);
    }

    private createGameOverPanel(): void {
        this._gameOverPanel = new Node('GameOverPanel');
        this._gameOverPanel.setParent(this.node);
        this._gameOverPanel.setPosition(0, 0, 0);
        this._gameOverPanel.active = false;

        // Semi-transparent background
        const bgNode = new Node('GameOverBg');
        bgNode.setParent(this._gameOverPanel);
        bgNode.setPosition(0, 0, 0);
        const bgTrans = bgNode.addComponent(UITransform);
        bgTrans.contentSize = new Size(960, 640);
        const bgG = bgNode.addComponent(Graphics);
        bgG.fillColor = new Color(0, 0, 0, 150);
        bgG.rect(-480, -320, 960, 640);
        bgG.fill();

        // Game over text
        const textNode = new Node('GameOverText');
        textNode.setParent(this._gameOverPanel);
        textNode.setPosition(0, 50, 0);
        textNode.addComponent(UITransform);
        const label = textNode.addComponent(Label);
        label.string = 'GAME OVER';
        label.fontSize = 48;
        label.color = new Color(255, 50, 50, 255);

        // Info text
        const infoNode = new Node('InfoText');
        infoNode.setParent(this._gameOverPanel);
        infoNode.setPosition(0, -20, 0);
        infoNode.addComponent(UITransform);
        this._gameOverLabel = infoNode.addComponent(Label);
        this._gameOverLabel.string = '';
        this._gameOverLabel.fontSize = 24;
        this._gameOverLabel.color = new Color(255, 255, 255, 255);
    }

    updateHealth(current: number, max: number): void {
        const ratio = max > 0 ? current / max : 0;
        if (Math.abs(ratio - this._hpRatio) > 0.001) {
            this._hpRatio = ratio;
            this.drawHPBar(ratio);
        }
    }

    updateExp(current: number, toNext: number): void {
        const ratio = toNext > 0 ? current / toNext : 0;
        if (Math.abs(ratio - this._expRatio) > 0.01) {
            this._expRatio = ratio;
            this.drawExpBar(ratio);
        }
    }

    updateLevel(level: number): void {
        if (this._levelLabel) {
            this._levelLabel.string = `Lv.${level}`;
        }
    }

    updateTime(time: number): void {
        if (this._timeLabel) {
            const min = Math.floor(time / 60);
            const sec = Math.floor(time % 60);
            this._timeLabel.string = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }
    }

    showGameOver(score: number, time: number): void {
        if (this._gameOverPanel) {
            this._gameOverPanel.active = true;
            const min = Math.floor(time / 60);
            const sec = Math.floor(time % 60);
            if (this._gameOverLabel) {
                this._gameOverLabel.string = `Survived: ${min}m ${sec}s`;
            }
        }
    }
}
