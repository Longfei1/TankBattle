import { GameStruct } from "../../define/GameStruct";
import GameDataModel from "../../model/GameDataModel";
import { GameDef } from "../../define/GameDef";
import Bullet from "./Bullet";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HomeBase extends cc.Component {
    @property({ displayName: "存活图片", type: cc.Sprite })
    imgAlive: cc.Sprite = null;

    @property({ displayName: "毁灭图片", type: cc.Sprite })
    imgDestroy: cc.Sprite = null;

    setAlive(bAlive: boolean) {
        let bAct = bAlive ? true : false;
        this.imgAlive.node.active = bAct;
        this.imgDestroy.node.active = !bAct;
    }

    isAlive(): boolean {
        return this.imgAlive.node.active;
    }

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

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        if (other.node.group === GameDef.GROUP_NAME_BULLET) {
            if (this.isAlive()) {
                this.setAlive(false);

                //游戏失败
            }
        }
    }
}