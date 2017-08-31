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

describe('/gifts', function() {

    var temporaryId,
        manifestationId,
        speciesId,
        attributeId,
        expertiseId,
        skillId;

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
        app.get('/expertises')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                expertiseId = res.body.results[0].id;

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

        it('/ should create a new gift', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                manifestation_id: manifestationId,
                species_id: speciesId
            };

            app.post('/gifts', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:giftId/clone should create a copy of the gift', function(done) {
            app.post('/gifts/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:giftId/comments should create a new comment for the gift', function(done) {
            app.post('/gifts/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:giftId/attributes should add an attribute to the gift', function(done) {
            var payload = {
                insert_id: attributeId,
                value: 10
            };

            app.post('/gifts/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:giftId/expertises should add an skill to the gift', function(done) {
            var payload = {
                insert_id: expertiseId,
                value: 10
            };

            app.post('/gifts/' + temporaryId + '/expertises', payload)
                .expect(201)
                .end(done);
        });

        it('/:giftId/skills should add an skill to the gift', function(done) {
            var payload = {
                insert_id: skillId,
                value: 10
            };

            app.post('/gifts/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:giftId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/gifts/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:giftId/canon should update the gift canon field', function(done) {
            app.put('/gifts/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:giftId/attributes should change the attribute value for the gift', function(done) {
            app.put('/gifts/' + temporaryId + '/attributes/' + attributeId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:giftId/expertises should change the skill value for the gift', function(done) {
            app.put('/gifts/' + temporaryId + '/expertises/' + expertiseId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:giftId/skills should change the skill value for the gift', function(done) {
            app.put('/gifts/' + temporaryId + '/skills/' + skillId, {value: 8})
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of gifts', function(done) {
            app.get('/gifts')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/manifestation/:manifestationId should return a list of gifts', function(done) {
            app.get('/gifts/manifestation/' + manifestationId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:speciesId should return a list of gifts', function(done) {
            app.get('/gifts/species/' + speciesId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:giftId should return one gift', function(done) {
            app.get('/gifts/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:giftId/ownership should return ownership status', function(done) {
            app.get('/gifts/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:giftId/comments should get all available comments', function(done) {
            app.get('/gifts/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:giftId/attributes should return a list', function(done) {
            app.get('/gifts/' + temporaryId + '/attributes')
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

        it('/:giftId/expertises should return a list', function(done) {
            app.get('/gifts/' + temporaryId + '/expertises')
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

        it('/:giftId/skills should return a list', function(done) {
            app.get('/gifts/' + temporaryId + '/skills')
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

        it('/:giftId/attributes should remove the attribute from the gift', function(done) {
            app.delete('/gifts/' + temporaryId + '/attributes/' + attributeId)
                .expect(204)
                .end(done);
        });

        it('/:giftId/skills should remove the skill from the gift', function(done) {
            app.delete('/gifts/' + temporaryId + '/skills/' + skillId)
                .expect(204)
                .end(done);
        });

        it('/:giftId/expertises should remove the expertise from the gift', function(done) {
            app.delete('/gifts/' + temporaryId + '/expertises/' + skillId)
                .expect(204)
                .end(done);
        });

        it('/:giftId should update the gift deleted field', function(done) {
            app.delete('/gifts/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});