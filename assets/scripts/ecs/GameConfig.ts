import { resources, TextAsset } from 'cc';

/**
 * GameConfig - CSV 表读取与类型化配置访问
 *
 * CSV 位于 `assets/resources/configs/` 下，作为 TextAsset 加载。
 * 三种表结构：
 * 1. 单行宽表（Player / Spawner）：首行为列名，第二行为数据。
 *    列名支持 `a.b.c` 点分隔，解析为嵌套对象。
 * 2. 多行宽表（Enemy）：首行为列名，每行一条记录；按 `id` 列索引为 Map。
 * 3. 长表（Skill）：列为 (skill, key, value)；按 skill 分组，支持 key 中的点分嵌套。
 *
 * 所有数值字段自动识别并转为 number；无法解析为数字的保留为 string。
 */

// ─── 类型定义 ───

export interface PlayerConfig {
    hp: number;
    moveSpeed: number;
    invincibleTime: number;
    initialAttack: {
        cooldown: number;
        range: number;
        damage: number;
        bulletSpeed: number;
        count: number;
        spreadAngle: number;
    };
    level: {
        initialExpToNext: number;
        expGrowthFactor: number;
    };
}

export interface EnemyConfig {
    id: string;
    baseHp: number;
    baseDamage: number;
    baseMoveSpeed: number;
    baseExpReward: number;
    colliderRadius: number;
    hpScalePerLevel: number;
    damageScalePerLevel: number;
    speedScalePerLevel: number;
    expBonusPerLevel: number;
}

export interface SpawnerConfig {
    initialInterval: number;
    initialMaxCount: number;
    spawnRadius: number;
    minSpawnDistance: number;
    initialSpawnCount: number;
    difficultyIntervalSeconds: number;
    spawnIntervalDecay: number;
    minInterval: number;
    maxCountIncrement: number;
    maxCountCap: number;
}

export interface BulletSkillConfig {
    lifeTime: number;
    hitRadius: number;
    knockbackSpeed: number;
}

export interface ExpOrbSkillConfig {
    attractRange: number;
    attractSpeed: number;
    collectDistance: number;
}

export interface ContactSkillConfig {
    enemyPlayerHitRadius: number;
}

export interface KnockbackConfig {
    /** 击退速度阻尼系数：越小滑行越远、击退越明显（典型 4~8） */
    drag: number;
}

export interface BladeSkillConfig {
    cooldown: number;
    damage: number;
    range: number;
    arcDegrees: number;
    count: number;
    lifeTime: number;
    knockbackSpeed: number;
}

export interface OrbitSkillConfig {
    count: number;
    damage: number;
    orbitRadius: number;
    angularSpeed: number;
    hitCooldown: number;
    hitRadius: number;
    knockbackSpeed: number;
}

export interface BombSkillConfig {
    cooldown: number;
    damage: number;
    fuseTime: number;
    blastRadius: number;
    count: number;
    throwDistance: number;
    explosion: {
        lifeTime: number;
        knockbackSpeed: number;
    };
}

export interface SkillsConfig {
    bullet: BulletSkillConfig;
    expOrb: ExpOrbSkillConfig;
    contact: ContactSkillConfig;
    knockback: KnockbackConfig;
    blade: BladeSkillConfig;
    orbit: OrbitSkillConfig;
    bomb: BombSkillConfig;
}

// ─── CSV 解析工具 ───

/** 按行切分，忽略空行和以 # 开头的注释行 */
function splitLines(text: string): string[] {
    return text.split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#'));
}

/** 简单 CSV 行解析（不支持带引号的字段，够用即可） */
function parseRow(line: string): string[] {
    return line.split(',').map(s => s.trim());
}

/** 若字符串可解析为 number 则返回 number，否则返回原 string */
function coerce(raw: string): number | string {
    if (raw === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
}

/** 按 `a.b.c` 形式写入嵌套对象 */
function setNested(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') {
            cur[parts[i]] = {};
        }
        cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
}

/**
 * 宽表 → 对象数组。每行对应一个对象，列名支持点分嵌套。
 */
function parseWideTable(text: string): any[] {
    const lines = splitLines(text);
    if (lines.length < 2) return [];
    const headers = parseRow(lines[0]);
    const result: any[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseRow(lines[i]);
        const obj: any = {};
        for (let c = 0; c < headers.length; c++) {
            setNested(obj, headers[c], coerce(values[c] ?? ''));
        }
        result.push(obj);
    }
    return result;
}

/**
 * 长表 → 按第 1 列分组的嵌套对象。
 * 假定列顺序为 (group, key, value)。
 */
function parseLongTable(text: string): Record<string, any> {
    const lines = splitLines(text);
    if (lines.length < 2) return {};
    // 忽略第 1 行 header
    const groups: Record<string, any> = {};
    for (let i = 1; i < lines.length; i++) {
        const [group, key, value] = parseRow(lines[i]);
        if (!group || !key) continue;
        if (!groups[group]) groups[group] = {};
        setNested(groups[group], key, coerce(value ?? ''));
    }
    return groups;
}

// ─── 加载后校验：缺键/非数值即报错，避免运行期静默 NaN ───

