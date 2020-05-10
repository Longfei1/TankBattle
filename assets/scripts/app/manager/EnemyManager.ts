import GameDataModel from "../model/GameDataModel";
import EnemyTank from "../component/game/tank/EnemyTank";
import NodePool from "../common/NodePool";
import UniqueIdGenerator from "../common/UniqueIdGenerator";

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

    onLoad() {
        this.initListenner();
        this._mapUnit = GameDataModel.getMapUnit();

        this._enemyPool = new NodePool(this.pfbEnemy, EnemyTank);
    }

    onDestroy() {

    }

    initListenner() {

    }

    removeListener() {

    }
}