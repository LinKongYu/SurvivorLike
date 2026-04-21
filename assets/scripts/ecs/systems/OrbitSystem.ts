import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerTag, EnemyTag, Knockback,
} from '../Components';
import { OrbitAttack, OrbitingSword } from '../SkillComponents';
import { createOrbitingSword } from '../EntityFactory';
import { GameConfig } from '../GameConfig';

/**
 * OrbitSystem - 环绕飞剑
 * Priority: 23
 *
 * 流程：
 * 1. 玩家首次拥有 OrbitAttack 或 count 变化时（dirty=true），重建飞剑实体
 * 2. 每帧更新所有飞剑的 angle 和位置（围绕 owner 的 Transform）
 * 3. 检查与敌人的距离碰撞；命中后伤害 + 击退 + 设 hitCooldown
 * 4. 若 owner 不存在（玩家死亡），销毁所有飞剑
 */
export class OrbitSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver() || world.isPaused()) return;

        this.rebuildIfDirty(world);
        this.updateSwordsAndHit(dt, world);
    }

    /** 遍历 OrbitAttack，若 dirty 则销毁旧剑并按 count 均分角度生成新剑 */
    private rebuildIfDirty(world: ECSWorld): void {
        const store = world.getStore(OrbitAttack);
        if (!store) return;

        for (const [pid, atk] of store) {
            if (!atk.dirty) continue;
            atk.dirty = false;

            // 销毁已有飞剑
            for (const sid of atk.swordIds) {
                if (world.entityAlive(sid)) {
                    world.destroyEntity(sid);
                }
            }
            atk.swordIds = [];

            // 按 count 均分角度生成
            const step = (Math.PI * 2) / atk.count;
            for (let i = 0; i < atk.count; i++) {
                const sid = createOrbitingSword(
                    world, pid, i * step, atk.angularSpeed,
                    atk.orbitRadius, atk.damage,
                );
                atk.swordIds.push(sid);
            }
        }
    }

    /** 每帧旋转并同步飞剑位置，检测碰撞 */
    private updateSwordsAndHit(dt: number, world: ECSWorld): void {
        const swordStore = world.getStore(OrbitingSword);
        if (!swordStore) return;

        const orbitCfg = GameConfig.skills.orbit;
        const hitDistSq = orbitCfg.hitRadius * orbitCfg.hitRadius;
        const hitCooldown = orbitCfg.hitCooldown;
        const knockbackSpeed = orbitCfg.knockbackSpeed;

        const enemies = world.query(Transform, EnemyTag, Health);

        for (const [sid, sword] of swordStore) {
            // owner 不存在（玩家死亡等），销毁该剑
            const otf = world.getComponent(sword.ownerEid, Transform);
            if (!otf) {
                world.destroyEntity(sid);
                continue;
            }

            // 旋转角度 + 同步位置
            sword.angle += sword.angularSpeed * dt;
            const stf = world.getComponent(sid, Transform)!;
            stf.x = otf.x + Math.cos(sword.angle) * sword.orbitRadius;
            stf.y = otf.y + Math.sin(sword.angle) * sword.orbitRadius;

            if (sword.hitCooldown > 0) {
                sword.hitCooldown -= dt;
                continue;
            }

            // 与敌人碰撞
            for (const eid of enemies) {
                const hp = world.getComponent(eid, Health)!;
                if (hp.hp <= 0) continue;

                const etf = world.getComponent(eid, Transform)!;
                const dx = etf.x - stf.x;
                const dy = etf.y - stf.y;
                if (dx * dx + dy * dy >= hitDistSq) continue;

                hp.hp -= sword.damage;
                sword.hitCooldown = hitCooldown;

                // 击退方向：从玩家指向敌人（向外推）
                const ox = etf.x - otf.x;
                const oy = etf.y - otf.y;
                const olen = Math.sqrt(ox * ox + oy * oy) || 1;
                const nx = ox / olen;
                const ny = oy / olen;
                const kb = world.getComponent(eid, Knockback);
                if (kb) {
                    kb.vx += nx * knockbackSpeed;
                    kb.vy += ny * knockbackSpeed;
                } else {
                    world.addComponent(eid, new Knockback(
                        nx * knockbackSpeed,
                        ny * knockbackSpeed,
                        8,
                    ));
                }

                // 每次命中后跳出该剑当前帧的检测
                break;
            }
        }
    }
}
