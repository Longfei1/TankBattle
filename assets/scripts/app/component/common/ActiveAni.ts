const {ccclass, property} = cc._decorator;

@ccclass
export default class ActiveAni extends cc.Component {
    @property({ displayName: "ActiveAni"})  
    strActiveAni: string = "";
    onLoad() {
        this.node.on("active-in-hierarchy-changed", (node: cc.Node) => {
            let animation = this.node.getComponent(cc.Animation);
            animation.play(this.strActiveAni);
        });
    }
}
