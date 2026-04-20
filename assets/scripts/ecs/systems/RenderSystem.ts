import { Node, UITransform, Size } from 'cc';
import { ISystem, ECSWorld } from '../World';
import { Transform, Render } from '../Components';
import { PrefabPool } from '../PrefabPool';

/**
 * RenderSystem - ECS 与 Cocos Creator 的桥接
 * Priority: 90
 *
 * 职责：
 * 1. 为新 Render 组件实例化对应的预制体（通过 PrefabPool）
 * 2. 每帧同步 Transform → Node.position，Render.rotation → Node.angle
 * 3. 若 Render.width/height > 0，覆盖预制体的 UITransform.contentSize
 * 4. 销毁已不存在实体的 Node
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
        const node = PrefabPool.instantiate(render.prefabName);
        if (!node) return; // 预制体未加载，跳过此实体

        node.setParent(this._rootNode);

        // 动态尺寸覆盖（用于刀扇形、爆炸等需要随参数变化的实体）
        if (render.width > 0 || render.height > 0) {
            const t = node.getComponent(UITransform);
            if (t) {
                const w = render.width > 0 ? render.width : t.contentSize.width;
                const h = render.height > 0 ? render.height : t.contentSize.height;
                t.contentSize = new Size(w, h);

                // const childT = node?.children[0]?.getComponent(UITransform);
                // childT.contentSize = new Size(w, h);
            }
        }

        // 初始位置和旋转
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
