var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/bodyparts', function() {

    before(function(done) {
        app.login(done);
    });

    var temporaryId;

    function verifyGET(body) {
        assert.isNumber(body.length);

        assert.isArray(body.results);
        assert.lengthOf(body.results, body.length);

        if(body.length > 0) {
            _.each(body.results, function(item) {
                assert.isString(item.name);
                if(item.description) assert.isString(item.description);

                assert.isString(item.created);
                if(item.updated) assert.isString(item.updated);
                if(item.deleted) assert.isString(item.deleted);
            });
        }

        assert.isObject(body.fields);
    }

    describe('SETUP', function() {

        it('POST / should create a new bodypart', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.post('/bodyparts', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.notEqual(res.body.affected, 0);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('GET / should return a list of bodyparts', function(done) {
            app.get('/bodyparts')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyGET(res.body);

                    done();
                });
        });

    });

    describe('/:bodyPartId', function() {

        it('GET /:bodyPartId should return a list with one bodypart', function(done) {
            app.get('/bodyparts/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyGET(res.body);

                    done();
                })
        });

        it('GET /:bodyPartId/ownership should return ownership status of the bodypart if user is logged in', function(done) {
            app.get('/bodyparts/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('PUT /:bodyPartId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/bodyparts/' + temporaryId, payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);
                    assert.notEqual(res.body.changed, 0);

                    assert.isNumber(res.body.id);

                    done();
                })
        });

    });

    describe('END', function() {

        it('POST /:bodyPartId/clone should create a copy of the bodypart', function(done) {
            app.post('/bodyparts/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('DELETE /:bodyPartId should update the bodypart deleted field', function(done) {
            app.delete('/bodyparts/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.notEqual(res.body.affected, 0);

                    done();
                })
        });

    });

});