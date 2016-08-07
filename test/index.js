const expect = require('chai').expect;
const request = require('supertest');

const Server = require('../src/index');

const defaultPort = 5579;
const testingPort = process.env.TESTING_PORT || 8888;

describe('ClockServer', function () {

    it('should construct ClockServer object', function () {
        var srv = Server();
        expect(srv).to.be.an('object');
    });

    it('should initialize httpServer object', function () {
        var srv = Server();
        expect(srv.httpServer).to.be.an('object');
    });

    it('should allow listening and closing', function (done) {
        var srv = Server();
        srv.listen(testingPort);
        request(srv.httpServer)
            .get('/')
            .end(function (err) {
                expect(err).to.be.null;
                srv.on('close', done);
                srv.close();
            });
    });

    it('should by default listen on port ' + defaultPort, function (done) {
        var srv = Server();
        srv.listen(); // no port passed
        var req = request('http://localhost:' + defaultPort + '/');
        req.get('/')
            .end(function (err) {
                expect(err).to.be.null;
                srv.on('close', done);
                srv.close();
            });
    });
});

describe('REST API', function () {
    var srv;

    beforeEach(function () {
        srv = Server();
        srv.listen(testingPort);
    });

    afterEach(function (done) {
        srv.on('close', done);
        srv.close();
    });

    describe('POST /', function () {
        it('should respond 405 - method not allowed', function (done) {
            request(srv.httpServer)
                .post('/')
                .expect(405, done);
        });
    });

    describe('GET /', function () {
        it('should respond 400 if no header "X-Client-Timestamp" passed', function (done) {
            request(srv.httpServer)
                .get('/')
                .expect(400, done);
        });

        it('should respond 400 if "X-Client-Timestamp" is not an integer number', function (done) {
            request(srv.httpServer)
                .get('/')
                .set('X-Client-Timestamp', 'not an integer')
                .expect(400, done);
        });

        it('should respond 200 with "X-Client-Timestamp" header is set to a number', function (done) {
            request(srv.httpServer)
                .get('/')
                .set('X-Client-Timestamp', '123456')
                .expect(200, done);
        });

        var testTimestamp = '123456';

        it('should respond with a string that starts from original timestamp', function (done) {
            request(srv.httpServer)
                .get('/')
                .set('X-Client-Timestamp', testTimestamp)
                .end(function (err, response) {
                    let responseText = response.text;
                    expect(responseText.substring(0, testTimestamp.length)).to.be.equal(testTimestamp);
                    done(err);
                });
        });

        it('should respond with another timestamp after original, comma-separated', function (done) {
            request(srv.httpServer)
                .get('/')
                .set('X-Client-Timestamp', testTimestamp)
                .end(function (err, response) {
                    let responseText = response.text;
                    expect(responseText.indexOf(',')).to.be.equal(testTimestamp.length);
                    let afterCommaPart = responseText.substring(testTimestamp.length + 1, responseText.length);
                    let remoteTimestamp = parseInt(afterCommaPart);
                    expect(isNaN(remoteTimestamp)).to.be.false;
                    done(err);
                });
        });

        it('should respond with timestamp greater than timestamp of request initiation', function (done) {
            var initiationTimestamp = Date.now();
            request(srv.httpServer)
                .get('/')
                .set('X-Client-Timestamp', "" + initiationTimestamp)
                .end(function (err, response) {
                    let responseText = response.text;
                    let afterCommaPart = responseText.substring(("" + initiationTimestamp).length + 1, responseText.length);
                    let remoteTimestamp = parseInt(afterCommaPart);
                    expect(remoteTimestamp).to.be.at.least(initiationTimestamp);
                    done(err);
                });
        });

        it('should respond with timestamp within 10 milliseconds form originating time', function (done) {
            var initiationTimestamp = Date.now();
            request(srv.httpServer)
                .get('/')
                .set('X-Client-Timestamp', "" + initiationTimestamp)
                .end(function (err, response) {
                    let responseText = response.text;
                    let afterCommaPart = responseText.substring(("" + initiationTimestamp).length + 1, responseText.length);
                    let remoteTimestamp = parseInt(afterCommaPart);
                    expect(remoteTimestamp).to.be.closeTo(initiationTimestamp, 10);
                    done(err);
                });
        });
    });
});
