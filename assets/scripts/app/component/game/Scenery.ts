import { GameDef } from "../../define/GameDef";
import { gameController } from "./Game";
import { EventDef } from "../../define/EventDef";
import Bullet from "./Bullet";
import CommonFunc from "../../common/CommonFunc";
import GameDataModel from "../../model/GameDataModel";
import { GameStruct } from "../../define/GameStruct";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Scenery extends cc.Component {

    @property({ displayName: "布景节点", type: cc.Node })
    nodeScenery: cc.Node = null;

    @property({ displayName: "布景图片", type: [cc.Sprite] })
    imgScenerys: cc.Sprite[] = [];

    @property({ displayName: "布景图片图集", type: cc.SpriteAtlas })
    atlasScenery: cc.SpriteAtlas = null;

    _type: number = GameDef.SceneryType.NULL;
    _colliders: cc.Collider[] = [];

    onLoad() {
        this.init();
    }

    init() {
        //碰撞体
        let colliders = this.node.getComponents(cc.Collider);
        for(let it of colliders) {
            this._colliders[it.tag] = it;
        }
    }

    setType(type: number) {
        this._type = type;
        this.setSceneryImg();
    }

    getType(): number {
        return this._type
    }

    reset() {
        for (let it of this.imgScenerys) {
            it.node.active = true;
        }

        for (let it of this._colliders) {
            it.enabled = true;
        }
    }

    setSceneryImg() {
        for (let i = 0; i < this.imgScenerys.length; i++) {
            let frame = this.getImgFrame(this._type, i + 1);
            if (frame) {
                this.imgScenerys[i].spriteFrame = frame;
            }
        }
    }

    getImgFrame(type, index) {
        if (!type || !index) {
            return;
        }

        let name = "";
        switch (type) {
            case GameDef.SceneryType.WALL:
                name = "wall";
                break;
            case GameDef.SceneryType.WATER:
                name = "water";
                break;
            case GameDef.SceneryType.GRASS:
                name = "grass";
                break;
            case GameDef.SceneryType.STEEL:
                name = "steel";
                break;
            default:
                break;
        }

        name += `_${index}`;
        let frame = this.atlasScenery.getSpriteFrame(name);
        return frame;
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        if (other.node.group === GameDef.GROUP_NAME_BULLET) {
            this.onBulletCollision(other, self);
        }
    }

    onBulletCollision(other: cc.Collider, self: cc.Collider) {
        let bullet = other.node.getComponent(Bullet);

        //同时有多个unit会产生碰撞，找出一个唯一生效的节点，然后计算出命中的所有节点。
        let bulletCollider: any = other;
        let bulletRect: cc.Rect = bulletCollider.world.aabb;
        let collisionPos = cc.v2(bulletRect.x, bulletRect.y);
        let sceneryCollider: any = other;
        let sceneryRect: cc.Rect = sceneryCollider.world.aabb;
        let sceneryPos = cc.v2(sceneryRect.x, sceneryRect.y);

        let hit = false;
        if (bullet._moveDirection === GameDef.DIRECTION_UP) {
            collisionPos.addSelf(cc.v2(bulletRect.width/2, bulletRect.height));
            if (collisionPos.x === sceneryPos.x) {
                hit = true;
            }
        }
        else if (bullet._moveDirection === GameDef.DIRECTION_LEFT) {
            collisionPos.addSelf(cc.v2(0, bulletRect.height/2));
            if (collisionPos.y === sceneryPos.y) {
                hit = true;
            }
        }
        else if (bullet._moveDirection === GameDef.DIRECTION_DOWN) {
            collisionPos.addSelf(cc.v2(bulletRect.width/2, 0));
            if (collisionPos.x === sceneryPos.x) {
                hit = true;
            }
        }
        else if (bullet._moveDirection === GameDef.DIRECTION_RIGHT) {
            collisionPos.addSelf(cc.v2(bulletRect.width, bulletRect.height/2));
            if (collisionPos.y === sceneryPos.y) {
                hit = true;
            }
        }

        if (hit) {
            let rcInfos = [];

            let index = this.getIndexByColliderTag(self.tag);
            let scenery:cc.Sprite = this.imgScenerys[index];
            if (scenery) {
                let pos = scenery.node.convertToWorldSpaceAR(cc.v2(0, 0));
                let rcInfo = GameDataModel.convertToMatrixPosition(pos.mul(2));//获取放大两倍后的矩阵坐标

                let multFunc = (key, value) => {
                    let newArray = [];
                    for (let it of rcInfos) {
                        newArray.push(it);
                        let copy = CommonFunc.copyObject(it);
                        copy.key = copy.key + value;
                        newArray.push(copy);
                    }
                }  

                rcInfos.push(rcInfo);
                if (bullet._moveDirection === GameDef.DIRECTION_UP) {
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col - 2, rcInfo.row));
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col - 1, rcInfo.row));
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col + 1, rcInfo.row));
                }
                else if (bullet._moveDirection === GameDef.DIRECTION_LEFT) {
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col, rcInfo.row - 1));
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col, rcInfo.row + 1));
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col, rcInfo.row + 2));
                }
                else if (bullet._moveDirection === GameDef.DIRECTION_DOWN) {
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col - 2, rcInfo.row));
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col - 1, rcInfo.row));
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col + 1, rcInfo.row));
                }
                else if (bullet._moveDirection === GameDef.DIRECTION_RIGHT) {
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col, rcInfo.row - 1));
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col, rcInfo.row + 1));
                    rcInfos.push(new GameStruct.RcInfo(rcInfo.col, rcInfo.row + 2));
                }
            }
        }

        gameController.node.emit(EventDef.EV_GAME_HIT_SCENERY, this.node);
    }

    getIndexByColliderTag(tag) {
        for (let index in this._colliders) {
            if (this._colliders[index].tag === tag) {
                return index;
            }
        }
    }
}
