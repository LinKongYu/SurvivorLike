/**
 * LevelUpPanel — 升级三选一面板。
 *
 * 自带升级流程状态：show() 显示当前候选；点卡片 apply 升级后，若 pendingCount 还有
 * 剩余则重抽并继续显示，否则关闭并解除暂停。world/playerEid 在 show 时记录，供卡片
 * 点击回调使用（与拆分前 UISystem 内的逻辑逐行一致）。
 */

import { Node, Label, UITransform, Color, Size } from 'cc';
import { removeComponent } from '../../bitEcs';
import { GameWorld } from '../World';
import { LevelUpRequest, LevelUpRequestData } from '../SkillComponents';
import { getUpgradeById, pickRandomUpgrades } from '../UpgradePool';
import { UiPrimitives } from './UiPrimitives';

export class LevelUpPanel {
    private _panel: Node = null!;
    private _cardNodes: Node[] = [];
    private _cardNameLabels: Label[] = [];
    private _cardDescLabels: Label[] = [];

    private _world: GameWorld | null = null;
    private _playerEid = -1;

    constructor(parent: Node, ui: UiPrimitives) {
        this.create(parent, ui);
    }

    get active(): boolean {
        return this._panel.active;
    }

    hide(): void {
        this._panel.active = false;
    }

    show(world: GameWorld, playerEid: number, req: LevelUpRequestData): void {
        this._panel.active = true;
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
        this._world = world;
        this._playerEid = playerEid;
    }

    private create(parent: Node, ui: UiPrimitives): void {
        this._panel = new Node('LevelUpPanel');
        this._panel.setParent(parent);
        this._panel.setPosition(0, 0, 0);
        this._panel.active = false;

        ui.coloredRect(this._panel, 'LUBg', 960, 640, new Color(0, 0, 0, 180)).setPosition(0, 0, 0);
        const title = new Node('LUTitle');
        title.setParent(this._panel);
        title.setPosition(0, 180, 0);
        title.addComponent(UITransform);
        const tl = title.addComponent(Label);
        tl.string = 'LEVEL UP!'; tl.fontSize = 40; tl.color = new Color(255, 220, 0, 255);

        const cardW = 200, cardH = 220, borderW = 3, gap = 40;
        const totalW = cardW * 3 + gap * 2;
        const startX = -totalW / 2 + cardW / 2;

        for (let i = 0; i < 3; i++) {
            const card = new Node(`Card_${i}`);
            card.setParent(this._panel);
            card.setPosition(startX + i * (cardW + gap), 0, 0);
            card.addComponent(UITransform).contentSize = new Size(cardW, cardH);

            ui.coloredRect(card, 'Border', cardW, cardH, new Color(255, 220, 0, 255));
            ui.coloredRect(card, 'Bg', cardW - borderW * 2, cardH - borderW * 2, new Color(40, 50, 80, 240));

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

    private onCardSelected(cardIndex: number): void {
        const world = this._world;
        const playerEid = this._playerEid;
        if (!world || playerEid < 0) return;

        const req = LevelUpRequest[playerEid];
        if (!req || cardIndex >= req.currentChoices.length) return;

        const def = getUpgradeById(req.currentChoices[cardIndex]);
        if (def) def.apply(world, playerEid);

        req.pendingCount -= 1;
        if (req.pendingCount > 0) {
            const nextChoices = pickRandomUpgrades(world, playerEid, 3).map(u => u.id);
            if (nextChoices.length === 0) {
                this.close(world, playerEid);
                return;
            }
            req.currentChoices = nextChoices;
            this.show(world, playerEid, req);
        } else {
            this.close(world, playerEid);
        }
    }

    private close(world: GameWorld, playerEid: number): void {
        delete LevelUpRequest[playerEid];
        removeComponent(world, playerEid, LevelUpRequest);
        world.paused = false;
        this._panel.active = false;
        this._world = null;
        this._playerEid = -1;
    }
}
