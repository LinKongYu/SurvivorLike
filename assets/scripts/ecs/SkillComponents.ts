/**
 * Skill components - attack trigger data and spawned skill effect data.
 */

// ─── 攻击触发（挂在玩家身上） ───

export const BladeAttack = {
    timer: [] as number[],
    cooldown: [] as number[],
    damage: [] as number[],
    range: [] as number[],
    arc: [] as number[],
    count: [] as number[],
};

export const OrbitAttack = {
    dirty: [] as boolean[],
    swordEntityIds: [] as number[][],
    count: [] as number[],
    damage: [] as number[],
    orbitRadius: [] as number[],
    angularSpeed: [] as number[],
};

export const BombAttack = {
    timer: [] as number[],
    cooldown: [] as number[],
    damage: [] as number[],
    fuseTime: [] as number[],
    blastRadius: [] as number[],
    count: [] as number[],
};

// ─── 技能效果实体 ───

export const BladeMarker = {
    facingAngle: [] as number[],
    arc: [] as number[],
    range: [] as number[],
};

export const OrbitingSword = {
    ownerEntityId: [] as number[],
    angle: [] as number[],
    angularSpeed: [] as number[],
    orbitRadius: [] as number[],
    damage: [] as number[],
    hitCooldown: [] as number[],
};

export const BombMarker = {
    timer: [] as number[],
    fuseTime: [] as number[],
    damage: [] as number[],
    blastRadius: [] as number[],
};

export const ExplosionMarker = {
    lifeTime: [] as number[],
    damage: [] as number[],
    radius: [] as number[],
};

// ─── 升级选择 ───

export type LevelUpRequestData = {
    currentChoices: string[];
    pendingCount: number;
};
export const LevelUpRequest = [] as LevelUpRequestData[];

const SKILL_COMPONENTS_WITH_DATA = [
    BladeAttack, OrbitAttack, BombAttack,
    BladeMarker, OrbitingSword, BombMarker, ExplosionMarker,
    LevelUpRequest,
];

function clearComponentData(eid: number, component: any): void {
    if (Array.isArray(component)) {
        delete component[eid];
        return;
    }

    for (const value of Object.values(component)) {
        if (Array.isArray(value)) delete value[eid];
    }
}

export function clearSkillComponentData(eid: number): void {
    for (const component of SKILL_COMPONENTS_WITH_DATA) {
        clearComponentData(eid, component);
    }
}
