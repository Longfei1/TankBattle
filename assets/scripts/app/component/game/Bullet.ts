import GameDataModel from "../../model/GameDataModel";
import { GameDef } from "../../define/GameDef";
import AudioModel from "../../model/AudioModel";
import { gameController } from "./Game";
import Scenery from "./Scenery";
import BattleTank from "./tank/BattleTank";
import { EventDef } from "../../define/EventDef";
import GameStartAni from "./animation/GameStartAni";
import { GameStruct } from "../../define/GameStruct";

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
    _powerLevel: number = -1;

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
            if (!this.onShootScenery(other, self)) {
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

    //返回值为true，则代表命中，需销毁子弹
    onShootScenery(scenery: cc.Collider, bullet: cc.Collider): boolean {
        if (this._destroyed) {
            return true;
        }

        let sceneryType = scenery.node.getComponent(Scenery).getType();
        if (sceneryType === GameDef.SceneryType.GRASS || sceneryType === GameDef.SceneryType.WATER) {
            return false;
        }

        //计算碰撞点的中心点位置以及命中范围
        //目前设定下，射击坐标一定处于行列坐标中(子弹不会命中到土墙内部细分的子结构上)，若不满足这一假设，需调整计算方式。
        let bulletCollider: any = bullet;
        let bulletRect: cc.Rect = bulletCollider.world.aabb;
        let sceneryCollider: any = scenery;
        let SceneryRect: cc.Rect = sceneryCollider.world.aabb;
        let collisionPos = bulletRect.center;//子弹碰撞体中心坐标
        let hitInfos: GameStruct.HitInfo[] = [];
        if (this._moveDirection === GameDef.DIRECTION_UP || this._moveDirection === GameDef.DIRECTION_DOWN) {
            collisionPos = gameController.getPanelGame().convertToNodeSpace(cc.v2(collisionPos.x, SceneryRect.y));//碰撞的世界坐标转换为游戏界面的局部坐标
            let hitRcInfo = GameDataModel.convertToMatrixPosition(collisionPos.mul(2));//命中位置

            let leftHitInfo: GameStruct.HitInfo = {
                pos: new GameStruct.RcInfo(hitRcInfo.col - 1, hitRcInfo.row), 
                scope: {
                    up: 0,
                    down: 0,
                    left: 1,
                    right: 0,
                },
                power: this._powerLevel,
            };
            let rightHitInfo: GameStruct.HitInfo = {
                pos: hitRcInfo,
                scope: {
                    up: 0,
                    down: 0,
                    left: 0,
                    right: 1,
                },
                power: this._powerLevel,
            };

            hitInfos.push(leftHitInfo);
            hitInfos.push(rightHitInfo);
        }
        else if (this._moveDirection === GameDef.DIRECTION_LEFT || this._moveDirection === GameDef.DIRECTION_RIGHT) {
            collisionPos = gameController.getPanelGame().convertToNodeSpace(cc.v2(SceneryRect.x, collisionPos.y));//碰撞的世界坐标转换为游戏界面的局部坐标
            let hitRcInfo = GameDataModel.convertToMatrixPosition(collisionPos.mul(2));//命中位置

            let upHitInfo: GameStruct.HitInfo = {
                pos: hitRcInfo,
                scope: {
                    up: 1,
                    down: 0,
                    left: 0,
                    right: 0,
                },
                power: this._powerLevel,
            };
            let downHitInfo: GameStruct.HitInfo = {
                pos: new GameStruct.RcInfo(hitRcInfo.col, hitRcInfo.row - 1),
                scope: {
                    up: 0,
                    down: 1,
                    left: 0,
                    right: 0,
                },
                power: this._powerLevel,
            };

            hitInfos.push(upHitInfo);
            hitInfos.push(downHitInfo);
        }

        if (this._powerLevel === GameDef.BULLET_POWER_LEVEL_STELL) {//扩大命中范围
            for (let info of hitInfos) {
                GameDataModel.addScopeByDirection(info.scope, this._moveDirection, 1);
            }
        }

        if (hitInfos.length > 0) {
            //交由地图管理器判断并销毁布景
            gameController.node.emit(EventDef.EV_GAME_HIT_SCENERY, hitInfos);//交由GameMapManager计算命中的布景节点
        }

        return true;
    }
}