/**
 * Skills — 技能标识与战斗元数据的单一数据源
 *
 * skillId 是「伤害实体」携带的标记（DamageDealer.skillId）。CombatSystem 据此决定
 * 命中判定方式（扇形/圆形）、击退力度、再次命中冷却。过去这些以魔法字符串 + switch
 * 形式散落在 CombatSystem 与各技能系统里，新增伤害技能要改多处。现集中于此：
 *   - SkillId：所有合法 skillId 常量（消除魔法字符串、便于改名/查引用）
 *   - skillKnockbackSpeed / skillHitCooldown：从 GameConfig.skills 取值的查表函数
 *   - HIT_FLASH：命中闪白的视觉常量
 *
 * 新增一个伤害技能：在 SkillId 加常量、在下面两个函数补一行映射即可，CombatSystem
 * 的判定主循环无需改动。数值仍只存在于配置表，这里不复制。
 */

import { GameConfig } from './GameConfig';

export const SkillId = {
    Bullet: 'bullet',
    Blade: 'blade',
    Orbit: 'orbit',
    Explosion: 'explosion',
    EnemyContact: 'enemy_contact',
} as const;
export type SkillId = typeof SkillId[keyof typeof SkillId];

/** 命中后施加的击退初速度（像素/秒）；未配置击退的技能返回 0。 */
export function skillKnockbackSpeed(skillId: string): number {
    const s = GameConfig.skills;
    switch (skillId) {
        case SkillId.Bullet: return s.bullet.knockbackSpeed;
        case SkillId.Blade: return s.blade.knockbackSpeed;
        case SkillId.Orbit: return s.orbit.knockbackSpeed;
        case SkillId.Explosion: return s.bomb.explosion.knockbackSpeed;
        default: return 0;
    }
}

/** 同一伤害源再次命中同一目标的冷却（秒）；一次性命中类返回 Infinity（命中后只记一次）。 */
export function skillHitCooldown(skillId: string): number {
    if (skillId === SkillId.Orbit) return GameConfig.skills.orbit.hitCooldown;
    return Infinity;
}

/** 命中闪白：红色、0.15s。被 CombatSystem 触发、HitFlashSystem 渲染。 */
export const HIT_FLASH = {
    color: [1, 0, 0, 1] as [number, number, number, number],
    duration: 0.15,
};
