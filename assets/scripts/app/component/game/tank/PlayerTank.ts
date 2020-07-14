import BattleTank from "./BattleTank";
import AudioModel from "../../../model/AudioModel";
import { gameController } from "../Game";
import { AniDef } from "../../../define/AniDef";
import { GameDef } from "../../../define/GameDef";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerTank extends BattleTank {
    _buffStatus = 0;

    shoot() {
        if (super.shoot()) {
            AudioModel.playSound("sound/fire");
            return true;
        }
        return false;
    }

    born(callback: Function) {
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
}
 