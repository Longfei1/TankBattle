import { GameDef } from "../define/GameDef";
import BaseModel from "./BaseModel";
import { PlayerDef } from "../define/PlayerDef";
import { GameStruct } from "../define/GameStruct";
import CommonFunc from "../common/CommonFunc";
import Scenery from "../component/game/Scenery";
import { GameConfig } from "../GameConfig";
import EnemyTank from "../component/game/tank/EnemyTank";
import PlayerTank from "../component/game/tank/PlayerTank";
import GameConfigModel from "./GameConfigModel";

class GameDataModel extends BaseModel {
    _playMode: number = -1;
    _gamePause: boolean = false;
    _gameRunning: boolean = false;
    _enableOperate: boolean = false;
    _gameMapData:  number[][] =  [];
    _mapUnit = {width: 0, height: 0};
    _useCustomMap: boolean = false;
    _currStage: number = 0;
    _liveStatus: { [id: number] : boolean } = {};


    //关卡相关数据
    private _scenerys: cc.Node[][] = [];
    private _enemys: { [id: number] : cc.Node } = {};
    private _players: { [id: number]: cc.Node } = {};

    _propBuff: number = 0;
    _playerLifeNum: { [id: number] : number } = {};
    _enemyDeadNum: {[name: string] : number} = {};

    initModel() {
        super.initModel();
        this.initGameMapData();
        this.initGameData();
    }

    initGameData() {
        this._enableOperate = false;

        this.resetGameData();
    }

    initGameMapData() {
        this._gameMapData = this.createMapData();
    }

    resetGameData() {
        this._gamePause = false;
        this._gameRunning = false;
        //this._useCustomMap = false;
        this._currStage = 1;
        this._enableOperate = false;
        this._liveStatus = {[0]: true, [1]: true}

        this._propBuff = 0;
        this.resetPlayerLifeNum();
        this.resetEnemyDeadNum();

        this.clearGameMapData();

        this._scenerys = [];
        this.clearEnemyTank();
        this.clearPlayerTank();
    }

