import {
    Node, Label, UITransform, Color, Size,
    Sprite, SpriteFrame, Texture2D, ImageAsset,
} from 'cc';
import { query, removeComponent } from '../../bitEcs';
import { Health, PlayerInput, Level, healthStore, playerInputStore, levelStore } from '../Components';
import { LevelUpRequest, levelUpRequestStore } from '../SkillComponents';
import { getUpgradeById, pickRandomUpgrades } from '../UpgradePool';

/**
 * UISystem — HUD + 升级面板 + GameOver
 * Priority: 95
 */
export class UISystem {
    private _rootNode: Node;
    private _initialized = false;
    private _defaultSF: SpriteFrame | null = null;

    private _hpBarFill: Node = null!;
    private _expBarFill: Node = null!;
    private _levelLabel: Label = null!;
    private _timeLabel: Label = null!;

    private _levelUpPanel: Node = null!;
    private _cardNodes: Node[] = [];
    private _cardNameLabels: Label[] = [];
    private _cardDescLabels: Label[] = [];

    private _gameOverPanel: Node = null!;
    private _gameOverLabel: Label = null!;

    private _cachedHpRatio = -1;
    private _cachedExpRatio = -1;
    private _cachedLevel = -1;

    private _gameTime = 0;
    private _gameOverShown = false;

    private _currentWorld: any = null;
    private _currentPlayerEid = -1;

    constructor(rootNode: Node) {
        this._rootNode = rootNode;
    }

    update(dt: number, world: any): void {
        if (!this._initialized) {
            this._defaultSF = this.createWhiteSpriteFrame();
            this.createUI();
            this._initialized = true;
        }

        if (!world.paused && !world.gameOver) {
            this._gameTime += dt;
        }

        const players = query(world, [PlayerInput]);
        if (players.length === 0) return;
        const playerEid = players[0];

        const hp = healthStore.get(playerEid);
        const level = levelStore.get(playerEid);

        if (hp) {
            const ratio = hp.maxHp > 0 ? hp.hp / hp.maxHp : 0;
            if (Math.abs(ratio - this._cachedHpRatio) > 0.001) {
                this._cachedHpRatio = ratio;
                this.updateHPBar(ratio);
            }
        }

        if (level) {
            const ratio = level.expToNext > 0 ? level.exp / level.expToNext : 0;
            if (Math.abs(ratio - this._cachedExpRatio) > 0.01) {
                this._cachedExpRatio = ratio;
                this.updateExpBar(ratio);
            }
            if (level.level !== this._cachedLevel) {
                this._cachedLevel = level.level;
                this._levelLabel.string = `Lv.${level.level}`;
            }
        }

        const min = Math.floor(this._gameTime / 60);
        const sec = Math.floor(this._gameTime % 60);
        this._timeLabel.string = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

        const req = levelUpRequestStore.get(playerEid);
        if (req && req.pendingCount > 0) {
            if (!this._levelUpPanel.active) {
                this.showLevelUpPanel(world, playerEid, req);
            }
        } else if (this._levelUpPanel.active) {
            this._levelUpPanel.active = false;
        }

        if (world.gameOver && !this._gameOverShown) {
            this._gameOverShown = true;
            this._gameOverPanel.active = true;
            this._gameOverLabel.string = `Survived: ${min}m ${sec}s`;
        }
    }

