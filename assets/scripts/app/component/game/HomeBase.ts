import { GameStruct } from "../../define/GameStruct";
import GameDataModel from "../../model/GameDataModel";

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
}