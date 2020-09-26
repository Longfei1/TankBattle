import BattleTank from "./BattleTank";
import AudioModel from "../../../model/AudioModel";
import Game, { gameController } from "../Game";
import { AniDef } from "../../../define/AniDef";
import { GameDef } from "../../../define/GameDef";
import { EventDef } from "../../../define/EventDef";
import GameDataModel from "../../../model/GameDataModel";
import CommonFunc from "../../../common/CommonFunc";
import GameConfigModel from "../../../model/GameConfigModel";
import { GameStruct } from "../../../define/GameStruct";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerTank extends BattleTank {

    _moveAudioInfo: GameStruct.AudioInfo = null;

    shoot() {
        if (super.shoot()) {
            AudioModel.playSound("sound/fire");
            return true;
        }
        return false;
    }

    born(callback?: Function) {
        //出生后，有几秒的护盾时间
        let afterBorn = () => {
            this.onGetShieldStatus(GameDef.BORN_INVINCIBLE_TIME);
            if (typeof callback === "function") {
                callback();
            }
        }
        
        //播放出生动画
        super.born(afterBorn);
    }

    destroyNode() {
        gameController.node.emit(EventDef.EV_PLAYER_DEAD, this.id);
    }

    getBulletPowerLevel(): number {
        //玩家子弹威力和等级绑定
        if (this._tankLevel === 4) {
            return GameDef.BULLET_POWER_LEVEL_STELL;
        }
        else {
            return GameDef.BULLET_POWER_LEVEL_COMMON;
        }
    }

    setMove(bMove: boolean, nDirection: number) {
        let lastMove = this._isMove;

        super.setMove(bMove, nDirection);

        if (lastMove != this._isMove) {
            if (this._isMove) {
                this.playMoveSound();
            }
            else {
                this.stopMoveSound();
            }
        }
    }

    playMoveSound() {
        this.stopMoveSound();
        this._moveAudioInfo = AudioModel.playSound("sound/move", true);
    }

    stopMoveSound() {
        if (this._moveAudioInfo != null && this._moveAudioInfo.audioID != null) {
            AudioModel.stopSound(this._moveAudioInfo);
        }
    }

    lateUpdate() {
        //super.lateUpdate();

        //
        if (GameDataModel.isGameDebugMode()) {
            let directions = this.getAvailableMoveDirections();
            let textInfo = {
                [GameDef.DIRECTION_UP]: "上",
                [GameDef.DIRECTION_DOWN]: "下",
                [GameDef.DIRECTION_LEFT]: "左",
                [GameDef.DIRECTION_RIGHT]: "右",
            };

            let info = "可移动方向\n";
            for (let it of directions) {
                info += textInfo[it];
            }

            gameController.node.emit(EventDef.EV_GAME_SHOW_DEBUG_TEXT, info);
        }
    }

    haveBuff(value: number) {
        if (value != null) {
            if (CommonFunc.isBitSet(this._buffStatus, value)) {
                return true;
            }
        }
        return false;
    }

    onHited(bulletNode: cc.Node) {
        if (this.haveBuff(GameDef.TANK_BUFF_INVINCIBLE)) {
            return;
        }

        if (this._tankLevel >= GameDef.PLAYER_LEVEL_PROTECT_ONCE_DEAD) {
            this.setTankLevel(this._tankLevel - 1);
            return;
        }

        this.dead();
    }

    onLevelUp() {
        if (this._tankLevel < this._tankMaxLevel) {
            this.setTankLevel(this._tankLevel + 1);
        }
    }

    onMaxLevel() {
        this.setTankLevel(this._tankMaxLevel);
    }

    onLevelUpdated() {
        super.onLevelUpdated();

        //玩家坦克等级变化时，更新其他属性
        let atru = GameConfigModel.tankData[this._tankName];
        if (atru) {
            if (this._tankLevel >= 2) {
                this._bulletSpeed = atru.bulletSpeed + 100; //等级大于2后，提升子弹速度
            }
            else{
                this._bulletSpeed = atru.bulletSpeed;
            }
        }

        if (this._tankLevel >= 3) {
            this._maxBulletNum = 2; //等级大于3后，提升共存数量
        }
        else {
            this._maxBulletNum = 1;
        }
    }
}
 