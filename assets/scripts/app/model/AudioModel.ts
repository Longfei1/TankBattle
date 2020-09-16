import BaseModel from "./BaseModel";

class AudioModel extends BaseModel{
    playMusic(srcPath: string) {
        cc.loader.loadRes(srcPath, (error, clip) =>{
            if(!error) {
                cc.audioEngine.playMusic(clip, true);
            }
        });
    }

    stopMusic() {
        cc.audioEngine.stopMusic();
    }

    playSound(srcPath: string) {
        cc.loader.loadRes(srcPath, (error, clip) => {
            if (!error) {
                cc.audioEngine.playEffect(clip, false);
            }
        });
    }
}

export default new AudioModel();