/** 读取 `a.b.c` 形式的嵌套值；任一层缺失返回 undefined。 */
function getPath(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/** 校验 obj 上一组点分路径均为有限数值，返回缺失/非数值路径（带 label 前缀）。 */
function requireNumbers(obj: any, paths: string[], label: string): string[] {
    const bad: string[] = [];
    for (const p of paths) {
        const v = getPath(obj, p);
        if (typeof v !== 'number' || !Number.isFinite(v)) bad.push(`${label}.${p}`);
    }
    return bad;
}


// ─── GameConfig 单例 ───

export class GameConfig {

    static player: PlayerConfig = null!;
    /** 按 id 索引的敌人配置。当前只有 default，未来可扩展多种 */
    static enemies: Map<string, EnemyConfig> = new Map();
    static spawner: SpawnerConfig = null!;
    static skills: SkillsConfig = null!;

    private static _loaded = false;

    /** 获取默认敌人配置的便捷方法 */
    static get enemyDefault(): EnemyConfig {
        const e = this.enemies.get('default');
        if (!e) throw new Error('[GameConfig] Enemy.csv 缺少 id=default 行');
        return e;
    }

    /**
     * 并发加载所有 CSV，解析并填充到静态字段
     */
    static loadAll(): Promise<void> {
        if (this._loaded) return Promise.resolve();

        const load = (path: string): Promise<string> => new Promise((resolve, reject) => {
            resources.load(path, TextAsset, (err, asset) => {
                if (err) {
                    reject(new Error(`加载失败: ${path} — ${err.message}`));
                    return;
                }
                resolve(asset.text);
            });
        });

        return Promise.all([
            load('configs/Player'),
            load('configs/Enemy'),
            load('configs/Spawner'),
            load('configs/Skill'),
        ]).then(([playerCsv, enemyCsv, spawnerCsv, skillCsv]) => {
            const playerRows = parseWideTable(playerCsv);
            if (playerRows.length === 0) throw new Error('Player.csv 没有数据行');
            this.player = playerRows[0] as PlayerConfig;

            const enemyRows = parseWideTable(enemyCsv) as EnemyConfig[];
            this.enemies.clear();
            for (const row of enemyRows) {
                if (row.id) this.enemies.set(row.id, row);
            }
            if (this.enemies.size === 0) throw new Error('Enemy.csv 没有数据行');

            const spawnerRows = parseWideTable(spawnerCsv);
            if (spawnerRows.length === 0) throw new Error('Spawner.csv 没有数据行');
            this.spawner = spawnerRows[0] as SpawnerConfig;

            this.skills = parseLongTable(skillCsv) as SkillsConfig;

            this.validate();
            this._loaded = true;
        });
    }

    /** 校验关键数值字段齐备；缺失则一次性抛出全部问题，便于改表时定位。 */
    private static validate(): void {
        const errors: string[] = [
            ...requireNumbers(this.player, [
                'hp', 'moveSpeed', 'invincibleTime',
                'initialAttack.cooldown', 'initialAttack.range', 'initialAttack.damage',
                'initialAttack.bulletSpeed', 'initialAttack.count', 'initialAttack.spreadAngle',
                'level.initialExpToNext', 'level.expGrowthFactor',
            ], 'Player'),
            ...requireNumbers(this.spawner, [
                'initialInterval', 'initialMaxCount', 'spawnRadius', 'minSpawnDistance',
                'initialSpawnCount', 'difficultyIntervalSeconds', 'spawnIntervalDecay',
                'minInterval', 'maxCountIncrement', 'maxCountCap',
            ], 'Spawner'),
            ...requireNumbers(this.enemyDefault, [
                'baseHp', 'baseDamage', 'baseMoveSpeed', 'baseExpReward', 'colliderRadius',
                'hpScalePerLevel', 'damageScalePerLevel', 'speedScalePerLevel', 'expBonusPerLevel',
            ], 'Enemy(default)'),
            ...requireNumbers(this.skills, [
                'bullet.lifeTime', 'bullet.hitRadius', 'bullet.knockbackSpeed',
                'expOrb.attractRange', 'expOrb.attractSpeed', 'expOrb.collectDistance',
                'contact.enemyPlayerHitRadius', 'knockback.drag',
                'blade.cooldown', 'blade.damage', 'blade.range', 'blade.arcDegrees',
                'blade.count', 'blade.lifeTime', 'blade.knockbackSpeed',
                'orbit.count', 'orbit.damage', 'orbit.orbitRadius', 'orbit.angularSpeed',
                'orbit.hitCooldown', 'orbit.hitRadius', 'orbit.knockbackSpeed',
                'bomb.cooldown', 'bomb.damage', 'bomb.fuseTime', 'bomb.blastRadius',
                'bomb.count', 'bomb.throwDistance',
                'bomb.explosion.lifeTime', 'bomb.explosion.knockbackSpeed',
            ], 'Skill'),
        ];
        if (errors.length > 0) {
            throw new Error('[GameConfig] 配置缺失或非数值字段:\n  ' + errors.join('\n  '));
        }
    }
}
