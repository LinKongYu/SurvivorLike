import { Sprite, Vec4 } from 'cc';
import { query, removeComponent } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import { Render, HitFlash } from '../Components';

function _findSprite(node: any): Sprite | null {
    let sprite = node.getComponent(Sprite);
    if (sprite) return sprite;
    for (const child of node.children) {
        sprite = child.getComponent(Sprite);
        if (sprite) return sprite;
    }
    return null;
}

function _getFlashMaterial(sprite: Sprite) {
    if (!sprite.customMaterial) return null;
    return sprite.getMaterialInstance(0);
}

/** 若实体当前有 HitFlash 效果，重置其 ColorShine 材质到默认状态。对象池回收 / 实体销毁前调用。 */
export function resetHitFlashMaterial(eid: number): void {
    if (HitFlash.totalDuration[eid] === undefined) return;

    const rd = Render[eid];
    if (!rd?.node?.isValid) return;
    const sprite = _findSprite(rd.node);
    const mat = sprite && _getFlashMaterial(sprite);
    if (mat) {
        mat.setProperty('shineColor', new Vec4(1, 1, 1, 1));
        mat.setProperty('shineParam', new Vec4(1, 0, 0, 0));
    }
}

export class HitFlashSystem implements System {
    readonly priority = 25;

    update(dt: number, world: GameWorld): void {
        for (const eid of query(world, [HitFlash, Render])) {
            HitFlash.remaining[eid] -= dt;

            const rd = Render[eid];
            if (!rd || !rd.node || !rd.node.isValid) {
                removeComponent(world, eid, HitFlash);
                continue;
            }

            const sprite = _findSprite(rd.node);
            if (!sprite) {
                removeComponent(world, eid, HitFlash);
                continue;
            }

            const mat = _getFlashMaterial(sprite);
            if (!mat) continue;

            const elapsed = HitFlash.totalDuration[eid] - HitFlash.remaining[eid];
            const rate = Math.max(0, Math.min(1, elapsed / HitFlash.totalDuration[eid]));
            const c = HitFlash.color[eid];

            mat.setProperty('shineColor', new Vec4(c[0], c[1], c[2], c[3]));
            mat.setProperty('shineParam', new Vec4(rate, 0, 0, 0));

            if (HitFlash.remaining[eid] <= 0) {
                resetHitFlashMaterial(eid);
                removeComponent(world, eid, HitFlash);
            }
        }
    }
}
