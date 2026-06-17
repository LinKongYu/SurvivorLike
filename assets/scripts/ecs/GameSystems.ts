/**
 * GameSystems — 正式游戏的系统流水线工厂
 *
 * 把「有哪些系统、谁先谁后」集中在一处：在此 new 一下即可接入新系统，执行顺序由
 * 各系统自带的 SystemPriority 决定（见 Schedule.ts），这里按优先级排好序后返回。
 * GameEntry 仅负责调用本工厂并逐帧驱动。
 */

import { Node } from 'cc';
import { System } from './System';
import { sortSystems } from './Schedule';

import { InputSystem } from './systems/InputSystem';
import { PlayerControlSystem } from './systems/PlayerControlSystem';
import { MonsterChaseSystem } from './systems/MonsterChaseSystem';
import { MagnetSystem } from './systems/MagnetSystem';
import { MovementSystem } from './systems/MovementSystem';
import { DragSystem } from './systems/DragSystem';
import { SeparationSystem } from './systems/SeparationSystem';
import { CombatSystem } from './systems/CombatSystem';
import { HitFlashSystem } from './systems/HitFlashSystem';
import { BladeSystem } from './systems/BladeSystem';
import { OrbitSystem } from './systems/OrbitSystem';
import { BombSystem } from './systems/BombSystem';
import { ExperienceSystem } from './systems/ExperienceSystem';
import { SpawnerSystem } from './systems/SpawnerSystem';
import { LifetimeSystem } from './systems/LifetimeSystem';
import { RenderSystem } from './systems/RenderSystem';
import { UISystem } from './systems/UISystem';

/** 构造并按执行顺序排好的完整游戏系统列表。RenderSystem / UISystem 需要场景根节点。 */
export function createGameSystems(rootNode: Node): System[] {
    return sortSystems([
        new InputSystem(),
        new PlayerControlSystem(),
        new MonsterChaseSystem(),
        new MagnetSystem(),
        new MovementSystem(),
        new DragSystem(),
        new SeparationSystem(),
        new CombatSystem(),
        new HitFlashSystem(),
        new BladeSystem(),
        new OrbitSystem(),
        new BombSystem(),
        new ExperienceSystem(),
        new SpawnerSystem(),
        new LifetimeSystem(),
        new RenderSystem(rootNode),
        new UISystem(rootNode),
    ]);
}
