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

describe('/milestones', function() {

    var temporaryId,
        assetId,
        attributeId,
        augmentationId,
        backgroundId,
        doctrineId,
        manifestationId,
        skillId,
        speciesId,
        weaponId;

    before(function(done) {
        app.login(done);
    });

    before(function(done) {
        app.get('/assets')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                assetId = res.body.results[0].id;

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
        app.get('/backgrounds')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                backgroundId = res.body.results[0].id;

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
        app.get('/doctrines')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                doctrineId = res.body.results[0].id;

                done();
            });
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

    before(function(done) {
        app.get('/weapons')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                weaponId = res.body.results[0].id;

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

        it('/ should create a new milestone', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                icon: 'http://fakeicon.com/' + hasher(20) + '.png',
                background_id: backgroundId,
                manifestation_id: manifestationId,
                species_id: speciesId
            };

            app.post('/milestones', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:milestoneId/clone should create a copy of the milestone', function(done) {
            app.post('/milestones/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:milestoneId/comments should create a new comment for the milestone', function(done) {
            app.post('/milestones/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:milestoneId/assets should add an asset to the milestone', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/milestones/' + temporaryId + '/assets', payload)
                .expect(201)
                .end(done);
        });

        it('/:milestoneId/attributes should add an attribute to the milestone', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/milestones/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:milestoneId/augmentations should add an augmentation to the milestone', function(done) {
            var payload = {
                insert_id: 1
            };

            app.post('/milestones/' + temporaryId + '/augmentations', payload)
                .expect(201)
                .end(done);
        });

        it('/:milestoneId/doctrines should add an doctrine to the milestone', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/milestones/' + temporaryId + '/doctrines', payload)
                .expect(201)
                .end(done);
        });

        it('/:milestoneId/loyalties should add a loyalty to the milestone', function(done) {
            var payload = {
                insert_id: 1,
                value: 10,
                custom: hasher(20)
            };

            app.post('/milestones/' + temporaryId + '/loyalties', payload)
                .expect(201)
                .end(done);
        });

        it('/:milestoneId/skills should add an skill to the milestone', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/milestones/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

        it('/:milestoneId/weapons should add an weapon to the milestone', function(done) {
            var payload = {
                insert_id: 1
            };

            app.post('/milestones/' + temporaryId + '/weapons', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:milestoneId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/milestones/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:milestoneId/canon should update the milestone canon field', function(done) {
            app.put('/milestones/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:milestoneId/assets should change the asset value for the milestone', function(done) {
            app.put('/milestones/' + temporaryId + '/assets/1', { value: 8 })
                .expect(204)
                .end(done);
        });

        it('/:milestoneId/attributes should change the attribute value for the milestone', function(done) {
            app.put('/milestones/' + temporaryId + '/attributes/1', { value: 8 })
                .expect(204)
                .end(done);
        });

        it('/:milestoneId/doctrines should change the doctrine value for the milestone', function(done) {
            app.put('/milestones/' + temporaryId + '/doctrines/1', { value: 8 })
                .expect(204)
                .end(done);
        });

        it('/:milestoneId/loyalties should change the loyalty value for the milestone', function(done) {
            app.put('/milestones/' + temporaryId + '/loyalties/1', { value: 8, custom: hasher(20) })
                .expect(204)
                .end(done);
        });

        it('/:milestoneId/skills should change the skill value for the milestone', function(done) {
            app.put('/milestones/' + temporaryId + '/skills/1', { value: 8 })
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of milestones', function(done) {
            app.get('/milestones')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/manifestation/:typeId should return a list of milestones', function(done) {
            app.get('/milestones/manifestation/' + manifestationId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:typeId should return a list of milestones', function(done) {
            app.get('/milestones/species/' + speciesId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:milestoneId should return one milestone', function(done) {
            app.get('/milestones/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:milestoneId/ownership should return ownership status', function(done) {
            app.get('/milestones/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:milestoneId/comments should get all available comments', function(done) {
            app.get('/milestones/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:milestoneId/assets should return a list of assets', function(done) {
            app.get('/milestones/' + temporaryId + '/assets')
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

        it('/:milestoneId/attributes should return a list', function(done) {
            app.get('/milestones/' + temporaryId + '/attributes')
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

        it('/:milestoneId/augmentations should return a list of augmentations', function(done) {
            app.get('/milestones/' + temporaryId + '/augmentations')
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

        it('/:milestoneId/doctrines should return a list', function(done) {
            app.get('/milestones/' + temporaryId + '/doctrines')
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

        it('/:milestoneId/loyalties should return a list of loyalties', function(done) {
            app.get('/milestones/' + temporaryId + '/loyalties')
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

        it('/:milestoneId/skills should return a list', function(done) {
            app.get('/milestones/' + temporaryId + '/skills')
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

        it('/:milestoneId/weapons should return a list', function(done) {
            app.get('/milestones/' + temporaryId + '/weapons')
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

        it('/:milestoneId/attributes should remove the attribute from the milestone', function(done) {
            app.delete('/milestones/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:milestoneId/assets should remove the asset from the milestone', function(done) {
            app.delete('/milestones/' + temporaryId + '/assets/1')
                .expect(204)
                .end(done);
        });

        it('/:milestoneId/skills should remove the skill from the milestone', function(done) {
            app.delete('/milestones/' + temporaryId + '/skills/1')
                .expect(204)
                .end(done);
        });

        it('/:milestoneId should update the milestone deleted field', function(done) {
            app.delete('/milestones/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});