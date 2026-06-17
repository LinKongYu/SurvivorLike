/**
 * Entities — 实体生命周期与「伤害实体」构造的公用 helper
 *
 * - destroyEntity：合并散落 6 处的「存在性检查 → 清数据 → 移除」三行样板。
 * - addDamager：写入子弹/刀/飞剑/爆炸等伤害实体共有的字段，消除四个技能系统里
 *   重复的 DamageDealer/Owner/Collider/HitRecord 赋值与 `new Map()`。调用方仍自行
 *   addEntity（决定组件集合）、设置 Transform、各自的 marker、Render、Velocity/Lifetime，
 *   因此每种技能各自的形状依然一目了然，只是去掉了公共样板。
 */

import { entityExists, removeEntity } from '../bitEcs';
import { clearEntityData } from './ComponentRegistry';
import { DamageDealer, Owner, Collider, HitRecord } from './Components';
import { GameWorld } from './World';

/** 安全销毁实体：先确认存在，清掉其全部组件数据，再移除（避免 id 回收后读到脏数据）。 */
export function destroyEntity(world: GameWorld, eid: number): void {
    if (!entityExists(world, eid)) return;
    clearEntityData(eid);
    removeEntity(world, eid);
}

export interface DamagerParams {
    /** 命中伤害 */
    damage: number;
    /** 技能标识，决定命中判定/击退/冷却（见 Skills.ts 的 SkillId） */
    skillId: string;
    /** 伤害归属者实体 id（-1 表示无主，如爆炸） */
    ownerEid: number;
    /** 命中判定半径（像素） */
    radius: number;
}

/**
 * 为一个**已创建**的实体写入伤害源共有字段（DamageDealer/Owner/Collider + 全新 HitRecord）。
 * 前置：该实体在 addEntity 时已包含 DamageDealer、Owner、Collider、HitRecord 组件。
 */
export function addDamager(eid: number, params: DamagerParams): void {
    DamageDealer.damage[eid] = params.damage;
    DamageDealer.skillId[eid] = params.skillId;
    Owner.eid[eid] = params.ownerEid;
    Collider.radius[eid] = params.radius;
    HitRecord[eid] = new Map();
}
