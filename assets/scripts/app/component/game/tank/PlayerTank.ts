import BattleTank from "./BattleTank";
import AudioModel from "../../../model/AudioModel";
import { gameController } from "../Game";
import { AniDef } from "../../../define/AniDef";
import { GameDef } from "../../../define/GameDef";
import { EventDef } from "../../../define/EventDef";
import GameDataModel from "../../../model/GameDataModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerTank extends BattleTank {
    _buffStatus = 0;

    private _playerNo: number = -1; //玩家编号

    set playerNo(no: number) {
        this._playerNo = no;
    }

    get playerNo(): number {
        return this._playerNo;
    }

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
        gameController.node.emit(EventDef.EV_PLAYER_DEAD, this.playerNo);
    }

    onGetShieldStatus(time: number) {
        if (time != null) {
            gameController.playUnitAniInTime(AniDef.UnitAniType.SHIELD, this.nodeAni, time, null, () => {
                this._buffStatus |= GameDef.BUFF_INVINCIBLE;
            }, () => {
                this._buffStatus &= ~GameDef.BUFF_INVINCIBLE;
            });
        }
    }

    getBulletPowerLevel(): number {
        if (this._tankLevel === 4) {
            return GameDef.BULLET_POWER_LEVEL_STELL;
        }
        else {
            return GameDef.BULLET_POWER_LEVEL_COMMON;
        }
    }

    // setMove(bMove: boolean, nDirection: number) {
    //     console.log("[PlayerTank]SetMove tankName:",this._tankName , ",move:", bMove, ",direction:", nDirection);
    //     super.setMove(bMove, nDirection);
    // }

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


}
 