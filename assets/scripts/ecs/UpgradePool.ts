import { hasComponent, addComponent } from '../bitEcs';
import { AutoAttack, autoAttackStore } from './Components';
import {
    BladeAttack, OrbitAttack, BombAttack,
    bladeAttackStore, orbitAttackStore, bombAttackStore,
} from './SkillComponents';
import { GameConfig } from './GameConfig';

export interface UpgradeDef {
    id: string;
    name: string;
    desc: string;
    canApply(world: any, playerEid: number): boolean;
    apply(world: any, playerEid: number): void;
}

export const UPGRADE_POOL: UpgradeDef[] = [
    { id: 'unlock_blade', name: '解锁·刀', desc: '前方扇形挥砍',
        canApply: (w, eid) => !hasComponent(w, eid, BladeAttack),
        apply: (w, eid) => {
            const c = GameConfig.skills.blade;
            addComponent(w, eid, BladeAttack);
            bladeAttackStore.set(eid, { timer: 0, cooldown: c.cooldown, damage: c.damage, range: c.range, arc: c.arcDegrees * Math.PI / 180, count: c.count });
        },
    },
    { id: 'unlock_orbit', name: '解锁·飞剑', desc: '环绕旋转攻击',
        canApply: (w, eid) => !hasComponent(w, eid, OrbitAttack),
        apply: (w, eid) => {
            const c = GameConfig.skills.orbit;
            addComponent(w, eid, OrbitAttack);
            orbitAttackStore.set(eid, { dirty: true, swordEntityIds: [], count: c.count, damage: c.damage, orbitRadius: c.orbitRadius, angularSpeed: c.angularSpeed });
        },
    },
    { id: 'unlock_bomb', name: '解锁·炸弹', desc: '投掷延迟爆炸',
        canApply: (w, eid) => !hasComponent(w, eid, BombAttack),
        apply: (w, eid) => {
            const c = GameConfig.skills.bomb;
            addComponent(w, eid, BombAttack);
            bombAttackStore.set(eid, { timer: 0, cooldown: c.cooldown, damage: c.damage, fuseTime: c.fuseTime, blastRadius: c.blastRadius, count: c.count });
        },
    },

    { id: 'arrow_count', name: '射击·+1箭', desc: '每次多射一支',
        canApply: (w, eid) => { const a = autoAttackStore.get(eid); return !!a && a.count < 8; },
        apply: (w, eid) => { const a = autoAttackStore.get(eid)!; a.count += 1; a.spreadAngle = Math.min(Math.PI * 0.7, a.spreadAngle + 0.08); },
    },
    { id: 'arrow_damage', name: '射击·伤害+25%', desc: '',
        canApply: (w, eid) => autoAttackStore.has(eid),
        apply: (w, eid) => { const a = autoAttackStore.get(eid)!; a.damage = Math.ceil(a.damage * 1.25); },
    },
    { id: 'arrow_cd', name: '射击·冷却-15%', desc: '',
        canApply: (w, eid) => { const a = autoAttackStore.get(eid); return !!a && a.cooldown > 0.1; },
        apply: (w, eid) => { const a = autoAttackStore.get(eid)!; a.cooldown = Math.max(0.1, a.cooldown * 0.85); },
    },
    { id: 'arrow_range', name: '射击·距离+20%', desc: '',
        canApply: (w, eid) => autoAttackStore.has(eid),
        apply: (w, eid) => { const a = autoAttackStore.get(eid)!; a.range *= 1.2; },
    },

    { id: 'blade_count', name: '刀·+1挥砍', desc: '围绕均分',
        canApply: (w, eid) => { const a = bladeAttackStore.get(eid); return !!a && a.count < 6; },
        apply: (w, eid) => { const a = bladeAttackStore.get(eid)!; a.count += 1; },
    },
    { id: 'blade_damage', name: '刀·伤害+30%', desc: '',
        canApply: (w, eid) => bladeAttackStore.has(eid),
        apply: (w, eid) => { const a = bladeAttackStore.get(eid)!; a.damage = Math.ceil(a.damage * 1.3); },
    },
    { id: 'blade_arc', name: '刀·角度+30°', desc: '',
        canApply: (w, eid) => { const a = bladeAttackStore.get(eid); return !!a && a.arc < Math.PI * 1.8; },
        apply: (w, eid) => { const a = bladeAttackStore.get(eid)!; a.arc = Math.min(Math.PI * 1.8, a.arc + Math.PI / 6); },
    },
    { id: 'blade_cd', name: '刀·冷却-20%', desc: '',
        canApply: (w, eid) => { const a = bladeAttackStore.get(eid); return !!a && a.cooldown > 0.2; },
        apply: (w, eid) => { const a = bladeAttackStore.get(eid)!; a.cooldown = Math.max(0.2, a.cooldown * 0.8); },
    },

    { id: 'orbit_count', name: '飞剑·+1把', desc: '更多环绕',
        canApply: (w, eid) => { const a = orbitAttackStore.get(eid); return !!a && a.count < 8; },
        apply: (w, eid) => { const a = orbitAttackStore.get(eid)!; a.count += 1; a.dirty = true; },
    },
    { id: 'orbit_damage', name: '飞剑·伤害+30%', desc: '',
        canApply: (w, eid) => orbitAttackStore.has(eid),
        apply: (w, eid) => { const a = orbitAttackStore.get(eid)!; a.damage = Math.ceil(a.damage * 1.3); a.dirty = true; },
    },
    { id: 'orbit_radius', name: '飞剑·半径+25%', desc: '',
        canApply: (w, eid) => orbitAttackStore.has(eid),
        apply: (w, eid) => { const a = orbitAttackStore.get(eid)!; a.orbitRadius *= 1.25; a.dirty = true; },
    },
    { id: 'orbit_speed', name: '飞剑·转速+25%', desc: '',
        canApply: (w, eid) => orbitAttackStore.has(eid),
        apply: (w, eid) => { const a = orbitAttackStore.get(eid)!; a.angularSpeed *= 1.25; a.dirty = true; },
    },

    { id: 'bomb_count', name: '炸弹·+1枚', desc: '',
        canApply: (w, eid) => { const a = bombAttackStore.get(eid); return !!a && a.count < 5; },
        apply: (w, eid) => { const a = bombAttackStore.get(eid)!; a.count += 1; },
    },
    { id: 'bomb_damage', name: '炸弹·伤害+35%', desc: '',
        canApply: (w, eid) => bombAttackStore.has(eid),
        apply: (w, eid) => { const a = bombAttackStore.get(eid)!; a.damage = Math.ceil(a.damage * 1.35); },
    },
    { id: 'bomb_radius', name: '炸弹·范围+25%', desc: '',
        canApply: (w, eid) => bombAttackStore.has(eid),
        apply: (w, eid) => { const a = bombAttackStore.get(eid)!; a.blastRadius *= 1.25; },
    },
    { id: 'bomb_cd', name: '炸弹·冷却-20%', desc: '',
        canApply: (w, eid) => { const a = bombAttackStore.get(eid); return !!a && a.cooldown > 0.5; },
        apply: (w, eid) => { const a = bombAttackStore.get(eid)!; a.cooldown = Math.max(0.5, a.cooldown * 0.8); },
    },
];

export function pickRandomUpgrades(world: any, playerEid: number, n = 3): UpgradeDef[] {
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
