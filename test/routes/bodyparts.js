var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('../app'),
    verifier = require('./../verifier'),
    hasher = require('../../lib/hasher');

describe('/bodyparts', function() {

    var temporaryId;

    before(function(done) {
        app.login(done);
    });

    function verifyList(body) {
        assert.isNumber(body.length);

        assert.isArray(body.results);
        assert.lengthOf(body.results, body.length);

        if(body.length > 0) {
            _.each(body.results, function(item) {
                verifyItem(item);
            });
        }

        assert.isObject(body.fields);
    }

    function verifyItem(item) {
        verifier.generic(item);
    }


    describe('POST', function() {

        it('/ should create a new bodypart', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.post('/bodyparts', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:bodyPartId/clone should create a copy of the bodypart', function(done) {
            app.post('/bodyparts/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:bodyPartId/comments should create a new comment for the asset', function(done) {
            app.post('/bodyparts/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:bodyPartId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/bodyparts/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:bodyPartId/canon should update the asset canon field', function(done) {
            app.put('/bodyparts/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of bodyparts', function(done) {
            app.get('/bodyparts')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:bodyPartId should return one bodypart', function(done) {
            app.get('/bodyparts/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:bodyPartId/ownership should return ownership status', function(done) {
            app.get('/bodyparts/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:skillId/comments should get all available comments, function(done) {
            app.get('/bodyparts/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

    });

    xdescribe('DELETE', function() {

        it('/:bodyPartId should update the bodypart deleted field', function(done) {
            app.delete('/bodyparts/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});