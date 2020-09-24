import { PlayerDef } from "../../define/PlayerDef";
import GameDataModel from "../../model/GameDataModel";
import { GameDef } from "../../define/GameDef";
import AudioModel from "../../model/AudioModel";
import ModelManager from "../../manager/ModelManager";
import GameInputModel from "../../model/GameInputModel";
import CommonFunc from "../../common/CommonFunc";
import GameConfigModel from "../../model/GameConfigModel";

const {ccclass, property} = cc._decorator;

let TOTLE_ITEMS = 3;
enum MenuItemIdex {
    SINGLE_PLAY,
    DOUBLE_PLAY,
    MAP_EDIT
}

@ccclass
export default class MainMenu extends cc.Component {

    @property({ displayName: "操作层节点", type: cc.Node })
    panelOperate: cc.Node = null;

    @property({ displayName: "菜单选项节点", type: [cc.Node] })
    nodeMenuItems: cc.Node[] = [];

    @property({ displayName: "选择光标预制体", type: cc.Prefab })
    pfbCursor: cc.Prefab = null;
 
    @property({ displayName: "光标移动间隔时间", type: cc.Float })
    moveInterval: number = 0.2;

    @property({ displayName: "光标与选项间隔像素", type: cc.Float })
    cursorShiftPos: number = -50;

    @property({ displayName: "最高分", type: cc.Label })
    textHighScore: cc.Label = null;

    _cursor: cc.Node = null;
    _currChoose: number = MenuItemIdex.SINGLE_PLAY;
    _bSelect: boolean = false;

    onLoad() {
        cc.game.setFrameRate(GameDef.GAME_FPS);
        
        ModelManager.initModels();

        this.initListener();

        this.initCursor();
        this._bSelect = false;

        this.updateHighScore();
    }

    initListener() {
        GameInputModel.addKeyDownIntervalListener(() => {
            CommonFunc.playButtonSound();
            this.onMoveUp();
        }, null, this, PlayerDef.KEYMAP_PLAYER1.UP, this.moveInterval);
        GameInputModel.addKeyDownIntervalListener(() => {
            CommonFunc.playButtonSound();
            this.onMoveDown();
        }, null, this, PlayerDef.KEYMAP_PLAYER1.DOWN, this.moveInterval);
        GameInputModel.addKeyDownOnceListener(() => {
            CommonFunc.playButtonSound();
            this.onSelectItems();
        }, null, this, PlayerDef.KEYMAP_PLAYER1.OK);
        GameInputModel.addKeyDownOnceListener(() => {
            CommonFunc.playButtonSound();
            this.onSelectItems();
        }, null, this, PlayerDef.KEYMAP_COMMON.START);
    }

    removeListener() {
        GameInputModel.removeInputListenerByContext(this);
    }

    initCursor() {
        this._cursor = cc.instantiate(this.pfbCursor);
        this.updateCursorPosition();
        this._cursor.setParent(this.panelOperate);
    }

    updateCursorPosition() {
        let itemPos = this.nodeMenuItems[this._currChoose].getPosition();
        let itemWidth = this.nodeMenuItems[this._currChoose].width;
        let cursorPos = cc.v2(itemPos.x + this.cursorShiftPos - itemWidth/2, itemPos.y);
        this._cursor.setPosition(cursorPos);
    }

    onDestroy() {
        this.removeListener();
        this._cursor.destroy();
    }

    onMoveUp() {
        this._currChoose = (this._currChoose + TOTLE_ITEMS - 1)%TOTLE_ITEMS;
        this.updateCursorPosition();
    }

    onMoveDown() {       
        this._currChoose = (this._currChoose + TOTLE_ITEMS + 1) % TOTLE_ITEMS;
        this.updateCursorPosition();
    }

    onSelectItems() {
        if (!this._bSelect) {
            this._bSelect = true;

            switch (this._currChoose) {
                case MenuItemIdex.SINGLE_PLAY:
                    GameDataModel._playMode = GameDef.GAMEMODE_SINGLE_PLAYER;
                    this.onStartGame();
                    console.log("开始单人游戏");
                    break;
                case MenuItemIdex.DOUBLE_PLAY:
                    GameDataModel._playMode = GameDef.GAMEMODE_DOUBLE_PLAYER;
                    this.onStartGame();
                    console.log("开始双人游戏");
                    break;
                case MenuItemIdex.MAP_EDIT:
                    //地图编辑场景
                    GameDataModel._playMode = GameDef.GAMEMODE_MAP_EDIT;
                    GameDataModel._useCustomMap = false;
                    this.onStartGame();
                    console.log("开始地图编辑");
                    break;
                default:
                    break;
            }
        }
    }

    //开始游戏
    onStartGame() {
        cc.director.loadScene("Game");
    }

    updateHighScore() {
        let score = GameDataModel.getHighScore();
        this.textHighScore.string = score.toString();
    }
}
