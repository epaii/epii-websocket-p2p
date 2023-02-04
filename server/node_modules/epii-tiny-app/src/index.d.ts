import * as http from "http";
import * as https from 'https';
type PrimitiveType = string | boolean | number | bigint;
type PromiseAble = Promise | void;

interface PlainObject {
    [key: string]: PrimitiveType;
}


interface InitHandler {
    (app: App, globalData?: GlobalData): PromiseAble;
}



interface Context {
    res: http.ServerResponse,
    req: http.IncomingMessage,
    shareData: Object,
    params(key?: String, dvalue?: any = null): void;
    paramsSet(key: String, value: any): void;
    success(data: any): void;
    error(msg: String = "error", code: Number = 0, data: any = {}): void;
    html(html: String): void;
    content(content: String): void;
}
interface ContextHandler {
    (ctx: Context, globalData: GlobalData): PromiseAble;
}

interface GlobalData {
    $service: Object | Function;
    [key: any]: any
}


declare class App {
    constructor();
    globalData: GlobalData;
    module(name: String, modulePath: String);
    init(hook: InitHandler): App;
    use(handler: ContextHandler): App;
    service(name: String, service: Object): App;
    servicePath(path: String): App;
    route(path: String, handler: ContextHandler): App;
    listen(port: Number, httpsOptions?: https.ServerOptions): Promise;
    callback(): Promise<http.RequestListener>
    static createServer():App;
}

export = App;