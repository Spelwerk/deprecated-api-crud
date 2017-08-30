var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    verifier = require('./../verifier'),
    hasher = require('./../../lib/hasher');

describe('/attributes', function() {

    var temporaryId,
        typeId,
        manifestationId;

    before(function(done) {
        app.login(done);
    });

    before(function(done) {
        app.get('/attributetypes')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                typeId = res.body.results[0].id;

                done();
            });
    });

    /*
    before(function(done) {
        app.get('/manifestations')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                manifestationId = res.body.results[0].id;

                done();
            });
    });
    */

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

        assert.isNumber(item.attributetype_id);
        assert.isNumber(item.maximum);
    }


    describe('POST', function() {

        it('/ should create a new attribute', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                attributetype_id: typeId,
                maximum: 10,
                icon: 'http://fakeicon.com/' + hasher(20) + '.png'
            };

            app.post('/attributes', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:expertiseId/comments should create a new comment for the asset', function(done) {
            app.post('/expertises/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:attributeId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/attributes/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:attributeId/canon should update the attribute canon field', function(done) {
            app.put('/attributes/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of attributes', function(done) {
            app.get('/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        xit('/manifestation/:manifestationId should return a list of attributes', function(done) {
            app.get('/attributes/manifestation/' + manifestationId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/type/:typeId should return a list of attributes', function(done) {
            app.get('/attributes/type/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:attributeId should return one attribute', function(done) {
            app.get('/attributes/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:attributeId/ownership should return ownership status of the attribute if user is logged in', function(done) {
            app.get('/attributes/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:attributeId/comments should get all available comments for the asset', function(done) {
            app.get('/attributes/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

    });

    xdescribe('DELETE', function() {

        it('/:attributeId should update the weapon deleted field', function(done) {
            app.delete('/attributes/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});