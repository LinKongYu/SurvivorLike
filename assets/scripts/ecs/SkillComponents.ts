/**
 * 技能相关组件
 *
 * 分两类：
 * 1. 攻击触发组件（挂在玩家身上）：BladeAttack, OrbitAttack, BombAttack
 *    - 通过叠加多个攻击组件让玩家拥有多种攻击方式
 *    - 通过升级修改其参数（count/damage/range/cooldown）
 *
 * 2. 效果实体组件（挂在独立实体上，由系统生成和销毁）：
 *    BladeHitbox（扇形伤害区）, OrbitingSword（环绕飞剑）,
 *    Bomb（倒计时炸弹）, Explosion（爆炸伤害圈）
 *
 * 3. LevelUpRequest：升级选择待处理队列，挂在玩家身上
 */

// ─── 攻击触发组件（on player） ───

/** 扇形挥砍 */
export class BladeAttack {
    timer: number = 0;
    constructor(
        public cooldown: number = 1.0,
        public damage: number = 30,
        /** 半径（扇形长度） */
        public range: number = 140,
        /** 扇形张角（弧度） */
        public arc: number = Math.PI / 2,
        /** 每次触发挥砍次数；>1 时围绕玩家均分角度 */
        public count: number = 1,
    ) {}
}

/** 环绕飞剑 */
export class OrbitAttack {
    /** 标记需要重建飞剑（count 变化后由升级系统设为 true） */
    dirty: boolean = true;
    /** 当前存活飞剑实体 ID */
    swordIds: number[] = [];
    constructor(
        public count: number = 2,
        public damage: number = 10,
        /** 环绕半径（像素） */
        public orbitRadius: number = 100,
        /** 角速度（弧度/秒） */
        public angularSpeed: number = 3,
    ) {}
}

/** 投掷炸弹 */
export class BombAttack {
    timer: number = 0;
    constructor(
        public cooldown: number = 3.0,
        public damage: number = 50,
        /** 延迟引爆时间 */
        public fuseTime: number = 1.0,
        /** 爆炸伤害半径 */
        public blastRadius: number = 150,
        /** 一次触发投掷数量 */
        public count: number = 1,
    ) {}
}

// ─── 效果实体组件 ───

/** 刀的伤害区（实体） */
export class BladeHitbox {
    /** 已击中敌人集合，避免同一个挥砍多次伤害同一敌人 */
    hitEids: Set<number> = new Set();
    timer: number = 0;
    constructor(
        public lifeTime: number = 0.25,
        public damage: number = 30,
        public range: number = 140,
        /** 朝向角度（弧度，0 为向右） */
        public facingAngle: number = 0,
        public arc: number = Math.PI / 2,
    ) {}
}

/** 环绕飞剑（实体） */
export class OrbitingSword {
    /** 冷却期间不造成伤害，避免高帧率下刷伤害 */
    hitCooldown: number = 0;
    constructor(
        public ownerEid: number,
        public angle: number = 0,
        public angularSpeed: number = 3,
        public orbitRadius: number = 100,
        public damage: number = 10,
    ) {}
}

/** 炸弹本体（实体） */
export class Bomb {
    timer: number = 0;
    pulsePhase: number = 0;
    constructor(
        public fuseTime: number = 1.0,
        public damage: number = 50,
        public blastRadius: number = 150,
    ) {}
}

/** 爆炸伤害圈（实体） */
export class Explosion {
    timer: number = 0;
    dealtDamage: boolean = false;
    constructor(
        public lifeTime: number = 0.35,
        public damage: number = 50,
        public radius: number = 150,
    ) {}
}

// ─── 升级选择 ───

/** 升级待处理请求，挂在玩家身上
 *  世界暂停直到 UISystem 处理完所有 pendingCount */
export class LevelUpRequest {
    /** 当前展示的 3 个升级 ID */
    currentChoices: string[] = [];
    /** 还有多少次升级排队等待选择 */
    pendingCount: number = 0;
}
