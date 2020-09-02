const { ccclass, property } = cc._decorator;

@ccclass
export default class BaseAni extends cc.Component {
    _param: any = {}

    setParam(param) {
        if (param != null) {
            this._param = param;
        }
    }
}