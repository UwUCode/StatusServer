import { type IncomingMessage, type Server as HttpServer, type ServerResponse, createServer } from "node:http";
import type { Server as HttpsServer } from "node:https";
import type { Http2Server, Http2SecureServer, Http2ServerRequest, Http2ServerResponse } from "node:http2";

type AnyServer = HttpServer | HttpsServer | Http2Server | Http2SecureServer;
type Incoming<T extends AnyServer> = T extends Http2Server | Http2SecureServer ? Http2ServerRequest : IncomingMessage;
type Response<T extends AnyServer> = T extends Http2Server | Http2SecureServer ? Http2ServerResponse : ServerResponse;
export interface Options<T extends AnyServer = AnyServer> {
    /** @default 127.0.0.1 */
    host?: string;
    /** @default false */
    logging?: boolean;
    /** @default 3621 */
    port?: number;
    statuses?: {
        /** @default 503 */
        failure?: number;
        /** @default 204 */
        success?: number;
    };
    /** @default http.createServer */
    serverFactory?(handler: (req: Incoming<T>, res: Response<T>) => void): T;
}

export default function statusServer<T extends AnyServer = HttpServer>(check: () => boolean, options: Options<T> = {}): T {
    options.host ??= "127.0.0.1";
    options.port ??= 3621;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    (options.serverFactory as unknown) ??= (handler: (req: IncomingMessage | Http2ServerRequest, res: ServerResponse | Http2ServerResponse) => void) => createServer(handler);
    options.logging ??= false;
    options.statuses ??= {};
    options.statuses.success ??= 204;
    options.statuses.failure ??= 503;
    return options.serverFactory!((req, res) => {
        const status = (check() ? options.statuses!.success : options.statuses!.failure)!;
        if (options.logging) {
            const ip = req.connection.remoteAddress;
            console.debug(`${ip ? `[${ip}] ` : ""}${req.method ?? ""} ${req.url ?? "/"} ${status} - ${req.headers["user-agent"] ?? ""}`);
        }
        res.writeHead(status, {
            "Content-Type":   "text/plain",
            "Content-Length": 0
        }).end();
    }).listen(options.port, options.host) as T;
}
