var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('../app'),
    verifier = require('../verifier'),
    hasher = require('../../lib/hasher');

describe('/imperfections', function() {

    var temporaryId,
        manifestationId,
        speciesId,
        attributeId,
        skillId,
        expertiseId;

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

    before(function(done) {
        app.get('/attributes')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                attributeId = res.body.results[0].id;

                done();
            });
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

    before(function(done) {
        app.get('/expertises')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                expertiseId = res.body.results[0].id;

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

        it('/ should create a new imperfection', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                manifestation_id: manifestationId,
                species_id: speciesId
            };

            app.post('/imperfections', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:imperfectionId/clone should create a copy of the imperfection', function(done) {
            app.post('/imperfections/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:imperfectionId/comments should create a new comment for the imperfection', function(done) {
            app.post('/imperfections/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:imperfectionId/attributes should add an attribute to the imperfection', function(done) {
            var payload = {
                insert_id: attributeId,
                value: 10
            };

            app.post('/imperfections/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:imperfectionId/skills should add an skill to the imperfection', function(done) {
            var payload = {
                insert_id: skillId,
                value: 10
            };

            app.post('/imperfections/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

        it('/:imperfectionId/expertises should add an skill to the imperfection', function(done) {
            var payload = {
                insert_id: expertiseId,
                value: 10
            };

            app.post('/imperfections/' + temporaryId + '/expertises', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:imperfectionId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/imperfections/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId/canon should update the imperfection canon field', function(done) {
            app.put('/imperfections/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId/attributes should change the attribute value for the imperfection', function(done) {
            app.put('/imperfections/' + temporaryId + '/attributes/' + attributeId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId/skills should change the skill value for the imperfection', function(done) {
            app.put('/imperfections/' + temporaryId + '/skills/' + skillId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId/expertises should change the skill value for the imperfection', function(done) {
            app.put('/imperfections/' + temporaryId + '/expertises/' + expertiseId, {value: 8})
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of imperfections', function(done) {
            app.get('/imperfections')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/manifestation/:manifestationId should return a list of imperfections', function(done) {
            app.get('/imperfections/manifestation/' + manifestationId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:speciesId should return a list of imperfections', function(done) {
            app.get('/imperfections/species/' + speciesId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:imperfectionId should return one imperfection', function(done) {
            app.get('/imperfections/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:imperfectionId/ownership should return ownership status', function(done) {
            app.get('/imperfections/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:imperfectionId/comments should get all available comments', function(done) {
            app.get('/imperfections/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:imperfectionId/attributes should return a list', function(done) {
            app.get('/imperfections/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        verifier.generic(item);
                    });

                    done();
                });
        });

        it('/:imperfectionId/skills should return a list', function(done) {
            app.get('/imperfections/' + temporaryId + '/skills')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        verifier.generic(item);
                    });

                    done();
                });
        });

        it('/:imperfectionId/skills should return a list', function(done) {
            app.get('/imperfections/' + temporaryId + '/expertises')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        verifier.generic(item);
                    });

                    done();
                });
        });

    });

    xdescribe('DELETE', function() {

        it('/:imperfectionId/attributes should remove the attribute from the imperfection', function(done) {
            app.delete('/imperfections/' + temporaryId + '/attributes/' + attributeId)
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId/skills should remove the skill from the imperfection', function(done) {
            app.delete('/imperfections/' + temporaryId + '/skills/' + skillId)
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId/expertises should remove the expertise from the imperfection', function(done) {
            app.delete('/imperfections/' + temporaryId + '/expertises/' + skillId)
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId should update the imperfection deleted field', function(done) {
            app.delete('/imperfections/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});