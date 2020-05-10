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
    _shootCooltime: number = 0;
    _bulletType: number = -1;

    //状态
    _isMove: boolean = false;
    _moveDirection: number = -1;
    _isCollision: boolean = false;
    _canMove: boolean = true;
    _moveDiff: number = 0;
    _lastPosition: cc.Vec2 = null;
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

        this._boundaryLx = GameDataModel.convertToScenePosition(new GameStruct.RcInfo(0, 0)).x
        this._boundaryRx = GameDataModel.convertToScenePosition(new GameStruct.RcInfo(GameDef.GAME_MAP_COL_NUM, 0)).x
        this._boundaryTy = GameDataModel.convertToScenePosition(new GameStruct.RcInfo(0, GameDef.GAME_MAP_ROW_NUM)).y
        this._boundaryBy = GameDataModel.convertToScenePosition(new GameStruct.RcInfo(0, 0)).y
    }

    reset() {
        super.reset();
        this._isMove = false;
        this._isCollision = false;
        this._canMove = true;
        this._lastPosition = null;
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
        this._shootCooltime = attributes.shootCooltime;
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
            if (this.isNeedCorrectPosition(this._moveDirection, nDirection)) {
                this.correctPosition(nDirection);
            }
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
        if (!GameDataModel._gamePause) {
            this._moveDiff = this.calcMove(this._speedMove * dt);
            if (this._moveDiff > 0) {
                let curPos = this.node.getPosition();
                let nextPox = curPos;

                switch (this._moveDirection) {
                    case GameDef.DIRECTION_UP:
                        nextPox = cc.v2(curPos.x, curPos.y + this._moveDiff);
                        break;
                    case GameDef.DIRECTION_LEFT:
                        nextPox = cc.v2(curPos.x - this._moveDiff, curPos.y);
                        break;
                    case GameDef.DIRECTION_DOWN:
                        nextPox = cc.v2(curPos.x, curPos.y - this._moveDiff);
                        break;
                    case GameDef.DIRECTION_RIGHT:
                        nextPox = cc.v2(curPos.x + this._moveDiff, curPos.y);
                        break;
                    default:
                        break;
                }
                this.node.setPosition(nextPox);
                //this.validateMove();

                this.addImgLoopFrame();
                this.updateTankImg();
            }
        }
    }

    calcMove(diff) {
        let moveDiff = 0;
        let minMoveDiff = GameDef.TANK_MOVE_MIN_VALUE;

        //需要矫正移动时，先按当前方向矫正位置
        // if (this._isNeedCorrectMove) {
        //     if (this._totalMoveDiff % minMoveDiff != 0) {
        //         this._totalMoveDiff = this._totalMoveDiff % minMoveDiff;
        //         moveDiff = diff;
        //         if (this._totalMoveDiff + moveDiff > minMoveDiff) {
        //             //moveDiff = minMoveDiff - this._totalMoveDiff;

        //             //确保静止时的坐标为整数值
        //             let pos = this.node.getPosition();
        //             if (pos.x % minMoveDiff != 0) {
        //                 if (this._moveDirection === GameDef.DIRECTION_LEFT) {
        //                     moveDiff = pos.x - (Math.floor(pos.x / minMoveDiff) * minMoveDiff);
        //                 }
        //                 else if (this._moveDirection === GameDef.DIRECTION_RIGHT) {
        //                     moveDiff = (Math.ceil(pos.x / minMoveDiff) * minMoveDiff) - pos.x;
        //                 }
        //             }

        //             if (pos.y % minMoveDiff != 0) {
        //                 if (this._moveDirection === GameDef.DIRECTION_UP) {
        //                     moveDiff = (Math.ceil(pos.y / minMoveDiff) * minMoveDiff) - pos.y;
        //                 }
        //                 else if (this._moveDirection === GameDef.DIRECTION_DOWN) {
        //                     moveDiff = pos.y - (Math.floor(pos.y / minMoveDiff) * minMoveDiff);
        //                 }
        //             }
        //         }
        //         return moveDiff;
        //     }
        //     else {
        //         this.cleanCorrectMoveStatus();
        //     }
        // }
        
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
            this._lastPosition = this.node.getPosition();
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        if (other.node.group === GameDef.GROUP_NAME_SCENERY) {
            let sceneryType = other.node.getComponent(Scenery).getType();
            if (sceneryType !== GameDef.SceneryType.GRASS && this.isValidCollision(other, self)) {
                this._canMove = false;
            }
        }
        else if (other.node.group === GameDef.GROUP_NAME_BOUNDARY) {
            if (this.isValidCollision(other, self)) {
                this._canMove = false;
            }
        }
        else if (other.node.group === GameDef.GROUP_NAME_BULLET) {
            let shooterTeam = other.node.getComponent(Bullet)._team;
            let destroyed = other.node.getComponent(Bullet)._destroyed;
            if (!destroyed && this._team !== shooterTeam) {
                //被击中
                this.dead();
            }
        }
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider) {
        if (other.node.group === GameDef.GROUP_NAME_SCENERY) {
            let sceneryType = other.node.getComponent(Scenery).getType();
            if (sceneryType !== GameDef.SceneryType.GRASS && this.isValidCollision(other, self)) {
                this._canMove = false;
            }
        }
        else if (other.node.group === GameDef.GROUP_NAME_BOUNDARY) {
            if (this.isValidCollision(other, self)) {
                this._canMove = false;
            }
        }
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
                }
            }
        }
    }

    shoot() {
        let currTime = new Date().getTime();
        if (currTime - this._shootCooltime * 1000 > this._lastShootTime) {
            if (this._speedMove > 0 && GameDataModel.isValidDirection(this._moveDirection)) {
                let bulletPos = this.nodePosBullet[this._moveDirection].convertToWorldSpaceAR(cc.v2(0, 0));
                let shootInfo: GameStruct.ShootInfo = {
                    type: this._bulletType,
                    shooterName: this._tankName,
                    shooterLevel: this._tankLevel,
                    team: this._team,
                    pos: bulletPos,
                    direction: this._moveDirection,
                    speed: this._speedBullet,
                }
                this._lastShootTime = currTime;
                gameController.onTankShoot(shootInfo);
                return true;
            }
        }
        return false;
    }

    born() {
        gameController.playUnitAniOnce(AniDef.UnitAniType.BORN, this.getNodeAni(), () => {
            this.setTankVisible(false);
        }, () => {
            this.setTankVisible(true);
        });
    }

    dead() {
        gameController.playUnitAniOnce(AniDef.UnitAniType.BLAST, this.getNodeAni(), () => {
            this.setTankVisible(false);
        }, () => {
            this.node.destroy();
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

        let interRect = cc.rect();
        rect1.intersection(interRect, rect2);

        if (interRect.width > 0 && interRect.height > 0) {
            return true;
        }

        return false;
    }

    //矫正坐标，转向时设置坐标为最近的行列坐标值
    correctPosition(direction: number) {
        let pos = this.node.getPosition();
        if (direction === GameDef.DIRECTION_UP || direction === GameDef.DIRECTION_DOWN) {
            let minValue = GameDataModel.getMapUnit().width;
            let col = Math.floor(pos.x / minValue);
            let diff = pos.x % minValue;
            if (diff >= minValue/ 2) {
                col++;
            }
            this.node.x = col * minValue;
            this.savePositon();
        }
        else if (direction === GameDef.DIRECTION_LEFT || direction === GameDef.DIRECTION_RIGHT) {
            let minValue = GameDataModel.getMapUnit().height;
            let row = Math.floor(pos.y / minValue);
            let diff = pos.y % minValue;
            if (diff >= minValue/ 2) {
                row++;
            }
            this.node.y = row * minValue;
            this.savePositon();
        }
    }

    //改变成垂直与水平方向时才需要矫正
    isNeedCorrectPosition(oldDirection: number, newDirection: number): boolean {
        //let vertical = false;
        //let horizontal = false;
        if (oldDirection === GameDef.DIRECTION_UP || oldDirection === GameDef.DIRECTION_DOWN) {
            if (newDirection === GameDef.DIRECTION_LEFT ||newDirection === GameDef.DIRECTION_RIGHT) {
                return true;
            }
        }
        else if (oldDirection === GameDef.DIRECTION_LEFT ||oldDirection === GameDef.DIRECTION_RIGHT) {
            if (newDirection === GameDef.DIRECTION_UP || newDirection === GameDef.DIRECTION_DOWN) {
                return true;
            }
        }
        return false;
    }

    savePositon() {
        this._lastPosition = this.node.getPosition();
    }
}
