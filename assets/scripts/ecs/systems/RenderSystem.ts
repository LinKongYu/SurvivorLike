import { Node, UITransform, Size } from 'cc';
import { ISystem, ECSWorld } from '../World';
import { Transform, Render } from '../Components';
import { BladeMarker, OrbitingSword, BombMarker, ExplosionMarker } from '../SkillComponents';
import { PrefabPool } from '../PrefabPool';

/**
 * RenderSystem — ECS → Cocos Creator 渲染桥接
 * Priority: 90
 *
 * 职责：
 * 1. 为新 Render 组件实例化预制体
 * 2. 每帧同步 Transform → Node.position
 * 3. 动态尺寸覆盖
 * 4. 销毁已死亡实体的 Node
 *
 * 预制体名称映射：
 * - Player → 'Player'
 * - Camp(enemy) → 'Enemy'
 * - BladeMarker → 'BladeHitbox'
 * - OrbitingSword → 'OrbitingSword'
 * - BombMarker → 'Bomb'
 * - ExplosionMarker → 'Explosion'
 * - 其他：根据组件推断
 */
export class RenderSystem implements ISystem {

    private _rootNode: Node;
    private _trackedEntities: Map<number, Node> = new Map();

    constructor(rootNode: Node) {
        this._rootNode = rootNode;
    }

    update(_dt: number, world: ECSWorld): void {
        const store = world.getStore(Render);
        if (!store) return;

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

        for (const [eid, node] of this._trackedEntities) {
            if (!world.entityAlive(eid)) {
                if (node.isValid) node.destroy();
                this._trackedEntities.delete(eid);
            }
        }
    }

    private createNode(eid: number, render: Render, world: ECSWorld): void {
        const node = PrefabPool.instantiate(render.prefabName);
        if (!node) return;

        node.setParent(this._rootNode);

        if (render.width > 0 || render.height > 0) {
            const t = node.getComponent(UITransform);
            if (t) {
                const w = render.width > 0 ? render.width : t.contentSize.width;
                const h = render.height > 0 ? render.height : t.contentSize.height;
                t.contentSize = new Size(w, h);
            }
        }

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
