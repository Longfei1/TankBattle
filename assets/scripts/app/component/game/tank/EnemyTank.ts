import BattleTank from "./BattleTank";
import { GameDef } from "../../../define/GameDef";
import CommonFunc from "../../../common/CommonFunc";
import { gameController } from "../Game";
import { EventDef } from "../../../define/EventDef";
import GameDataModel from "../../../model/GameDataModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyTank extends BattleTank {

    _bRed: boolean = false;

    setRed(bRed: boolean) {
        this._bRed = bRed;
    }

    reset() {
        super.reset();
        this._bRed = false;
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

    onHited(node: cc.Node) {
        if (this._bRed) {
            this.setRed(false);

            gameController.node.emit(EventDef.EV_PROP_CREATE); //产生道具

            return;
        }

        if (this._tankLevel > 1) {
            this._tankLevel--;
            return;
        }

        this.dead();
    }

    destroyNode() {
        gameController.node.emit(EventDef.EV_ENEMY_DEAD, this.id);
    }

    getTankImgName(): string {
        if (this._tankName === "") {
            return;
        }

        if (!this.DirectionSuffix[this._moveDirection]) {
            return;
        }

        let levelName = `${this._tankLevel}`;
        if (this._bRed) {
            levelName = "red"
        }

        let frameName = `${this._tankName}_${levelName}${this.DirectionSuffix[this._moveDirection]}_${this._imgShowFrame}`;
        return frameName;
    }

    calcMove(dt) {
        let moveDiff = 0;
        
        if (this._isMove) {
            moveDiff = this._speedMove * dt;
        }

        if (CommonFunc.isBitSet(GameDataModel._propBuff, GameDef.PROP_BUFF_STATIC)) {
            //定时道具时间
            moveDiff = 0;
        }

        return moveDiff;
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

        if (CommonFunc.isInProbability(0.4)) {
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