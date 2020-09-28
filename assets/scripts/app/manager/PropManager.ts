import { gameController } from "../component/game/Game";
import { EventDef } from "../define/EventDef";
import Prop from "../component/game/Prop";
import { GameStruct } from "../define/GameStruct";
import { GameDef } from "../define/GameDef";
import CommonFunc from "../common/CommonFunc";
import GameDataModel from "../model/GameDataModel";
import PlayerTank from "../component/game/tank/PlayerTank";
import AudioModel from "../model/AudioModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyManager extends cc.Component {
    @property({ displayName: "道具层", type: cc.Node })
    panelProp: cc.Node = null;

    @property({ displayName: "道具预制体", type: cc.Prefab })
    pfbProp: cc.Node = null;

    _prop: cc.Node = null;

    _staticTime: number = 0;
    _homeProtectTime: number = 0;

    onLoad() {
        this._prop = cc.instantiate(this.pfbProp);

        this.initListener();
    }

    reset() {
        GameDataModel._propBuff = 0;
        if (this._prop && this._prop.getParent()) {
            this._prop.removeFromParent();
        }

        GameDataModel.resetPlayerPropNum();

        this.removeTimers();
    }

    onDestroy() {
        //this.removeTimers();
    }

    initListener() {
        gameController.node.on(EventDef.EV_PROP_CREATE, this.evCreateProp, this);
        gameController.node.on(EventDef.EV_PROP_DESTROY, this.evDestroyProp, this);
        gameController.node.on(EventDef.EV_PROP_GAIN, this.evGainProp, this);

        gameController.node.on(EventDef.EV_GAME_PREPARE_GAME, this.evPrepareGame, this);
        gameController.node.on(EventDef.EV_GAME_STARTED, this.evGameStarted, this);
        gameController.node.on(EventDef.EV_GAME_ENDED, this.evGameEnd, this);

        //gameController.node.on(EventDef.EV_GAME_PAUSE, this.evGamePause, this);
        //gameController.node.on(EventDef.EV_GAME_RESUME, this.evGameResume, this);
    }

    evCreateProp() {
        if (this._prop) {
            let type = this.getRandomPropType();
            let pos = this.getRandomPropPosition()

            console.log("create prop, pos:", type, "pos:", pos);
            if (type != null && pos) {
                AudioModel.playSound("sound/prop_1");

                this._prop.removeFromParent();
                this.panelProp.addChild(this._prop);

                let com = this._prop.getComponent(Prop);
                com.reset();

                //随机产生一个道具

                com.setType(type);
                com.setPosition(pos);
            }
        }
    }

    evDestroyProp() {
        if (this._prop) {
            this._prop.removeFromParent();
        }
    }

    evGainProp(playerNode: cc.Node) {
        if (this._prop && playerNode) {
            let type = this._prop.getComponent(Prop)._type;
            let playerTank = playerNode.getComponent(PlayerTank);

            switch(type) {
                case GameDef.PropType.BOMB:
                    //炸弹
                    AudioModel.playSound("sound/prop_1");
                    gameController.node.emit(EventDef.EV_PROP_BOMB, playerTank.id);
                    break;
                case GameDef.PropType.STAR:
                    //五角星
                    AudioModel.playSound("sound/prop_1");
                    playerTank.onLevelUp();
                    break;
                case GameDef.PropType.TANK:
                    //坦克
                    AudioModel.playSound("sound/prop_2");
                    GameDataModel.addPlayerLifeNum(playerTank.id);
                    gameController.node.emit(EventDef.EV_DISPLAY_UPDATE_PLAYER_LIFE);
                    break;
                case GameDef.PropType.HELMET:
                    //头盔
                    AudioModel.playSound("sound/prop_1");
                    playerTank.onGetShieldStatus(GameDef.PROP_SHIELD_INVINCIBLE_TIME);
                    break;
                case GameDef.PropType.CLOCK:
                    //定时
                    AudioModel.playSound("sound/prop_1");
                    this.onPropClockStart(GameDef.PROP_CLOCK_TIME);
                    break;
                case GameDef.PropType.SPADE:
                    //铲子
                    AudioModel.playSound("sound/prop_2");
                    this.onPropSpadeStart(GameDef.PROP_SPADE_TIME);
                    break;
                case GameDef.PropType.GUN:
                    //手枪
                    AudioModel.playSound("sound/prop_2");
                    if (playerTank._tankLevel < playerTank._tankMaxLevel) {
                        playerTank.onMaxLevel();
                    }
                    else {
                        //满级再吃手枪，加生命数量
                        GameDataModel.addPlayerLifeNum(playerTank.id);
                        gameController.node.emit(EventDef.EV_DISPLAY_UPDATE_PLAYER_LIFE);
                    }
                    break;
                default:
                    break;
            }

            GameDataModel.addPlayerPropNum(playerTank.id);
            gameController.playGainScoreAni(this._prop.getPosition(), GameDef.PROP_BONUS_SCORE);
        }
    }

    evPrepareGame() {
        this.reset();
    }

    evGameStarted() {
        this.startTimers();
    }

    evGameEnd() {
        this.removeTimers();
    }

    getRandomPropPosition(): GameStruct.RcInfo {
        let posAry = GameDataModel.getEmptyMatrixArray(4, 4, [GameDef.SceneryType.GRASS, GameDef.SceneryType.WALL, GameDef.SceneryType.ICE]);
        if (posAry.length > 0) {
            return CommonFunc.getRandomArrayValue(posAry);
        }
        return null;
    }

    getRandomPropType(): number {
        let propAary = [
            GameDef.PropType.BOMB,
            GameDef.PropType.CLOCK,
            GameDef.PropType.HELMET,
            GameDef.PropType.SPADE,
            GameDef.PropType.STAR,
            GameDef.PropType.TANK,
            GameDef.PropType.GUN,
        ];
        return CommonFunc.getRandomArrayValue(propAary);
    }

    startPropStatusTimer() {
        this.schedule(()=>{
            let buff = GameDataModel._propBuff;
            if (CommonFunc.isBitSet(buff, GameDef.PROP_BUFF_STATIC)) {
                if (this._staticTime > 0) {
                    this._staticTime--;
                }
                else {
                    this.onPropClockStop();
                }
            }

            if (CommonFunc.isBitSet(buff, GameDef.PROP_BUFF_HOME_PROTECT)) {
                if (this._homeProtectTime > 0) {
                    if (this._homeProtectTime === GameDef.PROP_SPADE_EFFECT_DISAPPEAR_TIME) {
                        this.onPropSpadeCountDown();
                    }
                    this._homeProtectTime--;
                }
                else {
                    this.onPropSpadeStop();
                }
            }
        }, 1);
    }

    onPropClockStart(time: number) {
        GameDataModel._propBuff |= GameDef.PROP_BUFF_STATIC;
        this._staticTime = time;
    }
    
    onPropClockStop() {
        GameDataModel._propBuff &= ~GameDef.PROP_BUFF_STATIC;
    }

    onPropSpadeStart(time: number) {
        GameDataModel._propBuff |= GameDef.PROP_BUFF_HOME_PROTECT;
        this._homeProtectTime = time;

        gameController.node.emit(EventDef.EV_PROP_SPADE_START);
    }

    onPropSpadeCountDown() {
        gameController.node.emit(EventDef.EV_PROP_SPADE_COUNT_DOWN);
    }
    
    onPropSpadeStop() {
        GameDataModel._propBuff &= ~GameDef.PROP_BUFF_HOME_PROTECT;
        gameController.node.emit(EventDef.EV_PROP_SPADE_END);
    }

    evGamePause() {
        this.removeTimers();
    }

    evGameResume() {
        this.startTimers();
    }

    startTimers() {
        this.startPropStatusTimer();
    }

    removeTimers() {
        this.unscheduleAllCallbacks();
    }
 }