    createMapData() {
        let mapData: number[][] = CommonFunc.createArray(GameDef.SCENERYS_NODE_COL_NUM);
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
            if (this._scenerys[sceneryPos.col]) {
                return this._scenerys[sceneryPos.col][sceneryPos.row];
            }
        }
        return null;
    }

    setEnemyTank(node: cc.Node) {
        if (cc.isValid(node)) {
            let com = node.getComponent(EnemyTank);
            if (com) {
                this._enemys[com.id] = node;
            }
        }
    }

    removeEnemyTank(id: number) {
        if (this._enemys[id]) {
            delete this._enemys[id];
        }
    }

    clearEnemyTank() {
        this._enemys = {};
    }

    setPlayerTank(node: cc.Node) {
        if (cc.isValid(node)) {
            let com = node.getComponent(PlayerTank);
            if (com) {
                this._players[com.id] = node;
            }
        }
    }

    removePlayerTank(no: number) {
        if (this._players[no]) {
            delete this._players[no];
        }
    }

    clearPlayerTank() {
        this._players = {};
    }

    resetPlayerLifeNum() {
        this._playerLifeNum = {}

        this.setPlayerLifeNum(0, GameDef.PLAYER_LIFE_NUM);
        this.setPlayerLifeNum(1, GameDef.PLAYER_LIFE_NUM);
    }

    addPlayerLifeNum(id: number) {
        if (this._playerLifeNum[id] != null) {
            this._playerLifeNum[id]++;
        }
    }

    reducePlayerLifeNum(id: number) {
        if (this._playerLifeNum[id] != null) {
            this._playerLifeNum[id]--;
        }
    }

    getPlayerLifeNum(id: number): number {
        return this._playerLifeNum[id];
    }

    setPlayerLifeNum(id: number, num: number) {
        this._playerLifeNum[id] = num;
    }

    resetEnemyDeadNum() {
        this._enemyDeadNum = {}

        for (let name of GameDef.EnemyTankNames) {
            this.setEnemyDeadNum(name, 0);
        }
    }

    addEnemyDeadNum(name: string) {
        if (this._enemyDeadNum[name] != null) {
            this._enemyDeadNum[name]++;
        }
    }

    getEnemyDeadNum(name: string): number {
        return this._enemyDeadNum[name];
    }

    setEnemyDeadNum(name: string, num: number) {
        this._enemyDeadNum[name] = num;
    }

    getEnemyDeadTotalNum(): number {
        let total = 0;
        CommonFunc.travelMap(this._enemyDeadNum, (name: string, num: number) => {
            total += num;
        })
        return total;
    }

    getEnemyAliveNum(): number {
        return CommonFunc.getMapSize(this._enemys);
    }

    getEnemyLeftNum(): number {
        let diffcultyData = GameConfigModel.stageData.DifficultyData[this._currStage - 1];//本关卡难度数据
        let leftNum = diffcultyData["EnemyTotalNum"] - this.getEnemyDeadTotalNum() - this.getEnemyAliveNum();

        return leftNum;
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

    getHomeCenterScenePosition(): cc.Vec2 {
        let scenePos = this.matrixToScenePosition(new GameStruct.RcInfo(GameDef.PLACE_HOMEBASE.col + 2, GameDef.PLACE_HOMEBASE.row + 2)); 
        return scenePos;
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

    getPropWidth(): number {
        return this._mapUnit.width * GameDef.SCENERY_CONTAINS_RC * 2;
    }

    /**
     * 获取一个矩形所能包含的行列坐标数组
     * @param pos 矩形左下角行列坐标
     * @param rowNum 包含行数（矩形高度）
     * @param colNum 包含列数（矩形宽度）
     */
    getRectContainPosArray(pos: GameStruct.RcInfo, rowNum = 0, colNum: number = 0): GameStruct.RcInfo[]  {
        let array:GameStruct.RcInfo[] = [];

        if (pos) {
            for( let col = 0; col < colNum; col++) {
                for (let row = 0; row < rowNum; row ++) {
                    array.push(new GameStruct.RcInfo(pos.col + col, pos.row + row));
                }
            }
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

    //坦克是否能在给定区域移动
    canTankMoveInRect(moveAreaRect: cc.Rect, excludeTankNode: cc.Node = null): boolean {
        //是否超出边界
        if (!this.isValidRect(moveAreaRect)) {
            return false;
        }

        //是否包含基地
        {
            let homeBaseRect = this.getHomeBaseRect();

            if (this.isRectOverlap(moveAreaRect, homeBaseRect)) {
                return false;
            }
        }

        //是否包含不可穿越的布景
        {
            let sceneryNodes = this.getSceneryNodesInRect(moveAreaRect);
            if (sceneryNodes) {
                for (let node of sceneryNodes) {
                    let sceneryType = node.getComponent(Scenery).getType();
                    if (sceneryType !== GameDef.SceneryType.GRASS) {
                        return false;
                    }
                }
            }
        }

        //是否包含其他坦克
        {
            if (this.hasTankInRect(moveAreaRect, excludeTankNode)) {
                return false;
            }
        }

        return true;
    }

    hasTankInRect(areaRect: cc.Rect, excludeTankNode: cc.Node = null): boolean {
        let bHave = false;
        //玩家
        CommonFunc.travelMap(this._players, (no: number, node: cc.Node) => {
            if (node !== excludeTankNode) {
                let pos = node.getPosition()
                let tankWidth = this.getTankWidth();
                let tankRect: cc.Rect = cc.rect(pos.x, pos.y, tankWidth, tankWidth);
                if (this.isRectOverlap(areaRect, tankRect)) {
                    bHave = true;
                    return true;
                }
            }
        });

        //敌军
        if (!bHave) {
            CommonFunc.travelMap(this._enemys, (id: number, node: cc.Node) => {
                if (node !== excludeTankNode) {
                    let pos = node.getPosition()
                    let tankWidth = this.getTankWidth();
                    let tankRect: cc.Rect = cc.rect(pos.x, pos.y, tankWidth, tankWidth);
                    if (this.isRectOverlap(areaRect, tankRect)) {
                        bHave = true;
                        return true;
                    }
                }
            });
        }

        return bHave;
    }

    //获取子弹在移动时命中的最近的布景区域
    getBulletShootSceneryRectWhenMove(direction: number, moveRect: cc.Rect): cc.Rect {
        let retRect: cc.Rect = null;
        let hitRects: cc.Rect[] = [];

        //获取区域中所有相交的区域
        let sceneryNodes = this.getSceneryNodesInRect(moveRect);
        if (sceneryNodes) {
            for (let node of sceneryNodes) {
                let com = node.getComponent(Scenery);
                let sceneryType = com.getType();
                if (sceneryType !== GameDef.SceneryType.GRASS && sceneryType !== GameDef.SceneryType.WATER) {
                    let subRects = com.getOverlapRects(moveRect);
                    for (let it of subRects) {
                        hitRects.push(it);
                    }
                }
            }
        }

        //根据移动方向，获取移动区域中最先触碰到的布景区域
        for (let rect of hitRects) {
            if (retRect) {
                if (direction === GameDef.DIRECTION_UP) {
                    if (rect.yMin < retRect.yMin) {
                        retRect = rect;
                    }
                }
                else if (direction === GameDef.DIRECTION_DOWN) {
                    if (rect.yMax > retRect.yMax) {
                        retRect = rect;
                    }
                }
                else if (direction === GameDef.DIRECTION_LEFT) {
                    if (rect.xMax > retRect.xMax) {
                        retRect = rect;
                    }
                }
                else if (direction === GameDef.DIRECTION_RIGHT) {
                    if (rect.xMin < retRect.xMin) {
                        retRect = rect;
                    }
                }
            }
            else {
                retRect = rect;
            }
        }

        return retRect;
    }

    isGameDebugMode(): boolean {
        if (GameConfig.debugMode > 0) {
            return true;
        }
        return false;
    }

    isRectOverlap(rect1: cc.Rect, rect2: cc.Rect): boolean {
        let interRect = cc.rect();
        rect1.intersection(interRect, rect2);

        if (interRect.width > 0 && interRect.height > 0) {
            return true;
        }

        return false;
    }

    /**
     * 获取满足条件的所有矩阵坐标数组
     * 条件：以矩形左下角为坐标，rowNum*colNum格子范围内无其他布景、坦克、基地
     * @param rowNum 
     * @param colNum 
     */
    getEmptyMatrixArray(rowNum, colNum): GameStruct.RcInfo[] {
        let checkAry: boolean[][] = CommonFunc.createArray(GameDef.GAME_MAP_COL_NUM);
        for (let col = 0; col < GameDef.SCENERYS_NODE_COL_NUM; col++) {
            for (let row = 0; row < GameDef.SCENERYS_NODE_ROW_NUM; row++) {
                checkAry[col][row] = false;
            }
        }

        //排除非空位
        {
            //排除基地
            {
                let homePosAry = this.getRectContainPosArray(GameDef.PLACE_HOMEBASE, 4, 4);
                for (let pos of homePosAry) {
                    checkAry[pos.col][pos.row] = true;
                }
            }

            //排除布景
            {
                for (let i = 0; i < GameDef.SCENERYS_NODE_COL_NUM; i++) {
                    for (let j = 0; j < GameDef.SCENERYS_NODE_ROW_NUM; j++) {
                        if (this._scenerys[i] && this._scenerys[i][j]) {
                            let com = this._scenerys[i][j].getComponent(Scenery);
                            let posAry = com.getSceneryContainPosAry();
                            for (let pos of posAry) {
                                checkAry[pos.col][pos.row] = true;
                            }
                        }
                    }
                }
            }

            //排除坦克
            {
                CommonFunc.travelMap(this._players, (no: number, node: cc.Node) => {
                    let com = node.getComponent(PlayerTank);
                    let posAry = com.getTankContainRcInfoArray();
                    for (let pos of posAry) {
                        checkAry[pos.col][pos.row] = true;
                    }
                });
        

                CommonFunc.travelMap(this._enemys, (id: number, node: cc.Node) => {
                    let com = node.getComponent(EnemyTank);
                    let posAry = com.getTankContainRcInfoArray();
                    for (let pos of posAry) {
                        checkAry[pos.col][pos.row] = true;
                    }
                });
        
            }
        }

        let retAry:GameStruct.RcInfo[] = [];
        let propUnitNum = 4;

        let isEmptyPos = (col: number, row: number): boolean => {
            for (let i = 0; i < propUnitNum; i++) {
                for (let j = 0; j < propUnitNum; j++) {
                    if (checkAry[col + i][row + j]) {
                        return false;
                    }
                }
            }

            return true;
        };

        for (let col = 0; col <= GameDef.GAME_MAP_COL_NUM - propUnitNum; col++) {
            for (let row = 0; row <= GameDef.GAME_MAP_ROW_NUM - propUnitNum; row++) {
                if (isEmptyPos(col, row)) {
                    retAry.push(new GameStruct.RcInfo(col, row));
                }
            }
        }

        return retAry;
    }
}
export default new GameDataModel();
