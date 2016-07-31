var expect = require('chai').expect;
var request = require('supertest');

var Timeserver = require('../src/index');

const testPort = process.env.TESTPORT || 2355;

describe('Timeserver', function () {

    it('should construct Timeserver object', function () {
        var ts = Timeserver();
        expect(ts).to.be.an('object');
    });

    it('should initialize httpServer object', function () {
        var ts = Timeserver();
        expect(ts.httpServer).to.be.an('object');
    });

    it('should allow listening and closing', function (done) {
        var ts = Timeserver();
        ts.listen(testPort);
        request(ts.httpServer)
            .get('/')
            .end(function (err) {
                expect(err).to.be.null;
                ts.on('close', done);
                ts.close();
            });
    });
});

describe('REST API', function () {
    var ts;

    beforeEach(function () {
        ts = Timeserver();
        ts.listen(testPort);
    });

    afterEach(function (done) {
        ts.on('close', done);
        ts.close();
    });

    describe('POST /', function () {
        it('should respond 405 - method not allowed', function (done) {
            request(ts.httpServer)
                .post('/')
                .expect(405, done);
        });
    });

    describe('GET /', function () {
        it('should respond 400 if no header "X-Client-Timestamp" passed', function (done) {
            request(ts.httpServer)
                .get('/')
                .expect(400, done);
        });

        it('should respond 400 if "X-Client-Timestamp" is not an integer number', function (done) {
            request(ts.httpServer)
                .get('/')
                .set('X-Client-Timestamp', 'not an integer')
                .expect(400, done);
        });

        it('should respond 200 with "X-Client-Timestamp" header is set to a number', function (done) {
            request(ts.httpServer)
                .get('/')
                .set('X-Client-Timestamp', '123456')
                .expect(200, done);
        });

        var testTimestamp = '123456';

        it('should respond with a string that starts from original timestamp', function (done) {
            request(ts.httpServer)
                .get('/')
                .set('X-Client-Timestamp', testTimestamp)
                .end(function (err, response) {
                    let responseText = response.text;
                    expect(responseText.substring(0, testTimestamp.length)).to.be.equal(testTimestamp);
                    done(err);
                });
        });

        it('should respond with another timestamp after original, comma-separated', function (done) {
            request(ts.httpServer)
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
            request(ts.httpServer)
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
            request(ts.httpServer)
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
