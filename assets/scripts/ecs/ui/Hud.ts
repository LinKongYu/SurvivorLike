/**
 * Hud — 左上角抬头显示：血条、经验条、等级、存活时间。
 *
 * 构造时一次性建好节点，update() 每帧按需刷新（带阈值缓存，避免每帧重建 Size/Color）。
 */

import { Node, Label, UITransform, Color, Size, Sprite } from 'cc';
import { Health, Level } from '../Components';
import { GameWorld } from '../World';
import { UiPrimitives } from './UiPrimitives';

export class Hud {
    private _hpBarFill: Node = null!;
    private _expBarFill: Node = null!;
    private _levelLabel: Label = null!;
    private _timeLabel: Label = null!;

    private _cachedHpRatio = -1;
    private _cachedExpRatio = -1;
    private _cachedLevel = -1;

    constructor(private readonly parent: Node, private readonly ui: UiPrimitives) {
        this.createHPBar();
        this.createExpBar();
        this.createLevelLabel();
        this.createTimeLabel();
    }

    update(world: GameWorld, playerEid: number): void {
        const hpRatio = Health.maxHp[playerEid] > 0 ? Health.hp[playerEid] / Health.maxHp[playerEid] : 0;
        if (Math.abs(hpRatio - this._cachedHpRatio) > 0.001) {
            this._cachedHpRatio = hpRatio;
            this.updateHPBar(hpRatio);
        }

        const expRatio = Level.expToNext[playerEid] > 0 ? Level.exp[playerEid] / Level.expToNext[playerEid] : 0;
        if (Math.abs(expRatio - this._cachedExpRatio) > 0.01) {
            this._cachedExpRatio = expRatio;
            this.updateExpBar(expRatio);
        }
        if (Level.level[playerEid] !== this._cachedLevel) {
            this._cachedLevel = Level.level[playerEid];
            this._levelLabel.string = `Lv.${Level.level[playerEid]}`;
        }

        const min = Math.floor(world.time / 60);
        const sec = Math.floor(world.time % 60);
        this._timeLabel.string = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    private createHPBar(): void {
        const bg = this.ui.coloredRect(this.parent, 'HPBarBg', 200, 16, new Color(80, 0, 0, 255), 0, 0.5);
        bg.setPosition(-200, 320, 0);
        this._hpBarFill = this.ui.coloredRect(this.parent, 'HPBarFill', 200, 16, new Color(0, 200, 0, 255), 0, 0.5);
        this._hpBarFill.setPosition(-200, 320, 0);
        const lbl = new Node('HPLabel');
        lbl.setParent(this.parent);
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
        const bg = this.ui.coloredRect(this.parent, 'ExpBarBg', 200, 10, new Color(0, 0, 80, 255), 0, 0.5);
        bg.setPosition(-200, 298, 0);
        this._expBarFill = this.ui.coloredRect(this.parent, 'ExpBarFill', 0, 10, new Color(50, 100, 255, 255), 0, 0.5);
        this._expBarFill.setPosition(-200, 298, 0);
    }

    private updateExpBar(ratio: number): void {
        const r = Math.max(0, Math.min(1, ratio));
        const t = this._expBarFill.getComponent(UITransform);
        if (t) t.contentSize = new Size(200 * r, 10);
    }

    private createLevelLabel(): void {
        const node = new Node('LevelText');
        node.setParent(this.parent);
        node.setPosition(50, 320, 0);
        node.addComponent(UITransform);
        this._levelLabel = node.addComponent(Label);
        this._levelLabel.string = 'Lv.1'; this._levelLabel.fontSize = 20;
        this._levelLabel.color = new Color(255, 255, 0, 255);
    }

    private createTimeLabel(): void {
        const node = new Node('TimeText');
        node.setParent(this.parent);
        node.setPosition(150, 320, 0);
        node.addComponent(UITransform);
        this._timeLabel = node.addComponent(Label);
        this._timeLabel.string = '00:00'; this._timeLabel.fontSize = 18;
        this._timeLabel.color = new Color(255, 255, 255, 255);
    }
}
