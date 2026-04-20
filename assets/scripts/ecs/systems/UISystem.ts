import { Node, Label, UITransform, Color, Size, Graphics } from 'cc';
import { ISystem, ECSWorld } from '../World';
import { Health, PlayerTag, Level } from '../Components';
import { LevelUpRequest } from '../SkillComponents';
import { getUpgradeById, pickRandomUpgrades } from '../UpgradePool';

/**
 * UISystem - HUD 显示 + 升级选择面板
 * Priority: 95
 *
 * HUD：HP 条、经验条、等级、存活时间
 * 升级面板：三张卡片，点击后应用升级 + 处理队列
 * Game Over：死亡后叠加半透明黑+文字
 */
export class UISystem implements ISystem {

    private _rootNode: Node;
    private _initialized: boolean = false;

    // HUD
    private _hpBarG: Graphics = null!;
    private _expBarG: Graphics = null!;
    private _levelLabel: Label = null!;
    private _timeLabel: Label = null!;

    // 升级面板
    private _levelUpPanel: Node = null!;
    private _levelUpTitle: Label = null!;
    /** 3 个卡片节点及其内部 Label */
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

    constructor(rootNode: Node) {
        this._rootNode = rootNode;
    }

    update(dt: number, world: ECSWorld): void {
        if (!this._initialized) {
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

        // HP
        if (hp) {
            const ratio = hp.maxHp > 0 ? hp.hp / hp.maxHp : 0;
            if (Math.abs(ratio - this._cachedHpRatio) > 0.001) {
                this._cachedHpRatio = ratio;
                this.drawHPBar(ratio);
            }
        }

        // EXP + Level
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

        // 升级面板：由 LevelUpRequest 组件驱动
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

    // ─── UI Creation ───

    private createUI(): void {
        this.createHPBar();
        this.createExpBar();
        this.createLevelLabel();
        this.createTimeLabel();
        this.createLevelUpPanel();
        this.createGameOverPanel();
    }

    private createHPBar(): void {
        const bg = new Node('HPBarBg');
        bg.setParent(this._rootNode);
        bg.setPosition(-200, 320, 0);
        bg.addComponent(UITransform);
        const bgG = bg.addComponent(Graphics);
        bgG.fillColor = new Color(80, 0, 0, 255);
        bgG.rect(0, -8, 200, 16);
        bgG.fill();

        const fill = new Node('HPBarFill');
        fill.setParent(this._rootNode);
        fill.setPosition(-200, 320, 0);
        fill.addComponent(UITransform);
        this._hpBarG = fill.addComponent(Graphics);
        this.drawHPBar(1);

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

    /**
     * 创建升级选择面板（初始隐藏）
     * 布局：屏幕中央半透明背景 + 标题 + 3 张横排卡片
     */
    private createLevelUpPanel(): void {
        this._levelUpPanel = new Node('LevelUpPanel');
        this._levelUpPanel.setParent(this._rootNode);
        this._levelUpPanel.setPosition(0, 0, 0);
        this._levelUpPanel.active = false;

        // 半透明背景覆盖全屏
        const bg = new Node('LUBg');
        bg.setParent(this._levelUpPanel);
        bg.setPosition(0, 0, 0);
        bg.addComponent(UITransform).contentSize = new Size(960, 640);
        const bgG = bg.addComponent(Graphics);
        bgG.fillColor = new Color(0, 0, 0, 180);
        bgG.rect(-480, -320, 960, 640);
        bgG.fill();

        // 标题
        const title = new Node('LUTitle');
        title.setParent(this._levelUpPanel);
        title.setPosition(0, 180, 0);
        title.addComponent(UITransform);
        this._levelUpTitle = title.addComponent(Label);
        this._levelUpTitle.string = 'LEVEL UP!';
        this._levelUpTitle.fontSize = 40;
        this._levelUpTitle.color = new Color(255, 220, 0, 255);

        // 3 张卡片
        const cardW = 200;
        const cardH = 220;
        const gap = 40;
        const totalW = cardW * 3 + gap * 2;
        const startX = -totalW / 2 + cardW / 2;

        for (let i = 0; i < 3; i++) {
            const card = new Node(`Card_${i}`);
            card.setParent(this._levelUpPanel);
            card.setPosition(startX + i * (cardW + gap), 0, 0);
            const ct = card.addComponent(UITransform);
            ct.contentSize = new Size(cardW, cardH);
            // 这里很重要：让节点本身能响应触摸
            ct.anchorX = 0.5;
            ct.anchorY = 0.5;

            // 卡片背景（Graphics 单一填充：避免 fill + stroke 共用路径导致的叠加问题）
            const cardBg = card.addComponent(Graphics);
            cardBg.fillColor = new Color(40, 50, 80, 240);
            cardBg.rect(-cardW / 2, -cardH / 2, cardW, cardH);
            cardBg.fill();

            // 金色边框用一个子节点单独画
            const border = new Node('Border');
            border.setParent(card);
            border.setPosition(0, 0, 0);
            border.addComponent(UITransform);
            const borderG = border.addComponent(Graphics);
            borderG.strokeColor = new Color(255, 220, 0, 255);
            borderG.lineWidth = 3;
            borderG.rect(-cardW / 2, -cardH / 2, cardW, cardH);
            borderG.stroke();

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

            // 点击/触摸处理：TOUCH_END 适用于鼠标点击和触摸抬起
            const cardIndex = i;
            card.on(Node.EventType.TOUCH_END, () => {
                this.onCardSelected(cardIndex);
            }, this);

            this._cardNodes.push(card);
            this._cardNameLabels.push(nameLabel);
            this._cardDescLabels.push(descLabel);
        }
    }

    /** 显示面板并渲染当前三张卡片 */
    private showLevelUpPanel(world: ECSWorld, playerEid: number, req: LevelUpRequest): void {
        this._levelUpPanel.active = true;

        for (let i = 0; i < 3; i++) {
            if (i < req.currentChoices.length) {
                const def = getUpgradeById(req.currentChoices[i]);
                this._cardNodes[i].active = true;
                this._cardNameLabels[i].string = def ? def.name : '(未知)';
                this._cardDescLabels[i].string = def ? def.desc : '';
            } else {
                // 可用升级不足 3 时隐藏多余卡片
                this._cardNodes[i].active = false;
            }
        }

        // 缓存 world / playerEid 以便卡片点击时使用
        this._currentWorld = world;
        this._currentPlayerEid = playerEid;
    }

    private _currentWorld: ECSWorld | null = null;
    private _currentPlayerEid: number = -1;

    /** 卡片被点击：应用升级，pendingCount-1，决定是否继续显示下一轮 */
    private onCardSelected(cardIndex: number): void {
        const world = this._currentWorld;
        const playerEid = this._currentPlayerEid;
        if (!world || playerEid < 0) return;

        const req = world.getComponent(playerEid, LevelUpRequest);
        if (!req || cardIndex >= req.currentChoices.length) return;

        const def = getUpgradeById(req.currentChoices[cardIndex]);
        if (def) {
            def.apply(world, playerEid);
        }

        req.pendingCount -= 1;

        if (req.pendingCount > 0) {
            // 队列中还有升级，重新抽 3 张卡
            req.currentChoices = pickRandomUpgrades(world, playerEid, 3).map(u => u.id);
            this.showLevelUpPanel(world, playerEid, req);
        } else {
            // 队列清空：移除 Request + 解除暂停 + 隐藏面板
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
