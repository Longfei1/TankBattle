import BattleTank from "./BattleTank";
import AudioModel from "../../../model/AudioModel";
import Game, { gameController } from "../Game";
import { AniDef } from "../../../define/AniDef";
import { GameDef } from "../../../define/GameDef";
import { EventDef } from "../../../define/EventDef";
import GameDataModel from "../../../model/GameDataModel";
import CommonFunc from "../../../common/CommonFunc";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerTank extends BattleTank {
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

    haveBuff(value: number) {
        if (value != null) {
            if (CommonFunc.isBitSet(this._buffStatus, value)) {
                return true;
            }
        }
        return false;
    }

    onHited(node: cc.Node) {
        if (this.haveBuff(GameDef.TANK_BUFF_INVINCIBLE)) {
            return;
        }

        if (this._tankLevel >= GameDef.PLAYER_LEVEL_PROTECT_ONCE_DEAD) {
            this._tankLevel = 1;
            return;
        }

        this.dead();
    }
}
 