    private createWhiteSpriteFrame(): SpriteFrame {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1, 1);
        const imageAsset = new ImageAsset(canvas);
        const texture = new Texture2D();
        texture.image = imageAsset;
        const sf = new SpriteFrame();
        sf.texture = texture;
        return sf;
    }

    private createColoredRect(
        parent: Node, name: string, w: number, h: number,
        color: Color, ax = 0.5, ay = 0.5,
    ): Node {
        const node = new Node(name);
        node.setParent(parent);
        const t = node.addComponent(UITransform);
        t.contentSize = new Size(w, h);
        t.anchorX = ax; t.anchorY = ay;
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = this._defaultSF;
        sprite.color = color;
        return node;
    }

    private createUI(): void {
        this.createHPBar();
        this.createExpBar();
        this.createLevelLabel();
        this.createTimeLabel();
        this.createLevelUpPanel();
        this.createGameOverPanel();
    }

    private createHPBar(): void {
        const bg = this.createColoredRect(this._rootNode, 'HPBarBg', 200, 16, new Color(80, 0, 0, 255), 0, 0.5);
        bg.setPosition(-200, 320, 0);
        this._hpBarFill = this.createColoredRect(this._rootNode, 'HPBarFill', 200, 16, new Color(0, 200, 0, 255), 0, 0.5);
        this._hpBarFill.setPosition(-200, 320, 0);
        const lbl = new Node('HPLabel');
        lbl.setParent(this._rootNode);
        lbl.setPosition(-100, 338, 0);
        lbl.addComponent(UITransform);
        const l = lbl.addComponent(Label);
        l.string = 'HP'; l.fontSize = 14; l.color = new Color(255, 255, 255, 255);
    }

    private updateHPBar(ratio: number): void {
        const r = Math.max(0, Math.min(1, ratio));
        const t = this._hpBarFill.getComponent(UITransform);
        if (t) t.contentSize = new Size(200 * r, 16);
        const sprite = this._hpBarFill.getComponent(Sprite);
        if (sprite) {
            if (r > 0.6) sprite.color = new Color(0, 200, 0, 255);
            else if (r > 0.3) sprite.color = new Color(200, 200, 0, 255);
            else sprite.color = new Color(200, 0, 0, 255);
        }
    }

    private createExpBar(): void {
        const bg = this.createColoredRect(this._rootNode, 'ExpBarBg', 200, 10, new Color(0, 0, 80, 255), 0, 0.5);
        bg.setPosition(-200, 298, 0);
        this._expBarFill = this.createColoredRect(this._rootNode, 'ExpBarFill', 0, 10, new Color(50, 100, 255, 255), 0, 0.5);
        this._expBarFill.setPosition(-200, 298, 0);
    }

    private updateExpBar(ratio: number): void {
        const r = Math.max(0, Math.min(1, ratio));
        const t = this._expBarFill.getComponent(UITransform);
        if (t) t.contentSize = new Size(200 * r, 10);
    }

    private createLevelLabel(): void {
        const node = new Node('LevelText');
        node.setParent(this._rootNode);
        node.setPosition(50, 320, 0);
        node.addComponent(UITransform);
        this._levelLabel = node.addComponent(Label);
        this._levelLabel.string = 'Lv.1'; this._levelLabel.fontSize = 20;
        this._levelLabel.color = new Color(255, 255, 0, 255);
    }

    private createTimeLabel(): void {
        const node = new Node('TimeText');
        node.setParent(this._rootNode);
        node.setPosition(150, 320, 0);
        node.addComponent(UITransform);
        this._timeLabel = node.addComponent(Label);
        this._timeLabel.string = '00:00'; this._timeLabel.fontSize = 18;
        this._timeLabel.color = new Color(255, 255, 255, 255);
    }

    private createLevelUpPanel(): void {
        this._levelUpPanel = new Node('LevelUpPanel');
        this._levelUpPanel.setParent(this._rootNode);
        this._levelUpPanel.setPosition(0, 0, 0);
        this._levelUpPanel.active = false;

        this.createColoredRect(this._levelUpPanel, 'LUBg', 960, 640, new Color(0, 0, 0, 180)).setPosition(0, 0, 0);
        const title = new Node('LUTitle');
        title.setParent(this._levelUpPanel);
        title.setPosition(0, 180, 0);
        title.addComponent(UITransform);
        const tl = title.addComponent(Label);
        tl.string = 'LEVEL UP!'; tl.fontSize = 40; tl.color = new Color(255, 220, 0, 255);

        const cardW = 200, cardH = 220, borderW = 3, gap = 40;
        const totalW = cardW * 3 + gap * 2;
        const startX = -totalW / 2 + cardW / 2;

        for (let i = 0; i < 3; i++) {
            const card = new Node(`Card_${i}`);
            card.setParent(this._levelUpPanel);
            card.setPosition(startX + i * (cardW + gap), 0, 0);
            card.addComponent(UITransform).contentSize = new Size(cardW, cardH);

            this.createColoredRect(card, 'Border', cardW, cardH, new Color(255, 220, 0, 255));
            this.createColoredRect(card, 'Bg', cardW - borderW * 2, cardH - borderW * 2, new Color(40, 50, 80, 240));

            const name = new Node('Name');
            name.setParent(card); name.setPosition(0, 60, 0); name.addComponent(UITransform);
            const nameLbl = name.addComponent(Label);
            nameLbl.string = ''; nameLbl.fontSize = 22; nameLbl.color = new Color(255, 255, 255, 255);

            const desc = new Node('Desc');
            desc.setParent(card); desc.setPosition(0, 0, 0);
            desc.addComponent(UITransform).contentSize = new Size(cardW - 20, 120);
            const descLbl = desc.addComponent(Label);
            descLbl.string = ''; descLbl.fontSize = 16; descLbl.color = new Color(200, 220, 255, 255);
            descLbl.enableWrapText = true;

            const idx = i;
            card.on(Node.EventType.TOUCH_END, () => this.onCardSelected(idx));

            this._cardNodes.push(card);
            this._cardNameLabels.push(nameLbl);
            this._cardDescLabels.push(descLbl);
        }
    }

    private showLevelUpPanel(world: any, playerEid: number, req: any): void {
        this._levelUpPanel.active = true;
        for (let i = 0; i < 3; i++) {
            if (i < req.currentChoices.length) {
                const def = getUpgradeById(req.currentChoices[i]);
                this._cardNodes[i].active = true;
                this._cardNameLabels[i].string = def ? def.name : '(未知)';
                this._cardDescLabels[i].string = def ? def.desc : '';
            } else {
                this._cardNodes[i].active = false;
            }
        }
        this._currentWorld = world;
        this._currentPlayerEid = playerEid;
    }

    private onCardSelected(cardIndex: number): void {
        const world = this._currentWorld;
        const playerEid = this._currentPlayerEid;
        if (!world || playerEid < 0) return;

        const req = levelUpRequestStore.get(playerEid);
        if (!req || cardIndex >= req.currentChoices.length) return;

        const def = getUpgradeById(req.currentChoices[cardIndex]);
        if (def) def.apply(world, playerEid);

        req.pendingCount -= 1;
        if (req.pendingCount > 0) {
            req.currentChoices = pickRandomUpgrades(world, playerEid, 3).map(u => u.id);
            this.showLevelUpPanel(world, playerEid, req);
        } else {
            levelUpRequestStore.delete(playerEid);
            removeComponent(world, playerEid, LevelUpRequest);
            world.paused = false;
            this._levelUpPanel.active = false;
        }
    }

    private createGameOverPanel(): void {
        this._gameOverPanel = new Node('GameOverPanel');
        this._gameOverPanel.setParent(this._rootNode);
        this._gameOverPanel.setPosition(0, 0, 0);
        this._gameOverPanel.active = false;
        this.createColoredRect(this._gameOverPanel, 'GOBg', 960, 640, new Color(0, 0, 0, 150)).setPosition(0, 0, 0);
        const title = new Node('GOTitle');
        title.setParent(this._gameOverPanel); title.setPosition(0, 50, 0); title.addComponent(UITransform);
        const tl = title.addComponent(Label);
        tl.string = 'GAME OVER'; tl.fontSize = 48; tl.color = new Color(255, 50, 50, 255);
        const info = new Node('GOInfo');
        info.setParent(this._gameOverPanel); info.setPosition(0, -20, 0); info.addComponent(UITransform);
        this._gameOverLabel = info.addComponent(Label);
        this._gameOverLabel.string = ''; this._gameOverLabel.fontSize = 24;
        this._gameOverLabel.color = new Color(255, 255, 255, 255);
    }
}
