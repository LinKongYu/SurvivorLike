/**
 * 升级池定义
 *
 * 每条 UpgradeDef 描述一个可选升级项：
 * - canApply: 当前状态下是否可用
 * - apply: 执行升级效果
 *
 * 升级时从所有 canApply=true 的 def 中随机抽 3 个展示。
 */

import { ECSWorld } from './World';
import { AutoAttack, Camp } from './Components';
import { BladeAttack, OrbitAttack, BombAttack } from './SkillComponents';
import { GameConfig } from './GameConfig';

export interface UpgradeDef {
    id: string;
    name: string;
    desc: string;
    canApply(world: ECSWorld, playerEid: number): boolean;
    apply(world: ECSWorld, playerEid: number): void;
}

export const UPGRADE_POOL: UpgradeDef[] = [
    // ─── 解锁新技能 ───
    {
        id: 'unlock_blade',
        name: '解锁·刀',
        desc: '前方扇形挥砍',
        canApply: (w, eid) => !w.hasComponent(eid, BladeAttack),
        apply: (w, eid) => {
            const c = GameConfig.skills.blade;
            w.addComponent(eid, new BladeAttack(
                c.cooldown, c.damage, c.range,
                c.arcDegrees * Math.PI / 180, c.count,
            ));
        },
    },
    {
        id: 'unlock_orbit',
        name: '解锁·飞剑',
        desc: '环绕旋转攻击',
        canApply: (w, eid) => !w.hasComponent(eid, OrbitAttack),
        apply: (w, eid) => {
            const c = GameConfig.skills.orbit;
            const atk = new OrbitAttack(c.count, c.damage, c.orbitRadius, c.angularSpeed);
            atk.dirty = true;
            w.addComponent(eid, atk);
        },
    },
    {
        id: 'unlock_bomb',
        name: '解锁·炸弹',
        desc: '投掷延迟爆炸',
        canApply: (w, eid) => !w.hasComponent(eid, BombAttack),
        apply: (w, eid) => {
            const c = GameConfig.skills.bomb;
            w.addComponent(eid, new BombAttack(
                c.cooldown, c.damage, c.fuseTime, c.blastRadius, c.count,
            ));
        },
    },

    // ─── 射击升级 ───
    {
        id: 'arrow_count',
        name: '射击·+1箭',
        desc: '每次多射一支',
        canApply: (w, eid) => {
            const a = w.getComponent(eid, AutoAttack);
            return !!a && a.count < 8;
        },
        apply: (w, eid) => {
            const a = w.getComponent(eid, AutoAttack)!;
            a.count += 1;
            a.spreadAngle = Math.min(Math.PI * 0.7, a.spreadAngle + 0.08);
        },
    },
    {
        id: 'arrow_damage',
        name: '射击·伤害+25%',
        desc: '',
        canApply: (w, eid) => w.hasComponent(eid, AutoAttack),
        apply: (w, eid) => {
            const a = w.getComponent(eid, AutoAttack)!;
            a.damage = Math.ceil(a.damage * 1.25);
        },
    },
    {
        id: 'arrow_cd',
        name: '射击·冷却-15%',
        desc: '',
        canApply: (w, eid) => {
            const a = w.getComponent(eid, AutoAttack);
            return !!a && a.cooldown > 0.1;
        },
        apply: (w, eid) => {
            const a = w.getComponent(eid, AutoAttack)!;
            a.cooldown = Math.max(0.1, a.cooldown * 0.85);
        },
    },
    {
        id: 'arrow_range',
        name: '射击·距离+20%',
        desc: '',
        canApply: (w, eid) => w.hasComponent(eid, AutoAttack),
        apply: (w, eid) => {
            const a = w.getComponent(eid, AutoAttack)!;
            a.range *= 1.2;
        },
    },

    // ─── 刀升级 ───
    {
        id: 'blade_count',
        name: '刀·+1挥砍',
        desc: '围绕均分',
        canApply: (w, eid) => {
            const a = w.getComponent(eid, BladeAttack);
            return !!a && a.count < 6;
        },
        apply: (w, eid) => {
            const a = w.getComponent(eid, BladeAttack)!;
            a.count += 1;
        },
    },
    {
        id: 'blade_damage',
        name: '刀·伤害+30%',
        desc: '',
        canApply: (w, eid) => w.hasComponent(eid, BladeAttack),
        apply: (w, eid) => {
            const a = w.getComponent(eid, BladeAttack)!;
            a.damage = Math.ceil(a.damage * 1.3);
        },
    },
    {
        id: 'blade_arc',
        name: '刀·角度+30°',
        desc: '',
        canApply: (w, eid) => {
            const a = w.getComponent(eid, BladeAttack);
            return !!a && a.arc < Math.PI * 1.8;
        },
        apply: (w, eid) => {
            const a = w.getComponent(eid, BladeAttack)!;
            a.arc = Math.min(Math.PI * 1.8, a.arc + Math.PI / 6);
        },
    },
    {
        id: 'blade_cd',
        name: '刀·冷却-20%',
        desc: '',
        canApply: (w, eid) => {
            const a = w.getComponent(eid, BladeAttack);
            return !!a && a.cooldown > 0.2;
        },
        apply: (w, eid) => {
            const a = w.getComponent(eid, BladeAttack)!;
            a.cooldown = Math.max(0.2, a.cooldown * 0.8);
        },
    },

    // ─── 飞剑升级 ───
    {
        id: 'orbit_count',
        name: '飞剑·+1把',
        desc: '更多环绕',
        canApply: (w, eid) => {
            const a = w.getComponent(eid, OrbitAttack);
            return !!a && a.count < 8;
        },
        apply: (w, eid) => {
            const a = w.getComponent(eid, OrbitAttack)!;
            a.count += 1;
            a.dirty = true;
        },
    },
    {
        id: 'orbit_damage',
        name: '飞剑·伤害+30%',
        desc: '',
        canApply: (w, eid) => w.hasComponent(eid, OrbitAttack),
        apply: (w, eid) => {
            const a = w.getComponent(eid, OrbitAttack)!;
            a.damage = Math.ceil(a.damage * 1.3);
            a.dirty = true;
        },
    },
    {
        id: 'orbit_radius',
        name: '飞剑·半径+25%',
        desc: '',
        canApply: (w, eid) => w.hasComponent(eid, OrbitAttack),
        apply: (w, eid) => {
            const a = w.getComponent(eid, OrbitAttack)!;
            a.orbitRadius *= 1.25;
            a.dirty = true;
        },
    },
    {
        id: 'orbit_speed',
        name: '飞剑·转速+25%',
        desc: '',
        canApply: (w, eid) => w.hasComponent(eid, OrbitAttack),
        apply: (w, eid) => {
            const a = w.getComponent(eid, OrbitAttack)!;
            a.angularSpeed *= 1.25;
            a.dirty = true;
        },
    },

    // ─── 炸弹升级 ───
    {
        id: 'bomb_count',
        name: '炸弹·+1枚',
        desc: '',
        canApply: (w, eid) => {
            const a = w.getComponent(eid, BombAttack);
            return !!a && a.count < 5;
        },
        apply: (w, eid) => {
            const a = w.getComponent(eid, BombAttack)!;
            a.count += 1;
        },
    },
    {
        id: 'bomb_damage',
        name: '炸弹·伤害+35%',
        desc: '',
        canApply: (w, eid) => w.hasComponent(eid, BombAttack),
        apply: (w, eid) => {
            const a = w.getComponent(eid, BombAttack)!;
            a.damage = Math.ceil(a.damage * 1.35);
        },
    },
    {
        id: 'bomb_radius',
        name: '炸弹·范围+25%',
        desc: '',
        canApply: (w, eid) => w.hasComponent(eid, BombAttack),
        apply: (w, eid) => {
            const a = w.getComponent(eid, BombAttack)!;
            a.blastRadius *= 1.25;
        },
    },
    {
        id: 'bomb_cd',
        name: '炸弹·冷却-20%',
        desc: '',
        canApply: (w, eid) => {
            const a = w.getComponent(eid, BombAttack);
            return !!a && a.cooldown > 0.5;
        },
        apply: (w, eid) => {
            const a = w.getComponent(eid, BombAttack)!;
            a.cooldown = Math.max(0.5, a.cooldown * 0.8);
        },
    },
];

export function pickRandomUpgrades(
    world: ECSWorld, playerEid: number, n: number = 3,
): UpgradeDef[] {
    const eligible = UPGRADE_POOL.filter(u => u.canApply(world, playerEid));
    if (eligible.length <= n) return eligible.slice();

    const indices: number[] = [];
    for (let i = 0; i < eligible.length; i++) indices.push(i);
    for (let i = 0; i < n; i++) {
        const j = i + Math.floor(Math.random() * (indices.length - i));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, n).map(i => eligible[i]);
}

export function getUpgradeById(id: string): UpgradeDef | undefined {
    return UPGRADE_POOL.find(u => u.id === id);
}
