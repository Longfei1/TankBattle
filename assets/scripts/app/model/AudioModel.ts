import { GameStruct } from "../define/GameStruct";
import BaseModel from "./BaseModel";

class AudioModel extends BaseModel{
    playMusic(srcPath: string, loop = true) {
        cc.loader.loadRes(srcPath, (error, clip) =>{
            if(!error) {
                cc.audioEngine.playMusic(clip, loop);
            }
        });
    }

    stopMusic() {
        cc.audioEngine.stopMusic();
    }

    playSound(srcPath: string, loop = false): GameStruct.AudioInfo {
        let info: GameStruct.AudioInfo = {audioID: null};
        cc.loader.loadRes(srcPath, (error, clip) => {
            if (!error) {
                info.audioID = cc.audioEngine.playEffect(clip, loop);
            }
        });
        return info;
    }

    stopSound(info: GameStruct.AudioInfo) {
        if (info != null && info.audioID != null) {
            cc.audioEngine.stopEffect(info.audioID);
        }
    }
}

export default new AudioModel();