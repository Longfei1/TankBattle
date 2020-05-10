import BaseModel from "./BaseModel";

enum InputMode {
    KEY_DOWN,           //键盘按下
    KEY_UP,             //键盘弹起
    KEY_DOWN_ONCE,      //键盘按键按下时算输入，在弹起后再按下才算做下一次输入
    KEY_DOWN_INTERVAL,  //键盘按键按下后每隔一定时间算作一次输入
}

class GameInputModel extends BaseModel {
    _inputListeners: Observer[] = []

    initModel() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    /**
     * 添加按下一次输入监听
     * @param keyDownCallBack 按下监听回调函数
     * @param keyUpCallBack 弹起监听回调函数
     * @param context 监听上下文
     * @param key 按键值,没有时所有按键都触发
     */
    addKeyDownOnceListener(keyDownCallBack: Function, keyUpCallBack: Function, context: any, key?: cc.macro.KEY) {
        this.addInputListener(InputMode.KEY_DOWN_ONCE, keyDownCallBack, keyUpCallBack, context, key);
    }

    /**
     * 添加按下间隔的输入监听
     * @param keyDownCallBack 按下监听回调函数
     * @param keyUpCallBack 弹起监听回调函数
     * @param context 监听上下文
     * @param key 按键值,没有时所有按键都触发
     * @param interval 间隔时间,单位秒
     */
    addKeyDownIntervalListener(keyDownCallBack: Function, keyUpCallBack: Function, context: any, key?: cc.macro.KEY, interval?: number) {
        this.addInputListener(InputMode.KEY_DOWN_INTERVAL, keyDownCallBack, keyUpCallBack, context, key, interval);
    }

    /**
     * 添加按下输入监听
     * @param keyDownCallBack 按下监听回调函数
     * @param context 监听上下文
     * @param key 按键值,没有时所有按键都触发
     */
    addKeyDownListener(keyDownCallBack: Function, context: any, key?: cc.macro.KEY) {
        this.addInputListener(InputMode.KEY_DOWN, keyDownCallBack, null, context, key);
    }

    /**
     * 添加按键弹起输入监听
     * @param keyUpCallBack 弹起监听回调函数
     * @param context 监听上下文
     * @param key 按键值,没有时所有按键都触发
     */
    addKeyUpListener(keyUpCallBack: Function, context: any, key?: cc.macro.KEY) {
        this.addInputListener(InputMode.KEY_UP, null, keyUpCallBack, context, key);
    }

    /**
     * 移除上下文的所有监听
     * @param context 
     */
    removeInputListenerByContext(context: any) {
        for (let i = this._inputListeners.length - 1; i >= 0; i--) {
            if (this._inputListeners[i].compare(context)) {
                this._inputListeners.splice(i, 1);
            }
        } 
    }

    /**
     * 移除按下一次的按键监听
     * @param context 监听上下文
     * @param key 按键值
     */
    removeKeyDownOnceListener(context: any, key?: cc.macro.KEY) {
        key = key ? key : null;
        this.removeInputListener(key, InputMode.KEY_DOWN_ONCE, context);
    }

    /**
     * 移除按下间隔类型的按键监听
     * @param context 监听上下文
     * @param key 按键值
     */
    removeKeyDownIntervalListener(context: any, key?: cc.macro.KEY) {
        key = key ? key : null;
        this.removeInputListener(key, InputMode.KEY_DOWN_INTERVAL, context);
    }

    /**
     * 移除按下间隔类型的按键监听
     * @param context 监听上下文
     * @param key 按键值
     */
    removeKeyDownListener(context: any, key?: cc.macro.KEY) {
        key = key ? key : null;
        this.removeInputListener(key, InputMode.KEY_DOWN, context);
    }

    /**
     * 移除按下间隔类型的按键监听
     * @param context 监听上下文
     * @param key 按键值
     */
    removeKeyUpListener(context: any, key?: cc.macro.KEY) {
        key = key ? key : null;
        this.removeInputListener(key, InputMode.KEY_UP, context);
    }

