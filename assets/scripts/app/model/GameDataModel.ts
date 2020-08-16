import { GameDef } from "../define/GameDef";
import BaseModel from "./BaseModel";
import { PlayerDef } from "../define/PlayerDef";
import { GameStruct } from "../define/GameStruct";
import CommonFunc from "../common/CommonFunc";
import Scenery from "../component/game/Scenery";
import { GameConfig } from "../GameConfig";

class GameDataModel extends BaseModel {
    _playMode: number = -1;
    _gamePause: boolean = false;
    _enableOperate: boolean = false;
    _gameMapData:  number[][] =  [];
    _mapUnit = {width: 0, height: 0};
    _useCustomMap: boolean = false;
    _currStage: number = 0;

    private _scenerys: cc.Node[][] = [];
    
    initModel() {
        super.initModel();
        this.initGameData();
    }

    initGameData() {
        this._enableOperate = false;

        this.initGameMapData();
    }

    initGameMapData() {
        this._gameMapData = this.createMapData();
    }

    resetGameData() {
        this._gamePause = false;
        this._enableOperate = false;
        this._useCustomMap = false;
        this._currStage = 0;

        this.clearGameMapData();
    }

    createMapData() {
        let mapData: number[][] = CommonFunc.createArray(GameDef.GAME_MAP_COL_NUM);
        for (let x = 0; x < GameDef.SCENERYS_NODE_COL_NUM; x++) {
            for (let y = 0; y < GameDef.SCENERYS_NODE_ROW_NUM; y++) {
                mapData[x][y] = GameDef.SceneryType.NULL;
            }
        }
        return mapData;
    }

    clearGameMapData() {
        if (this._gameMapData) {
            for (let colArray of this._gameMapData) {
                if (colArray) {
                    for (let y = 0; y < colArray.length; y++) {
                        colArray[y] = GameDef.SceneryType.NULL;
                    }
                }
            }
        }
    }

    isModeEditMap() {
        if (this._playMode === GameDef.GAMEMODE_MAP_EDIT) {
            return true
        }
        return false
    }

    setMapUnit(width: number, height: number) {
        this._mapUnit.width = width;
        this._mapUnit.height = height;
    }

    getMapUnit() {
        return this._mapUnit;
    }

    set scenerys(scenerys: cc.Node[][]) {
        this._scenerys = scenerys;
    }

    get scenerys() {
        return this._scenerys;
    }

    //根据行列信息获取布景节点
    getSceneryNode(sceneryPos: GameStruct.RcInfo): cc.Node {
        if (sceneryPos && this.isValidSceneryPos(sceneryPos)) {
            return this._scenerys[sceneryPos.col][sceneryPos.row];
        }
        return null;
    }

    /**
     * 将地图方格的行列转换为场景中的坐标值
     * @param RcInfo ,col为列，row为行
     */
    matrixToScenePosition(pos: GameStruct.RcInfo): cc.Vec2 {
        return cc.v2(this._mapUnit.width * pos.col, this._mapUnit.height * pos.row);
    }

    /**
     * 将场景坐标映射到包含该坐标的方格中，并返回该方格的行列坐标
     * @param pos 
     */
    sceneToMatrixPosition(pos: cc.Vec2): GameStruct.RcInfo {
        let col = Math.floor(pos.x / this._mapUnit.width);
        let row = Math.floor(pos.y / this._mapUnit.height);
        return new GameStruct.RcInfo(col, row);
    }

    //矩阵行列坐标转为布景坐标
    matrixToSceneryPosition(pos: GameStruct.RcInfo): GameStruct.RcInfo {
        let ret = GameStruct.RcInfo.multiply(pos, 1/GameDef.SCENERY_CONTAINS_RC);
        return ret;
    }

    //布景坐标转为矩阵行列坐标
    sceneryToMatrixPosition(pos: GameStruct.RcInfo): GameStruct.RcInfo {
        let ret = GameStruct.RcInfo.multiply(pos, GameDef.SCENERY_CONTAINS_RC);
        return ret;
    }

    //场景坐标转为布景坐标
    sceneToSceneryPosition(pos: cc.Vec2): GameStruct.RcInfo {
        let col = Math.floor(pos.x / this._mapUnit.width);
        let row = Math.floor(pos.y / this._mapUnit.height);
        let ret = new GameStruct.RcInfo(col, row);
        ret.multiplySelf(1/GameDef.SCENERY_CONTAINS_RC);
        return ret;
    }

    isGamePause() {
        return this._gamePause;
    }

    /**
     * 指定坐标超过边界
     * @param pos 场景坐标
     */
    isOutMapBoundary(pos: cc.Vec2) {
        if (pos) {
            let rect = cc.rect(0, 0, this._mapUnit.width * GameDef.GAME_MAP_COL_NUM, this._mapUnit.height * GameDef.GAME_MAP_ROW_NUM);
            if (rect.contains(pos)) {
                return false;
            }
        }
        return true;
    }

