import { Node, UITransform, Size } from 'cc';
import { query } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import { Render, Transform } from '../Components';
import { PrefabPool } from '../PrefabPool';
import { SystemPriority } from '../Schedule';

export class RenderSystem implements System {
    readonly priority = SystemPriority.Render;
    readonly runWhenPaused = true;
    readonly runWhenGameOver = true;

    private _rootNode: Node;
    private _trackedEntities: Map<number, Node> = new Map();
    constructor(rootNode: Node) { this._rootNode = rootNode; }

    update(_dt: number, world: GameWorld): void {
        const activeRenderEntities = new Set<number>();

        for (const eid of query(world, [Render, Transform])) {
            activeRenderEntities.add(eid);
            const rd = Render[eid];
            if (!rd.created) this.createNode(eid, rd);
            if (rd.node && rd.node.isValid) {
                rd.node.setPosition(Transform.x[eid], Transform.y[eid], 0);
                rd.node.angle = rd.rotation;
            }
        }

        // Clean up nodes for entities that no longer match the render query.
        for (const [eid, node] of this._trackedEntities) {
            if (!activeRenderEntities.has(eid)) {
                if (node.isValid) node.destroy();
                this._trackedEntities.delete(eid);
            }
        }
    }

    private createNode(eid: number, rd: any): void {
        // Destroy old Node if this eid was recycled (new entity reused the ID)
        const oldNode = this._trackedEntities.get(eid);
        if (oldNode && oldNode.isValid) {
            oldNode.destroy();
        }

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
        node.setPosition(Transform.x[eid], Transform.y[eid], 0);
        node.angle = rd.rotation;
        rd.node = node;
        rd.created = true;
        this._trackedEntities.set(eid, node);
    }

    destroy(): void {
        for (const node of this._trackedEntities.values()) {
            if (node.isValid) node.destroy();
        }
        this._trackedEntities.clear();
    }
}
