import AudioModel from "../model/AudioModel";

export default class CommonFunc {
    static copyObject(object): any {
        return JSON.parse(JSON.stringify(object));
    }

    static playButtonSound() {
        AudioModel.playSound("sound/btn_click");
    }

    static isBitSet(srcBit, dstBit): boolean {
        if ((srcBit & dstBit) === dstBit) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * 生成多维数组，没有参数时生层空一维数组，每多一个参数增加一个维度。
     * @param arg 
     */
    static createArray(...arg: number[]) {
        let ret: any = [];
        let arrays: any[][] = [];
        arrays.push(ret);
        for (let num of arg) {
            if (num > 0) {
                let temp = [];
                for (let array of arrays) {
                    for (let i = 0; i < num; i++) {
                        array.push([]);
                        temp.push(array[i]);
                    }
                }
                arrays = temp;
            }
            else {
                break;
            }
        }
        return ret;
    }
}