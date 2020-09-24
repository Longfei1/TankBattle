
class ModelManager {
    _models: any[] = [];
    _bInit: boolean = false;

    pushModel(model) {
        this._models.push(model);
    }

    initModels() {
        if (!this._bInit) {
            for (let model of this._models) {
                model.initModel();
            }
            this._bInit = true;
        }
    }
}

export default new ModelManager();