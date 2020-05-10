import { GameStruct } from "./GameStruct";


export namespace GameDef {
    //游戏模式
    export const GAMEMODE_SINGLE_PLAYER         = 0;
    export const GAMEMODE_DOUBLE_PLAYER         = 1;
    export const GAMEMODE_MAP_EDIT              = 2;

    //运动方向
    export const DIRECTION_UP                   = 0;
    export const DIRECTION_LEFT                 = 1;
    export const DIRECTION_DOWN                 = 2;
    export const DIRECTION_RIGHT                = 3;

    //游戏地图
    export const GAME_MAP_ROW_NUM               = 32; //地图矩阵 行数(y)
    export const GAME_MAP_COL_NUM               = 52; //地图矩阵 列数(x)
    export const BORN_PLACE_PLAYER1             = new GameStruct.RcInfo(21, 0); //玩家出生坐标
    export const BORN_PLACE_PLAYER2             = new GameStruct.RcInfo(29, 0); //玩家出生坐标
    export const PLACE_HOMEBASE                 = new GameStruct.RcInfo(25, 0); //基地所在坐标

    //节点分组
    export const GROUP_NAME_TANK                = "tank";
    export const GROUP_NAME_SCENERY             = "scenery";
    export const GROUP_NAME_BULLET              = "bullet";
    export const GROUP_NAME_BOUNDARY            = "boundary";

    //坦克增益buff
    export const BUFF_INVINCIBLE                = 0x0001; //无敌

    //时效
    export const BORN_INVINCIBLE_TIME           = 3;  //出生无敌时间
    export const SHIELD_INVINCIBLE_TIME         = 10; //护盾无敌时间

    //其他
    export const TANK_MOVE_MIN_VALUE            = 10; //坦克最小移动量（像素）
    export const TANK_MOVE_INTERVAL_FRAMES      = 3; //移动图片变化的间隔帧数

    export enum SceneryType {
        NULL,   //无
        WALL,   //土墙
        WATER,  //水
        GRASS,  //草地
        STEEL   //钢
    } 

    //资源原因，现没有特殊子弹
    export enum BulletType {
        COMMON,
    }

    export enum TeamType {
        PLAYER,
        ENEMY,
    }
}