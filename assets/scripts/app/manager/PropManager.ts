import { gameController } from "../component/game/Game";
import { EventDef } from "../define/EventDef";
import Prop from "../component/game/Prop";
import { GameStruct } from "../define/GameStruct";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyManager extends cc.Component {
    @property({ displayName: "道具层", type: cc.Node })
    panelProp: cc.Node = null;

    @property({ displayName: "道具预制体", type: cc.Prefab })
    pfbProp: cc.Node = null;

    _prop: cc.Node = null;

    onLoad() {
        this._prop = cc.instantiate(this.pfbProp);
    }

    initListener() {
        gameController.node.on(EventDef.EV_PROP_CREATE, this.evCreateProp, this);
        gameController.node.on(EventDef.EV_PROP_DESTROY, this.evDestroyProp, this);
    }

    evCreateProp() {
        if (this._prop) {
            this.panelProp.addChild(this._prop);

            let com = this._prop.getComponent(Prop);
            com.reset();

            com.setPosition(this.getRandomPropPosition());
        }
    }

    evDestroyProp() {
        if (this._prop) {
            this._prop.removeFromParent();
        }
    }

    getRandomPropPosition(): GameStruct.RcInfo {

        return null;
    }
}