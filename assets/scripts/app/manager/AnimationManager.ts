import { gameController } from "../component/game/Game";
import { EventDef } from "../define/EventDef";
import { GameStruct } from "../define/GameStruct";
import { GameDef } from "../define/GameDef";
import { AniDef } from "../define/AniDef";
import UniqueIdGenerator from "../common/UniqueIdGenerator";
import CommonFunc from "../common/CommonFunc";
import GameDataModel from "../model/GameDataModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AnimationManager extends cc.Component {
    @property({ displayName: "单元动画预制体", type: [cc.Prefab], tooltip: "顺序与动画枚举顺序一致" })
    pfbUnitAniArray: cc.Prefab[] = [];

    @property({ displayName: "场景动画预制体", type: [cc.Prefab], tooltip: "顺序与动画枚举顺序一致" })
    pfbSceneAniArray: cc.Prefab[] = [];

    @property({ displayName: "场景中心节点", type: cc.Node})
    nodeBoxCenter: cc.Node = null; 

    _idGenerator: UniqueIdGenerator = new UniqueIdGenerator()
    _aniCallback: { [id: number]: GameStruct.AniCallback} = {};

    onLoad () {
        this.initMembers()

        if (!GameDataModel.isModeEditMap()) {
            gameController.node.on(EventDef.EV_UNITANI_PLAY, this.playUnitAni, this);
            gameController.node.on(EventDef.EV_SCENEANI_PLAY, this.playSceneAni, this);
            gameController.node.on(EventDef.EV_ANI_STOP, this.stopAnimation, this);

            gameController.node.on(EventDef.EV_GAME_ENDED, this.evGameEnd, this);

            //gameController.node.on(EventDef.EV_GAME_PAUSE, this.evGamePause, this);
            //gameController.node.on(EventDef.EV_GAME_RESUME, this.evGameResume, this);

            gameController.node.on(EventDef.EV_ANI_PAUSE, this.evPauseAni, this);
            gameController.node.on(EventDef.EV_ANI_RESUME, this.evResumeAni, this);
        }
    }

    onDestroy() {
        //this.unscheduleAllCallbacks();
    }

    initMembers() {
        this._idGenerator.reset();
        this._aniCallback = {};
    }

    addAniCallback(info: GameStruct.AniCallback) {
        if (info) {
            let aniID = this._idGenerator.generateID();
            if (aniID != null) {
                this._aniCallback[aniID] = info;
                return aniID;
            }
            else {
                console.error("[AnimationManager] Generate AniID Failed!");
            }
        }
    }

    removeAniCallback(aniID) {
        if (this._aniCallback[aniID]) {
            delete this._aniCallback[aniID];
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

        if (param && param.pos) {
            nodeAni.setPosition(param.pos);
        }

        let animation = nodeAni.getComponent(cc.Animation);
        //动画需要有默认的clip
        if (animation) {
            let aniID: number;
            let scheduleFunc;
            let pause = false;

            aniID = this.addAniCallback({
                stopFunction: () => {
                    if (scheduleFunc) {
                        this.unschedule(scheduleFunc);
                    }

                    if (cc.isValid(nodeAni)) {
                        nodeAni.stopAllActions();
                        nodeAni.destroy();
                    }
                },
                pauseFunction: () => {
                    pause = true;
                    animation.pause();
                },
                resumeFunction: () => {
                    pause = false;
                    animation.resume();
                }
            });

            if (mode === AniDef.UnitAniMode.ONCE) {
                animation.on("finished", (event) => {
                    this.stopUnitAni(aniID);
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
                //这个模式下动画用循环播放模式，然后根据时间停止播放, 精度0.1s
                let totalTime = 0; let interval = 0.1;
                scheduleFunc = () => {
                    if (!pause) {
                        totalTime += interval;
                        if (totalTime > time) {
                            this.stopUnitAni(aniID);
                            if (typeof (endCallback) === "function") {
                                endCallback();
                            }
                        }
                    }
                }

                this.schedule(scheduleFunc, interval, cc.macro.REPEAT_FOREVER);
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
        if (this._aniCallback[aniID]) {
            this._aniCallback[aniID].stopFunction();
            this.removeAniCallback(aniID);
        }
    }

    pauseAnimation(aniID: number) {
        if (this._aniCallback[aniID]) {
            this._aniCallback[aniID].pauseFunction();
        }
    }

    resumeAnimation(aniID: number) {
        if (this._aniCallback[aniID]) {
            this._aniCallback[aniID].resumeFunction();
        }
    }

    playSceneAni(info: GameStruct.AniInfo) {
        if (!info) {
            return;
        }

        if (this.pfbSceneAniArray[info.type]) {
            info.aniID = this.playPrefabAni(
                this.nodeBoxCenter,
                this.pfbSceneAniArray[info.type],
                info.mode,
                info.time,
                info.param,
                info.startCallback,
                info.endCallback
            );
        }
    }

    stopAllAnimation() {
        CommonFunc.travelMap(this._aniCallback, (id:number , callbacks: GameStruct.AniCallback) => {
            callbacks.stopFunction();
            this._idGenerator.returnID(id);
        });

        this._aniCallback = {};
    }

    pauseAllAnimation() {
        CommonFunc.travelMap(this._aniCallback, (id: number, callbacks: GameStruct.AniCallback) => {
            callbacks.pauseFunction();
        });
    }

    resumeAllAnimation() {
        CommonFunc.travelMap(this._aniCallback, (id: number, callbacks: GameStruct.AniCallback) => {
            callbacks.resumeFunction();
        });

    }

    evGameEnd() {
        this.stopAllAnimation();
    }

    evGamePause() {
        this.pauseAllAnimation();
    }

    evGameResume() {
        this.resumeAllAnimation();
    }

    evPauseAni(aniID: number) {
        this.pauseAnimation(aniID);
    }

    evResumeAni(aniID: number) {
        this.resumeAnimation(aniID);
    }
}