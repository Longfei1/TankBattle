import { GameDef } from "../../../define/GameDef";
import { GameStruct } from "../../../define/GameStruct";
import GameDataModel from "../../../model/GameDataModel";
import { gameController } from "../Game";
import { EventDef } from "../../../define/EventDef";
import Scenery from "../Scenery";
import Bullet from "../Bullet";
import { AniDef } from "../../../define/AniDef";
import BaseTank from "./BaseTank";

const { ccclass, property } = cc._decorator;

const DirectionSuffix = {
    0: "U",
    1: "L",
    2: "D",
    3: "R"
}

@ccclass
export default class BattleTank extends BaseTank {
    @property({ displayName: "子弹发射位置", type: [cc.Node], tooltip: "上左下右" })
    nodePosBullet: cc.Node[] = [];

    //属性
    _tankName: string = "";
    _tankLevel: number = 1;
    _tankMaxLevel: number = 0;
    _team: number = -1;
    _speedMove: number = 0;
    _speedBullet: number = 0;
    _shootCoolTime: number = 0;
    _bulletType: number = -1;

    //状态
    _isMove: boolean = false;
    _moveDirection: number = -1;
    _isCollision: boolean = false;
    //_canMove: boolean = true;
    //_moveDiff: number = 0;
    //_lastPosition: cc.Vec2 = null;
    _lastShootTime: number = 0;
    _imgLoopFrame: number = 0;
    _imgShowFrame: number = 1;

     //地图边界
     _boundaryLx: number = 0;
     _boundaryRx: number = 0;
     _boundaryTy: number = 0;
     _boundaryBy: number = 0;

    onLoad() {
        super.onLoad();

        this._boundaryLx = GameDataModel.matrixToScenePosition(new GameStruct.RcInfo(0, 0)).x
        this._boundaryRx = GameDataModel.matrixToScenePosition(new GameStruct.RcInfo(GameDef.GAME_MAP_COL_NUM, 0)).x
        this._boundaryTy = GameDataModel.matrixToScenePosition(new GameStruct.RcInfo(0, GameDef.GAME_MAP_ROW_NUM)).y
        this._boundaryBy = GameDataModel.matrixToScenePosition(new GameStruct.RcInfo(0, 0)).y
    }

    reset() {
        super.reset();

        this.setTankVisible(false); //初始时不可见

        //属性
        this._tankName = "";
        this._tankLevel = 1;
        this._tankMaxLevel = 0;
        this._team = -1;
        this._speedMove = 0;
        this._speedBullet = 0;
        this._shootCoolTime = 0;
        this._bulletType = -1;

        //状态
        this._isMove = false;
        this._isCollision = false;
        //this._canMove = true;
        //this._lastPosition = null;
        this._lastShootTime = 0;
        this._imgLoopFrame = 0;
        this._imgShowFrame = 1;
    }

    setAttributes(attributes: GameStruct.TankAttributes) {
        this.setTankName(attributes.tankName);
        this.setTankLevel(attributes.maxLevel);
        this.setTankTeam(attributes.team);
        this.setMoveSpeed(attributes.moveSpeed);
        this.setBulletSpeed(attributes.bulletSpeed);

        this._tankMaxLevel = attributes.maxLevel;
        this._bulletType = attributes.bulletType;
        this._shootCoolTime = attributes.shootCoolTime;
    }

    setTankTeam(team: number) {
        this._team = team;
    }

    setTankName(name: string) {
        this._tankName = name;
    }

    setTankLevel(level: number = 0) {
        this._tankLevel = level;
        this.updateTankImg();
    }

    setMoveDirction(nDirection: number) {
        if (this._moveDirection !== nDirection) {
            this._moveDirection = nDirection;
            this.updateTankImg()
        }
    }

    getMoveDirection(): number {
        return this._moveDirection;
    }

    updateTankImg() {
        if (this._tankName === "") {
            return;
        }

        if (!DirectionSuffix[this._moveDirection]) {
            return;
        }

        let frameName = `${this._tankName}_${this._tankLevel}${DirectionSuffix[this._moveDirection]}_${this._imgShowFrame}`;
        this.setTankImg(frameName);
    }

