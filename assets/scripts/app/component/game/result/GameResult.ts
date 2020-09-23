import GameDataModel from "../../../model/GameDataModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameResult extends cc.Component {
    @property({ displayName: "最高分", type: cc.Label })
    textHighScore: cc.Label = null;

    @property({ displayName: "关卡数", type: cc.Label })
    textStage: cc.Label = null;

    @property({ displayName: "玩家信息节点", type: [cc.Node] })
    panelPlayer: cc.Node[] = [];

    onLoad() {
        //初始化显示
        this.updateView();
    }

    updateView() {
        //最高分
        this.updateHighScoreView();

        //关卡
        this.updateStageView();

        //玩家得分面板
        this.updatePlayerResultView();
    }

    updateStageView() {
        let stage = GameDataModel._currStage;
        this.textStage.string = stage.toString();
    }

    updateHighScoreView() {
        let highScore = this.getHighScore(); //缓存中的最高分
        this.textHighScore.string = highScore.toString();
    }

    updatePlayerResultView() {
        if (GameDataModel.isModeDoublePlayer) {
            this.panelPlayer[1].active = true;
        }
        else {
            this.panelPlayer[1].active = false;
        }
    }

    getHighScore(): number {
        return Math.max(this.getPlayerHighScore(0), this.getPlayerHighScore(1));
    }

    getPlayerHighScore(no: number): number {
        let key = `PlayerHighScore_${no}`;
        let value = cc.sys.localStorage.getItem(key);

        if (value) {
            return Number(value);
        }

        return 0;
    }

    setPlayerHighScore(no: number, score: number) {
        let key = `PlayerHighScore_${no}`;
        let value = cc.sys.localStorage.setItem(key, score.toString());
    }

    //玩家当前关卡得分结果
    onPlayerScoreResult(no: number, score: number) {
        GameDataModel.addPlayerTotalScore(no, score);

        let total = GameDataModel.getPlayerTotalScore(no);
        let highScore = this.getPlayerHighScore(no);
        if (total > highScore) {
            this.setPlayerHighScore(no, total);

            this.updateHighScoreView(); //刷新最高分显示
        }
    }
}