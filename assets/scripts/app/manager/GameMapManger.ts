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
    _scenerys: cc.Node[][] = [];
    _homeBase: cc.Node = null;

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

        gameController.node.on(EventDef.EV_GAME_HIT_SCENERY, this.evHitScenery, this);

        GameInputModel.addKeyDownOnceListener(() => {
            this.saveMapData();
        }, null, this, PlayerDef.KEYMAP_COMMON.SAVE);
    }

    init() {
        this._sceneryPool = new NodePool(this.pfbScenery, Scenery);
        this._mapUnit = GameDataModel.getMapUnit();

        this.initListenner();

        this.initGameMap();
    }

    initGameMap() {
        this.resetGameMap();

        if (!GameDataModel.isModeEditMap()) {
            if (GameDataModel._useCustomMap) {
                this.createGameMap(GameDataModel._gameMapData);

                GameDataModel._useCustomMap = false;
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
        //GameDataModel.clearGameMapData();

        for (let i = 0; i < GameDef.GAME_MAP_COL_NUM; i++) {
            this._scenerys[i] = this._scenerys[i] ? this._scenerys[i] : [];
            for (let j = 0; j < GameDef.GAME_MAP_ROW_NUM; j++) {
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

        for (let x = 0; x < GameDef.GAME_MAP_COL_NUM; x++) {
            for (let y = 0; y <GameDef.GAME_MAP_ROW_NUM; y++) {
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

    getSceneryNode(pos: GameStruct.RcInfo): cc.Node {
        if (pos && GameDataModel.isValidMatrixPos(pos)) {
            return this._scenerys[pos.col][pos.row];
        }
        return null;
    }

    createScenery(type: number, pos: GameStruct.RcInfo) { 
        if (pos && GameDataModel.isValidMatrixPos(pos)) {
            this.destroyScenery(pos);

            if (type !== GameDef.SceneryType.NULL) {
                let scenery = this._sceneryPool.getNode();
                this.panelScenery.addChild(scenery);
                scenery.getComponent(Scenery).setType(type);
                scenery.setPosition(GameDataModel.convertToScenePosition(pos));
                this._scenerys[pos.col][pos.row] = scenery;
            }
        }
    }

    destroyScenery(rcInfo: GameStruct.RcInfo) {
        if (rcInfo && GameDataModel.isValidMatrixPos(rcInfo)) {
            let node = this._scenerys[rcInfo.col][rcInfo.row];
            if (node) {
                this._scenerys[rcInfo.col][rcInfo.row] = null;
                this._sceneryPool.putNode(node);
            }
        }
    }

    evMapEditCreateScenery(infos) {
        if (infos) {
            for (let info of infos) {
                if (!this.isHomeBasePosition(info.rcInfo)) {
                    this.createScenery(info.type, info.rcInfo);
                }
            }
        }
    }

    evMapEditFinished() {
        //保存编辑的地图
        GameDataModel.clearGameMapData()
        for (let i = 0; i < GameDef.GAME_MAP_COL_NUM; i++) {
            for (let j = 0; j < GameDef.GAME_MAP_ROW_NUM; j++) {
                if (this._scenerys[i][j]) {
                    let com = this._scenerys[i][j].getComponent(Scenery);
                    GameDataModel._gameMapData[i][j] = com.getType();
                }
            }
        }
    }

    evDestroyScenery(node: cc.Node) {
        let rcInfo = GameDataModel.convertToMatrixPosition(node.getPosition());
        if (this._scenerys[rcInfo.col][rcInfo.row] === node) {
            this._scenerys[rcInfo.col][rcInfo.row] = null;
            this._sceneryPool.putNode(node);
        }
    }

    saveMapData() {
        if (jsb != undefined) {
            //转化场景数据到数组中
            let mapData = {
                [GameDef.SceneryType.WALL]: [],
                [GameDef.SceneryType.WATER]: [],
                [GameDef.SceneryType.GRASS]: [],
                [GameDef.SceneryType.STEEL]: [],
            };

            for (let i = 0; i < GameDef.GAME_MAP_COL_NUM; i++) {
                for (let j = 0; j < GameDef.GAME_MAP_ROW_NUM; j++) {
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
    }

    //基地所在位置，不能存在其他布景元素
    checkHomeBase() {
        if (this._homeBase) {
            this.destorySceneryAround(GameDataModel.convertToMatrixPosition(this._homeBase.getPosition()));
        }
    }

    destorySceneryAround(rcInfo: GameStruct.RcInfo) {
        if (rcInfo) {
            let posAry = GameDataModel.getMapUnitContainRcInfo(rcInfo);
            for (let rcInfo of posAry) {
                this.destroyScenery(rcInfo);
            }
        }
    }

    evPlayerInitFinished(rcInfos: GameStruct.RcInfo[]) {
        if (rcInfos) {
            for(let rcInfo of rcInfos) {
                this.destorySceneryAround(rcInfo);
            }
        }
    }

    isHomeBasePosition(rcInfo: GameStruct.RcInfo) {
        if (rcInfo && this._homeBase) {
            let anchorPos = GameDataModel.convertToMatrixPosition(this._homeBase.getPosition());
            let posAry = GameDataModel.getMapUnitContainRcInfo(anchorPos);
            for (let pos of posAry) {
                if (pos.equal(rcInfo)) {
                    return true;
                }
            }
        }
        return false;
    }

    //子弹命中布景节点，根据范围处理相关布景的销毁
    evHitScenery(hitInfos: GameStruct.HitInfo[]) {
        if (!hitInfos) {
            return;
        }

        //递归函数，由某一节点向四周递归判断
        let hitFunc;
        hitFunc = (hitInfo: GameStruct.HitInfo, hitSceneryType: number = GameDef.SceneryType.NULL) => {
            let sceneryPos = GameStruct.RcInfo.multiply(hitInfo.pos, 0.5);
            let sceneryNode = this.getSceneryNode(sceneryPos);
            if (!sceneryNode) {
                return;
            }
            let scenery = sceneryNode.getComponent(Scenery);
            if (scenery) {
                if (hitSceneryType !== GameDef.SceneryType.NULL && hitSceneryType !== scenery.getType()) {//只扩散处理相同的布景类型
                    return;
                }

                //处理销毁动作
                scenery.onHited(hitInfo.pos, hitInfo.power);

                hitSceneryType = scenery.getType();
                //递归判断周围节点
                let scope = hitInfo.scope;
                if (scope.up > 0) {
                    scope.up--;
                    hitInfo.pos.row++;
                    hitFunc(hitInfo, hitSceneryType);
                    hitInfo.pos.row--;
                    scope.up++;
                }

                if (scope.down > 0) {
                    scope.down--;
                    hitInfo.pos.row--;
                    hitFunc(hitInfo, hitSceneryType);
                    hitInfo.pos.row++;
                    scope.down++;
                }

                if (scope.left > 0) {
                    scope.left--;
                    hitInfo.pos.col--;
                    hitFunc(hitInfo, hitSceneryType);
                    hitInfo.pos.col++;
                    scope.left++;
                }

                if (scope.right > 0) {
                    scope.right--;
                    hitInfo.pos.col++;
                    hitFunc(hitInfo, hitSceneryType);
                    hitInfo.pos.col--;
                    scope.right++;
                }
            }
        };

        for (let info of hitInfos) {
            hitFunc(info);
        }
    }
}
