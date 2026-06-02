import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerInput, Camp,
    DamageDealer, Owner, Collider, HitRecord, Velocity, Drag,
} from '../Components';
import { OrbitAttack, OrbitingSword } from '../SkillComponents';
import { GameConfig } from '../GameConfig';

/**
 * OrbitSystem — 环绕飞剑管理
 * Priority: 23
 *
 * 职责：
 * 1. 管理 OrbitAttack 组件（dirty 时重建飞剑实体）
 * 2. 每帧更新飞剑位置（绕 owner 旋转）
 *
 * 飞剑实体的碰撞/伤害走通用 CombatSystem 管线。
 * 飞剑挂载组件：Transform + Collider + DamageDealer + Owner + HitRecord + OrbitingSword
 */
export class OrbitSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver() || world.isPaused()) return;

        this.rebuildIfDirty(world);
        this.updateSwords(dt, world);
    }

    /** dirty 时销毁旧剑重新生成 */
    private rebuildIfDirty(world: ECSWorld): void {
        const store = world.getStore(OrbitAttack);
        if (!store) return;

        for (const [pid, atk] of store) {
            if (!atk.dirty) continue;
            atk.dirty = false;

            for (const sid of atk.swordEntityIds) {
                if (world.entityAlive(sid)) {
                    world.destroyEntity(sid);
                }
            }
            atk.swordEntityIds = [];

            const orbitCfg = GameConfig.skills.orbit;
            const step = (Math.PI * 2) / atk.count;
            for (let i = 0; i < atk.count; i++) {
                const angle = i * step;
                const sid = world.createEntity();
                world.addComponent(sid, new Transform(0, 0));
                world.addComponent(sid, new OrbitingSword(pid, angle, atk.angularSpeed, atk.orbitRadius, atk.damage));
                world.addComponent(sid, new Collider(orbitCfg.hitRadius));
                world.addComponent(sid, new DamageDealer(atk.damage, 'orbit'));
                world.addComponent(sid, new Owner(pid));
                world.addComponent(sid, new HitRecord());
                atk.swordEntityIds.push(sid);
            }
        }
    }

    /** 每帧更新飞剑位置 */
    private updateSwords(dt: number, world: ECSWorld): void {
        const swordStore = world.getStore(OrbitingSword);
        if (!swordStore) return;

        const enemies = world.query(Transform, Health, Camp);

        for (const [sid, sword] of swordStore) {
            const otf = world.getComponent(sword.ownerEntityId, Transform);
            if (!otf) {
                world.destroyEntity(sid);
                continue;
            }

            sword.angle += sword.angularSpeed * dt;
            const stf = world.getComponent(sid, Transform)!;
            stf.x = otf.x + Math.cos(sword.angle) * sword.orbitRadius;
            stf.y = otf.y + Math.sin(sword.angle) * sword.orbitRadius;

            // 击退和碰撞由 CombatSystem 处理
        }
    }
}
