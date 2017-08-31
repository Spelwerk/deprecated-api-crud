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

describe('/weapons', function() {

    var temporaryId,
        augmentationId,
        speciesId,
        weaponTypeId,
        attributeId,
        expertiseId,
        skillId,
        modId;

    before(function(done) {
        app.login(done);
    });

    before(function(done) {
        app.get('/weapontypes')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                weaponTypeId = res.body.results[0].id;

                done();
            });
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

    before(function(done) {
        app.get('/weaponmods')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                modId = res.body.results[0].id;

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

        assert.isNumber(item.weapontype_id);
        assert.isNumber(item.damage_id);
        assert.isNumber(item.expertise_id);
        assert.isNumber(item.skill_id);
        if(item.species_id) assert.isNumber(item.species_id);
        if(item.augmentation_id) assert.isNumber(item.augmentation_id);

        assert.isBoolean(item.legal);
        assert.isNumber(item.price);
        assert.isNumber(item.damage_dice);
        assert.isNumber(item.damage_bonus);
        assert.isNumber(item.critical_dice);
        assert.isNumber(item.critical_bonus);
        assert.isNumber(item.hand);
        assert.isNumber(item.initiative);
        assert.isNumber(item.hit);
        assert.isNumber(item.distance);
    }


    describe('POST', function() {

        it('/ should create a new weapon', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                weapontype_id: weaponTypeId,
                legal: true,
                price: 8,
                damage_dice: 2,
                damage_bonus: 3,
                critical_dice: 4,
                critical_bonus: 5,
                hand: 1,
                initiative: 6,
                hit: 7,
                distance: 100
            };

            app.post('/weapons', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:weaponId/clone should create a copy of the weapon', function(done) {
            app.post('/weapons/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:weaponId/comments should create a new comment for the weapon', function(done) {
            app.post('/weapons/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:weaponId/attributes should add an attribute to the weapon', function(done) {
            var payload = {
                insert_id: attributeId,
                value: 10
            };

            app.post('/weapons/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:weaponId/expertises should add an skill to the weapon', function(done) {
            var payload = {
                insert_id: expertiseId,
                value: 10
            };

            app.post('/weapons/' + temporaryId + '/expertises', payload)
                .expect(201)
                .end(done);
        });

        it('/:weaponId/skills should add an skill to the weapon', function(done) {
            var payload = {
                insert_id: skillId,
                value: 10
            };

            app.post('/weapons/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

        it('/:weaponId/mods should add an skill to the weapon', function(done) {
            var payload = {
                insert_id: modId,
                value: 10
            };

            app.post('/weapons/' + temporaryId + '/mods', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:weaponId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/weapons/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:weaponId/canon should update the weapon canon field', function(done) {
            app.put('/weapons/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:weaponId/attributes should change the attribute value for the weapon', function(done) {
            app.put('/weapons/' + temporaryId + '/attributes/' + attributeId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:weaponId/expertises should change the skill value for the weapon', function(done) {
            app.put('/weapons/' + temporaryId + '/expertises/' + expertiseId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:weaponId/skills should change the skill value for the weapon', function(done) {
            app.put('/weapons/' + temporaryId + '/skills/' + skillId, {value: 8})
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of weapons', function(done) {
            app.get('/weapons')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/augmentation/:augmentationId should return a list of weapons', function(done) {
            app.get('/weapons/augmentation/' + augmentationId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:speciesId should return a list of weapons', function(done) {
            app.get('/weapons/species/' + speciesId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/type/:typeId should return a list of weapons', function(done) {
            app.get('/weapons/type/' + weaponTypeId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:weaponId should return one weapon', function(done) {
            app.get('/weapons/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:weaponId/ownership should return ownership status of the weapon if user is logged in', function(done) {
            app.get('/weapons/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:weaponId/comments should get all available comments for the weapon', function(done) {
            app.get('/weapons/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:weaponId/attributes should return a list of attributes', function(done) {
            app.get('/weapons/' + temporaryId + '/attributes')
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

        it('/:weaponId/expertises should return a list of expertises', function(done) {
            app.get('/weapons/' + temporaryId + '/expertises')
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

        it('/:weaponId/skills should return a list of skills', function(done) {
            app.get('/weapons/' + temporaryId + '/skills')
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

        it('/:weaponId/mods should return a list of mods', function(done) {
            app.get('/weapons/' + temporaryId + '/mods')
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

        it('/:weaponId should update the weapon deleted field', function(done) {
            app.delete('/weapons/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});