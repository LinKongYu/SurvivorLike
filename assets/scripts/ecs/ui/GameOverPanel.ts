/**
 * GameOverPanel — 结算遮罩：GAME OVER 标题 + 存活时长。默认隐藏，show() 时显示。
 */

import { Node, Label, UITransform, Color } from 'cc';
import { UiPrimitives } from './UiPrimitives';

export class GameOverPanel {
    private _panel: Node = null!;
    private _label: Label = null!;

    constructor(parent: Node, ui: UiPrimitives) {
        this.create(parent, ui);
    }

    show(text: string): void {
        this._panel.active = true;
        this._label.string = text;
    }

    private create(parent: Node, ui: UiPrimitives): void {
        this._panel = new Node('GameOverPanel');
        this._panel.setParent(parent);
        this._panel.setPosition(0, 0, 0);
        this._panel.active = false;
        ui.coloredRect(this._panel, 'GOBg', 960, 640, new Color(0, 0, 0, 150)).setPosition(0, 0, 0);
        const title = new Node('GOTitle');
        title.setParent(this._panel); title.setPosition(0, 50, 0); title.addComponent(UITransform);
        const tl = title.addComponent(Label);
        tl.string = 'GAME OVER'; tl.fontSize = 48; tl.color = new Color(255, 50, 50, 255);
        const info = new Node('GOInfo');
        info.setParent(this._panel); info.setPosition(0, -20, 0); info.addComponent(UITransform);
        this._label = info.addComponent(Label);
        this._label.string = ''; this._label.fontSize = 24;
        this._label.color = new Color(255, 255, 255, 255);
    }
}
