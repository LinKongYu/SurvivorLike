import { ISystem, ECSWorld } from '../World';
import {
    Transform, Health, PlayerInput, Camp,
    DamageDealer, Owner, Collider, HitRecord, Lifetime, Velocity, Drag,
} from '../Components';
import { BombAttack, BombMarker, ExplosionMarker } from '../SkillComponents';
import { GameConfig } from '../GameConfig';

/**
 * BombSystem — 炸弹 + 爆炸
 * Priority: 24
 *
 * 只负责触发逻辑：
 * 1. tick BombAttack 冷却，到时生成 BombMarker 实体
 * 2. tick BombMarker 引信，到时生成 ExplosionMarker 实体
 *
 * 炸弹/爆炸实体的伤害由 CombatSystem 的碰撞流程统一处理。
 */
export class BombSystem implements ISystem {

    update(dt: number, world: ECSWorld): void {
        if (world.isGameOver() || world.isPaused()) return;

        this.triggerBombs(dt, world);
        this.tickBombs(dt, world);
        this.tickExplosions(dt, world);
    }

    /** 持有 BombAttack 的玩家冷却到时投掷炸弹 */
    private triggerBombs(dt: number, world: ECSWorld): void {
        const players = world.query(Transform, PlayerInput, BombAttack);
        for (const pid of players) {
            const atk = world.getComponent(pid, BombAttack)!;
            atk.timer += dt;
            if (atk.timer < atk.cooldown) continue;
            atk.timer = 0;

            const ptf = world.getComponent(pid, Transform)!;
            const step = (Math.PI * 2) / atk.count;
            const throwDist = atk.count > 1 ? GameConfig.skills.bomb.throwDistance : 0;
            for (let i = 0; i < atk.count; i++) {
                const angle = i * step + Math.random() * 0.3;
                this.spawnBomb(world,
                    ptf.x + Math.cos(angle) * throwDist,
                    ptf.y + Math.sin(angle) * throwDist,
                    atk.fuseTime, atk.damage, atk.blastRadius, pid);
            }
        }
    }

    /** 创建炸弹实体 */
    private spawnBomb(
        world: ECSWorld, x: number, y: number,
        fuseTime: number, damage: number, blastRadius: number,
        ownerEid: number,
    ): void {
        const eid = world.createEntity();
        world.addComponent(eid, new Transform(x, y));
        world.addComponent(eid, new BombMarker(fuseTime, damage, blastRadius));
    }

    /** tick 炸弹引信，到时生成爆炸 */
    private tickBombs(dt: number, world: ECSWorld): void {
        const store = world.getStore(BombMarker);
        if (!store) return;

        for (const [bid, bomb] of store) {
            bomb.timer += dt;
            if (bomb.timer >= bomb.fuseTime) {
                const tf = world.getComponent(bid, Transform)!;
                this.spawnExplosion(world, tf.x, tf.y, bomb.blastRadius, bomb.damage);
                world.destroyEntity(bid);
            }
        }
    }

    /** 创建爆炸实体 */
    private spawnExplosion(
        world: ECSWorld, x: number, y: number,
        radius: number, damage: number,
    ): void {
        const lifeTime = GameConfig.skills.bomb.explosion.lifeTime;
        const knockback = GameConfig.skills.bomb.explosion.knockbackSpeed;

        const eid = world.createEntity();
        world.addComponent(eid, new Transform(x, y));
        world.addComponent(eid, new ExplosionMarker(lifeTime, damage, radius));
        world.addComponent(eid, new Collider(radius));
        world.addComponent(eid, new DamageDealer(damage, 'explosion'));
        world.addComponent(eid, new HitRecord());
        world.addComponent(eid, new Lifetime(lifeTime));
    }

    /** 管理爆炸生命周期 */
    private tickExplosions(dt: number, world: ECSWorld): void {
        const store = world.getStore(ExplosionMarker);
        if (!store) return;

        for (const [exid, exp] of store) {
            exp.timer += dt;
            if (exp.timer >= exp.lifeTime) {
                world.destroyEntity(exid);
            }
        }
    }
}
