import {
    Node, Label, UITransform, Color, Size,
    Sprite, SpriteFrame, builtinResMgr,
} from 'cc';
import { ISystem, ECSWorld } from '../World';
import { Health, PlayerTag, Level } from '../Components';
import { LevelUpRequest } from '../SkillComponents';
import { getUpgradeById, pickRandomUpgrades } from '../UpgradePool';

/**
 * UISystem - HUD 显示 + 升级选择面板
 * Priority: 95
 *
 * 所有 UI 元素使用 Sprite + Cocos 内置白色 SpriteFrame + 颜色 tint 实现，
 * 不依赖 Graphics。SpriteFrame 通过 builtinResMgr 获取内置的 default-sprite-splash。
 */
export class UISystem implements ISystem {

    private _rootNode: Node;
    private _initialized: boolean = false;
    private _defaultSF: SpriteFrame | null = null;

    // HUD
    private _hpBarFill: Node = null!;
    private _expBarFill: Node = null!;
    private _levelLabel: Label = null!;
    private _timeLabel: Label = null!;

    // 升级面板
    private _levelUpPanel: Node = null!;
    private _cardNodes: Node[] = [];
    private _cardNameLabels: Label[] = [];
    private _cardDescLabels: Label[] = [];

    // Game Over
    private _gameOverPanel: Node = null!;
    private _gameOverLabel: Label = null!;

    // 缓存
    private _cachedHpRatio: number = -1;
    private _cachedExpRatio: number = -1;
    private _cachedLevel: number = -1;

    private _gameTime: number = 0;
    private _gameOverShown: boolean = false;

    private _currentWorld: ECSWorld | null = null;
    private _currentPlayerEid: number = -1;

    constructor(rootNode: Node) {
        this._rootNode = rootNode;
    }

    update(dt: number, world: ECSWorld): void {
        if (!this._initialized) {
            this._defaultSF = builtinResMgr.get<SpriteFrame>('default-sprite-splash');
            if (!this._defaultSF) {
                console.warn('[UISystem] 未找到内置 default-sprite-splash，UI 可能不显示背景');
            }
            this.createUI();
            this._initialized = true;
        }

        if (!world.isPaused() && !world.isGameOver()) {
            this._gameTime += dt;
        }

        const player = world.getSingleton(PlayerTag);
        if (!player) return;

        const hp = world.getComponent(player.eid, Health);
        const level = world.getComponent(player.eid, Level);

        // HP 条
        if (hp) {
            const ratio = hp.maxHp > 0 ? hp.hp / hp.maxHp : 0;
            if (Math.abs(ratio - this._cachedHpRatio) > 0.001) {
                this._cachedHpRatio = ratio;
                this.updateHPBar(ratio);
            }
        }

        // 经验条 + 等级
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

        // 时间
        const min = Math.floor(this._gameTime / 60);
        const sec = Math.floor(this._gameTime % 60);
        this._timeLabel.string = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

        // 升级面板
        const req = world.getComponent(player.eid, LevelUpRequest);
        if (req && req.pendingCount > 0) {
            if (!this._levelUpPanel.active) {
                this.showLevelUpPanel(world, player.eid, req);
            }
        } else if (this._levelUpPanel.active) {
            this._levelUpPanel.active = false;
        }

        // Game Over
        if (world.isGameOver() && !this._gameOverShown) {
            this._gameOverShown = true;
            this._gameOverPanel.active = true;
            this._gameOverLabel.string = `Survived: ${min}m ${sec}s`;
        }
    }

    // ─── 工具：用 Sprite 创建纯色矩形 ───

    /** 使用内置白色 SpriteFrame + 颜色 tint 创建一个纯色矩形节点 */
    private createColoredRect(
        parent: Node, name: string,
        width: number, height: number,
        color: Color,
        anchorX: number = 0.5, anchorY: number = 0.5,
    ): Node {
        const node = new Node(name);
        node.setParent(parent);
        const t = node.addComponent(UITransform);
        t.contentSize = new Size(width, height);
        t.anchorX = anchorX;
        t.anchorY = anchorY;
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = this._defaultSF;
        sprite.color = color;
        return node;
    }

    // ─── UI 构建 ───

    private createUI(): void {
        this.createHPBar();
        this.createExpBar();
        this.createLevelLabel();
        this.createTimeLabel();
        this.createLevelUpPanel();
        this.createGameOverPanel();
    }

