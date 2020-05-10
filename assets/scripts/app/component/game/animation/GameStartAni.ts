import BaseAni from "./BaseAni";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameStartAni extends BaseAni {
    @property({ displayName: "关卡文本", type: cc.Label})
    textStage: cc.Label = null;

    onLoad() {
        if (this._param.stage != null) {
            this.textStage.string = this._param.stage;
        }
    }
}