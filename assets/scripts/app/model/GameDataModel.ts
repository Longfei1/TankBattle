import { GameDef } from "../define/GameDef";
import BaseModel from "./BaseModel";
import { PlayerDef } from "../define/PlayerDef";
import { GameStruct } from "../define/GameStruct";
import CommonFunc from "../common/CommonFunc";

class GameDataModel extends BaseModel {
    _playMode: number = -1;
    _gamePause: boolean = false;
    _enableOperate: boolean = false;
    _gameMapData:  number[][] =  [];
    _mapUnit = {width: 0, height: 0};
    _useCustomMap: boolean = false;
    _currStage: number = 0;
    
    initModel() {
        super.initModel();
        this.initGameData();
    }

    initGameData() {
        this._enableOperate = false;

        this.initGameMapData();
    }

    initGameMapData() {
        this._gameMapData = CommonFunc.createArray(GameDef.GAME_MAP_COL_NUM);
        for (let x = 0; x < GameDef.GAME_MAP_COL_NUM; x++) {
            for (let y = 0; y < GameDef.GAME_MAP_ROW_NUM; y++) {
                this._gameMapData[x][y] = GameDef.SceneryType.NULL;
            }
        }
    }

    createMapData() {
        let mapData: number[][] = CommonFunc.createArray(GameDef.GAME_MAP_COL_NUM);
        for (let x = 0; x < GameDef.GAME_MAP_COL_NUM; x++) {
            for (let y = 0; y < GameDef.GAME_MAP_ROW_NUM; y++) {
                mapData[x][y] = GameDef.SceneryType.NULL;
            }
        }
        return mapData;
    }

    clearGameMapData() {
        for (let colArray of this._gameMapData) {
            if (colArray) {
                for (let y = 0; y < colArray.length; y++) {
                    colArray[y] = GameDef.SceneryType.NULL;
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

    /**
     * 将地图方格的行列转换为场景中的坐标值
     * @param RcInfo ,col为列，row为行
     */
    convertToScenePosition(pos: GameStruct.RcInfo): cc.Vec2 {
        return cc.v2(this._mapUnit.width * pos.col, this._mapUnit.height * pos.row);
    }

    /**
     * 将场景坐标映射到包含该坐标的方格中，并返回该方格的行列坐标
     * @param pos 
     */
    convertToMatrixPosition(pos: cc.Vec2): GameStruct.RcInfo {
        let col = Math.floor(pos.x / this._mapUnit.width);
        let row = Math.floor(pos.y / this._mapUnit.height);
        return new GameStruct.RcInfo(col, row);
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

    isValidDirection(direction: number):boolean {
        if (direction >= 0 && direction <= 3) {
            return true;
        }
        return false;
    }

    //传入一个unit锚点（需要为左下角）所在的位置
    getMapUnitContainRcInfo(rcInfo: GameStruct.RcInfo): GameStruct.RcInfo[]  {
        let array:GameStruct.RcInfo[] = [];
        if (rcInfo) {
            array.push(new GameStruct.RcInfo(rcInfo.col, rcInfo.row + 1));//左上
            array.push(rcInfo);//左下
            array.push(new GameStruct.RcInfo(rcInfo.col + 1, rcInfo.row));//右下
            array.push(new GameStruct.RcInfo(rcInfo.col + 1, rcInfo.row + 1));//右上
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
}
export default new GameDataModel();
