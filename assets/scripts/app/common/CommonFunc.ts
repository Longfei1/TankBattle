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

    /**
     * 生成区间内的随机整数，包含上下限
     * @param min 
     * @param max 
     */
    static getRandomInteger(min, max): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getRandomArrayValue(ary: any[]): any {
        let selectIndex = this.getRandomInteger(0, ary.length - 1);
        return ary[selectIndex];
    }

    /**
     * 是否触发给定概率
     * @param rate 0-1的概率
     */
    static isInProbability(rate: number): boolean {
        if (Math.random() < rate) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * 遍历map
     * @param map 
     * @param travelFunc 遍历方法，返回值为true退出循环
     */
    static travelMap(map, travelFunc) {
        if (map) {
            for (let key of Object.keys(map)) {
                if (travelFunc(key, map[key])) {
                    break;
                }
            }
        }
    }

    /**
     * 获取map的大小
     * @param map 
     */
    static getMapSize(map) {
        if (map) {
            return Object.keys(map).length;
        }
        
        return 0;
    }

    /**
     * 删除源数组中与给定的值相等的元素
     * @param srcAry 源数组
     * @param filterValues 包含删除值的数组
     */
    static filterArray(srcAry: any[], filterValues: any[]) {
        for(let i = srcAry.length - 1; i >= 0; i--) {
            for (let value of filterValues) {
                if (srcAry[i] === value) {
                    srcAry.splice(i, 1);
                }
            }
        }
    }
}