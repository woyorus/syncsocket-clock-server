const http = require('http');
const EventEmitter = require('events').EventEmitter;
const util = require('util');

module.exports = ClockServer;

const port = parseInt(process.env.PORT) || 5579;

util.inherits(ClockServer, EventEmitter);

var corsHeaders = {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, x-client-timestamp'
};

function ClockServer() {
    if (!(this instanceof ClockServer)) return new ClockServer();
    this.httpServer = http.createServer(function (request, response) {
        if (request.method === 'OPTIONS') {
            respondWith(200, response);
            return;
        } else if (request.method !== 'GET') {
            respondWith(405, response);
            return;
        }

        let clientTimestamp = parseInt(request.headers['x-client-timestamp']);

        if (isNaN(clientTimestamp)) {
            respondWith(400, response);
            return;
        }

        response.writeHead(200, corsHeaders);
        response.write("" + clientTimestamp + "," + Date.now());
        response.end();
    });
    this.httpServer.on('close', () => this.onclose());
}

ClockServer.prototype.listen = function (p = port) {
    this.httpServer.listen(p);
};

ClockServer.prototype.close = function () {
    this.httpServer.close();
};

ClockServer.prototype.onclose = function () {
    this.emit('close')
};

function respondWith(code, response) {
    response.writeHead(code, corsHeaders);
    response.end();
}

if (process.env.STANDALONE) {
  console.log(" [*] running standalone on \":%d\"", port);
  var server = new ClockServer();
  server.listen();
}
