export default class Emitter {
    private _observers = {};

    /**
     * 注册监听事件
     * @param event 
     * @param callback 
     * @param context 
     */
    addEventListener(event: string, callback: Function, context: any) {
        this._observers[event] = this._observers[event] ? this._observers[event] : [];
        this._observers[event].push(new Observer(callback, context));
    }

    /**
     * 移除监听事件
     * @param event 移除的事件名
     * @param context 监听的上下文
     */
    removeEventListener(event: string, context: any) {
        let observers: Observer[] = this._observers[event];
        if (!observers) return;

        for (let i = observers.length - 1; i >= 0; i--) {
            let observer = observers[i];
            if (observer.compare(context)) {
                observers.splice(i, 1);
            }
        }
    }

    /**
     * 移除上下文下的所有的事件
     * @param context 上下文 
     */
    removeEventListenerByContext(context: any) {
        for (let event in this._observers) {
            let observers: Observer[] = this._observers[event];
            for (let i = observers.length - 1; i >= 0; i--) {
                let observer = observers[i];
                if (observer.compare(context)) {
                    observers.splice(i, 1);
                }
            }
        }
    }

    /**
     * 分发事件
     * @param event 事件名
     * @param params ...参数包
     */
    emit(event: string, ...params) {
        let observers = this._observers[event];
        if (observers) {
            for(let observer of observers) {
                observer.notify(...params);
            }
        }
    }
}

class Observer {
    private _callback: Function = null;
    private _context: any = null;

    constructor(callback:Function, context: any) {
        this._callback = callback;
        this._context = context;
    }

    notify(...params: any) {
        let self = this;
        self._callback.call(self._context, ...params);
    }

    compare(context: any): boolean {
        return context == this._context;
    }
}