    /**
     * 移除一个按键值的监听
     * @param key 按键值
     * @param inputMode 监听模式
     * @param context 监听上下文
     */
    private removeInputListener(key: cc.macro.KEY, inputMode: InputMode, context: any) {
        let observers = this._inputListeners;
        for (let i = observers.length - 1; i >= 0; i--) {
            let observer = observers[i];
            if (observer.compare(context) && key === observer._inputkey && inputMode === observer._inputmode) {
                observers.splice(i, 1);
            }
        }
    }

    /**
     * 添加输入监听
     * @param inputMode 监听模式
     * @param keyDownCallBack 按下监听回调函数
     * @param keyUpCallBack 弹起监听回调函数
     * @param context 监听上下文
     * @param key 按键值,没有时所有按键都触发
     * @param interval 监听间隔模式时,间隔时间,单位秒
     */
    private addInputListener(inputMode: InputMode, keyDownCallBack: Function, keyUpCallBack: Function, context: any, key?: cc.macro.KEY, interval?: number) {
        this._inputListeners.push(new Observer(keyDownCallBack, keyUpCallBack, context, inputMode, key, interval));
    }

    private onKeyDown(event) {
        for (let observer of this._inputListeners) {
            let bNotify = false;
            if (observer._inputkey == null || observer._inputkey == event.keyCode) {
                let key = event.keyCode;
                switch (observer._inputmode) {
                    case InputMode.KEY_DOWN:
                        bNotify = true;
                        break;
                    case InputMode.KEY_DOWN_INTERVAL:
                        let curTime = new Date().getTime();
                        observer._keyTimeMap[key] = observer._keyTimeMap[key] ? observer._keyTimeMap[key] : 0;
                        if (curTime > observer._keyTimeMap[key] + observer._interval * 1000) {
                            observer._keyTimeMap[key] = curTime;
                            bNotify = true;
                        }                        
                        break;
                    case InputMode.KEY_DOWN_ONCE:
                        if (!observer._effectedMap[key]) {
                            observer._effectedMap[key] = true;
                            bNotify = true;
                        }
                        break;
                    default:
                        break;
                }
                if (bNotify) {
                    observer.notifyKeyDown(event);
                }
            }
        }
    }

    private onKeyUp(event) {
        for (let observer of this._inputListeners) {
            let bNotify = false;
            if (observer._inputkey == null || observer._inputkey == event.keyCode) {
                let key = event.keyCode;
                switch (observer._inputmode) {
                    case InputMode.KEY_DOWN_INTERVAL: 
                        observer._keyTimeMap[key] = 0;   
                        bNotify = true;
                        break;
                    case InputMode.KEY_DOWN_ONCE:
                        observer._effectedMap[key] = false;
                        bNotify = true;
                        break;
                    case InputMode.KEY_UP:
                        bNotify = true;
                        break;
                    default:
                        break;
                }
                if (bNotify) {
                    observer.notifyKeyUp(event);
                }
            }
        }
    }
}

class Observer {
    private _keyDownCallBack: Function = null;
    private _keyUpCallBack: Function = null;
    private _context: any = null;
    _inputmode: number = InputMode.KEY_DOWN;
    _inputkey: cc.macro.KEY = null;
    _interval: number = 0;

    _lastTime: number = 0;
    _keyTimeMap = {};
    _effectedMap = {};

    constructor(keyDownCallBack: Function, keyUpCallBack: Function, context: any, inputMode: InputMode, key?: cc.macro.KEY, interval?: number) {
        this._keyDownCallBack = keyDownCallBack;
        this._keyUpCallBack = keyUpCallBack;
        this._context = context;
        this._inputmode = inputMode;

        if (key != null) {
            this._inputkey = key;
        }

        if (interval != null) {
            this._interval = interval;
        }
    }

    notifyKeyDown(...params: any) {
        let self = this;
        if (self._keyDownCallBack) {
            self._keyDownCallBack.call(self._context, ...params);
        }
    }

    notifyKeyUp(...params: any) {
        let self = this;
        if (self._keyUpCallBack) {
            self._keyUpCallBack.call(self._context, ...params);
        }
    }

    compare(context: any): boolean {
        return context == this._context;
    }
}

export default new GameInputModel()
