import { GameDef } from "../../../define/GameDef";
import { GameStruct } from "../../../define/GameStruct";
import GameDataModel from "../../../model/GameDataModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerResult extends cc.Component {
    @property({ displayName: "总分", type: cc.Label })
    textTotalScore: cc.Label = null;

    @property({ displayName: "坦克数量", type: [cc.Label] })
    textTankNum: cc.Label[] = [];

    @property({ displayName: "坦克得分", type: [cc.Label] })
    textTankScore: cc.Label[] = [];

    @property({ displayName: "坦克总数量", type: cc.Label })
    textTankTotalNum: cc.Label = null;

    @property({ displayName: "奖励分", type: cc.Label })
    textBonusScore: cc.Label = null;

    _playerNO: number;
    _resultInfo: GameStruct.PlayerResultInfo = null;

    setData(no: number, playerResult: GameStruct.PlayerResultInfo) {
        this._playerNO = no;
        this._resultInfo = playerResult;
    }

    onDestroy() {
        this.node.stopAllActions();
    }

    playScoreAni(callback: Function) {
        this.showPlayerTotalScore();
        this.showBonusScore();

        this.showTankScoreAni(callback);
    }

    //得分动画
    showTankScoreAni(callback: Function) {
        let actions = [];

        //添加显示一行分数所需的动画
        let addActionFunc = (enemyTankNO: number) => {
            let totoalNum = this._resultInfo.tankNum[enemyTankNO];
            let totoalScore = this._resultInfo.tankScore[enemyTankNO];

            let avgScore = totoalScore / totoalNum;

            let showNum = 0;
            let showScore = 0;

            let delay = cc.delayTime(0.2);
            let showScoreFunc = cc.callFunc(() => {
                this.textTankNum[enemyTankNO].node.active = true;
                this.textTankScore[enemyTankNO].node.active = true;

                this.playScoreSound();
                this.textTankNum[enemyTankNO].string = showNum.toString();
                this.textTankScore[enemyTankNO].string = showScore.toString();
            });

            let addScoreFunc = cc.callFunc(() => {
                showNum++;
                showScore += avgScore;

                this.playScoreSound();
                this.textTankNum[enemyTankNO].string = showNum.toString();
                this.textTankScore[enemyTankNO].string = showScore.toString();
            });

            actions.push(delay);
            actions.push(showScoreFunc);
            for (let i = 0; i < totoalNum; i++) {
                actions.push(delay);
                actions.push(addScoreFunc);
            }
        }

        //添加所有击毁坦克的得分动画
        for (let i = 0; i < this._resultInfo.tankNum.length; i++) {
            addActionFunc(i);
        }

        //总击毁数量
        actions.push(cc.delayTime(0.2));
        actions.push(() => {
            this.showTankTotalNum();
        });

        //结束回调
        actions.push(cc.callFunc(() => {
            if (typeof callback === "function") {
                callback();
            }
        }));

        let sequence = cc.sequence(actions);
        this.node.runAction(sequence);
    }

    showBonusScore() {
        let score = this._resultInfo.bonusScore;
        this.textBonusScore.string = score.toString();
    }

    showPlayerTotalScore() {
        let score = this._resultInfo.totolScore;
        this.textTotalScore.string = score.toString();
    }

    showTankTotalNum() {
        let num = this._resultInfo.totalTankNum;
        this.textTankTotalNum.string = num.toString();
    }

    playScoreSound() {

    }
}