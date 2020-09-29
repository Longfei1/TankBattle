import { EventDef } from "../../define/EventDef";
import GameDataModel from "../../model/GameDataModel";
import { GameDef } from "../../define/GameDef";
import GameInputModel from "../../model/GameInputModel";
import { PlayerDef } from "../../define/PlayerDef";
import CommonFunc from "../../common/CommonFunc";
import AudioModel from "../../model/AudioModel";
import NodePool from "../../common/NodePool";
import Bullet from "./Bullet";
import { GameStruct } from "../../define/GameStruct";
import { AniDef } from "../../define/AniDef";
import GameConfigModel from "../../model/GameConfigModel";

const {ccclass, property} = cc._decorator;

export let gameController: Game = null;

@ccclass
export default class Game extends cc.Component {

    @property({ displayName: "游戏层", type: cc.Node })
    panelGame: cc.Node = null;

    @property({ displayName: "道具层", type: cc.Node })
    panelProp: cc.Node = null;

    @property({ displayName: "动画层", type: cc.Node })
    panelAni: cc.Node = null;

    @property({ displayName: "游戏地图最小元素单元", type: cc.Node })
    nodeMapUnit: cc.Node = null;

    @property({ displayName: "子弹预制体", type: cc.Prefab })
    pfbBullet: cc.Prefab = null;

    @property({ displayName: "调试信息标签", type: cc.Label })
    textDebug: cc.Label = null;

    @property({ displayName: "游戏场景中心", type: cc.Node })
    nodeGameCenter: cc.Node = null;

    @property({ displayName: "游戏盒子中心", type: cc.Node })
    nodeBoxCenter: cc.Node = null;

    @property({ displayName: "结算预制体", type: cc.Prefab })
    pfbResult: cc.Prefab = null;

    @property({ displayName: "暂停标记", type: cc.Node })
    nodePause: cc.Node = null;

    @property({ displayName: "暂停标记", type: cc.Prefab })
    pfbGameSuccess: cc.Prefab = null;

    _currLevel: number = 1;

    _bulletPool: NodePool = null;

    _resultPanel: cc.Node = null;
    _gameSuccessPanel: cc.Node = null;
    
    onLoad() {
        this.panelGame.active = false;
        gameController = this;
        this.initListener();

        GameDataModel.initGameData();
        GameDataModel.setMapUnit(this.nodeMapUnit.width, this.nodeMapUnit.height);

        this._bulletPool = new NodePool(this.pfbBullet, Bullet);

        if (GameDataModel.isGameDebugMode()) {
            this.textDebug.node.active = true;
        }
        else {
            this.textDebug.node.active = false;
        }
    }

    onDestroy() {
        this.removeListener();
        this._bulletPool.clearNode();
        cc.director.getCollisionManager().enabled = false;
    }

    start() {
        //所有脚本onload后即算初始化完成
        if (GameConfigModel.isAllDataLoaded()) {
            gameController.node.emit(EventDef.EV_GAME_INIT_FINISHED);
        }
        else {
            console.error("GameConfig Load Failed!");
        }
    }

    initListener() {
        GameInputModel.addKeyDownOnceListener(() => {
            //GameDataModel.resetGameData();
            this.goToMainMenu();
        }, null, this, PlayerDef.KEYMAP_COMMON.BACK);
        GameInputModel.addKeyDownOnceListener(() => {
            CommonFunc.playButtonSound();
            this.onBtnStart();
        }, null, this, PlayerDef.KEYMAP_COMMON.START);
        if (GameDataModel.isGameDebugMode) {
            GameInputModel.addKeyDownOnceListener(() => {
                this.onTest();
            }, null, this, cc.macro.KEY.t);
        }

        this.node.on(EventDef.EV_GAME_INIT_FINISHED, this.evInitGameFinished, this)
        this.node.on(EventDef.EV_GAME_SHOW_DEBUG_TEXT, this.onDebugTextOut, this);
    }

    removeListener() {
        GameInputModel.removeInputListenerByContext(this);
    }

    goToMainMenu() {
        cc.director.loadScene("Menu");
    }

    evInitGameFinished() {
        this.startGameStage(1);//从第一关开始
    }

