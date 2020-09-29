import CommonFunc from "../common/CommonFunc";
import { GameDef } from "../define/GameDef";
import BaseModel from "./BaseModel";

class GameConfigModel extends BaseModel {
    private _mapData = {};
    private _tankData = null;
    private _difficultyData = {};

    initModel() {
        super.initModel();
        this.loadLocalConfig();
    }

    loadLocalConfig() {
        this.loadMapData();
        this.loadTankData();
        this.loadDifficultyData();
    }

    loadMapData() {
        for (let i = 1; i <= GameDef.GAME_TOTAL_STAGE; i++) {
            this.loadStageMap(i);
        }
    }

    loadTankData() {
        cc.loader.loadRes("data/TankData", cc.JsonAsset, (error, resource) => {
            if (error) {
                console.error("TankData读取错误", resource);
                console.log(error);
            } else {
                console.log("TankData读取成功", resource);
                this._tankData = resource.json;
            }
        });
    }

    loadDifficultyData() {
        cc.loader.loadRes("data/DifficultyData", cc.JsonAsset, (error, resource) => {
            if (error) {
                console.error("DifficultyData读取错误", resource);
                console.log(error);
            } else {
                console.log("DifficultyData读取成功", resource);
                this._difficultyData = resource.json;
            }
        });
    }

    loadStageMap(stage: number) {
        cc.loader.loadRes(`data/mapdata/${stage}`, cc.JsonAsset, (error, resource) => {
            if (error) {
                console.error(`MapData ${stage} 读取错误`, resource);
                console.log(error);
            } else {
                console.log(`MapData ${stage} 读取成功`, resource);
                this._mapData[stage] = resource.json;
            }
        });
    }

    isAllDataLoaded() {
        if (!this._tankData) {
            return false;
        }

        if (CommonFunc.getMapSize(this._mapData) < GameDef.GAME_TOTAL_STAGE) {
            return false;
        }

        if (CommonFunc.getMapSize(this._difficultyData < GameDef.GAME_TOTAL_STAGE)) {
            return false;
        }

        return true;
    }

    get mapData() {
        return this._mapData;
    }

    get tankData() {
        return this._tankData;
    }

    get difficultyData() {
        return this._difficultyData;
    }

    getMapData(stage: number) {
        return this._mapData[stage];
    }

    getDifficultyData(stage: number) {
        return this._difficultyData[stage.toString()];
    }
}

export default new GameConfigModel();