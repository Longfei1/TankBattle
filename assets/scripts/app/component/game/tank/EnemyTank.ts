import BattleTank from "./BattleTank";
import { GameDef } from "../../../define/GameDef";
import CommonFunc from "../../../common/CommonFunc";
import { gameController } from "../Game";
import { EventDef } from "../../../define/EventDef";
import GameDataModel from "../../../model/GameDataModel";
import Bullet from "../Bullet";

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

    onHited(bulletNode: cc.Node) {
        let bulletLevel = bulletNode.getComponent(Bullet)._powerLevel;
        let hitCount = bulletLevel == GameDef.BULLET_POWER_LEVEL_STELL ? 2 : 1; //被能击毁钢的子弹打中时，扣两次等级
        if (this._bRed) {
            this.setRed(false);

            gameController.node.emit(EventDef.EV_PROP_CREATE); //产生道具

            hitCount--;

            if (hitCount === 0) {
                return;
            }
        }

        if (this._tankLevel > hitCount) {
            this._tankLevel = this._tankLevel - hitCount;
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
            moveDiff = this._moveSpeed * dt;
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
        let twoDirs = this.getAllMoveDirectionsCanChoose();
        this.chooseOneDirctionMove(twoDirs);
    }

    changeMoveDirection() {
        let twoDirs = this.getAllMoveDirectionsCanChoose();
        if (this._isMove) {
            //筛选出原来的移动方向
            CommonFunc.filterArray(twoDirs.moveableDirs, [this._moveDirection]);
            CommonFunc.filterArray(twoDirs.tryDirs, [this._moveDirection]);
        }

        this.chooseOneDirctionMove(twoDirs);
    }

    chooseOneDirctionMove(twoDirs) {
        let movedirs = null;
        if (twoDirs.moveableDirs.length > 0) {
            if (twoDirs.tryDirs.length > 0) {
                //按照概率选择移动方向
                if (CommonFunc.isInProbability(0.8)) {
                    movedirs = twoDirs.moveableDirs;
                }
                else {
                    movedirs = twoDirs.tryDirs;
                }
            }
            else {
                movedirs = twoDirs.moveableDirs;
            }
        }
        else {
            //没有可移动方向，随机一个方向移动
            if (twoDirs.tryDirs.length > 0) {
                movedirs = twoDirs.tryDirs;
            }
        }

        if (movedirs) {


            let dir = CommonFunc.getRandomArrayValue(movedirs);
            this.setMove(true, dir);
        }
    }

    //获取所有可以选择移动的方向(不包括会造成触碰边界的方向)
    getAllMoveDirectionsCanChoose() {
        let tryDirections = [GameDef.DIRECTION_UP, GameDef.DIRECTION_LEFT, GameDef.DIRECTION_DOWN, GameDef.DIRECTION_RIGHT];
        let moveableDirections = this.getAvailableMoveDirections();

        CommonFunc.filterArray(tryDirections, moveableDirections); //筛选可移动的方向

        for (let i = tryDirections.length - 1; i >= 0; i--) {
            if (this.isOutBoundaryDirction(tryDirections[i])) { //排除会导致越界的方向
                tryDirections.splice(i, 1);
            }
        }

        return {moveableDirs: moveableDirections, tryDirs: tryDirections};//{可移动方向，可尝试的不可移动方向}
    }

    //该方向是否会导致越界
    isOutBoundaryDirction(dir: number) {
        let pos = this.node.getPosition();
        let distance = this._moveSpeed * (1 / GameDef.GAME_FPS);
        let moveAreaRect: cc.Rect;
        let width = GameDataModel.getTankWidth();
        if (dir === GameDef.DIRECTION_UP) {
            moveAreaRect = cc.rect(pos.x, pos.y + width, width, distance);
        }
        else if (dir === GameDef.DIRECTION_DOWN) {
            moveAreaRect = cc.rect(pos.x, pos.y - distance, width, distance);
        }
        else if (dir === GameDef.DIRECTION_LEFT) {
            moveAreaRect = cc.rect(pos.x - distance, pos.y, distance, width);
        }
        else if (dir === GameDef.DIRECTION_RIGHT) {
            moveAreaRect = cc.rect(pos.x + width, pos.y, distance, width);
        }

        if (moveAreaRect) {
            if (GameDataModel.isValidRect(moveAreaRect)) {
                return true;
            }
        }

        return false;
    }

    //行为控制相关
    //************************
}