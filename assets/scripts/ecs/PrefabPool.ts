import { resources, Prefab, instantiate, Node } from 'cc';

/**
 * PrefabPool - 启动时加载并缓存所有实体预制体
 *
 * 用法：
 * 1. 启动时调用 `await PrefabPool.loadAll()`
 * 2. 之后通过 `PrefabPool.instantiate(name)` 获取节点实例
 *
 * 所有预制体必须放在 `assets/resources/prefabs/` 下（由用户手动创建）：
 *   Player / Enemy / Bullet / ExpOrb / BladeHitbox / OrbitingSword / Bomb / Explosion
 */
export class PrefabPool {

    /** 需要加载的预制体名称（即 resources/prefabs/ 下的文件名，不含扩展名） */
    static readonly PREFAB_NAMES = [
        'Player', 'Enemy', 'Bullet', 'ExpOrb',
        'BladeHitbox', 'OrbitingSword', 'Bomb', 'Explosion',
    ];

    private static _prefabs: Map<string, Prefab> = new Map();
    private static _loaded: boolean = false;

    /** 批量加载所有预制体。Promise 在全部加载完毕后 resolve */
    static loadAll(): Promise<void> {
        if (this._loaded) return Promise.resolve();

        return new Promise((resolve, reject) => {
            let remaining = this.PREFAB_NAMES.length;
            let failed = false;

            for (const name of this.PREFAB_NAMES) {
                resources.load(`prefabs/${name}`, Prefab, (err, prefab) => {
                    if (failed) return;
                    if (err) {
                        failed = true;
                        console.error(`[PrefabPool] 加载失败: prefabs/${name}`, err);
                        reject(err);
                        return;
                    }
                    this._prefabs.set(name, prefab);
                    remaining--;
                    if (remaining === 0) {
                        this._loaded = true;
                        resolve();
                    }
                });
            }
        });
    }

    /** 实例化指定预制体；不存在时返回 null 并打印错误 */
    static instantiate(name: string): Node | null {
        const prefab = this._prefabs.get(name);
        if (!prefab) {
            console.error(`[PrefabPool] 预制体未加载: ${name}`);
            return null;
        }
        return instantiate(prefab);
    }

    static isLoaded(): boolean {
        return this._loaded;
    }
}
