/**
 * UiPrimitives — 程序化建 UI 的底层工具
 *
 * 本项目 HUD/面板均用代码即时创建节点（无 UI 预制体），这里集中两个最常用的原语：
 *   - createWhiteSpriteFrame：1×1 白色贴图，作为纯色矩形的 spriteFrame
 *   - coloredRect：带 UITransform + Sprite 的纯色矩形
 * 一个 UiPrimitives 实例持有一张共享白贴图，所有矩形复用它；destroy 时释放。
 */

import { Node, UITransform, Size, Sprite, SpriteFrame, Color, Texture2D, ImageAsset } from 'cc';

/** 生成 1×1 白色 SpriteFrame（纯色矩形的底图，配合 Sprite.color 上色）。 */
export function createWhiteSpriteFrame(): SpriteFrame {
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

export class UiPrimitives {
    readonly whiteSF: SpriteFrame;

    constructor() {
        this.whiteSF = createWhiteSpriteFrame();
    }

    /** 创建一个纯色矩形节点（默认中心锚点）。 */
    coloredRect(
        parent: Node, name: string, w: number, h: number,
        color: Color, ax = 0.5, ay = 0.5,
    ): Node {
        const node = new Node(name);
        node.setParent(parent);
        const t = node.addComponent(UITransform);
        t.contentSize = new Size(w, h);
        t.anchorX = ax; t.anchorY = ay;
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = this.whiteSF;
        sprite.color = color;
        return node;
    }

    destroy(): void {
        if (this.whiteSF && this.whiteSF.isValid) this.whiteSF.destroy();
    }
}
