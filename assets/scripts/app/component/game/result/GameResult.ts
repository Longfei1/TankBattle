import { GameDef } from "../../../define/GameDef";
import { GameStruct } from "../../../define/GameStruct";
import GameDataModel from "../../../model/GameDataModel";
import GameStartAni from "../animation/GameStartAni";
import { gameController } from "../Game";
import PlayerResult from "./PlayerResult";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameResult extends cc.Component {
    @property({ displayName: "最高分", type: cc.Label })
    textHighScore: cc.Label = null;

    @property({ displayName: "关卡数", type: cc.Label })
    textStage: cc.Label = null;

    @property({ displayName: "玩家信息节点", type: [cc.Node] })
    panelPlayer: cc.Node[] = [];

    _resultInfo: GameStruct.GameResultInfo = null;

    onLoad() {
        //初始化显示
        this.calcGameResult();
        this.updateView();
    }

    calcGameResult() {
        let playerResults: GameStruct.PlayerResultInfo[] = [];

        let highScore = GameDataModel.getHighScore();
        let allPlayerScore = 0;
        for (let i = 0; i < 2; i ++) {
            let playerResult = this.calcPlayerResult(i);

            GameDataModel.addPlayerTotalScore(i, playerResult.totolScore);
            allPlayerScore += GameDataModel.getPlayerTotalScore(i);

            playerResults[i] = playerResult;
        }

        if (highScore < allPlayerScore) {
            highScore = allPlayerScore;
            GameDataModel.setHighScore(highScore);
        }

        let result: GameStruct.GameResultInfo = {
            stage: GameDataModel._currStage,
            highScore: highScore,
            playerResult: playerResults,
        };

        this._resultInfo = result;
    }

    calcPlayerResult(no: number): GameStruct.PlayerResultInfo {
        let propNum = GameDataModel.getPlayerPropNum(no);
        let bonusScore = propNum * GameDef.PROP_BONUS_SCORE;

        let tankNum = [];
        let tankScore = [];
        let totalScore = 0;
        let totalTankNum = 0;
        for (let i = 0; i < GameDef.EnemyTankNames.length; i++) {
            let name = GameDef.EnemyTankNames[i];
            let num = GameDataModel.getPlayerShootNum(no, name);

            tankNum[i] = num;
            tankScore[i] = num * GameDef.EnemyTankScore[name];
            totalScore += tankScore[i];
            totalTankNum+= num;
        }

        totalScore += bonusScore;
        let result: GameStruct.PlayerResultInfo = {
            totolScore: totalScore,
            bonusScore: bonusScore,
            totalTankNum: totalTankNum,
            tankNum: tankNum,
            tankScore: tankScore,
        };

        return result;
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
        let stage = this._resultInfo.stage;
        this.textStage.string = stage.toString();
    }

    updateHighScoreView() {
        let highScore = this._resultInfo.highScore;
        this.textHighScore.string = highScore.toString();
    }

    updatePlayerResultView() {
        let com1 = this.panelPlayer[0].getComponent(PlayerResult);
        com1.setData(0, this._resultInfo.playerResult[0]);

        let com2 = this.panelPlayer[1].getComponent(PlayerResult);
        com2.setData(1, this._resultInfo.playerResult[1]);

        if (GameDataModel.isModeDoublePlayer()) {
            this.panelPlayer[1].active = true;
        }
        else {
            this.panelPlayer[1].active = false;
        }

        //得分动画
        let totalEnemy = GameDef.EnemyTankNames.length;
        let aniFinish;
        let playScoreAni = (enemyNO: number) => {
            com1.showTankScoreAni(enemyNO, aniFinish);
            if (GameDataModel.isModeDoublePlayer()) {
                com2.showTankScoreAni(enemyNO, aniFinish);
            }
        };

        let finishNum = {};
        aniFinish = (enemyNO: number) => {
            finishNum[enemyNO] = finishNum[enemyNO] == null ? 0 : finishNum[enemyNO];
            finishNum[enemyNO]++;
            let needFinishNum = GameDataModel.isModeDoublePlayer() ? 2 : 1;
            if (finishNum[enemyNO] >= needFinishNum) {
                if (enemyNO >= totalEnemy - 1) {
                    com1.playScoreSound();
                    com1.showTankTotalNum();
                    com2.showTankTotalNum();

                    this.onScoreAniFinished();
                }
                else {
                    playScoreAni(enemyNO + 1);
                }
            }
        };

        playScoreAni(0);
    }

    //得分展示结束
    onScoreAniFinished() {
        //判断进入下一关或显示通关界面
        this.scheduleOnce(() => {
            gameController.onGameResultShowFinished();
        }, 3);
    }
}