import BattleTank from "./BattleTank";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyTank extends BattleTank {


    _no: number = -1;

    //编号
    setNo(no: number) {
       this._no = no; 
    }

    getNo() {
        return this._no;
    }
}