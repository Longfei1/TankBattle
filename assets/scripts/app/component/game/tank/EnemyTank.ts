import BattleTank from "./BattleTank";
import { GameDef } from "../../../define/GameDef";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyTank extends BattleTank {

    private _id: number = -1;

    //编号
    set id(id: number) {
       this._id = id; 
    }

    get id(): number {
        return this._id; 
    }

    born(callback: Function) {
        super.born(callback);
    }

    lateUpdate() {
        if (this._moveDiff > 0) {
            if (this._canMove) {
                this.savePositon();
            }
            else {
                if (this._lastPosition) {
                    this.node.setPosition(this._lastPosition);
                    this._canMove = true;
                    //this.cleanCorrectMoveStatus();

                    this.doWhenCollision();
                }
            }
        }
    }

    //************************
    //行为控制相关

    //碰撞发生
    doWhenCollision() {

    }

    //行为控制相关
    //************************
}