    private createHPBar(): void {
        // 背景：anchor 左中，位置 (-200, 320) 即屏幕左上
        const bg = this.createColoredRect(
            this._rootNode, 'HPBarBg', 200, 16,
            new Color(80, 0, 0, 255), 0, 0.5,
        );
        bg.setPosition(-200, 320, 0);

        // 填充：anchor 左中，宽度随血量变化
        this._hpBarFill = this.createColoredRect(
            this._rootNode, 'HPBarFill', 200, 16,
            new Color(0, 200, 0, 255), 0, 0.5,
        );
        this._hpBarFill.setPosition(-200, 320, 0);

        // HP 文字
        const lbl = new Node('HPLabel');
        lbl.setParent(this._rootNode);
        lbl.setPosition(-100, 338, 0);
        lbl.addComponent(UITransform);
        const l = lbl.addComponent(Label);
        l.string = 'HP';
        l.fontSize = 14;
        l.color = new Color(255, 255, 255, 255);
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
        const bg = this.createColoredRect(
            this._rootNode, 'ExpBarBg', 200, 10,
            new Color(0, 0, 80, 255), 0, 0.5,
        );
        bg.setPosition(-200, 298, 0);

        this._expBarFill = this.createColoredRect(
            this._rootNode, 'ExpBarFill', 0, 10,
            new Color(50, 100, 255, 255), 0, 0.5,
        );
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

    /**
     * 升级面板（初始隐藏）
     * 布局：屏幕中央半透明遮罩 + 标题 + 3 张横排卡片
     * 卡片边框通过"大黄矩形 + 略小深蓝矩形"两层叠放实现（无需描边）
     */
    private createLevelUpPanel(): void {
        this._levelUpPanel = new Node('LevelUpPanel');
        this._levelUpPanel.setParent(this._rootNode);
        this._levelUpPanel.setPosition(0, 0, 0);
        this._levelUpPanel.active = false;

        // 半透明背景遮罩
        this.createColoredRect(
            this._levelUpPanel, 'LUBg', 960, 640,
            new Color(0, 0, 0, 180),
        ).setPosition(0, 0, 0);

        // 标题
        const title = new Node('LUTitle');
        title.setParent(this._levelUpPanel);
        title.setPosition(0, 180, 0);
        title.addComponent(UITransform);
        const titleLabel = title.addComponent(Label);
        titleLabel.string = 'LEVEL UP!';
        titleLabel.fontSize = 40;
        titleLabel.color = new Color(255, 220, 0, 255);

        // 3 张卡片
        const cardW = 200;
        const cardH = 220;
        const borderW = 3;
        const gap = 40;
        const totalW = cardW * 3 + gap * 2;
        const startX = -totalW / 2 + cardW / 2;

        for (let i = 0; i < 3; i++) {
            const card = new Node(`Card_${i}`);
            card.setParent(this._levelUpPanel);
            card.setPosition(startX + i * (cardW + gap), 0, 0);
            const ct = card.addComponent(UITransform);
            ct.contentSize = new Size(cardW, cardH);
            ct.anchorX = 0.5;
            ct.anchorY = 0.5;

            // 黄色边框（大矩形）
            this.createColoredRect(
                card, 'Border', cardW, cardH,
                new Color(255, 220, 0, 255),
            );
            // 深蓝背景（小 borderW*2，位于边框上方）
            this.createColoredRect(
                card, 'Bg', cardW - borderW * 2, cardH - borderW * 2,
                new Color(40, 50, 80, 240),
            );

            // 名称
            const name = new Node('Name');
            name.setParent(card);
            name.setPosition(0, 60, 0);
            name.addComponent(UITransform);
            const nameLabel = name.addComponent(Label);
            nameLabel.string = '';
            nameLabel.fontSize = 22;
            nameLabel.color = new Color(255, 255, 255, 255);

            // 描述
            const desc = new Node('Desc');
            desc.setParent(card);
            desc.setPosition(0, 0, 0);
            desc.addComponent(UITransform).contentSize = new Size(cardW - 20, 120);
            const descLabel = desc.addComponent(Label);
            descLabel.string = '';
            descLabel.fontSize = 16;
            descLabel.color = new Color(200, 220, 255, 255);
            descLabel.enableWrapText = true;

            // 点击处理：TOUCH_END 适用于鼠标点击和触摸
            const cardIndex = i;
            card.on(Node.EventType.TOUCH_END, () => {
                this.onCardSelected(cardIndex);
            }, this);

            this._cardNodes.push(card);
            this._cardNameLabels.push(nameLabel);
            this._cardDescLabels.push(descLabel);
        }
    }

    private showLevelUpPanel(world: ECSWorld, playerEid: number, req: LevelUpRequest): void {
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

        const req = world.getComponent(playerEid, LevelUpRequest);
        if (!req || cardIndex >= req.currentChoices.length) return;

        const def = getUpgradeById(req.currentChoices[cardIndex]);
        if (def) def.apply(world, playerEid);

        req.pendingCount -= 1;

        if (req.pendingCount > 0) {
            req.currentChoices = pickRandomUpgrades(world, playerEid, 3).map(u => u.id);
            this.showLevelUpPanel(world, playerEid, req);
        } else {
            world.removeComponent(playerEid, LevelUpRequest);
            world.setPaused(false);
            this._levelUpPanel.active = false;
        }
    }

    private createGameOverPanel(): void {
        this._gameOverPanel = new Node('GameOverPanel');
        this._gameOverPanel.setParent(this._rootNode);
        this._gameOverPanel.setPosition(0, 0, 0);
        this._gameOverPanel.active = false;

        this.createColoredRect(
            this._gameOverPanel, 'GOBg', 960, 640,
            new Color(0, 0, 0, 150),
        ).setPosition(0, 0, 0);

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
