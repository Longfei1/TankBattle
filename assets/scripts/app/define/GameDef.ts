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
    export const GROUP_HOME_BASE                = "homebase";
    export const GROUP_NAME_PROP                = "prop";

    //坦克增益buff
    export const TANK_BUFF_INVINCIBLE           = 0x0001; //无敌

    //道具buff
    export const PROP_BUFF_STATIC               = 0x0001; //静止
    export const PROP_BUFF_HOME_PROTECT         = 0x0002; //基地保护

    //时效
    export const BORN_INVINCIBLE_TIME           = 2; //出生无敌时间
    export const PROP_SHOW_TIME                 = 15; //道具显示时间
    export const PROP_SHIELD_INVINCIBLE_TIME    = 15; //护盾无敌时间
    export const PROP_CLOCK_TIME                = 12; //定时道具持续时长
    export const PROP_SPADE_TIME                = 15; //铲子道具持续时长
    export const PROP_SPADE_EFFECT_DISAPPEAR_TIME = 5;  //铲子道具消失倒计时
    export const TANK_SHOOT_COOLTIME            = 0.2; //坦克射击冷却时间

    //子弹威力\
    export const BULLET_POWER_LEVEL_COMMON      = 1; //普通威力,可击毁一层土墙
    export const BULLET_POWER_LEVEL_STELL       = 2; //可销毁钢墙,两层土墙

    //其他
    export const TANK_MOVE_MIN_VALUE            = 10; //坦克最小移动量（像素）
    export const TANK_MOVE_INTERVAL_FRAMES      = 3; //移动图片变化的间隔帧数
    export const GAME_FPS                       = 60;
    export const PLAYER_LEVEL_PROTECT_ONCE_DEAD = 4; //玩家坦克可以抵挡一次死亡的等级
    export const PLAYER_LIFE_NUM                = 2; //玩家初始生命数量
    export const PROP_BONUS_SCORE               = 500; //道具奖励得分
    export const GAME_TOTAL_STAGE               = 20; //总关卡数

    //游戏元素层级
    export const ZINDEX_BATTLE_TANK             = 500;
    export const ZINDEX_HOMEBASE                = cc.macro.MAX_ZINDEX;
    export const ZINDEX_MAP_EDIT_TANK           = cc.macro.MAX_ZINDEX;
    export const ZINDEX_BULLET                  = 500;
    export const ZINDEX_SCENERY_WALL            = 500;
    export const ZINDEX_SCENERY_WATER           = 400;
    export const ZINDEX_SCENERY_STEEL           = 500;
    export const ZINDEX_SCENERY_ICE             = 400;
    export const ZINDEX_SCENERY_GRASS           = 600;

    //敌军坦克名字
    export const EnemyTankNames = [
        "LightTank",
        "RapidMoveTank",
        "RapidFireTank",
        "HeavyTank",
    ];

    //敌军坦克击毁得分
    export const EnemyTankScore = {
        "LightTank": 100,
        "RapidMoveTank": 200,
        "RapidFireTank": 200,
        "HeavyTank":400,
    };

    export enum SceneryType {
        NULL,   //无
        WALL,   //土墙
        WATER,  //水
        GRASS,  //草地
        STEEL,  //钢
        ICE,    //冰
    } 

    //资源原因，现没有特殊子弹
    export enum BulletType {
        COMMON,
    }

    export enum TeamType {
        PLAYER,
        ENEMY,
    }

    export enum PropType {
        BOMB,       //炸弹
        CLOCK,      //定时
        HELMET,     //头盔
        SPADE,      //铲子
        STAR,       //五角心
        TANK,       //坦克
        GUN,        //手枪
    }
}