    isValidMatrixPos(pos: GameStruct.RcInfo) {
        if (pos) {
            if (0 <= pos.col && pos.col <= GameDef.GAME_MAP_COL_NUM
                && 0 <= pos.row && pos.row <= GameDef.GAME_MAP_ROW_NUM) {
                    return true;
            }
        }
        return false;
    }

    isValidSceneryPos(pos: GameStruct.RcInfo) {
        if (pos) {
            if (0 <= pos.col && pos.col <= GameDef.SCENERYS_NODE_COL_NUM
                && 0 <= pos.row && pos.row <= GameDef.SCENERYS_NODE_ROW_NUM) {
                    return true;
            }
        }
        return false;
    }

    isValidDirection(direction: number):boolean {
        if (direction >= 0 && direction <= 3) {
            return true;
        }
        return false;
    }

    isValidRect(rect: cc.Rect) {
        if (rect) {
            let mapRect = cc.rect(0, 0, this._mapUnit.width * GameDef.GAME_MAP_COL_NUM, this._mapUnit.height * GameDef.GAME_MAP_ROW_NUM);
            
            if (mapRect.containsRect(rect)) {
                return true;
            }
        }
        return false;
    }

    getHomeBaseRect(): cc.Rect {
        let scenePos = this.matrixToScenePosition(GameDef.PLACE_HOMEBASE); 
        let rect = cc.rect(scenePos.x, scenePos.y, this.getHomeBaseWidth(), this.getHomeBaseWidth());
        return rect;
    }

    getSceneryWidth(): number {
        return this._mapUnit.width * GameDef.SCENERY_CONTAINS_RC;
    }

    getHomeBaseWidth(): number {
        return this._mapUnit.width * GameDef.SCENERY_CONTAINS_RC * 2;
    }

    getTankWidth(): number {
        return this._mapUnit.width * GameDef.SCENERY_CONTAINS_RC * 2;
    }

    //传入一个unit锚点（需要为左下角）所在的位置
    getMapUnitContainSceneryPosition(sceneryPos: GameStruct.RcInfo): GameStruct.RcInfo[]  {
        let array:GameStruct.RcInfo[] = [];
        if (sceneryPos) {
            array.push(new GameStruct.RcInfo(sceneryPos.col, sceneryPos.row + 1));//左上
            array.push(sceneryPos);//左下
            array.push(new GameStruct.RcInfo(sceneryPos.col + 1, sceneryPos.row));//右下
            array.push(new GameStruct.RcInfo(sceneryPos.col + 1, sceneryPos.row + 1));//右上
        }
        return array;
    }

    addScopeByDirection(scope: GameStruct.HitScope, direction: number, value: number) {
        if (scope && value) {
            if (direction === GameDef.DIRECTION_UP) {
                scope.up += value;
            }
            else if (direction === GameDef.DIRECTION_DOWN) {
                scope.down += value;
            }
            else if (direction === GameDef.DIRECTION_LEFT) {
                scope.left += value;
            }
            else if (direction === GameDef.DIRECTION_RIGHT) {
                scope.right += value;
            }
        }
    }

    getOppositeDirection(direction: number) {
        let opposites = {
            [GameDef.DIRECTION_UP]: GameDef.DIRECTION_DOWN,
            [GameDef.DIRECTION_DOWN]: GameDef.DIRECTION_UP,
            [GameDef.DIRECTION_LEFT]: GameDef.DIRECTION_RIGHT,
            [GameDef.DIRECTION_RIGHT]: GameDef.DIRECTION_LEFT,
        }

        if (opposites[direction]) {
            return opposites[direction];
        }

        return -1;
    }

    getSceneryNodesInRect(rect: cc.Rect): cc.Node[] {
        let ret: cc.Node[] = [];
        if (rect) {
            //布景坐标
            let leftBottom = this.sceneToSceneryPosition(cc.v2(rect.xMin, rect.yMin));
            let rightTop = this.sceneToSceneryPosition(cc.v2(rect.xMax, rect.yMax));

            for (let col = leftBottom.col; col <= rightTop.col; col++) {
                for (let row = leftBottom.row; row <= rightTop.row; row++) {
                    let node = this.getSceneryNode(new GameStruct.RcInfo(col, row));
                    if (node) {
                        if (node.getComponent(Scenery).isOverlapWithRect(rect)) {
                            ret.push(node);
                        }
                    }
                }
            }
        }
        return ret;
    }

    isGameDebugMode(): boolean {
        if (GameConfig.debugMode > 0) {
            return true;
        }
        return false;
    }
}
export default new GameDataModel();
