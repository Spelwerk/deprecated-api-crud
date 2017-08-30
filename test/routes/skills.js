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

describe('/skills', function() {

    var temporaryId,
        manifestationId,
        speciesId;

    before(function(done) {
        app.login(done);
    });

    before(function(done) {
        app.get('/manifestations')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                manifestationId = res.body.results[0].id;

                done();
            });
    });

    before(function(done) {
        app.get('/species')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                speciesId = res.body.results[0].id;

                done();
            });
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

        if(item.manifestation_id) assert.isNumber(item.manifestation_id);
        if(item.species_id) assert.isNumber(item.species_id);
    }


    describe('POST', function() {

        it('/ should create a new asset', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                manifestation_id: manifestationId,
                species_id: speciesId,
                icon: 'http://fakeicon.com/' + hasher(20) + '.png'
            };

            app.post('/skills', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:skillId/clone should create a copy of the asset', function(done) {
            app.post('/skills/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:skillId/comments should create a new comment for the asset', function(done) {
            app.post('/skills/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:skillId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/skills/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:skillId/canon should update the asset canon field', function(done) {
            app.put('/skills/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of skills', function(done) {
            app.get('/skills')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/manifestation/:manifestationId should return a list of assets', function(done) {
            app.get('/skills/manifestation/' + manifestationId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:speciesId should return a list of assets', function(done) {
            app.get('/skills/species/' + speciesId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:skillId should return one asset', function(done) {
            app.get('/skills/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:skillId/ownership should return ownership status of the asset if user is logged in', function(done) {
            app.get('/skills/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:skillId/comments should get all available comments for the asset', function(done) {
            app.get('/skills/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

    });

    xdescribe('DELETE', function() {

        it('/:skillId should update the asset deleted field', function(done) {
            app.delete('/skills/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});