import { hasComponent, addComponent } from '../bitEcs';
import { AutoAttack } from './Components';
import { BladeAttack, OrbitAttack, BombAttack } from './SkillComponents';
import { GameConfig } from './GameConfig';

export interface UpgradeDef {
    id: string;
    name: string;
    desc: string;
    canApply(world: any, playerEid: number): boolean;
    apply(world: any, playerEid: number): void;
}

function hasAutoAttack(world: any, eid: number): boolean {
    return hasComponent(world, eid, AutoAttack);
}

export const UPGRADE_POOL: UpgradeDef[] = [
    { id: 'unlock_blade', name: '解锁·刀', desc: '前方扇形挥砍',
        canApply: (w, eid) => !hasComponent(w, eid, BladeAttack),
        apply: (w, eid) => {
            const c = GameConfig.skills.blade;
            addComponent(w, eid, BladeAttack);
            BladeAttack.timer[eid] = 0;
            BladeAttack.cooldown[eid] = c.cooldown;
            BladeAttack.damage[eid] = c.damage;
            BladeAttack.range[eid] = c.range;
            BladeAttack.arc[eid] = c.arcDegrees * Math.PI / 180;
            BladeAttack.count[eid] = c.count;
        },
    },
    { id: 'unlock_orbit', name: '解锁·飞剑', desc: '环绕旋转攻击',
        canApply: (w, eid) => !hasComponent(w, eid, OrbitAttack),
        apply: (w, eid) => {
            const c = GameConfig.skills.orbit;
            addComponent(w, eid, OrbitAttack);
            OrbitAttack.dirty[eid] = true;
            OrbitAttack.swordEntityIds[eid] = [];
            OrbitAttack.count[eid] = c.count;
            OrbitAttack.damage[eid] = c.damage;
            OrbitAttack.orbitRadius[eid] = c.orbitRadius;
            OrbitAttack.angularSpeed[eid] = c.angularSpeed;
        },
    },
    { id: 'unlock_bomb', name: '解锁·炸弹', desc: '投掷延迟爆炸',
        canApply: (w, eid) => !hasComponent(w, eid, BombAttack),
        apply: (w, eid) => {
            const c = GameConfig.skills.bomb;
            addComponent(w, eid, BombAttack);
            BombAttack.timer[eid] = 0;
            BombAttack.cooldown[eid] = c.cooldown;
            BombAttack.damage[eid] = c.damage;
            BombAttack.fuseTime[eid] = c.fuseTime;
            BombAttack.blastRadius[eid] = c.blastRadius;
            BombAttack.count[eid] = c.count;
        },
    },

    { id: 'arrow_count', name: '射击·+1箭', desc: '每次多射一支',
        canApply: (w, eid) => hasAutoAttack(w, eid) && AutoAttack.count[eid] < 8,
        apply: (_w, eid) => {
            AutoAttack.count[eid] += 1;
            AutoAttack.spreadAngle[eid] = Math.min(Math.PI * 0.7, AutoAttack.spreadAngle[eid] + 0.08);
        },
    },
    { id: 'arrow_damage', name: '射击·伤害+25%', desc: '',
        canApply: hasAutoAttack,
        apply: (_w, eid) => { AutoAttack.damage[eid] = Math.ceil(AutoAttack.damage[eid] * 1.25); },
    },
    { id: 'arrow_cd', name: '射击·冷却-15%', desc: '',
        canApply: (w, eid) => hasAutoAttack(w, eid) && AutoAttack.cooldown[eid] > 0.1,
        apply: (_w, eid) => { AutoAttack.cooldown[eid] = Math.max(0.1, AutoAttack.cooldown[eid] * 0.85); },
    },
    { id: 'arrow_range', name: '射击·距离+20%', desc: '',
        canApply: hasAutoAttack,
        apply: (_w, eid) => { AutoAttack.range[eid] *= 1.2; },
    },

    { id: 'blade_count', name: '刀·+1挥砍', desc: '围绕均分',
        canApply: (w, eid) => hasComponent(w, eid, BladeAttack) && BladeAttack.count[eid] < 6,
        apply: (_w, eid) => { BladeAttack.count[eid] += 1; },
    },
    { id: 'blade_damage', name: '刀·伤害+30%', desc: '',
        canApply: (w, eid) => hasComponent(w, eid, BladeAttack),
        apply: (_w, eid) => { BladeAttack.damage[eid] = Math.ceil(BladeAttack.damage[eid] * 1.3); },
    },
    { id: 'blade_arc', name: '刀·角度+30°', desc: '',
        canApply: (w, eid) => hasComponent(w, eid, BladeAttack) && BladeAttack.arc[eid] < Math.PI * 1.8,
        apply: (_w, eid) => { BladeAttack.arc[eid] = Math.min(Math.PI * 1.8, BladeAttack.arc[eid] + Math.PI / 6); },
    },
    { id: 'blade_cd', name: '刀·冷却-20%', desc: '',
        canApply: (w, eid) => hasComponent(w, eid, BladeAttack) && BladeAttack.cooldown[eid] > 0.2,
        apply: (_w, eid) => { BladeAttack.cooldown[eid] = Math.max(0.2, BladeAttack.cooldown[eid] * 0.8); },
    },

    { id: 'orbit_count', name: '飞剑·+1把', desc: '更多环绕',
        canApply: (w, eid) => hasComponent(w, eid, OrbitAttack) && OrbitAttack.count[eid] < 8,
        apply: (_w, eid) => { OrbitAttack.count[eid] += 1; OrbitAttack.dirty[eid] = true; },
    },
    { id: 'orbit_damage', name: '飞剑·伤害+30%', desc: '',
        canApply: (w, eid) => hasComponent(w, eid, OrbitAttack),
        apply: (_w, eid) => { OrbitAttack.damage[eid] = Math.ceil(OrbitAttack.damage[eid] * 1.3); OrbitAttack.dirty[eid] = true; },
    },
    { id: 'orbit_radius', name: '飞剑·半径+25%', desc: '',
        canApply: (w, eid) => hasComponent(w, eid, OrbitAttack),
        apply: (_w, eid) => { OrbitAttack.orbitRadius[eid] *= 1.25; OrbitAttack.dirty[eid] = true; },
    },
    { id: 'orbit_speed', name: '飞剑·转速+25%', desc: '',
        canApply: (w, eid) => hasComponent(w, eid, OrbitAttack),
        apply: (_w, eid) => { OrbitAttack.angularSpeed[eid] *= 1.25; OrbitAttack.dirty[eid] = true; },
    },

    { id: 'bomb_count', name: '炸弹·+1枚', desc: '',
        canApply: (w, eid) => hasComponent(w, eid, BombAttack) && BombAttack.count[eid] < 5,
        apply: (_w, eid) => { BombAttack.count[eid] += 1; },
    },
    { id: 'bomb_damage', name: '炸弹·伤害+35%', desc: '',
        canApply: (w, eid) => hasComponent(w, eid, BombAttack),
        apply: (_w, eid) => { BombAttack.damage[eid] = Math.ceil(BombAttack.damage[eid] * 1.35); },
    },
    { id: 'bomb_radius', name: '炸弹·范围+25%', desc: '',
        canApply: (w, eid) => hasComponent(w, eid, BombAttack),
        apply: (_w, eid) => { BombAttack.blastRadius[eid] *= 1.25; },
    },
    { id: 'bomb_cd', name: '炸弹·冷却-20%', desc: '',
        canApply: (w, eid) => hasComponent(w, eid, BombAttack) && BombAttack.cooldown[eid] > 0.5,
        apply: (_w, eid) => { BombAttack.cooldown[eid] = Math.max(0.5, BombAttack.cooldown[eid] * 0.8); },
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
