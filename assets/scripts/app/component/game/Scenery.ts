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

    //隐藏布景子元素
    destroyUnit(index: number) {
        if (this.imgScenerys[index]) {
            this.imgScenerys[index].node.active = false;
        }
        if (this._colliders[index]) {
            this._colliders[index].enabled = false;
        }

        let haveVisible = false;
        for (let it of this.imgScenerys) {
            if (this.node.active === true) {
                haveVisible = true;
                break;
            }
        }

        //所有unit都销毁后，销毁整个节点
        if (!haveVisible) {
            gameController.node.emit(EventDef.EV_MAP_DESTROY_SCENERY, this.node);
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
        // if (other.node.group === GameDef.GROUP_NAME_BULLET) {
            
        // }
    }

    //被子弹击中后处理函数，
    onHited(pos: GameStruct.RcInfo, power: number) {
        if (!pos || !power) {
            return;
        }

        let sceneryType = this.getType();
        if (sceneryType === GameDef.SceneryType.GRASS || sceneryType === GameDef.SceneryType.WATER) {//水和草暂时不能销毁
            return;
        }
        else if (sceneryType === GameDef.SceneryType.STEEL) {
            if (power < GameDef.BULLET_POWER_LEVEL_STELL) {
                return;
            }

            //目前只有土墙需要按细分后的unit去销毁，钢墙可直接销毁。
            gameController.node.emit(EventDef.EV_MAP_DESTROY_SCENERY, this.node);
        }
        else if (sceneryType === GameDef.SceneryType.WALL) {
            let nodeRcInfo = GameDataModel.sceneToMatrixPosition(this.node.position);

            //求出坐标对应unit的index
            let unitIndex = null;
            if (pos.equal(nodeRcInfo)) {
                unitIndex = 3;
            }
            else if (pos.col === nodeRcInfo.col && pos.row === nodeRcInfo.row + 1) {
                unitIndex = 1;
            }
            else if (pos.row === nodeRcInfo.row && pos.col === nodeRcInfo.col + 1) {
                unitIndex = 4;
            }
            else if (pos.col === nodeRcInfo.col + 1 && pos.row === nodeRcInfo.row + 1) {
                unitIndex = 2;
            }

            //销毁unit
            if (unitIndex) {
                this.destroyUnit(unitIndex - 1);
            }
        }
    }
}
