export namespace AniDef {
    export enum UnitAniMode {
        ONCE,       //单次
        TIMELIMIT,  //限时
        LOOP,       //循环播放（永久）
    }

    export enum UnitAniType {
        BORN,     //出生
        SHIELD,   //护罩
        BLAST,    //爆炸
        SPADE_EFFECT_DISAPPEAR, //铲子效果消失动画
    }

    export enum SceneAniType {
        GAME_START,    //游戏开始
    }
}