    update(dt) {
        this.updateMove(dt)
    }

    setMove(bMove: boolean, nDirection: number) {
        if (bMove) {
            this.correctPosition(this._moveDirection, nDirection);

            this.setMoveDirction(nDirection);
            this._isMove = true;
        }
        else if (!bMove) {
            if (this._moveDirection === nDirection) {
                this._isMove = false;
            }
        }
    }

    setMoveSpeed(nSpeed: number) {
        this._speedMove = nSpeed;
    }

    setBulletSpeed(nSpeed: number) {
        this._speedBullet = nSpeed;
    }

    updateMove(dt) {
        if (!GameDataModel._gamePause
            && this.isTankVisible()) {
            // this._moveDiff = this.calcMove(this._speedMove * dt);
            // if (this._moveDiff > 0) {
            //     let curPos = this.node.getPosition();
            //     let nextPox = curPos;

            //     switch (this._moveDirection) {
            //         case GameDef.DIRECTION_UP:
            //             nextPox = cc.v2(curPos.x, curPos.y + this._moveDiff);
            //             break;
            //         case GameDef.DIRECTION_LEFT:
            //             nextPox = cc.v2(curPos.x - this._moveDiff, curPos.y);
            //             break;
            //         case GameDef.DIRECTION_DOWN:
            //             nextPox = cc.v2(curPos.x, curPos.y - this._moveDiff);
            //             break;
            //         case GameDef.DIRECTION_RIGHT:
            //             nextPox = cc.v2(curPos.x + this._moveDiff, curPos.y);
            //             break;
            //         default:
            //             break;
            //     }
            //     this.node.setPosition(nextPox);
            //     this.validateMove();

            //     this.addImgLoopFrame();
            //     this.updateTankImg();
            // }

            //改为不使用碰撞检测的方式判断
            let moveDiff = this.calcMove(this._speedMove * dt);
            if (moveDiff > 0) {
                let curPos = this.node.getPosition();
                if (this.canMoveFromAToB(curPos, this._moveDirection, moveDiff)) {
                    let nextPox = curPos;
                    switch (this._moveDirection) {
                        case GameDef.DIRECTION_UP:
                            nextPox = cc.v2(curPos.x, curPos.y + moveDiff);
                            break;
                        case GameDef.DIRECTION_LEFT:
                            nextPox = cc.v2(curPos.x - moveDiff, curPos.y);
                            break;
                        case GameDef.DIRECTION_DOWN:
                            nextPox = cc.v2(curPos.x, curPos.y - moveDiff);
                            break;
                        case GameDef.DIRECTION_RIGHT:
                            nextPox = cc.v2(curPos.x + moveDiff, curPos.y);
                            break;
                        default:
                            break;
                    }
                    this.node.setPosition(nextPox);
                }
                else {
                    this.onMoveFailed();
                }

                this.addImgLoopFrame();
                this.updateTankImg();
            }
        }
    }

    calcMove(diff) {
        let moveDiff = 0;
        let minMoveDiff = GameDef.TANK_MOVE_MIN_VALUE;
        
        if (this._isMove) {
            moveDiff = diff;
        }

        return moveDiff;
    }

    validateMove() {
        let pos = this.node.getPosition();
        if (pos.x < this._boundaryLx) {
            this.node.x = this._boundaryLx;
        }
        else if (pos.x > this._boundaryRx) {
            this.node.x = this._boundaryRx;
        }
        else if (pos.y > this._boundaryTy) {
            this.node.y = this._boundaryTy;
        }
        else if (pos.y < this._boundaryBy) {
            this.node.y = this._boundaryBy;
        }
    }

