#!/usr/bin/env node
import { program } from "commander";
import StatusServer from "../dist/index.js";
import pkg from "../package.json" assert { type: "json" };

/**
 * @typedef {Object} Options
 * @property {number} port
 * @property {string} host
 * @property {number} successStatus 
 * @property {number} failureStatus
 * @property {boolean} logging
 */

/** @type Options */
const opts = program
    .version(pkg.version)
    .option("-p, --port <port>", "Port to listen on", 3621)
    .option("-h, --host <host>", "Host to listen on", "127.0.0.1")
    .option("-s, --success-status <status>", "Status to return upon success", 204)
    .option("-f, --failure-status <status>", "Status to return upon failure", 503)
    .option("-l, --logging", "Enabling logging of requests", false)
    .parse(process.argv)
    .opts();

const server = StatusServer(() => true, {
    port: opts.port,
    host: opts.host,
    statuses: {
        success: opts.successStatus,
        failure: opts.failureStatus
    },
    logging: opts.logging
});
console.log(`Listening on http://${opts.host}:${opts.port}`);

process.once("SIGINT", () => {
    server.close();
    process.kill(process.pid, "SIGINT");
})
    .on("SIGTERM", () => {
        server.close();
        process.kill(process.pid, "SIGTERM");
    });
