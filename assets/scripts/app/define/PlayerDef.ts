export namespace PlayerDef {
    export const KEYMAP_PLAYER1 = {
        UP: cc.macro.KEY.w,
        LEFT: cc.macro.KEY.a,
        DOWN: cc.macro.KEY.s,
        RIGHT: cc.macro.KEY.d,
        OK: cc.macro.KEY.j,
        CANCEL: cc.macro.KEY.k
    };

    export const KEYMAP_PLAYER2 = {
        UP: cc.macro.KEY.up,
        LEFT: cc.macro.KEY.left,
        DOWN: cc.macro.KEY.down,
        RIGHT: cc.macro.KEY.right,
        OK: cc.macro.KEY.num1,
        CANCEL: cc.macro.KEY.num2
    };

    export const KEYMAP_COMMON = {
        START: cc.macro.KEY.enter,
        BACK: cc.macro.KEY.escape,
        SAVE: cc.macro.KEY.space,
    };

}
