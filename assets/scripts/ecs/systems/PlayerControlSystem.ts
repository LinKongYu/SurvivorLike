import { query } from '../../bitEcs';
import { Velocity, PlayerInput, Camp, velocityStore, playerInputStore, campStore } from '../Components';
import { GameConfig } from '../GameConfig';

export class PlayerControlSystem {
    update(_dt: number, world: any): void {
        const speed = GameConfig.player.moveSpeed;
        for (const eid of query(world, [Velocity, PlayerInput, Camp])) {
            if (campStore.get(eid) !== 'player') continue;
            const inp = playerInputStore.get(eid)!;
            const vel = velocityStore.get(eid)!;
            vel.x = inp.moveX * speed;
            vel.y = inp.moveY * speed;
        }
    }
}
