import { GameDef } from "../../../define/GameDef";
import { GameStruct } from "../../../define/GameStruct";
import GameDataModel from "../../../model/GameDataModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BaseTank extends cc.Component {
    @property({ displayName: "坦克图片", type: cc.Sprite })
    imgTank: cc.Sprite = null;

    @property({ displayName: "坦克图片图集", type: cc.SpriteAtlas })
    atlasTank: cc.SpriteAtlas = null;

    @property({ displayName: "坦克主体节点", type: cc.Node })
    nodeMain: cc.Node = null;

    @property({ displayName: "坦克动画节点", type: cc.Node })
    nodeAni: cc.Node = null;

    onLoad() {

    }

    onDestroy() {
        
    }

    reset() {

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

    getNodeAni() {
        return this.nodeAni;
    }

    setTankVisible(bVisible: boolean) {
        let visible = bVisible ? true : false;

        if (this.nodeMain) {
            this.nodeMain.active = visible;
        }
    }

    isTankVisible(): boolean {
        return this.nodeMain.active;
    }

    setTankImg(name: string) {
        if (name) {
            let frame = this.atlasTank.getSpriteFrame(name);
            if (frame) {
                this.imgTank.spriteFrame = frame;
            }
        }
    }
}
