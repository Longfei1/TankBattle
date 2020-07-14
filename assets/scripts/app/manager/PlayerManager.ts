import GameDataModel from "../model/GameDataModel";
import { GameDef } from "../define/GameDef";
import PlayerTank from "../component/game/tank/PlayerTank";
import { PlayerDef } from "../define/PlayerDef";
import GameInputModel from "../model/GameInputModel";
import MapEditTank from "../component/game/tank/MapEditTank";
import { gameController } from "../component/game/Game";
import { EventDef } from "../define/EventDef";
import { GameStruct } from "../define/GameStruct";
import CommonFunc from "../common/CommonFunc";
import AudioModel from "../model/AudioModel";
import GameConfigModel from "../model/GameConfigModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PlayerManager extends cc.Component {

    @property({ displayName: "游戏层", type: cc.Node })
    panelGame: cc.Node = null;

    @property({ displayName: "玩家预制体", type: cc.Prefab })
    pfbPlayer: cc.Prefab = null;

    @property({ displayName: "地图编辑玩家预制体", type: cc.Prefab })
    pfbMapEditer: cc.Prefab = null;

    _operateHandlerMap = {};

    _mapUnit = null;
    _players: PlayerTank[] = [];
    _mapEditer: MapEditTank = null;

    onLoad() {
        this.initListener();

        this.initPlyaers();
    }

    onDestroy() {
        this.removeListener()
    }

    initListener() {
        if (GameDataModel.isModeEditMap()) {
            GameInputModel.addKeyDownIntervalListener(this.onKeyDown, this.onKeyUp, this, null, 0.05);
        }
        else {
            GameInputModel.addKeyDownOnceListener(this.onKeyDown, this.onKeyUp, this);
        }

        gameController.node.on(EventDef.EV_GAME_STARTED, this.evGameStarted, this);
    }

    removeListener() {
        GameInputModel.removeInputListenerByContext(this);
    }

    initPlyaers() {
        this._mapUnit = GameDataModel.getMapUnit();

        if (GameDataModel.isModeEditMap()) {
            let mapEditer = cc.instantiate(this.pfbMapEditer);
            if (mapEditer) {
                this.panelGame.addChild(mapEditer);
                let tankCom = mapEditer.getComponent(MapEditTank)
                tankCom.setEditPosition(GameDef.BORN_PLACE_PLAYER1);
                //tankCom.setMoveDirction(GameDef.DIRECTION_UP);
                this._mapEditer = tankCom;
            }
        }
        else {
            let tankData = GameConfigModel.tankData;
            if (!tankData) { return; }

            let player1 = cc.instantiate(this.pfbPlayer);
            this.panelGame.addChild(player1);
            let playerCom1 = player1.getComponent(PlayerTank);
            playerCom1.setAttributes(tankData["player1"]);
            playerCom1.setTankLevel(1);
            playerCom1.setPosition(GameDef.BORN_PLACE_PLAYER1);
            playerCom1.setMoveDirction(GameDef.DIRECTION_UP);
            this._players[0] = playerCom1;
            if (GameDataModel._playMode === GameDef.GAMEMODE_DOUBLE_PLAYER) {
                let player2 = cc.instantiate(this.pfbPlayer);
                this.panelGame.addChild(player2);
                let playerCom2 = player2.getComponent(PlayerTank);
                playerCom2.setAttributes(tankData["player2"]);
                playerCom2.setTankLevel(1);
                playerCom2.setPosition(GameDef.BORN_PLACE_PLAYER2);
                playerCom2.setMoveDirction(GameDef.DIRECTION_UP);
                this._players[1] = playerCom2;
            }
        }

        gameController.node.emit(EventDef.EV_PLAYER_INIT_FINISHED);
    }

    resetPlayer() {
        for (let player of this._players) {
            if(cc.isValid(player.node)) {
                player.node.destroy();
            }
        }
        this._players = [];
    }

    update() {
        if (GameDataModel.isGamePause()) {
            return
        }

        if (GameDataModel.isModeEditMap()) {
            return
        }
    }

    onKeyDown(event) {
        if (!GameDataModel._enableOperate) {
            return;
        }
        switch (event.keyCode) {
            case PlayerDef.KEYMAP_PLAYER1.UP:
                this.onPlayerMove(0, GameDef.DIRECTION_UP);
                break;
            case PlayerDef.KEYMAP_PLAYER1.LEFT:
                this.onPlayerMove(0, GameDef.DIRECTION_LEFT);
                break;
            case PlayerDef.KEYMAP_PLAYER1.DOWN:
                this.onPlayerMove(0, GameDef.DIRECTION_DOWN);
                break;
            case PlayerDef.KEYMAP_PLAYER1.RIGHT:
                this.onPlayerMove(0, GameDef.DIRECTION_RIGHT);
                break;
            case PlayerDef.KEYMAP_PLAYER1.OK:
                this.onPlayerOkClick(0);
                break;
            case PlayerDef.KEYMAP_PLAYER1.CANCEL:
                this.onPlayerCancelClick(0);
                break;
            case PlayerDef.KEYMAP_PLAYER2.UP:
                this.onPlayerMove(1, GameDef.DIRECTION_UP);
                break;
            case PlayerDef.KEYMAP_PLAYER2.LEFT:
                this.onPlayerMove(1, GameDef.DIRECTION_LEFT);
                break;
            case PlayerDef.KEYMAP_PLAYER2.DOWN:
                this.onPlayerMove(1, GameDef.DIRECTION_DOWN);
                break;
            case PlayerDef.KEYMAP_PLAYER2.RIGHT:
                this.onPlayerMove(1, GameDef.DIRECTION_RIGHT);
                break;
            case PlayerDef.KEYMAP_PLAYER2.OK:
                this.onPlayerOkClick(1);
                break;
            case PlayerDef.KEYMAP_PLAYER2.CANCEL:
                this.onPlayerCancelClick(1);
                break;
            default:
                break;
        }
    }

    onKeyUp(event) {
        if (!GameDataModel._enableOperate) {
            return;
        }
        switch (event.keyCode) {
            case PlayerDef.KEYMAP_PLAYER1.UP:
                this.onStopMove(0, GameDef.DIRECTION_UP);
                break;
            case PlayerDef.KEYMAP_PLAYER1.LEFT:
                this.onStopMove(0, GameDef.DIRECTION_LEFT);
                break;
            case PlayerDef.KEYMAP_PLAYER1.DOWN:
                this.onStopMove(0, GameDef.DIRECTION_DOWN);
                break;
            case PlayerDef.KEYMAP_PLAYER1.RIGHT:
                this.onStopMove(0, GameDef.DIRECTION_RIGHT);
                break;
            case PlayerDef.KEYMAP_PLAYER2.UP:
                this.onStopMove(1, GameDef.DIRECTION_UP);
                break;
            case PlayerDef.KEYMAP_PLAYER2.LEFT:
                this.onStopMove(1, GameDef.DIRECTION_LEFT);
                break;
            case PlayerDef.KEYMAP_PLAYER2.DOWN:
                this.onStopMove(1, GameDef.DIRECTION_DOWN);
                break;
            case PlayerDef.KEYMAP_PLAYER2.RIGHT:
                this.onStopMove(1, GameDef.DIRECTION_RIGHT);
                break;
            default:
                break;
        }
    }

    onPlayerMove(playerNo: number, nDirection: number) {
        if (GameDataModel.isModeEditMap()) {
            CommonFunc.playButtonSound();
            //地图编辑模式移动一格
            if (playerNo === 0) {
                let moveDiff;
                let moveLength = GameDef.SCENERY_CONTAINS_RC;
                if (nDirection == GameDef.DIRECTION_UP) {
                    moveDiff = new GameStruct.RcInfo(0, moveLength);
                }
                else if (nDirection == GameDef.DIRECTION_LEFT){
                    moveDiff = new GameStruct.RcInfo(-moveLength, 0);
                }
                else if (nDirection == GameDef.DIRECTION_DOWN){
                    moveDiff = new GameStruct.RcInfo(0, -moveLength);
                }
                else if (nDirection == GameDef.DIRECTION_RIGHT){
                    moveDiff = new GameStruct.RcInfo(moveLength, 0);
                }
                this._mapEditer.moveBy(moveDiff);
            }
        }
        else {
            if (this._players[playerNo]) {
                this._players[playerNo].setMove(true, nDirection);
            }
        }
    }

    onStopMove(playerNo: number, nDirection: number) {
        if (!GameDataModel.isModeEditMap()) {
            if (this._players[playerNo]) {
                this._players[playerNo].setMove(false, nDirection);
            }
        }
    }

    onPlayerOkClick(playerNo: number) {
        if (GameDataModel.isModeEditMap() && playerNo === 0) {
            this.onChangeScenery();
        }
        else {
            if (this._players[playerNo]) {
                this._players[playerNo].shoot();
            }
        }
    }

    onPlayerCancelClick(playerNo: number) {
        if (GameDataModel.isModeEditMap() && playerNo === 0) {
            this.onChangeEditMode();
        }
    }

    onChangeEditMode() {
        CommonFunc.playButtonSound();
        this._mapEditer.changeEditMode();
    }

    onChangeScenery() {
        CommonFunc.playButtonSound();
        this._mapEditer.updateSceneryMap();
    }

    evGameStarted() {
        for(let player of this._players) {
            if (cc.isValid(player.node)) {
                player.onGetShieldStatus(GameDef.BORN_INVINCIBLE_TIME);
            }
        }
    }
}