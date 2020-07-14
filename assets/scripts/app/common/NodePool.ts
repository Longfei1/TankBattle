
/**
 * 节点缓冲池，大小不固定
 */
export default class NodePool {
    private _pool: cc.NodePool = null;
    private _prefab: cc.Prefab= null;
    constructor(prefab: cc.Prefab, handlerComp: string | {prototype: cc.Component}) {
        this._prefab = prefab;
        this._pool = new cc.NodePool(handlerComp);
    }

    getNode(...params): cc.Node {
        let node = this._pool.get(...params);
        if (!node) {
            node = cc.instantiate(this._prefab);
        }
        return node;
    }

    putNode(node: cc.Node,) {
        if (cc.isValid(node)) {
            this._pool.put(node);
        }
    }

    clearNode() {
        this._pool.clear();
    }
}