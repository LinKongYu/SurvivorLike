import { query } from '../../bitEcs';
import { Velocity, PlayerInput, Camp } from '../Components';
import { GameConfig } from '../GameConfig';

export class PlayerControlSystem {
    update(_dt: number, world: any): void {
        const speed = GameConfig.player.moveSpeed;
        for (const eid of query(world, [Velocity, PlayerInput, Camp])) {
            if (Camp.value[eid] !== 'player') continue;
            Velocity.x[eid] = PlayerInput.moveX[eid] * speed;
            Velocity.y[eid] = PlayerInput.moveY[eid] * speed;
        }
    }
}
