import GameDataModel from "../model/GameDataModel";
import { gameController } from "../component/game/Game";
import { EventDef } from "../define/EventDef";
import NodePool from "../common/NodePool";
import Scenery from "../component/game/Scenery";
import { GameDef } from "../define/GameDef";
import CommonFunc from "../common/CommonFunc";
import { GameStruct } from "../define/GameStruct";
import GameInputModel from "../model/GameInputModel";
import { PlayerDef } from "../define/PlayerDef";
import GameConfigModel from "../model/GameConfigModel";
import HomeBase from "../component/game/HomeBase";
import { AniDef } from "../define/AniDef";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameMapManager extends cc.Component {

    @property({ displayName: "游戏地图所在平面节点", type: cc.Node })
    panelScenery: cc.Node = null;

    @property({ displayName: "布景预制体", type: cc.Prefab })
    pfbScenery: cc.Prefab = null;

    @property({ displayName: "基地预制体", type: cc.Prefab })
    pfbHomeBase: cc.Prefab = null;

    _sceneryPool: NodePool = null;
    _mapUnit = null;
    _scenerys: cc.Node[][] = null;
    _homeBase: cc.Node = null;

    _propSpadeEffectDisappearAniID: number = null;

    onLoad() {
        this.init();
    }

    onDestroy() {
        this._sceneryPool.clearNode();

        GameInputModel.removeInputListenerByContext(this);
    }

    initListenner() {
        gameController.node.on(EventDef.EV_TEST_CREATE_GAMEMAP, this.testCreateGameMap, this);

        gameController.node.on(EventDef.EV_MAP_CREATE_SCENERY, this.evMapEditCreateScenery, this);
        gameController.node.on(EventDef.EV_MAP_EDIT_FINISHED, this.evMapEditFinished, this);
        gameController.node.on(EventDef.EV_MAP_DESTROY_SCENERY, this.evDestroyScenery, this);
        gameController.node.on(EventDef.EV_PLAYER_INIT_FINISHED, this.evPlayerInitFinished, this);
        gameController.node.on(EventDef.EV_GAME_PREPARE_GAME, this.evPrepareGame, this);
        gameController.node.on(EventDef.EV_GAME_ENDED, this.evGameEnded, this);

        gameController.node.on(EventDef.EV_PROP_SPADE_START, this.evPropSpadeStart, this);
        gameController.node.on(EventDef.EV_PROP_SPADE_COUNT_DOWN, this.evPropSpadeCountDown, this);
        gameController.node.on(EventDef.EV_PROP_SPADE_END, this.evPropSpadeEnd, this);

        GameInputModel.addKeyDownOnceListener(() => {
            this.saveMapData();
        }, null, this, PlayerDef.KEYMAP_COMMON.SAVE);
    }

    init() {
        this._sceneryPool = new NodePool(this.pfbScenery, Scenery);
        
        this.bindGameModeData();

        this.initListenner();

        //this.initGameMap();
    }

    bindGameModeData() {
        this._mapUnit = GameDataModel.getMapUnit();
        this._scenerys = GameDataModel.scenerys;
    }

    initGameMap() {
        this.resetGameMap();

        if (!GameDataModel.isModeEditMap()) {
            if (GameDataModel._useCustomMap) {
                this.createGameMap(GameDataModel._gameMapData);

                GameDataModel._useCustomMap = false;
                GameDataModel.clearGameMapData();
            }
            else {
                let stage = GameDataModel._currStage;
                let stageConfig = GameConfigModel.stageData;
                if (stageConfig && stageConfig.MapData && stageConfig.MapData[stage - 1]) {
                    let mapData = this.convertToMapData(stageConfig.MapData[stage - 1]);
                    this.createGameMap(mapData);
                }
                else {
                    console.error("No MapData Stage:", stage);
                }
            }
        }

        this.createHomeBase();
        this.checkHomeBase();
    }

    resetGameMap() {
        for (let i = 0; i < GameDef.SCENERYS_NODE_COL_NUM; i++) {
            this._scenerys[i] = this._scenerys[i] ? this._scenerys[i] : [];
            for (let j = 0; j < GameDef.SCENERYS_NODE_ROW_NUM; j++) {
                if (this._scenerys[i][j]) {
                    this._sceneryPool.putNode(this._scenerys[i][j]);
                }
                this._scenerys[i][j] = null;
            }
        }

        this.resetHomeBase();
    }

    createGameMap(mapData) {
        if (!mapData) {
            return;
        }

        for (let x = 0; x < GameDef.SCENERYS_NODE_COL_NUM; x++) {
            for (let y = 0; y <GameDef.SCENERYS_NODE_ROW_NUM; y++) {
                if (mapData[x][y] !== GameDef.SceneryType.NULL) {
                    this.createScenery(mapData[x][y], new GameStruct.RcInfo(x, y));
                }
            }
        }
    }

    testCreateGameMap() {
        let mapData = CommonFunc.copyObject(GameDataModel._gameMapData);
        mapData[20][5] = GameDef. SceneryType.GRASS;
        mapData[21][5] = GameDef.SceneryType.WALL;
        mapData[22][5] = GameDef.SceneryType.WATER;
        mapData[23][5] = GameDef.SceneryType.GRASS;
        this.createGameMap(mapData);
    }

    getSceneryNode(sceneryPos: GameStruct.RcInfo): cc.Node {
        return GameDataModel.getSceneryNode(sceneryPos);
    }

    createScenery(type: number, sceneryPos: GameStruct.RcInfo) { 
        if (sceneryPos && GameDataModel.isValidSceneryPos(sceneryPos)) {
            this.destroyScenery(sceneryPos);

            if (type !== GameDef.SceneryType.NULL) {
                let scenery = this._sceneryPool.getNode();
                this.panelScenery.addChild(scenery);
                let com = scenery.getComponent(Scenery);
                com.reset();
                com.setType(type);
                scenery.setPosition(GameDataModel.matrixToScenePosition(GameDataModel.sceneryToMatrixPosition(sceneryPos)));
                this._scenerys[sceneryPos.col][sceneryPos.row] = scenery;
            }
        }
    }

    destroyScenery(sceneryPos: GameStruct.RcInfo) {
        if (sceneryPos && GameDataModel.isValidSceneryPos(sceneryPos)) {
            let node = this._scenerys[sceneryPos.col][sceneryPos.row];
            if (node) {
                this._scenerys[sceneryPos.col][sceneryPos.row] = null;
                this._sceneryPool.putNode(node);
            }
        }
    }

    evMapEditCreateScenery(infos) {
        if (infos) {
            for (let info of infos) {
                if (!this.isHomeBasePosition(info.sceneryPos)) {
                    this.createScenery(info.type, info.sceneryPos);
                }
            }
        }
    }

    evMapEditFinished() {
        //保存编辑的地图
        GameDataModel.clearGameMapData()
        for (let i = 0; i < GameDef.SCENERYS_NODE_COL_NUM; i++) {
            for (let j = 0; j < GameDef.SCENERYS_NODE_ROW_NUM; j++) {
                if (this._scenerys[i][j]) {
                    let com = this._scenerys[i][j].getComponent(Scenery);
                    GameDataModel._gameMapData[i][j] = com.getType();
                }
            }
        }
    }

    evDestroyScenery(node: cc.Node) {
        let rcInfo = GameDataModel.sceneToMatrixPosition(node.getPosition());
        if (this._scenerys[rcInfo.col][rcInfo.row] === node) {
            this._scenerys[rcInfo.col][rcInfo.row] = null;
            this._sceneryPool.putNode(node);
        }
    }

    saveMapData() {
        if (!GameDataModel.isModeEditMap() || !GameDataModel.isGameDebugMode()) {
            return;
        }

        if (jsb != undefined) {
            //转化场景数据到数组中
            let mapData = {
                [GameDef.SceneryType.WALL]: [],
                [GameDef.SceneryType.WATER]: [],
                [GameDef.SceneryType.GRASS]: [],
                [GameDef.SceneryType.STEEL]: [],
            };

            for (let i = 0; i < GameDef.SCENERYS_NODE_COL_NUM; i++) {
                for (let j = 0; j < GameDef.SCENERYS_NODE_ROW_NUM; j++) {
                    if (this._scenerys[i][j]) {
                        let com = this._scenerys[i][j].getComponent(Scenery);
                        let type = com.getType();
                        mapData[type].push(i);
                        mapData[type].push(j);
                    }
                }
            }

            //保存数据到文件中
            let path = jsb.fileUtils.getWritablePath();
            let mapString = JSON.stringify(mapData);
            
            let saveDir = path + "mapdata";
            if (!jsb.fileUtils.isDirectoryExist(saveDir)) {
                jsb.fileUtils.createDirectory(saveDir);
            }

            jsb.fileUtils.writeStringToFile(mapString, saveDir + "/map.txt");
            console.log("SaveMapData Success Path:", saveDir + "/map.txt");
        }
    }

    //将json存储的地图数据格式转化为游戏中的矩阵数据
    convertToMapData(mapConfig) {
        let mapData = GameDataModel.createMapData();
        let dataArray = mapConfig;

        for (let key in dataArray) {
            for (let i = 0; i + 1 < dataArray[key].length; i += 2) {
                mapData[dataArray[key][i]][dataArray[key][i + 1]] = parseInt(key);
            }
        }

        return mapData;
    }

    resetHomeBase() {
        if (cc.isValid(this._homeBase)) {
            this._homeBase.destroy();
            this._homeBase = null;
        }
    }

    createHomeBase() {
        this.resetHomeBase();
        this._homeBase = cc.instantiate(this.pfbHomeBase);
        this._homeBase.getComponent(HomeBase).setPosition(GameDef.PLACE_HOMEBASE);
        this.panelScenery.addChild(this._homeBase);

        this._homeBase.zIndex = cc.macro.MAX_ZINDEX; //暂时设置一个最大的zindex
    }

    //基地所在位置，不能存在其他布景元素
    checkHomeBase() {
        if (this._homeBase) {
            this.destroySceneryAround(this.getHomeBaseSceneryPosition());
        }
    }

    //出生位置，不能存在其他布景元素
    checkBornPlace() {
        //目前固定出生位置，若出生位置可随关卡调整，需改变写法
        let placeInfos: GameStruct.RcInfo[] = [
            GameDef.BORN_PLACE_PLAYER1,
            GameDef.BORN_PLACE_PLAYER2,
            GameDef.BORN_PLACE_ENAMY1,
            GameDef.BORN_PLACE_ENAMY2,
            GameDef.BORN_PLACE_ENAMY3,
        ];

        for (let pos of placeInfos) {
            let sceneryPos = GameDataModel.matrixToSceneryPosition(pos);
            this.destroySceneryAround(sceneryPos);
        }
    }

    getHomeBaseSceneryPosition():GameStruct.RcInfo {
        let matrixPox = GameDataModel.sceneToMatrixPosition(this._homeBase.getPosition());
        return GameDataModel.matrixToSceneryPosition(matrixPox);
    }

    destroySceneryAround(sceneryPos: GameStruct.RcInfo) {
        if (sceneryPos) {
            let posAry = GameDataModel.getRectContainPosArray(sceneryPos, 2, 2);
            for (let pos of posAry) {
                this.destroyScenery(pos);
            }
        }
    }

    evPlayerInitFinished() {
        
    }

    isHomeBasePosition(sceneryPos: GameStruct.RcInfo) {
        if (sceneryPos && this._homeBase) {
            let homeBasePos = this.getHomeBaseSceneryPosition();
            let posAry = GameDataModel.getRectContainPosArray(homeBasePos, 2, 2);
            for (let pos of posAry) {
                if (pos.equal(sceneryPos)) {
                    return true;
                }
            }
        }
        return false;
    }

    evPrepareGame() {
        this.initGameMap();
    }

    evGameEnded() {
        this.stopPropSpadeEffectDisappearAni();
    }

    evPropSpadeStart() {
        //铲子道具效果，产生钢布景围绕基地
        this.createScenerysAroundHomeBase(GameDef.SceneryType.STEEL);
    }

    evPropSpadeCountDown() {
        this.showPropSpadeEffectDisappearAni();
    }

    evPropSpadeEnd() {
        this.stopPropSpadeEffectDisappearAni();

        //道具结束后，不管原来周围是什么类型的布景，这里都重新设置为土墙
        this.createScenerysAroundHomeBase(GameDef.SceneryType.WALL);
    }

    destroyScenerysAroundHomeBase() {
        let homePos = GameDataModel.matrixToSceneryPosition(GameDef.PLACE_HOMEBASE);

        //销毁周围的布景
        this.destroyScenery(new GameStruct.RcInfo(homePos.col - 1, homePos.row));
        this.destroyScenery(new GameStruct.RcInfo(homePos.col - 1, homePos.row + 1));
        this.destroyScenery(new GameStruct.RcInfo(homePos.col - 1, homePos.row + 2));
        this.destroyScenery(new GameStruct.RcInfo(homePos.col, homePos.row + 2));
        this.destroyScenery(new GameStruct.RcInfo(homePos.col + 1, homePos.row + 2));
        this.destroyScenery(new GameStruct.RcInfo(homePos.col + 2, homePos.row + 2));
        this.destroyScenery(new GameStruct.RcInfo(homePos.col + 2, homePos.row + 1));
        this.destroyScenery(new GameStruct.RcInfo(homePos.col + 2, homePos.row));
    }

    
    createScenerysAroundHomeBase(type: number) {
        this.destroyScenerysAroundHomeBase();//先销毁周围原来的布景

        let homePos = GameDataModel.matrixToSceneryPosition(GameDef.PLACE_HOMEBASE);

        //生成周围的钢布景
        this.createScenery(type, new GameStruct.RcInfo(homePos.col - 1, homePos.row));
        this.createScenery(type, new GameStruct.RcInfo(homePos.col - 1, homePos.row + 1));
        this.createScenery(type, new GameStruct.RcInfo(homePos.col - 1, homePos.row + 2));
        this.createScenery(type, new GameStruct.RcInfo(homePos.col, homePos.row + 2));
        this.createScenery(type, new GameStruct.RcInfo(homePos.col + 1, homePos.row + 2));
        this.createScenery(type, new GameStruct.RcInfo(homePos.col + 2, homePos.row + 2));
        this.createScenery(type, new GameStruct.RcInfo(homePos.col + 2, homePos.row + 1));
        this.createScenery(type, new GameStruct.RcInfo(homePos.col + 2, homePos.row));
    }

    showPropSpadeEffectDisappearAni() {
        this._propSpadeEffectDisappearAniID = gameController.playUnitAniLoop(AniDef.UnitAniType.SPADE_EFFECT_DISAPPEAR,
            this._homeBase);
    }

    stopPropSpadeEffectDisappearAni() {
        if (this._propSpadeEffectDisappearAniID != null) {
            gameController.stopAni(this._propSpadeEffectDisappearAniID);
        }

        this._propSpadeEffectDisappearAniID = null;
    }
}
