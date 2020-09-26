import BattleTank from "./BattleTank";
import { GameDef } from "../../../define/GameDef";
import CommonFunc from "../../../common/CommonFunc";
import { gameController } from "../Game";
import { EventDef } from "../../../define/EventDef";
import GameDataModel from "../../../model/GameDataModel";
import Bullet from "../Bullet";

const { ccclass, property } = cc._decorator;

//遇到障碍后，继续尝试朝该方向移动的时间区间。
const TRY_MOVE_TIME_MIN = 0.2; 
const TRY_MOVE_TIME_MAX = 0.6;       

@ccclass
export default class EnemyTank extends BattleTank {

    _bRed: boolean = false;

    _tryMoveTime: number = 0;
    _tryMoveStartTime: number = 0;
    _bTryMoving: boolean = false;

    _destroyedBy: number;

    setRed(bRed: boolean) {
        this._bRed = bRed;
        this.updateTankImg();
    }

    reset() {
        super.reset();
        this._bRed = false;

        this._tryMoveStartTime = 0;
        this._bTryMoving = false;
        this._destroyedBy = -1;
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
        let com = bulletNode.getComponent(Bullet);
        let bulletLevel = com._powerLevel;
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
            this.setTankLevel(this._tankLevel - hitCount);
            return;
        }

        this._destroyedBy = com._shooterID;
        this.dead();
    }

    destroyNode() {
        gameController.node.emit(EventDef.EV_ENEMY_DEAD, this.id);
    }

    getTankImgName(): string {
        if (this._imgName === "") {
            return;
        }

        if (!this.DirectionSuffix[this._moveDirection]) {
            return;
        }

        let levelName = `${this._tankLevel}`;
        if (this._bRed) {
            levelName = "red"
        }

        let frameName = `${this._imgName}_${levelName}${this.DirectionSuffix[this._moveDirection]}_${this._imgShowFrame}`;
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

    getDestroyScore() {
        if (GameDef.EnemyTankScore[this._tankName]) {
            return GameDef.EnemyTankScore[this._tankName];
        }

        return 0;
    }

    shoot(): boolean {
        if (!CommonFunc.isBitSet(GameDataModel._propBuff, GameDef.PROP_BUFF_STATIC)) {
            return super.shoot();
        }
        return false;
    }

    //************************
    //行为控制相关

    setMove(bMove: boolean, nDirection: number) {
        if (CommonFunc.isBitSet(GameDataModel._propBuff, GameDef.PROP_BUFF_STATIC)) {
            return;
        }
        if (!bMove || nDirection != this._moveDirection) {
            this._bTryMoving = false; //停止移动或换方向，重置尝试移动标志
        }

        super.setMove(bMove, nDirection);
    }

    //当前方向移动失败
    onMoveFailed() {
        if (GameDataModel._gameOver) {
            return;
        }

        let time = CommonFunc.getTimeStamp();
        //障碍物不是边界时，尝试突破障碍物
        if (!this._bTryMoving && !this.isOutBoundaryDirction(this._moveDirection)) {
            if (CommonFunc.isInProbability(0.8)) {
                this._bTryMoving = true;
                this._tryMoveStartTime = time;
                this._tryMoveTime = CommonFunc.getRandomNumber(TRY_MOVE_TIME_MIN, TRY_MOVE_TIME_MAX);
                this.shoot(); //射击，尝试打破障碍后移动
                return;
            }
        }

        if (this._bTryMoving && time - this._tryMoveStartTime < this._tryMoveTime * 1000) {
            this.shoot(); //射击，尝试打破障碍后移动
            return;
        }

        //超过尝试时间, 换方向移动
        this.changeMoveDirectionEx(0.3);
    }

    //行为控制定时器
    onBehaviorTimer() {
        if (CommonFunc.isInProbability(0.1)) {
            //给定概率下改变移动方向

            this.changeMoveDirectionEx(0.1);
        }

        if (CommonFunc.isInProbability(0.3)) {
            this.shoot();
        }
    }

    moveOnBorn() {
        let twoDirs = this.getAllMoveDirectionsCanChoose();
        this.chooseOneDirctionMove(twoDirs);
    }

    //换方向移动，排除当前移动方向。
    changeMoveDirection() {
        let twoDirs = this.getAllMoveDirectionsCanChoose();
        if (this._isMove) {
            //筛选出原来的移动方向
            CommonFunc.filterArray(twoDirs.moveableDirs, [this._moveDirection]);
            CommonFunc.filterArray(twoDirs.tryDirs, [this._moveDirection]);
        }

        this.chooseOneDirctionMove(twoDirs);
    }

    //换方向移动，排除当前移动方向，一定概率排除相反的方向。
    changeMoveDirectionEx(oppositeProbability: number) {
        let twoDirs = this.getAllMoveDirectionsCanChoose();
        if (this._isMove) {
            //筛选出原来的移动方向
            CommonFunc.filterArray(twoDirs.moveableDirs, [this._moveDirection]);
            CommonFunc.filterArray(twoDirs.tryDirs, [this._moveDirection]);

            if (!CommonFunc.isInProbability(oppositeProbability)) {
                //概率下，不向现在移动的反方向移动
                let opsiteDirection = GameDataModel.getOppositeDirection(this._moveDirection);
                CommonFunc.filterArray(twoDirs.moveableDirs, [opsiteDirection]);
                CommonFunc.filterArray(twoDirs.tryDirs, [opsiteDirection]);
            }
        }

        this.chooseOneDirctionMove(twoDirs);
    }

    chooseOneDirctionMove(twoDirs) {
        let movedirs = null;
        if (twoDirs.moveableDirs.length > 0) {
            if (twoDirs.tryDirs.length > 0) {
                //按照概率选择移动方向
                if (CommonFunc.isInProbability(0.75)) {
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
            //没有可移动方向，尝试不可移动的方向
            movedirs = twoDirs.tryDirs;
        }

        if (movedirs && movedirs.length > 0) {
            let weights = this.calcMoveDirectionWeight(movedirs);

            let dir = CommonFunc.getRandomArrayValueWithWeight(movedirs, weights);
            if (dir != null) {
                this.setMove(true, dir);
            }
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
            if (!GameDataModel.isValidRect(moveAreaRect)) {
                return true;
            }
        }

        return false;
    }

    //计算移动方向的选择权重
    calcMoveDirectionWeight(moveDirctions: number[]): number[] {
        let defaultValue = 10;
        let weights: number[] = [];
        for (let i = 0; i < moveDirctions.length; i++) {
            let value = defaultValue;//初始权重
            if (this.isDirectionForwardHomeBase(moveDirctions[i])) {
                value += 20;
            }

            weights.push(value);
        }

        return weights;
    }

    isDirectionForwardHomeBase(dir: number): boolean {
        let tankPos = this.node.getPosition();
        let homeBasePos = GameDataModel.getHomeCenterScenePosition();

        let vertical = GameDef.DIRECTION_UP;
        if (tankPos.y < homeBasePos.y) {
            vertical = GameDef.DIRECTION_DOWN;
        }

        let horizontal = GameDef.DIRECTION_LEFT;
        if (tankPos.x < homeBasePos.x) {
            horizontal = GameDef.DIRECTION_RIGHT;
        }

        if (dir === vertical || dir === horizontal) {
            return true;
        }

        return false;
    }

    //行为控制相关
    //************************
}