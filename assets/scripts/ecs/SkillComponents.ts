/**
 * 技能相关组件
 *
 * 分两类：
 * 1. 攻击触发组件（挂在玩家身上）：定时触发技能效果
 * 2. 效果标记组件（挂在技能效果实体上）：用于识别和渲染
 *
 * 注：效果实体的碰撞/伤害不再走自定义逻辑，而是挂载通用组件
 * （Collider + DamageDealer + Owner + HitRecord + Lifetime）后
 * 由 CollisionSystem → DamageSystem → HealthSystem 标准流程处理。
 */

// ─── 攻击触发组件（挂在玩家身上） ───

/** 扇形挥砍：冷却到时在玩家周围生成刀光实体 */
export class BladeAttack {
    timer: number = 0;
    constructor(
        public cooldown: number = 1.0,
        public damage: number = 30,
        public range: number = 140,
        public arc: number = Math.PI / 2,
        public count: number = 1,
    ) {}
}

/** 环绕飞剑：管理一圈 OrbitingSword 实体的生成参数 */
export class OrbitAttack {
    dirty: boolean = true;
    swordEntityIds: number[] = [];
    constructor(
        public count: number = 2,
        public damage: number = 10,
        public orbitRadius: number = 100,
        public angularSpeed: number = 3,
    ) {}
}

/** 投掷炸弹：冷却到时在玩家周围投掷 */
export class BombAttack {
    timer: number = 0;
    constructor(
        public cooldown: number = 3.0,
        public damage: number = 50,
        public fuseTime: number = 1.0,
        public blastRadius: number = 150,
        public count: number = 1,
    ) {}
}

// ─── 效果标记组件（挂在独立实体上，用于识别和渲染） ───

/** 标记为刀光（RenderSystem 决定预制体，BladeSystem 管理生命周期） */
export class BladeMarker {}

/** 环绕飞剑标记和轨道参数（OrbitSystem 管理位置和生命周期） */
export class OrbitingSword {
    /** 冷却期间不造成伤害 */
    hitCooldown: number = 0;
    constructor(
        public ownerEntityId: number,
        public angle: number = 0,
        public angularSpeed: number = 3,
        public orbitRadius: number = 100,
        public damage: number = 10,
    ) {}
}

/** 炸弹标记（BombSystem 管理引信计时） */
export class BombMarker {
    timer: number = 0;
    constructor(
        public fuseTime: number = 1.0,
        public damage: number = 50,
        public blastRadius: number = 150,
    ) {}
}

/** 爆炸标记（BombSystem 管理生命周期） */
export class ExplosionMarker {
    timer: number = 0;
    constructor(
        public lifeTime: number = 0.35,
        public damage: number = 50,
        public radius: number = 150,
    ) {}
}

// ─── 升级选择 ───

/**
 * 升级待处理请求，挂在玩家身上
 * 世界暂停直到 UISystem 处理完所有 pendingCount
 */
export class LevelUpRequest {
    currentChoices: string[] = [];
    pendingCount: number = 0;
}
