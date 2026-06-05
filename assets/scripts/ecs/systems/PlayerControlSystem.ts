import { query } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import { Velocity, PlayerInput, Camp } from '../Components';
import { GameConfig } from '../GameConfig';

export class PlayerControlSystem implements System {
    readonly priority = 2;

    update(_dt: number, world: GameWorld): void {
        const speed = GameConfig.player.moveSpeed;
        for (const eid of query(world, [Velocity, PlayerInput, Camp])) {
            if (Camp.value[eid] !== 'player') continue;
            Velocity.x[eid] = PlayerInput.moveX[eid] * speed;
            Velocity.y[eid] = PlayerInput.moveY[eid] * speed;
        }
    }
}
