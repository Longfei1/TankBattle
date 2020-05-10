
class ModelManager {
    _models: any[] = [];

    pushModel(model) {
        this._models.push(model);
    }

    initModels() {
        for (let model of this._models) {
             model.initModel();
        }
    }
}

export default new ModelManager();