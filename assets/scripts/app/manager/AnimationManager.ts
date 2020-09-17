import { gameController } from "../component/game/Game";
import { EventDef } from "../define/EventDef";
import { GameStruct } from "../define/GameStruct";
import { GameDef } from "../define/GameDef";
import { AniDef } from "../define/AniDef";
import UniqueIdGenerator from "../common/UniqueIdGenerator";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AnimationManager extends cc.Component {
    @property({ displayName: "单元动画预制体", type: [cc.Prefab], tooltip: "顺序与动画枚举顺序一致" })
    pfbUnitAniArray: cc.Prefab[] = [];

    @property({ displayName: "场景动画预制体", type: [cc.Prefab], tooltip: "顺序与动画枚举顺序一致" })
    pfbSceneAniArray: cc.Prefab[] = [];

    @property({ displayName: "场景中心节点", type: cc.Node})
    nodeCenter: cc.Node = null; 

    _idGenerator: UniqueIdGenerator = new UniqueIdGenerator()
    _stopFunction = {};

    onLoad () {
        this.initMembers()

        gameController.node.on(EventDef.EV_UNITANI_PLAY, this.playUnitAni, this);
        gameController.node.on(EventDef.EV_SCENEANI_PLAY, this.playSceneAni, this);
        gameController.node.on(EventDef.EV_ANI_STOP, this.stopAnimation, this);
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
    }

    initMembers() {
        this._idGenerator.reset();
        this._stopFunction = {};
    }

    addStopAniFunction(func) {
        if (typeof(func) === "function") {
            let aniID = this._idGenerator.generateID();
            if (aniID != null) {
                this._stopFunction[aniID] = func;
                return aniID;
            }
            else {
                console.error("[AnimationManager] Generate AniID Failed!");
            }
        }
    }

    removeStopAniFunction(aniID) {
        if (this._stopFunction[aniID]) {
            this._stopFunction[aniID] = null;
        }
        this._idGenerator.returnID(aniID);
    }

    playUnitAni(info: GameStruct.AniInfo) {
        if (!info || !cc.isValid(info.node)) {
            return;
        }

        if (this.pfbUnitAniArray[info.type]) {
            info.aniID = this.playPrefabAni(
                info.node, 
                this.pfbUnitAniArray[info.type], 
                info.mode, 
                info.time, 
                info.param,
                info.startCallback, 
                info.endCallback
            );
        }
    }

    stopUnitAni(aniID: number) {
        this.stopAnimation(aniID);
    }

    playPrefabAni(node: cc.Node, aniPrefab: cc.Prefab, mode: number, time: number, param, startCallback, endCallback): number {
        if (!cc.isValid(node) || !aniPrefab) {
            return;
        }

        let nodeAni = cc.instantiate(aniPrefab);

        if (param && param.scriptName) {
            let com: any = nodeAni.getComponent(param.scriptName);
            if (com && com.setParam) {
                com.setParam(param.params);
            }
        }

        node.addChild(nodeAni);
        let animation = nodeAni.getComponent(cc.Animation);

        //动画需要有默认的clip
        if (animation) {
            let aniID: number;
            let scheduleFunc;

            let stopAni = () => {
                if (scheduleFunc) {
                    this.unschedule(scheduleFunc);
                }
                this.stopUnitAni(aniID);
            }

            aniID = this.addStopAniFunction(() => {
                if (cc.isValid(nodeAni)) {
                    nodeAni.stopAllActions();
                    nodeAni.destroy();
                }
            });

            if (mode === AniDef.UnitAniMode.ONCE) {
                animation.on("finished", (event) => {
                    stopAni();
                    if (typeof (endCallback) === "function") {
                        endCallback();
                    }
                });

                let state = animation.play();
                state.wrapMode = cc.WrapMode.Normal;
                state.repeatCount = 1;
            }
            else if (mode === AniDef.UnitAniMode.LOOP) {
                let state = animation.play();
                state.wrapMode = cc.WrapMode.Loop;
                state.repeatCount = Infinity;
            }
            else if (mode === AniDef.UnitAniMode.TIMELIMIT) {
                //这个模式下动画用循环播放模式，然后根据时间停止播放
                scheduleFunc = () => {
                    stopAni();
                    if (typeof (endCallback) === "function") {
                        endCallback();
                    }
                }
                this.scheduleOnce(scheduleFunc, time ? time : 3);
                let state = animation.play();
                state.wrapMode = cc.WrapMode.Loop;
                state.repeatCount = Infinity;
            }

            if (typeof (startCallback) === "function") {
                startCallback();
            }

            return aniID;
        }
    }

    stopAnimation(aniID: number) {
        if (this._stopFunction[aniID]) {
            this._stopFunction[aniID]();
            this.removeStopAniFunction(aniID);
        }
    }

    playSceneAni(info: GameStruct.AniInfo) {
        if (!info) {
            return;
        }

        if (this.pfbSceneAniArray[info.type]) {
            info.aniID = this.playPrefabAni(
                this.nodeCenter,
                this.pfbSceneAniArray[info.type],
                info.mode,
                info.time,
                info.param,
                info.startCallback,
                info.endCallback
            );
        }
    }
}