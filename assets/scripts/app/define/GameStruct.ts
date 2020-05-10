export namespace GameStruct {
    export class RcInfo {
        col: number;
        row: number;

        constructor(col: number, row: number) {
            this.col = col;
            this.row = row;
        }

        static sum(rcInfo1: RcInfo, rcInfo2: RcInfo): RcInfo {
            return new RcInfo(rcInfo1.col + rcInfo2.col, rcInfo1.row + rcInfo2.row);
        }

        equal(rcInfo: RcInfo) {
            if (rcInfo) {
                if (this.col === rcInfo.col && this.row === rcInfo.row) {
                    return true;
                }
            }
            return false;
        }
    }

    export class TankAttributes {
        name: string;
        tankName: string; 
        team: number;
        maxLevel: number;
        moveSpeed: number;
        bulletSpeed: number;
        bulletType: number;
        shootCooltime: number;
    }

    export class ShootInfo {
        type: number;         //子弹类型，对应不同的资源
        shooterName: string;  //射击者名称
        shooterLevel: number; //射击者等级
        team: number;         //所属队伍
        pos: cc.Vec2;         //起始位置
        direction: number;    //方向
        speed: number;        //速度
    }

    export class AniParam {
        scriptName: string;
        params: any;
    }

    export class AniInfo {
        node: cc.Node;
        mode: number; //动画模式
        type: number;
        time: number; //动画为定时模式时需要持续的时间

        startCallback: Function;  //动画播放回调
        endCallback: Function;    //动画结束回调（正常结束才回调，调用Stop函数不触发）

        aniID: number;            //动画id

        param: AniParam;          //参数，用于初始动画预制体绑定脚本
    }
}