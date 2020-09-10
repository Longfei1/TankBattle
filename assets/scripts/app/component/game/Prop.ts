import { GameStruct } from "../../define/GameStruct";
import GameDataModel from "../../model/GameDataModel";
import { GameDef } from "../../define/GameDef";
import { gameController } from "./Game";
import { EventDef } from "../../define/EventDef";

const { ccclass, property } = cc._decorator;

const PropImgName = {
    [GameDef.PropType.BOMB]: "bomb",
    [GameDef.PropType.CLOCK]: "clock",
    [GameDef.PropType.HELMET]: "helmet",
    [GameDef.PropType.SPADE]: "spade",
    [GameDef.PropType.STAR]: "star",
    [GameDef.PropType.TANK]: "tank",
}

@ccclass
export default class Prop extends cc.Component {
    @property({ displayName: "道具图片", type: cc.Sprite })
    imgProp: cc.Sprite = null;

    @property({ displayName: "道具图集", type: cc.SpriteAtlas })
    atlasProp: cc.SpriteAtlas = null;

    _type: number = -1;
    _destroyed: boolean = false;

    setPosition(pos: cc.Vec2);
    setPosition(rcInfo: GameStruct.RcInfo);
    setPosition(pos: any) {
        if (pos) {
            if (pos.x != null && pos.y != null) {
                this.node.setPosition(pos);
            }
            else if (pos.col != null && pos.row != null) {
                this.node.setPosition(GameDataModel.matrixToScenePosition(pos));
            }
        }
    }

    setType(type: number) {
        this._type = type;
        this.updateImg();
    }

    updateImg() {
        let framename = PropImgName[this._type];
        if (framename) {
            let frame = this.atlasProp.getSpriteFrame(framename);
            if (frame) {
                this.imgProp.spriteFrame = frame;
            }
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        if (other.node.group === GameDef.GROUP_NAME_PROP) {
            if (!this._destroyed) {
                gameController.node.emit(EventDef.EV_PROP_DESTROY);
            }
        }
    }

    reset() {
        this._type = -1;
        this._destroyed = false;

        //this.node.stopAllActions();
    }
}