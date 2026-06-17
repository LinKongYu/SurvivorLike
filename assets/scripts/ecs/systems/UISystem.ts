import { Node } from 'cc';
import { entityExists } from '../../bitEcs';
import { System } from '../System';
import { GameWorld } from '../World';
import { LevelUpRequest } from '../SkillComponents';
import { SystemPriority } from '../Schedule';
import { UiPrimitives } from '../ui/UiPrimitives';
import { Hud } from '../ui/Hud';
import { LevelUpPanel } from '../ui/LevelUpPanel';
import { GameOverPanel } from '../ui/GameOverPanel';

/**
 * UISystem — UI 编排：首帧建好 HUD / 升级面板 / 结算面板，之后每帧刷新 HUD、
 * 根据 LevelUpRequest 显隐升级面板、game over 时弹结算。具体节点构建与升级流程
 * 拆到 ui/ 下的各 widget（Hud / LevelUpPanel / GameOverPanel / UiPrimitives）。
 *
 * runWhenPaused / runWhenGameOver 为 true：暂停（升级面板）与结束时仍需刷新 UI。
 */
export class UISystem implements System {
    readonly priority = SystemPriority.UI;
    readonly runWhenPaused = true;
    readonly runWhenGameOver = true;

    private _rootNode: Node;
    private _uiRootNode: Node | null = null;
    private _ui: UiPrimitives | null = null;
    private _hud: Hud | null = null;
    private _levelUpPanel: LevelUpPanel | null = null;
    private _gameOverPanel: GameOverPanel | null = null;
    private _initialized = false;
    private _gameOverShown = false;

    constructor(rootNode: Node) {
        this._rootNode = rootNode;
    }

    update(_dt: number, world: GameWorld): void {
        if (!this._initialized) {
            this.createUI();
            this._initialized = true;
        }

        const playerEid = world.playerEid;
        if (playerEid < 0 || !entityExists(world, playerEid)) return;

        this._hud!.update(world, playerEid);

        const req = LevelUpRequest[playerEid];
        if (req && req.pendingCount > 0) {
            if (!this._levelUpPanel!.active) {
                this._levelUpPanel!.show(world, playerEid, req);
            }
        } else if (this._levelUpPanel!.active) {
            this._levelUpPanel!.hide();
        }

        if (world.gameOver && !this._gameOverShown) {
            this._gameOverShown = true;
            const min = Math.floor(world.time / 60);
            const sec = Math.floor(world.time % 60);
            this._gameOverPanel!.show(`Survived: ${min}m ${sec}s`);
        }
    }

    private createUI(): void {
        this._uiRootNode = new Node('GameUIRoot');
        this._uiRootNode.setParent(this._rootNode);
        this._ui = new UiPrimitives();
        this._hud = new Hud(this._uiRootNode, this._ui);
        this._levelUpPanel = new LevelUpPanel(this._uiRootNode, this._ui);
        this._gameOverPanel = new GameOverPanel(this._uiRootNode, this._ui);
    }

    destroy(): void {
        if (this._uiRootNode && this._uiRootNode.isValid) {
            this._uiRootNode.destroy();
        }
        this._ui?.destroy();
        this._uiRootNode = null;
        this._ui = null;
        this._hud = null;
        this._levelUpPanel = null;
        this._gameOverPanel = null;
        this._initialized = false;
        this._gameOverShown = false;
    }
}
