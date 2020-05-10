import GameDataModel from "../../model/GameDataModel";
import { GameDef } from "../../define/GameDef";
import AudioModel from "../../model/AudioModel";
import { gameController } from "./Game";
import Scenery from "./Scenery";
import BattleTank from "./tank/BattleTank";

const { ccclass, property } = cc._decorator;

const DirectionSuffix = {
    0: "U",
    1: "L",
    2: "D",
    3: "R"
}

@ccclass
export default class Bullet extends cc.Component {
    @property({ displayName: "子弹图片", type: cc.Sprite})
    imgBullet: cc.Sprite = null;

    @property({ displayName: "子弹图集", type: cc.SpriteAtlas })
    atlasBullet: cc.SpriteAtlas = null;

    _speedMove: number = 0;
    _moveDirection: number = -1;
    _bulletType: number = -1;
    _shooterName: string = "";
    _team: number = -1;

    _destroyed: boolean = false; //击中目标后自己销毁，以免产生两次碰撞

    onEnable() {
        this._destroyed = false;
    }

    update(dt) {
        if (!GameDataModel._gamePause) {
            let curPos = this.node.getPosition();
            let moveDiff = this._speedMove * dt;
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
    }

    setMove(speed?: number, direction?: number) {
        this._speedMove = speed == null ? this._speedMove : speed;
        this._moveDirection = direction == null ? this._moveDirection : direction;
        this.updateImg();
    }

    setType(type: number) {
        if (type != null) {
            this._bulletType = type;
        }
        this.updateImg();
    }

    updateImg() {
        let frameName = "";
        switch (this._bulletType) {
            case GameDef.BulletType.COMMON:
                frameName = "common";
                break;
            default:
                break;
        }

        frameName += `_${DirectionSuffix[this._moveDirection]}`;
        let frame = this.atlasBullet.getSpriteFrame(frameName);
        if (frame) {
            this.imgBullet.spriteFrame = frame;
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        let canMove = false;
        if (other.node.group === GameDef.GROUP_NAME_SCENERY) {
            let sceneryType = other.node.getComponent(Scenery).getType();
            if (sceneryType === GameDef.SceneryType.GRASS || sceneryType === GameDef.SceneryType.WATER) {
                canMove = true;
            }
        }  
        else if (other.node.group === GameDef.GROUP_NAME_TANK) {
            let com = other.node.getComponent(BattleTank);
            if (this._shooterName === com._tankName) {
                canMove = true;
            }
        }

        if (!canMove && !this._destroyed) {
            AudioModel.playSound("sound/hit");
            this._destroyed = true;
            gameController.putNodeBullet(this.node);
        }
    }
}