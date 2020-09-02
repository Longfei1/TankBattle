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
    export const GAME_MAP_ROW_NUM               = 64; //地图矩阵 行数(y)
    export const GAME_MAP_COL_NUM               = 104; //地图矩阵 列数(x)
    export const SCENERY_CONTAINS_RC            = 2; //一个节点占2格，两行两列
    export const SCENERYS_NODE_ROW_NUM          = GAME_MAP_ROW_NUM/SCENERY_CONTAINS_RC; //地图布景节点行数
    export const SCENERYS_NODE_COL_NUM          = GAME_MAP_COL_NUM/SCENERY_CONTAINS_RC; //地图布景节点列数
    export const BORN_PLACE_PLAYER1             = new GameStruct.RcInfo(42, 0); //玩家出生坐标
    export const BORN_PLACE_PLAYER2             = new GameStruct.RcInfo(58, 0); //玩家出生坐标
    export const PLACE_HOMEBASE                 = new GameStruct.RcInfo(50, 0); //基地所在坐标
    export const BORN_PLACE_ENAMY1              = new GameStruct.RcInfo(0, 60); //敌军出生坐标1
    export const BORN_PLACE_ENAMY2              = new GameStruct.RcInfo(50, 60); //敌军出生坐标2
    export const BORN_PLACE_ENAMY3              = new GameStruct.RcInfo(100, 60); //敌军出生坐标3

    export const ENEMY_BORN_PLACE_COUNT         = 3; //敌军出生位置数量

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

    //子弹威力
    export const BULLET_POWER_LEVEL_COMMON      = 1; //普通威力,可击毁一层土墙
    export const BULLET_POWER_LEVEL_STELL       = 2; //可销毁钢墙,两层土墙

    //其他
    export const TANK_MOVE_MIN_VALUE            = 10; //坦克最小移动量（像素）
    export const TANK_MOVE_INTERVAL_FRAMES      = 3; //移动图片变化的间隔帧数
    export const GAME_FPS                       = 60;

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