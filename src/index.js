const http = require('http');
const EventEmitter = require('events').EventEmitter;
const util = require('util');

module.exports = ClockServer;

const defaultPort = 5579;

util.inherits(ClockServer, EventEmitter);

function ClockServer() {
    if (!(this instanceof ClockServer)) return new ClockServer();
    this.httpServer = http.createServer(function (request, response) {
        if (request.method !== 'GET') {
            respondWith(405, response);
            return;
        }

        let clientTimestamp = parseInt(request.headers['x-client-timestamp']);

        if (isNaN(clientTimestamp)) {
            respondWith(400, response);
            return;
        }

        response.writeHead(200, { 'Content-Type': 'text/plain' } );
        response.write("" + clientTimestamp + "," + Date.now());
        response.end();
    });
    this.httpServer.on('close', () => this.onclose());
}

ClockServer.prototype.listen = function (port = defaultPort) {
    this.httpServer.listen(port);
};

ClockServer.prototype.close = function () {
    this.httpServer.close();
};

ClockServer.prototype.onclose = function () {
    this.emit('close')
};

function respondWith(code, response) {
    response.writeHead(code);
    response.end();
}
