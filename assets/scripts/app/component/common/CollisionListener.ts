const { ccclass, property } = cc._decorator;

@ccclass
export default class CollisionListener extends cc.Component {
    @property({ displayName: "根节点", type: cc.Node })
    nodeRoot = null; 

    @property({ displayName: "Enter", type: cc.Component.EventHandler})
    handlerEnter: cc.Component.EventHandler = null;

    @property({ displayName: "Stay", type: cc.Button.EventHandler })
    handlerStay: cc.Component.EventHandler = null;
    
    @property({ displayName: "Exit", type: cc.Button.EventHandler })
    handlerExit: cc.Component.EventHandler = null;

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        if (this.handlerEnter) {
            this.handlerEnter.emit([this.nodeRoot, other, self]);
        }
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider) {
        if (this.handlerStay) {
            this.handlerStay.emit([this.nodeRoot, other, self]);
        }
    }

    onCollisionExit(other: cc.Collider, self: cc.Collider) {
        if (this.handlerExit) {
            this.handlerExit.emit([this.nodeRoot, other, self]);
        }
    }
}