    setPosition(pos: any) {
        super.setPosition(pos);
        if (pos) {
            //this._lastPosition = this.node.getPosition();
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        // if (other.node.group === GameDef.GROUP_NAME_SCENERY) {
        //     let sceneryType = other.node.getComponent(Scenery).getType();
        //     if (sceneryType !== GameDef.SceneryType.GRASS && this.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
        // else if (other.node.group === GameDef.GROUP_NAME_BOUNDARY) {
        //     if (this.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
        // else if (other.node.group === GameDef.GROUP_NAME_TANK) {
        //     if (this.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
        if (other.node.group === GameDef.GROUP_NAME_BULLET) {
            let shooterTeam = other.node.getComponent(Bullet)._team;
            let destroyed = other.node.getComponent(Bullet)._destroyed;
            if (!destroyed && this._team !== shooterTeam) {
                //被击中
                this.dead();
            }
        }
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider) {
        // if (other.node.group === GameDef.GROUP_NAME_SCENERY) {
        //     let sceneryType = other.node.getComponent(Scenery).getType();
        //     if (sceneryType !== GameDef.SceneryType.GRASS && this.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
        // else if (other.node.group === GameDef.GROUP_NAME_BOUNDARY) {
        //     if (this.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
        // else if (other.node.group === GameDef.GROUP_NAME_TANK) {
        //     if (this.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
    }

    // lateUpdate() {
    //     if (this._moveDiff > 0) {
    //         if (this._canMove) {
    //             this.savePositon();
    //         }
    //         else {
    //             if (this._lastPosition) {
    //                 this.node.setPosition(this._lastPosition);
    //                 this._canMove = true;
    //                 //this.cleanCorrectMoveStatus();
    //             }
    //         }
    //     }
    // }

    shoot() {
        let currTime = new Date().getTime();
        if (currTime - this._shootCoolTime * 1000 > this._lastShootTime) {
            let shootInfo = this.getShootInfo();
            if (shootInfo) {
                this._lastShootTime = currTime;
                gameController.onTankShoot(shootInfo);
                return true;
            }    
        }
        return false;
    }

    born(callback?: Function) {
        gameController.playUnitAniOnce(AniDef.UnitAniType.BORN, this.getNodeAni(), () => {
            //this.setTankVisible(false);
        }, () => {
            this.setTankVisible(true);
            
            if (typeof callback === "function") {
                callback();
            }
        });
    }

    dead(callback?: Function) {
        this._isMove = false;

        gameController.playUnitAniOnce(AniDef.UnitAniType.BLAST, this.getNodeAni(), () => {
            this.setTankVisible(false);
        }, () => {
            this.destroyNode();

            if (typeof callback === "function") {
                callback();
            }
        });
    }

    setTankVisible(bVisible: boolean) {
        super.setTankVisible(bVisible);

        let visible = bVisible ? true : false;
        let colliders = this.node.getComponents(cc.Collider);
        for(let collider of colliders) {
            collider.enabled = visible;//根据显隐决定碰撞组件的启用
        }
    }

    destroyNode() {
        this.node.destroy();
    }

    addImgLoopFrame() {
        this._imgLoopFrame++;

        if (this._imgLoopFrame > GameDef.TANK_MOVE_INTERVAL_FRAMES) {
            //两帧移动帧
            this._imgShowFrame++;
            if (this._imgShowFrame > 2) {
                this._imgShowFrame = 1;
            }

            this._imgLoopFrame = 0;
        }
    }

    //判断两个矩形碰撞体是否产生有效碰撞(相交非相切时)
    isValidCollision(other: any /*cc.Collider*/, self: any /*cc.Collider*/): boolean {
        let rect1 = self.world.aabb;
        let rect2 = other.world.aabb;

        if (GameDataModel.isRectOverlap(rect1, rect2)) {
            return true;
        }

        return false;
    }

    //矫正坐标，转向时设置坐标为最近的行列坐标值
    correctPosition(oldDirection: number, newDirection: number) {
        if (this.isNeedCorrectPosition(oldDirection, newDirection)) {
            this.node.position = this.getCorrectPosition(this.node.getPosition(), oldDirection, newDirection);
            this.savePositon();
        }
    }

    //改变成垂直与水平方向时才需要矫正
    isNeedCorrectPosition(oldDirection: number, newDirection: number): boolean {
        if (oldDirection === newDirection || newDirection === GameDataModel.getOppositeDirection(oldDirection)) {
            return false;
        }
        
        return true;
    }

    getCorrectPosition(pos: cc.Vec2, oldDirection: number, newDirection: number):cc.Vec2 {
        let ret = cc.v2(pos.x, pos.y);

        if (this.isNeedCorrectPosition(oldDirection, newDirection)) {
            if (newDirection === GameDef.DIRECTION_UP || newDirection === GameDef.DIRECTION_DOWN) {
                let minValue = GameDataModel.getSceneryWidth(); //保持x坐标为布景节点宽度的倍数
                let col = Math.floor(pos.x / minValue);
                let offset = pos.x % minValue;
                if (offset >= minValue/2) {
                    if (offset !== minValue/2 || oldDirection !== GameDef.DIRECTION_RIGHT) { //原来方向向右时，如果与右边障碍相切时也可能出现等于minValue/2的情况，此时不能向右纠正
                        col++;
                    }
                }
                ret.x = col * minValue;
            }
            else if (newDirection === GameDef.DIRECTION_LEFT || newDirection === GameDef.DIRECTION_RIGHT) {
                let minValue = GameDataModel.getSceneryWidth(); //保持y坐标为布景节点宽度的倍数
                let row = Math.floor(pos.y / minValue);
                let offset = pos.y % minValue;
                if (offset >= minValue/2) {
                    if (offset !== minValue/2 || oldDirection !== GameDef.DIRECTION_UP) { //原来方向向上时，如果与上边障碍相切时也可能出现等于minValue/2的情况，此时不能向上纠正
                        row++;
                    }
                }
                ret.y = row * minValue;
            }
        }

        return ret;
    }

    //给定起点(锚点)、方向和距离，判断是否可以移动
    canMoveFromAToB(src: cc.Vec2, dir: number, distance: number) {
        let moveAreaRect: cc.Rect;
        let width = GameDataModel.getTankWidth();
        if (dir === GameDef.DIRECTION_UP) {
            moveAreaRect = cc.rect(src.x, src.y + width, width, distance);
        }
        else if (dir === GameDef.DIRECTION_DOWN) {
            moveAreaRect = cc.rect(src.x, src.y - distance, width, distance);
        }
        else if (dir === GameDef.DIRECTION_LEFT) {
            moveAreaRect = cc.rect(src.x - distance, src.y, distance, width);
        }
        else if (dir === GameDef.DIRECTION_RIGHT) {
            moveAreaRect = cc.rect(src.x + width, src.y, distance, width);
        }

        if (moveAreaRect) {
            if (GameDataModel.canTankMoveInRect(moveAreaRect, this.node)) {
                return true;
            }
        }

        return false;
    }

    //获取坦克当前可移动的方向
    getAvailableMoveDirections(): number[] {
        let moveDirections = [GameDef.DIRECTION_UP, GameDef.DIRECTION_LEFT, GameDef.DIRECTION_DOWN, GameDef.DIRECTION_RIGHT];
        let directions: number[] = []

        let nowPos = this.node.getPosition();
        let nowDirction = this._moveDirection;

        for (let dir of moveDirections) {
            let correctPos = this.getCorrectPosition(nowPos, nowDirction, dir);//向dirction方向移动时，矫正后的位置坐标

            let moveDistance = this._speedMove*(1/GameDef.GAME_FPS);

            if (this.canMoveFromAToB(correctPos, dir, moveDistance)) {
                directions.push(dir);
            }
        }

        return directions;
    }

    savePositon() {
        //this._lastPosition = this.node.getPosition();
    }

    getBulletPowerLevel(): number {
        return GameDef.BULLET_POWER_LEVEL_COMMON; //默认子弹威力不变
    }

    getShootCoolTime() : number {
        return this._shootCoolTime;
    }

    getShootInfo(): GameStruct.ShootInfo {
        if (this._speedMove > 0 && GameDataModel.isValidDirection(this._moveDirection)) {
            let bulletPos = this.nodePosBullet[this._moveDirection].convertToWorldSpaceAR(cc.v2(0, 0));
            let shootInfo: GameStruct.ShootInfo = {
                type: this._bulletType,
                shooterName: this._tankName,
                powerLevel: this.getBulletPowerLevel(),
                team: this._team,
                pos: bulletPos,
                direction: this._moveDirection,
                speed: this._speedBullet,
            }
            return shootInfo;
        }
        return null;
    }

    //移动更新失败时触发
    onMoveFailed() {
        
    }
}
