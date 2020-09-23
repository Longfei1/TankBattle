import GameDataModel from "../../../model/GameDataModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerResult extends cc.Component {
    @property({ displayName: "总分", type: cc.Label })
    textTotalScore: cc.Label = null;
}