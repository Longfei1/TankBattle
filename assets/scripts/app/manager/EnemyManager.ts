import GameDataModel from "../model/GameDataModel";
import EnemyTank from "../component/game/tank/EnemyTank";
import NodePool from "../common/NodePool";
import UniqueIdGenerator from "../common/UniqueIdGenerator";
import { gameController } from "../component/game/Game";
import { EventDef } from "../define/EventDef";
import GameConfigModel from "../model/GameConfigModel";
import { GameStruct } from "../define/GameStruct";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyManager extends cc.Component {
    @property({ displayName: "游戏层", type: cc.Node })
    panelGame: cc.Node = null;

    @property({ displayName: "坦克预制体", type: cc.Prefab })
    pfbEnemy: cc.Prefab = null;

    _idGenerator: UniqueIdGenerator = new UniqueIdGenerator(100);

    _mapUnit = null
    _enemyTanks: EnemyTank[] = [];
    _enemyPool: NodePool = null;

    _stageData = null;

    onLoad() {
        this.initListenner();
        this._mapUnit = GameDataModel.getMapUnit();

        this._enemyPool = new NodePool(this.pfbEnemy, EnemyTank);
    }

    onDestroy() {

    }

    initListenner() {
        gameController.node.on(EventDef.EV_GAME_STARTED, this.evGameStarted, this);
    }

    removeListener() {

    }

    evGameStarted() {
        //读取本关卡数据
        this._stageData = GameConfigModel.stageData.DifficultyData;

        //游戏开始，生成敌方坦克

    }

    setEnemyTank(pos: GameStruct.RcInfo) {
        let tank = this._enemyPool.getNode();
        this.panelGame.addChild(tank);
        let com = tank.getComponent(EnemyTank);
        let tankData = GameConfigModel.tankData;
        com.setAttributes(tankData["player1"]);
        playerCom1.setTankLevel(1);
        playerCom1.setPosition(GameDef.BORN_PLACE_PLAYER1);
        playerCom1.setMoveDirction(GameDef.DIRECTION_UP);
        this._players[0] = playerCom1;
    }
}