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

describe('/identities', function() {

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

        it('/ should create a new asset', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                icon: 'http://fakeicon.com/' + hasher(20) + '.png'
            };

            app.post('/identities', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:identityId/clone should create a copy of the asset', function(done) {
            app.post('/identities/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:identityId/comments should create a new comment for the asset', function(done) {
            app.post('/identities/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:identityId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/identities/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:identityId/canon should update the asset canon field', function(done) {
            app.put('/identities/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of identities', function(done) {
            app.get('/identities')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:identityId should return one asset', function(done) {
            app.get('/identities/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:identityId/ownership should return ownership status', function(done) {
            app.get('/identities/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:identityId/comments should get all available comments', function(done) {
            app.get('/identities/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

    });

    xdescribe('DELETE', function() {

        it('/:identityId should update the asset deleted field', function(done) {
            app.delete('/identities/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});