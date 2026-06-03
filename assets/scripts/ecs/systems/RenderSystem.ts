import { Node, UITransform, Size } from 'cc';
import { query } from '../../bitEcs';
import { Render, renderStore, positionStore } from '../Components';
import { PrefabPool } from '../PrefabPool';

export class RenderSystem {
    private _rootNode: Node;
    private _trackedEntities: Map<number, Node> = new Map();
    constructor(rootNode: Node) { this._rootNode = rootNode; }
    update(_dt: number, world: any): void {
        for (const eid of query(world, [Render])) {
            const rd = renderStore.get(eid)!;
            if (!rd.created) this.createNode(eid, rd);
            if (rd.node) {
                const tf = positionStore.get(eid);
                if (tf) rd.node.setPosition(tf.x, tf.y, 0);
                rd.node.angle = rd.rotation;
            }
        }
        for (const [eid, node] of this._trackedEntities) {
            if (!renderStore.has(eid)) {
                if (node.isValid) node.destroy();
                this._trackedEntities.delete(eid);
            }
        }
    }
    private createNode(eid: number, rd: any): void {
        const node = PrefabPool.instantiate(rd.prefabName);
        if (!node) return;
        node.setParent(this._rootNode);
        if (rd.width > 0 || rd.height > 0) {
            const t = node.getComponent(UITransform);
            if (t) {
                const w = rd.width > 0 ? rd.width : t.contentSize.width;
                const h = rd.height > 0 ? rd.height : t.contentSize.height;
                t.contentSize = new Size(w, h);
            }
        }
        const tf = positionStore.get(eid);
        if (tf) node.setPosition(tf.x, tf.y, 0);
        node.angle = rd.rotation;
        rd.node = node;
        rd.created = true;
        this._trackedEntities.set(eid, node);
    }
}
