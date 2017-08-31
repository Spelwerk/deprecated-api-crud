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

describe('/weapontypes', function() {

    var temporaryId,
        augmentationId,
        attributeId,
        expertiseId,
        skillId,
        speciesId;

    before(function(done) {
        app.login(done);
    });

    before(function(done) {
        app.get('/augmentations')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                augmentationId = res.body.results[0].id;

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
        app.get('/attributes')
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

        assert.isNumber(item.damage_id);
        assert.isNumber(item.expertise_id);
        assert.isNumber(item.skill_id);

        if(item.augmentation_id) assert.isNumber(item.augmentation_id);
        if(item.species_id) assert.isNumber(item.species_id);
    }


    describe('POST', function() {

        it('/ should create a new weapon group', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                icon: 'http://fakeicon.com/' + hasher(20) + '.png',
                augmentation_id: augmentationId,
                damage_id: attributeId,
                skill_id: skillId,
                species_id: speciesId
            };

            app.post('/weapontypes', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:weaponTypeId/comments should create a new comment for the asset', function(done) {
            app.post('/weapontypes/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:weaponTypeId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/weapontypes/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:weaponTypeId/canon should update the weapon group canon field', function(done) {
            app.put('/weapontypes/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of weapon groups', function(done) {
            app.get('/weapontypes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/augmentation/:augmentationId should return a list of weapon groups', function(done) {
            app.get('/weapontypes/augmentation/' + augmentationId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/damage/:damageId should return a list of weapon groups', function(done) {
            app.get('/weapontypes/damage/' + attributeId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/expertise/:expertiseId should return a list of weapon groups', function(done) {
            app.get('/weapontypes/expertise/' + expertiseId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/skill/:skillId should return a list of weapon groups', function(done) {
            app.get('/weapontypes/skill/' + skillId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:speciesId should return a list of weapon groups', function(done) {
            app.get('/weapontypes/species/' + speciesId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:weaponTypeId should return one weapon group', function(done) {
            app.get('/weapontypes/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:weaponTypeId/ownership should return ownership status of the weapon group if user is logged in', function(done) {
            app.get('/weapontypes/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:weaponTypeId/comments should get all available comments for the asset', function(done) {
            app.get('/weapontypes/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

    });

    xdescribe('DELETE', function() {

        it('/:weaponTypeId should update the weapon deleted field', function(done) {
            app.delete('/weapontypes/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});