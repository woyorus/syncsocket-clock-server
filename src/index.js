

var http = require('http');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = Timeserver;

util.inherits(Timeserver, EventEmitter);

function Timeserver() {
    if (!(this instanceof Timeserver)) return new Timeserver();
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

Timeserver.prototype.listen = function (port) {
    this.httpServer.listen(port);
};

Timeserver.prototype.close = function () {
    this.httpServer.close();
};

Timeserver.prototype.onclose = function () {
    this.emit('close')
};

function respondWith(code, response) {
    response.writeHead(code);
    response.end();
}
