import Emitter from "../common/Emitter";
import ModelManager from "../manager/ModelManager";

export default class BaseModel extends Emitter {

    constructor() {
        super();
        ModelManager.pushModel(this);
    }

    public initModel() {

    }
}
