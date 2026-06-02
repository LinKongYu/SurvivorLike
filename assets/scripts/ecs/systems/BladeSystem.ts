import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerInput, Camp,
    DamageDealer, Owner, Collider, HitRecord, Lifetime, Drag, Velocity,
} from '../Components';
import { BladeAttack, BladeMarker } from '../SkillComponents';
import { GameConfig } from '../GameConfig';
import { findNearestEnemy } from '../helpers';

/**
 * BladeSystem — 扇形挥砍（生成器）
 * Priority: 22
 *
 * 只负责触发：冷却到时生成 BladeMarker 实体。
 * BladeMarker 实体挂载通用组件（Collider + DamageDealer + Owner + HitRecord + Lifetime），
 * 由 CombatSystem 的碰撞检测和伤害流程统一处理。
 *
 * TODO: 后续 BladeSystem 只保留 trigger 逻辑，碰撞伤害走标准事件管线。
 */
export class BladeSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver() || world.isPaused()) return;

        this.triggerBlades(dt, world);
        this.updateExistingHitboxes(dt, world);
    }

    /** 为持有 BladeAttack 的玩家 tick 冷却，到时生成刀光实体 */
    private triggerBlades(dt: number, world: ECSWorld): void {
        const players = world.query(Transform, PlayerInput, BladeAttack);
        if (players.length === 0) return;
        const enemies = world.query(Transform, Health, Camp);

        for (const pid of players) {
            const atk = world.getComponent(pid, BladeAttack)!;
            atk.timer += dt;
            if (atk.timer < atk.cooldown) continue;

            const ptf = world.getComponent(pid, Transform)!;

            const nearest = findNearestEnemy(world, ptf.x, ptf.y);
            if (!nearest) continue;

            atk.timer = 0;
            const etf = world.getComponent(nearest.eid, Transform)!;
            const baseAngle = Math.atan2(etf.y - ptf.y, etf.x - ptf.x);
            const step = (Math.PI * 2) / atk.count;

            for (let i = 0; i < atk.count; i++) {
                const angle = baseAngle + i * step;
                this.spawnBladeHitbox(world, ptf.x, ptf.y, angle, atk.range, atk.arc, atk.damage, pid);
            }
        }
    }

    /** 创建刀光实体（标准组件组合） */
    private spawnBladeHitbox(
        world: ECSWorld,
        x: number, y: number,
        facingAngle: number,
        range: number, arc: number,
        damage: number,
        ownerEid: number,
    ): void {
        const lifeTime = GameConfig.skills.blade.lifeTime;
        const knockbackSpeed = GameConfig.skills.blade.knockbackSpeed;

        const eid = world.createEntity();
        world.addComponent(eid, new Transform(x, y));
        world.addComponent(eid, new BladeMarker());
        world.addComponent(eid, new Collider(range));
        world.addComponent(eid, new DamageDealer(damage, 'blade'));
        world.addComponent(eid, new Owner(ownerEid));
        world.addComponent(eid, new HitRecord());
        world.addComponent(eid, new Lifetime(lifeTime));

        // 扇形朝向存储为 rotation（RenderSystem 使用）
        // 碰撞检测使用圆形近似（range 作为半径）
        world.getComponent(eid, Transform)!.x = x;
        world.getComponent(eid, Transform)!.y = y;
    }

    /** 管理现有刀光（处理 BladeMarker 生命周期，RenderSystem 显示） */
    private updateExistingHitboxes(dt: number, world: ECSWorld): void {
        const store = world.getStore(BladeMarker);
        if (!store) return;

        const toDestroy: number[] = [];
        for (const [eid] of store) {
            const lifetime = world.getComponent(eid, Lifetime);
            if (!lifetime || lifetime.remaining <= 0) {
                toDestroy.push(eid);
            }
        }
        for (const eid of toDestroy) {
            world.destroyEntity(eid);
        }
    }
}