    startGameStage(stage: number) {
        GameDataModel._currStage = stage;
        this.playStartGameAni(stage, () => {
            this.gameStart();
        });

        this.prepareGame();
    }

    prepareGame() {
        gameController.node.emit(EventDef.EV_GAME_PREPARE_GAME);
    }

    playStartGameAni(stage: number, callback) {
        if (GameDataModel.isModeEditMap()) {
            this.panelGame.active = true;
            callback();
        }
        else {
            this.panelGame.active = false;
            AudioModel.playSound("sound/start");
            this.playSceneAni(
                AniDef.SceneAniType.GAME_START,
                AniDef.UnitAniMode.TIMELIMIT,
                2,
                {
                    scriptName: "GameStartAni",
                    params: { ["stage"]: stage},
                },
                null,
                () => {
                    this.panelGame.active = true;
                    callback();
                },
            );
        }
    }

    gameStart() {
        GameDataModel._gameRunning = true;
        this.node.emit(EventDef.EV_GAME_STARTED); //其他模块执行开始逻辑

        GameDataModel._enableOperate = true; //打开控制开关
        cc.director.getCollisionManager().enabled = true; //打开碰撞检测
    }

    //游戏结束，进入结算
    gameEnd() {
        GameDataModel._gameRunning = false;
        GameDataModel._enableOperate = false; //关闭控制开关
        cc.director.getCollisionManager().enabled = false; //关闭碰撞检测

        cc.audioEngine.stopAll();

        this.node.emit(EventDef.EV_GAME_ENDED);

        this.showGameResult();
    }

    //游戏结束，失败
    gameOver() {
        GameDataModel._gameOver = true;
        GameDataModel._enableOperate = false;

        this.playUnitAniOnce(AniDef.UnitAniType.GAME_OVER, this.nodeGameCenter, null, null, () => {
            this.gameEnd();
        });
    }

    getNodeBullet(): cc.Node {
        return this._bulletPool.getNode()
    }

    putNodeBullet(node) {
        if (node) {
            this._bulletPool.putNode(node);
        }
    }

    onTankShoot(shootInfo: GameStruct.ShootInfo) { 
        if (shootInfo) {
            let bullet = this.getNodeBullet();
            bullet.setPosition(this.panelGame.convertToNodeSpace(shootInfo.pos));
            let com = bullet.getComponent(Bullet);
            com.setType(shootInfo.type);
            com._shooterID = shootInfo.shooterID;
            com._team = shootInfo.team;
            com._powerLevel = shootInfo.powerLevel;
            com.setMove(shootInfo.speed, shootInfo.direction);
            this.panelGame.addChild(bullet);
        }
    }

    playUnitAni(aniInfo: GameStruct.AniInfo) {
        if (aniInfo) {
            this.node.emit(EventDef.EV_UNITANI_PLAY, aniInfo);
        }
    }

    playUnitAniOnce(type, node: cc.Node, params = null, startCallback = null, endCallback = null): number {
        let aniInfo: GameStruct.AniInfo = {
            node: node,
            mode: AniDef.UnitAniMode.ONCE,
            type: type,
            time: 0,
            startCallback: startCallback,
            endCallback: endCallback,
            aniID: null,
            param: params,
        }
        this.playUnitAni(aniInfo);

        return aniInfo.aniID
    }

    playUnitAniLoop(type, node: cc.Node, params = null, startCallback = null, endCallback = null): number {
        let aniInfo: GameStruct.AniInfo = {
            node: node,
            mode: AniDef.UnitAniMode.LOOP,
            type: type,
            time: 0,
            startCallback: startCallback,
            endCallback: endCallback,
            aniID: null,
            param: params,
        }
        this.playUnitAni(aniInfo);

        return aniInfo.aniID
    }

    playUnitAniInTime(type, node: cc.Node, time = 0, params = null, startCallback = null, endCallback = null): number {
        let aniInfo: GameStruct.AniInfo = {
            node: node,
            mode: AniDef.UnitAniMode.TIMELIMIT,
            type: type,
            time: time,
            startCallback: startCallback,
            endCallback: endCallback,
            aniID: null,
            param: params,
        }
        this.playUnitAni(aniInfo);

        return aniInfo.aniID
    }

