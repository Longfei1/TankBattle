const { ccclass, property } = cc._decorator;

@ccclass
export default class BaseAni extends cc.Component {
    _param: any = {}

    setParam(param) {
        if (param) {
            this._param = param;
        }
    }
}