import BaseModel from "./BaseModel";

class GameConfigModel extends BaseModel {
    private _stageData = null;
    private _tankData = null;

    initModel() {
        super.initModel();
        this.loadLocalConfig();
    }

    loadLocalConfig() {
        this.loadStageData();
        this.loadTankData();
    }

    loadStageData() {
        cc.loader.loadRes("data/StageData", cc.JsonAsset, (error, resource) => {
            if (error) {
                console.error("StageData读取错误", resource);
                console.log(error);
            } else {
                console.log("StageData读取成功", resource);
                this._stageData = resource.json;
            }
        });
    }

    loadTankData() {
        cc.loader.loadRes("data/TankData", cc.JsonAsset, (error, resource) => {
            if (error) {
                console.error("StageData读取错误", resource);
                console.log(error);
            } else {
                console.log("StageData读取成功", resource);
                this._tankData = resource.json;
            }
        });
    }

    isAllDataLoaded() {
        if (this._stageData && this._tankData) {
            return true;
        }
        return false;
    }

    get stageData() {
        return this._stageData;
    }

    get tankData() {
        return this._tankData;
    }

    getTotalStage(): number {
        if (this._stageData) {
            return this._stageData["MapData"].length;
        }
        return 0;
    }
}

export default new GameConfigModel();