    playSceneAni(type, mode, time = 0, params = null, startCallback = null, endCallback = null) {
        let aniInfo: GameStruct.AniInfo = {
            node: null,
            mode: mode,
            type: type,
            time: time,
            startCallback: startCallback,
            endCallback: endCallback,
            aniID: null,
            param: params,
        }

        this.node.emit(EventDef.EV_SCENEANI_PLAY, aniInfo);
        return aniInfo.aniID
    }

    //停止指定id的动画
    stopAni(aniID: number) {
        this.node.emit(EventDef.EV_ANI_STOP, aniID);
    }

    onTest() {
        //创建场景地图
        //this.node.emit(EventDef.EV_TEST_CREATE_GAMEMAP);

        //随机生成一个敌军坦克
    }

    getPanelGame() {
        return this.panelGame;
    }

    onDebugTextOut(text: string) {
        if (GameDataModel.isGameDebugMode()) {
            this.textDebug.string = text;
        }
    }

    worldToGameScenePosition(pos: cc.Vec2): cc.Vec2 {
        return this.panelGame.convertToNodeSpace(pos);
    }

    showGameResult() {
        this.closeGameResult();

        this._resultPanel = cc.instantiate(this.pfbResult);
        this.nodeBoxCenter.addChild(this._resultPanel);
    }

    closeGameResult() {
        if (this._resultPanel) {
            this._resultPanel.destroy();
            this._resultPanel = null;
        }
    }

    onBtnStart() {
        if (GameDataModel.isModeEditMap()) {
            this.node.emit(EventDef.EV_MAP_EDIT_FINISHED);
            GameDataModel._playMode = -1;
            GameDataModel._useCustomMap = true;
            this.goToMainMenu();
        }
        else {
            if (GameDataModel._gameRunning) {
                if (GameDataModel.isGamePause()) {
                    GameDataModel._enableOperate = true;
                    cc.director.resume();
                    cc.audioEngine.resumeAll();

                    this.node.emit(EventDef.EV_GAME_PAUSE);
                    this.nodePause.active = false;
                }
                else {
                    GameDataModel._enableOperate = false;
                    cc.director.pause();
                    cc.audioEngine.pauseAll();

                    this.node.emit(EventDef.EV_GAME_RESUME);
                    this.nodePause.active = true;
                }
            }
        }
    }

    playGainScoreAni(pos: cc.Vec2, score: number) {
        if (pos && score != null && score > 0) {
            this.playUnitAniInTime(AniDef.UnitAniType.GAIN_SCORE, this.panelAni, 0.7, { scriptName: "GainScoreAni", pos: pos, params: {score: score}});
        }
    }

    playTankBlastAni(pos: cc.Vec2, startCallback, endCallback) {
        if (pos) {
            this.playUnitAniOnce(AniDef.UnitAniType.TANK_BLAST, this.panelAni, { pos: pos}, startCallback, endCallback);
        }
    }

    playBulletBlastAni(pos: cc.Vec2) {
        if (pos) {
            this.playUnitAniOnce(AniDef.UnitAniType.BULLET_BLAST, this.panelAni, { pos: pos});
        }
    }

    onGameResultShowFinished() {
        if (GameDataModel._gameOver) {
            gameController.goToMainMenu(); //回到主菜单
        }
        else {
            if (GameDataModel._currStage < GameDef.GAME_TOTAL_STAGE) {
                //进入下一关
                this.closeGameResult();

                this.startGameStage(GameDataModel._currStage + 1);
            }
            else {
                //显示通关页面
                this.showGameSuccessDlg();
            }
        }
    }

    showGameSuccessDlg() {
        this.closeGameSuccessDlg();

        this._gameSuccessPanel = cc.instantiate(this.pfbGameSuccess);
        this.nodeBoxCenter.addChild(this._gameSuccessPanel);
    }

    closeGameSuccessDlg() {
        if (this._gameSuccessPanel) {
            this._gameSuccessPanel.destroy();
            this._gameSuccessPanel = null;
        }
    }
}
