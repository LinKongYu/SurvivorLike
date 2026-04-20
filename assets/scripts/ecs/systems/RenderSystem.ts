import { Node, UITransform, Graphics, Size } from 'cc';
import { ISystem, ECSWorld } from '../World';
import { Transform, Render } from '../Components';

/**
 * RenderSystem - ECS 与 Cocos Creator 的桥接
 * Priority: 90
 *
 * 职责：
 * 1. 为新 Render 组件创建 Cocos Node（Graphics 绘制）
 * 2. 每帧同步 Transform → Node.position，Render.rotation → Node.angle
 * 3. 销毁已不存在实体的 Node
 *
 * 支持形状：rect / circle / sector（扇形）
 */
export class RenderSystem implements ISystem {

    private _rootNode: Node;
    /** 记录已创建 Node 的实体，用于清理 */
    private _trackedEntities: Map<number, Node> = new Map();

    constructor(rootNode: Node) {
        this._rootNode = rootNode;
    }

    update(_dt: number, world: ECSWorld): void {
        const store = world.getStore(Render);
        if (!store) return;

        // 1. 为新 Render 创建 Node；同步位置和旋转
        for (const [eid, render] of store) {
            if (!render.created) {
                this.createNode(eid, render, world);
            }

            if (render.node) {
                const tf = world.getComponent(eid, Transform);
                if (tf) {
                    render.node.setPosition(tf.x, tf.y, 0);
                }
                render.node.angle = render.rotation;
            }
        }

        // 2. 清理已销毁实体的 Node
        for (const [eid, node] of this._trackedEntities) {
            if (!world.entityAlive(eid)) {
                if (node.isValid) node.destroy();
                this._trackedEntities.delete(eid);
            }
        }
    }

    private createNode(eid: number, render: Render, world: ECSWorld): void {
        const node = new Node(`Entity_${eid}`);
        node.setParent(this._rootNode);

        const uiTransform = node.addComponent(UITransform);
        uiTransform.contentSize = new Size(render.width, render.height);

        const g = node.addComponent(Graphics);
        g.fillColor = render.color;

        switch (render.shape) {
            case 'circle':
                g.circle(0, 0, render.width / 2);
                g.fill();
                break;
            case 'sector': {
                // 绘制以原点为中心、指向 +X 的扇形（饼形）
                // 实际朝向通过 render.rotation (由 Node.angle 承载) 控制
                const r = render.width / 2;
                const half = render.arcAngle * 0.5;
                g.moveTo(0, 0);
                g.arc(0, 0, r, -half, half, false);
                g.lineTo(0, 0);
                g.fill();
                break;
            }
            case 'rect':
            default:
                g.rect(-render.width / 2, -render.height / 2, render.width, render.height);
                g.fill();
                break;
        }

        // 设置初始位置和旋转
        const tf = world.getComponent(eid, Transform);
        if (tf) {
            node.setPosition(tf.x, tf.y, 0);
        }
        node.angle = render.rotation;

        render.node = node;
        render.created = true;
        this._trackedEntities.set(eid, node);
    }
}
