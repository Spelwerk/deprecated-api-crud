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

describe('/expertise', function() {

    var temporaryId,
        skillId,
        speciesId,
        manifestationId;

    before(function(done) {
        app.login(done);
    });

    before(function(done) {
        app.get('/skills')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                skillId = res.body.results[0].id;

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

        assert.isNumber(item.skill_id);
        if(item.species_id) assert.isNumber(item.species_id);
        if(item.manifestation_id) assert.isNumber(item.manifestation_id);
    }


    describe('POST', function() {

        it('/ should create a new asset', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                skill_id: skillId
            };

            app.post('/expertises', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:expertiseId/clone should create a copy of the asset', function(done) {
            app.post('/expertises/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

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

        it('/:expertiseId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/expertises/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:expertiseId/canon should update the asset canon field', function(done) {
            app.put('/expertises/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of expertise', function(done) {
            app.get('/expertises')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/manifestation/:manifestationId should return a list of expertise', function(done) {
            app.get('/expertises/manifestation/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/skill/:skillId should return a list of expertise', function(done) {
            app.get('/expertises/skill/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:speciesId should return a list of expertise', function(done) {
            app.get('/expertises/species/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/skill/:skillId/manifestation/:manifestationId should return a list of expertise', function(done) {
            app.get('/expertises/skill/20/manifestation/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/skill/:skillId/species/:speciesId should return a list of expertise', function(done) {
            app.get('/expertises/skill/19/species/5')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:expertiseId should return one asset', function(done) {
            app.get('/expertises/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:expertiseId/ownership should return ownership status', function(done) {
            app.get('/expertises/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:expertiseId/comments should get all available comments', function(done) {
            app.get('/expertises/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

    });

    xdescribe('DELETE', function() {

        it('/:expertiseId should update the asset deleted field', function(done) {
            app.delete('/expertises/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});