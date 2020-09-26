import BaseAni from "./BaseAni";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GainScoreAni extends BaseAni {
    @property({ displayName: "得分文本", type: cc.Label })
    textScore: cc.Label = null;

    onLoad() {
        if (this._param.score != null) {
            this.textScore.string = this._param.score;
        }
    }
}