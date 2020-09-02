import BattleTank from "./BattleTank";
import { GameDef } from "../../../define/GameDef";
import CommonFunc from "../../../common/CommonFunc";

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

    reset() {
        super.reset();
        this._id = -1;
    }

    born(callback?: Function) {
        let cb = ()=> {
            if (typeof callback === "function") {
                callback();
            }

            this.moveOnBorn()
        };

        super.born(cb);
    }

    //************************
    //行为控制相关

    //当前方向移动失败
    onMoveFailed() {
        //先随机寻找一个可移动的方向移动
        let directions = this.getAvailableMoveDirections();
        if (directions.length > 0) {
            let dir = CommonFunc.getRandomArrayValue(directions);

            this.setMove(true, dir);
        }
    }

    //行为控制定时器
    onBehaviorTimer() {
        if (CommonFunc.isInProbability(0.15)) {
            //给定概率下改变移动方向

            this.changeMoveDirection()
        }

        if (CommonFunc.isInProbability(0.5)) {
            this.shoot();
        }
    }

    moveOnBorn() {
        let directions = this.getAvailableMoveDirections();
        if (directions.length > 0) {
            let dir = CommonFunc.getRandomArrayValue(directions);
            this.setMove(true, dir);
        }
    }

    changeMoveDirection() {
        let directions = this.getAvailableMoveDirections();
        if (directions.length > 1 && this._isMove) {
            //筛选出原来的移动方向
            CommonFunc.filterArray(directions, [this._moveDirection]);
        }

        if (directions.length > 0) {
            let dir = CommonFunc.getRandomArrayValue(directions);
            this.setMove(true, dir);
        }
    }

    //行为控制相关
    //************************
}