import GameDataModel from "../model/GameDataModel";
import EnemyTank from "../component/game/tank/EnemyTank";
import NodePool from "../common/NodePool";
import UniqueIdGenerator from "../common/UniqueIdGenerator";
import { gameController } from "../component/game/Game";
import { EventDef } from "../define/EventDef";
import GameConfigModel from "../model/GameConfigModel";
import { GameStruct } from "../define/GameStruct";
import CommonFunc from "../common/CommonFunc";
import { GameDef } from "../define/GameDef";

const ENEMY_ADD_INTERVAL = 1; //秒
const ENEMY_BEHAVIOR_INTERVAL = 1; //秒

const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyManager extends cc.Component {
    @property({ displayName: "游戏层", type: cc.Node })
    panelGame: cc.Node = null;

    @property({ displayName: "坦克预制体", type: cc.Prefab })
    pfbEnemy: cc.Prefab = null;

    _idGenerator: UniqueIdGenerator = new UniqueIdGenerator(100, 11); //10以内的id预留给玩家使用

    _enemyTanks: { [id: number]: EnemyTank } = {};
    _enemyPool: NodePool = null;

    _diffcultyData = null;

    _bornPlaceIndex: number = 0;

    onLoad() {
        this.initListenner();

        this._enemyPool = new NodePool(this.pfbEnemy, EnemyTank);
    }

    onDestroy() {
        //this.removeTimers();

        this._enemyPool.clearNode();
    }

    initListenner() {
        gameController.node.on(EventDef.EV_GAME_PREPARE_GAME, this.evPrepareGame, this);
        gameController.node.on(EventDef.EV_GAME_STARTED, this.evGameStarted, this);
        gameController.node.on(EventDef.EV_GAME_ENDED, this.evGameEnded, this);
        gameController.node.on(EventDef.EV_ENEMY_DEAD, this.evEnemyDead, this);
        gameController.node.on(EventDef.EV_GAME_REDUCE_BULLET, this.evReduceBullet, this);

        gameController.node.on(EventDef.EV_GAME_PAUSE, this.evGamePause, this);
        gameController.node.on(EventDef.EV_GAME_RESUME, this.evGameResume, this);

        gameController.node.on(EventDef.EV_PROP_BOMB, this.evPropBomb, this);
    }

    removeListener() {

    }

    reset() {
        this._idGenerator.reset();
        this._diffcultyData = null;
        this._bornPlaceIndex = 0;

        this.resetEnemy();
        GameDataModel.resetPlayerShootNum();
        GameDataModel._propDestroyEnemyNum = 0;
    }

    resetEnemy() {
        CommonFunc.travelMap(this._enemyTanks, (id:number, enemy: EnemyTank) => {
            if (cc.isValid(enemy.node)) {
                this._enemyPool.putNode(enemy.node);
            }
        })

        this._enemyTanks = {};
        GameDataModel.clearEnemyTank();
    }

    evPrepareGame() {
        this.reset();
    }

    evGameStarted() {
        let stage = GameDataModel._currStage;
        //读取本关卡难度数据
        this._diffcultyData = GameConfigModel.stageData.DifficultyData[stage - 1];

        //游戏开始，生成敌方坦克
        let initNum = 3;
        for (let i = 0; i < initNum; i++) {
            this.addOneEnemy();
        }

        this.createTimers();
    }

    evGameEnded() {
        this.removeTimers();
    }

    evEnemyDead(id : number) {
        this.destroyEnemyTank(id);
        if (this._enemyTanks[id] && this._enemyTanks[id]._destroyedBy >= 0) {
            GameDataModel.addPlayerShootNum(this._enemyTanks[id]._destroyedBy, this._enemyTanks[id]._tankName);
        }

        //生成新的敌人
        if (this.isNeedCreateEnemy()) {
            this.addOneEnemy();
        }

        if (this.isGameEnd()) {
            gameController.gameEnd();
        }
    }

    evReduceBullet(id: number) {
        if (this._enemyTanks[id]) {
            this._enemyTanks[id].onShootHited();
        }
    }

    evGamePause() {
        this.removeTimers();
    }

    evGameResume() {
        this.createTimers();
    }

    evPropBomb(playerNO: number) {
        //销毁全部敌军
        CommonFunc.travelMap(this._enemyTanks, (id:number, enemy: EnemyTank) => {
            GameDataModel._propDestroyEnemyNum++;
            enemy.dead(); 
        })
    }

    createEnemyTank(name: string, pos: GameStruct.RcInfo, bRed = false) {
        let tank = this._enemyPool.getNode();
        this.panelGame.addChild(tank);
        let com = tank.getComponent(EnemyTank);
        let tankData = GameConfigModel.tankData;
        com.reset();
        com.id = this._idGenerator.generateID();
        com.setAttributes(tankData[name]);
        com.setRed(bRed);
        com.setPosition(pos);
        com.setMoveDirction(GameDef.DIRECTION_DOWN); 

        this._enemyTanks[com.id] = com;
        GameDataModel.setEnemyTank(tank);

        com.born();
    }

    destroyEnemyTank(id: number) {
        if (this._enemyTanks[id]) {
            this._enemyPool.putNode(this._enemyTanks[id].node);
            delete this._enemyTanks[id];
            GameDataModel.removeEnemyTank(id);
        }
    }

    //获取下次生成的坦克类型
    getNextTankName(): string {
        //先简单处理，使用随机类型。后续可通过设置关卡难度，设置不同坦克的数量。
        return CommonFunc.getRandomArrayValue(GameDef.EnemyTankNames);
    }

    //获取下次生成的坦克位置
    getNextTankPositon(): GameStruct.RcInfo {
        const index2pos = [
            GameDef.BORN_PLACE_ENAMY1,
            GameDef.BORN_PLACE_ENAMY2,
            GameDef.BORN_PLACE_ENAMY3,
        ]

        //依次寻找可用的出生位置
        for (let i = 0; i < GameDef.ENEMY_BORN_PLACE_COUNT; i++) {
            let rc = index2pos[this._bornPlaceIndex];
            this.incBornPlaceIndex();

            let pos = GameDataModel.matrixToScenePosition(rc);
            let tankWidth = GameDataModel.getTankWidth();
            let bornArea: cc.Rect = cc.rect(pos.x, pos.y, tankWidth, tankWidth);
            if (!GameDataModel.hasTankInRect(bornArea)) {
                return rc;
            }
        }

        return null;
    }

    //获取下次生成的坦克是否为红色
    getNextTankRed(): boolean {
        //先简单处理，使用随机类型。后续可通过设置关卡难度，设置复杂情况。
        return CommonFunc.isInProbability(0.3);
    }

    incBornPlaceIndex() {
        this._bornPlaceIndex++;
        if (this._bornPlaceIndex >= GameDef.ENEMY_BORN_PLACE_COUNT) {
            this._bornPlaceIndex = 0;
        }
    }

    //添加一名敌军坦克
    addOneEnemy() {
        let tankName = this.getNextTankName();
        let pos = this.getNextTankPositon();
        let bRed = this.getNextTankRed();

        if (tankName && pos) {
            this.createEnemyTank(tankName, pos, bRed);

            gameController.node.emit(EventDef.EV_DISPLAY_UPDATE_ENEMY_LIFE);
        }
    }

    isNeedCreateEnemy(): boolean {
        let aliveNum = GameDataModel.getEnemyAliveNum();
        if (!GameDataModel._gamePause
            && (aliveNum < this._diffcultyData["EnemyMaxAliveNum"])
            && (GameDataModel.getEnemyDeadTotalNum() + aliveNum < this._diffcultyData["EnemyTotalNum"])) {
            return true;
        }
        return false;
    }

    isGameEnd() {
        if (GameDataModel.getEnemyDeadTotalNum() >= this._diffcultyData["EnemyTotalNum"]) {
            return true;
        }

        return false;
    }

    createTimers() {
        this.removeTimers();

        this.createEnemyAddTimer();
        this.createEnemyBehaviorTimer();
    }

    removeTimers() {
        this.unscheduleAllCallbacks();
    }

    createEnemyAddTimer() {
        this.schedule(this.onEnemyAddTimer, ENEMY_ADD_INTERVAL);
    }

    onEnemyAddTimer() {
        //尝试生成一名敌人
        if (this.isNeedCreateEnemy()) {
            this.addOneEnemy();
        }
    }

    createEnemyBehaviorTimer() {
        this.schedule(this.onEnemyBehaviorTimer, ENEMY_BEHAVIOR_INTERVAL);
    }

    onEnemyBehaviorTimer() {
        CommonFunc.travelMap(this._enemyTanks, (id: number, enemy: EnemyTank) => {
            if (cc.isValid(enemy.node)) {
                enemy.onBehaviorTimer();
            }
        })
    }
}