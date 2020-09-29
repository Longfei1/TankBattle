import { GameDef } from "../../../define/GameDef";
import { GameStruct } from "../../../define/GameStruct";
import GameDataModel from "../../../model/GameDataModel";
import { gameController } from "../Game";
import { EventDef } from "../../../define/EventDef";
import Scenery from "../Scenery";
import Bullet from "../Bullet";
import { AniDef } from "../../../define/AniDef";
import BaseTank from "./BaseTank";
import CommonFunc from "../../../common/CommonFunc";
import AudioModel from "../../../model/AudioModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BattleTank extends BaseTank {
    @property({ displayName: "子弹发射位置", type: [cc.Node], tooltip: "上左下右" })
    nodePosBullet: cc.Node[] = [];

    //属性
    _tankName:string = "";
    _imgName: string = "";
    _tankLevel: number = 1;
    _tankMaxLevel: number = 0;
    _team: number = -1;
    _moveSpeed: number = 0;
    _bulletSpeed: number = 0;
    _maxBulletNum: number = 1;
    _bulletType: number = -1;
    _bulletPower: number = 1;

    _shootCoolTime: number = GameDef.TANK_SHOOT_COOLTIME;

    //状态
    _isMove: boolean = false;
    _moveDirection: number = -1;
    _isCollision: boolean = false;
    //_canMove: boolean = true;
    //_moveDiff: number = 0;
    //_lastPosition: cc.Vec2 = null;
    _imgLoopFrame: number = 0;
    _imgShowFrame: number = 1;

    _buffStatus = 0;
    _bulletNum = 0;

    _lastShootTime: number = 0;

    private _tankID: number = -1;

    DirectionSuffix = {
        0: "U",
        1: "L",
        2: "D",
        3: "R"
    }

    //编号
    set id(id: number) {
       this._tankID = id; 
    }

    get id(): number {
        return this._tankID; 
    }


    onLoad() {
        super.onLoad();

        this.node.zIndex = GameDef.ZINDEX_BATTLE_TANK;
    }

    reset() {
        super.reset();

        this.setTankVisible(false); //初始时不可见

        this._tankID = -1;

        //属性
        this._imgName = "";
        this._tankLevel = 1;
        this._tankMaxLevel = 0;
        this._team = -1;
        this._moveSpeed = 0;
        this._bulletSpeed = 0;
        this._maxBulletNum = 1;
        this._bulletType = -1;
        this._bulletPower = 1;

        //状态
        this._isMove = false;
        this._isCollision = false;
        //this._canMove = true;
        //this._lastPosition = null;
        this._imgLoopFrame = 0;
        this._imgShowFrame = 1;

        this._buffStatus = 0;
        this._bulletNum = 0;

        this._lastShootTime = 0;
    }

    setAttributes(attributes: GameStruct.TankAttributes) {
        this.setTankName(attributes.tankName);
        this.setImgName(attributes.imgName);
        this.setTankLevel(attributes.maxLevel);
        this.setTankTeam(attributes.team);
        this.setMoveSpeed(attributes.moveSpeed);
        this.setBulletSpeed(attributes.bulletSpeed);
        this.setBulletPower(attributes.bulletPower);

        this._tankMaxLevel = attributes.maxLevel;
        this._bulletType = attributes.bulletType;
        this._maxBulletNum = attributes.maxBulletNum;
    }

    setTankTeam(team: number) {
        this._team = team;
    }

    setTankName(name: string) {
        this._tankName = name;
    }

    setImgName(name: string) {
        this._imgName = name;
    }

    setTankLevel(level: number = 0) {
        this._tankLevel = level;
        
        this.onLevelUpdated();
    }

    setBulletPower(power: number) {
        this._bulletPower = power;
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
        let frameName = this.getTankImgName();
        this.setTankImg(frameName);
    }

    getTankImgName(): string {
        if (this._imgName === "") {
            return;
        }

        if (!this.DirectionSuffix[this._moveDirection]) {
            return;
        }

        let frameName = `${this._imgName}_${this._tankLevel}${this.DirectionSuffix[this._moveDirection]}_${this._imgShowFrame}`;
        return frameName;
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
        this._moveSpeed = nSpeed;
    }

    setBulletSpeed(nSpeed: number) {
        this._bulletSpeed = nSpeed;
    }

    updateMove(dt) {
        if (this.isTankVisible()) {
            // this._moveDiff = this.calcMove(this._moveSpeed * dt);
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
            let moveDiff = this.calcMove(dt);
            if (moveDiff > 0) {
                let curPos = this.node.getPosition();
                let newPos = this.canMoveFromAToBEx(curPos, this._moveDirection, moveDiff);
                if (newPos) {
                    this.node.setPosition(newPos);
                    this.onMoveSuccess();
                }
                else {
                    this.onMoveFailed();
                }

                this.addImgLoopFrame();
                this.updateTankImg();
            }
        }
    }

    calcMove(dt) {
        let moveDiff = 0;

        if (this._isMove) {
            let speed = this._moveSpeed;
            if (this.isTankOnIceScenery()) {
                speed += 20; //冰加移速
            }

            moveDiff = speed * dt;
        }

        return moveDiff;
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
        //     if (sceneryType !== GameDef.SceneryType.GRASS && GameDataModel.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
        // else if (other.node.group === GameDef.GROUP_NAME_BOUNDARY) {
        //     if (GameDataModel.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
        // else if (other.node.group === GameDef.GROUP_NAME_TANK) {
        //     if (GameDataModel.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
        if (other.node.group === GameDef.GROUP_NAME_BULLET) {
            let shooterTeam = other.node.getComponent(Bullet)._team;
            if (this._team !== shooterTeam) {
                //被击中
                //this.dead();
                this.onHited(other.node);
            }
        }
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider) {
        // if (other.node.group === GameDef.GROUP_NAME_SCENERY) {
        //     let sceneryType = other.node.getComponent(Scenery).getType();
        //     if (sceneryType !== GameDef.SceneryType.GRASS && GameDataModel.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
        // else if (other.node.group === GameDef.GROUP_NAME_BOUNDARY) {
        //     if (GameDataModel.isValidCollision(other, self)) {
        //         this._canMove = false;
        //     }
        // }
        // else if (other.node.group === GameDef.GROUP_NAME_TANK) {
        //     if (GameDataModel.isValidCollision(other, self)) {
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

    shoot(): boolean {
        if (!this.isTankVisible()) {
            return false;
        }

        let time = CommonFunc.getTimeStamp();
        if (time - this._lastShootTime < this._shootCoolTime * 1000) {
            return false;
        }

        if (this._bulletNum < this._maxBulletNum) {
            let shootInfo = this.getShootInfo();
            if (shootInfo) {
                this._bulletNum++;
                this._lastShootTime = time;
                gameController.onTankShoot(shootInfo);
                return true;
            }    
        }
        return false;
    }

    born(callback?: Function) {
        gameController.playUnitAniOnce(AniDef.UnitAniType.BORN, this.getNodeAni(), null, () => {
            //this.setTankVisible(false);
        }, () => {
            this.setTankVisible(true);
            
            if (typeof callback === "function") {
                callback();
            }
        });
    }

    dead(callback?: Function) {
        AudioModel.playSound("sound/blast");

        this._isMove = false;
        gameController.playTankBlastAni(this.getCenterPosition(), () => {
            this.setTankVisible(false);
        }, () => {
            this.destroyNode();

            if (typeof callback === "function") {
                callback();
            }
        });

        gameController.playGainScoreAni(this.node.getPosition(), this.getDestroyScore());
    }

    //被命中
    onHited(bulletNode: cc.Node) {
        this.dead();
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

    getMovePosition(src: cc.Vec2, dir: number, distance: number) {
        let retPos: cc.Vec2 = null;

        switch (dir) {
            case GameDef.DIRECTION_UP:
                retPos = cc.v2(src.x, src.y + distance);
                break;
            case GameDef.DIRECTION_LEFT:
                retPos = cc.v2(src.x - distance, src.y);
                break;
            case GameDef.DIRECTION_DOWN:
                retPos = cc.v2(src.x, src.y - distance);
                break;
            case GameDef.DIRECTION_RIGHT:
                retPos = cc.v2(src.x + distance, src.y);
                break;
            default:
                break;
        }

        return retPos;
    }

    //给定起点(锚点)、方向和距离，判断是否可以移动
    canMoveFromAToB(src: cc.Vec2, dir: number, distance: number): cc.Vec2 {
        let newPos: cc.Vec2 = null;
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
                newPos = this.getMovePosition(src, dir, distance);
            }
        }

        return newPos;
    }

    //给定起点(锚点)、方向和距离，判断是否可以移动(当与阻碍物有一定距离时，会贴近阻碍物，并算作可以移动)
    //返回值为新的坐标
    canMoveFromAToBEx(src: cc.Vec2, dir: number, distance: number): cc.Vec2 {
        let newPos: cc.Vec2 = null;
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
            let collisionInfo = GameDataModel.getCollisionRectWhenTankMove(dir, moveAreaRect, this.node);
            if (collisionInfo) {
                //返回一个和障碍物相交的坐标
                let collisionRect = collisionInfo.rect;
                let tankWidth = GameDataModel.getTankWidth();
                let myRect: cc.Rect = cc.rect(src.x, src.y, tankWidth, tankWidth);
                switch (dir) {
                    case GameDef.DIRECTION_UP:
                        if (myRect.yMax < collisionRect.yMin) {
                            newPos = cc.v2(myRect.x, collisionRect.yMin - myRect.height);
                        }
                        break;
                    case GameDef.DIRECTION_LEFT:
                        if (myRect.xMin > collisionRect.xMax) {
                            newPos = cc.v2(collisionRect.xMax, myRect.y);
                        }
                        break;
                    case GameDef.DIRECTION_DOWN:
                        if (myRect.yMin > collisionRect.yMax) {
                            newPos = cc.v2(myRect.x, collisionRect.yMax);
                        }
                        break;
                    case GameDef.DIRECTION_RIGHT:
                        if (myRect.xMax < collisionRect.xMin) {
                            newPos = cc.v2(collisionRect.xMin - myRect.width, myRect.y);
                        }
                        break;
                    default:
                        break;
                }
            }
            else {
                newPos = this.getMovePosition(src, dir, distance);
            }
        }

        return newPos;
    }

    //获取坦克当前可移动的方向
    getAvailableMoveDirections(): number[] {
        let moveDirections = [GameDef.DIRECTION_UP, GameDef.DIRECTION_LEFT, GameDef.DIRECTION_DOWN, GameDef.DIRECTION_RIGHT];
        let directions: number[] = []

        let nowPos = this.node.getPosition();
        let nowDirction = this._moveDirection;

        for (let dir of moveDirections) {
            let correctPos = this.getCorrectPosition(nowPos, nowDirction, dir);//向dirction方向移动时，矫正后的位置坐标

            let moveDistance = this._moveSpeed*(1/GameDef.GAME_FPS);

            if (this.canMoveFromAToBEx(correctPos, dir, moveDistance)) {
                directions.push(dir);
            }
        }

        return directions;
    }

    savePositon() {
        //this._lastPosition = this.node.getPosition();
    }

    getBulletPowerLevel(): number {
        return this._bulletPower;
    }

    getShootInfo(): GameStruct.ShootInfo {
        if (this._moveSpeed > 0 && GameDataModel.isValidDirection(this._moveDirection)) {
            let bulletPos = this.nodePosBullet[this._moveDirection].convertToWorldSpaceAR(cc.v2(0, 0));
            let shootInfo: GameStruct.ShootInfo = {
                type: this._bulletType,
                shooterID: this._tankID,
                powerLevel: this.getBulletPowerLevel(),
                team: this._team,
                pos: bulletPos,
                direction: this._moveDirection,
                speed: this._bulletSpeed,
            }
            return shootInfo;
        }
        return null;
    }

    //移动更新失败时触发
    onMoveFailed() {
        
    }

    //移动更新成功时触发
    onMoveSuccess() {

    }

    onGetShieldStatus(time: number) {
        if (time != null) {
            gameController.playUnitAniInTime(AniDef.UnitAniType.SHIELD, this.nodeAni, time, null, () => {
                this._buffStatus |= GameDef.TANK_BUFF_INVINCIBLE;
            }, () => {
                this._buffStatus &= ~GameDef.TANK_BUFF_INVINCIBLE;
            });
        }
    }

    onShootHited() {
        if (this._bulletNum > 0) {
            this._bulletNum--;
        }
    }

    getTankContainRcInfoArray(): GameStruct.RcInfo[] {
        let scenePos = this.node.getPosition();
        let pos = GameDataModel.sceneToMatrixPosition(scenePos);

        let rowNum = 4;
        let colNum = 4;
        let unitWidth = GameDataModel.getMapUnit().width;

        if (scenePos.x % unitWidth != 0) {
            colNum++;
        }

        if (scenePos.y % unitWidth != 0) {
            rowNum++;
        }

        let posAry = GameDataModel.getRectContainPosArray(pos, rowNum, colNum);
        return posAry;
    }

    onLevelUpdated() {
        this.updateTankImg();
    }

    getDestroyScore(): number {
        return 0;
    }

    getCenterPosition() {
        let pos = this.node.getPosition();
        let width = GameDataModel.getTankWidth();
        return cc.v2(pos.x + width / 2, pos.y + width / 2);
    }

    getTankRect(): cc.Rect {
        let pos = this.node.getPosition()
        let tankWidth = GameDataModel.getTankWidth();
        let tankRect: cc.Rect = cc.rect(pos.x, pos.y, tankWidth, tankWidth);
        return tankRect;
    }

    isTankOnIceScenery(): boolean {
        let rect = this.getTankRect();
        let sceneryNodes = GameDataModel.getSceneryNodesInRect(rect);
        if (sceneryNodes) {
            for (let node of sceneryNodes) {
                let com = node.getComponent(Scenery);
                let sceneryType = com.getType();
                if (sceneryType === GameDef.SceneryType.ICE) {
                    return true;
                }
            }
        }

        return false;
    }
}