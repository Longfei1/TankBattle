/**
 * 唯一ID生层工具
 */
export default class UniqueIdGenerator {
    private _idMap = {};
    private _maxSize = 10000;
    private _currID = 0;
    private _startIndex = 0;

    constructor(maxSize = 10000, start = 0) {
        this.reset(maxSize, start);
    }

    /**
     * 生成ID
     */
    generateID() {
        let id = null;
        for (let i = 0; i < this._maxSize; i++) {
            if (this._idMap[this._currID]) {
                this.IncID();
            }
            else {
                id = this._currID;
                break;
            }
        }
        return id;
    }

    /**
     * 归还指定ID给生成器
     */
    returnID(id: number) {
        if (this._idMap[id]) {
            this._idMap[id] = null;
        }
    }

    reset(maxSize?: number, start?: number) {
        this._idMap = {}
        this._maxSize = maxSize != null ? maxSize : this._maxSize;
        this._startIndex = start != null ? start : this._startIndex;
        this._currID = this._startIndex;
    }

    private IncID() {
        this._currID++;
        if (this._currID >= this._startIndex + this._maxSize) {
            this._currID -= this._maxSize;
        }
    }
}