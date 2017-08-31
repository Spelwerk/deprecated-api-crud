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

describe('/backgrounds', function() {

    var temporaryId,
        assetId,
        attributeId,
        augmentationId,
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

        it('/ should create a new background', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                icon: 'http://fakeicon.com/' + hasher(20) + '.png',
                manifestation_id: manifestationId,
                species_id: speciesId
            };

            app.post('/backgrounds', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:backgroundId/clone should create a copy of the background', function(done) {
            app.post('/backgrounds/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:backgroundId/comments should create a new comment for the background', function(done) {
            app.post('/backgrounds/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:backgroundId/assets should add an asset to the background', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/backgrounds/' + temporaryId + '/assets', payload)
                .expect(201)
                .end(done);
        });

        it('/:backgroundId/attributes should add an attribute to the background', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/backgrounds/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:backgroundId/augmentations should add an augmentation to the background', function(done) {
            var payload = {
                insert_id: 1
            };

            app.post('/backgrounds/' + temporaryId + '/augmentations', payload)
                .expect(201)
                .end(done);
        });

        it('/:backgroundId/doctrines should add an doctrine to the background', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/backgrounds/' + temporaryId + '/doctrines', payload)
                .expect(201)
                .end(done);
        });

        it('/:backgroundId/skills should add an skill to the background', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/backgrounds/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

        it('/:backgroundId/weapons should add an weapon to the background', function(done) {
            var payload = {
                insert_id: 1
            };

            app.post('/backgrounds/' + temporaryId + '/weapons', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:backgroundId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/backgrounds/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:backgroundId/canon should update the background canon field', function(done) {
            app.put('/backgrounds/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:backgroundId/assets should change the asset value for the background', function(done) {
            app.put('/backgrounds/' + temporaryId + '/assets/1', { value: 8 })
                .expect(204)
                .end(done);
        });

        it('/:backgroundId/attributes should change the attribute value for the background', function(done) {
            app.put('/backgrounds/' + temporaryId + '/attributes/1', { value: 8 })
                .expect(204)
                .end(done);
        });

        it('/:backgroundId/doctrines should change the doctrine value for the background', function(done) {
            app.put('/backgrounds/' + temporaryId + '/doctrines/1', { value: 8 })
                .expect(204)
                .end(done);
        });

        it('/:backgroundId/skills should change the skill value for the background', function(done) {
            app.put('/backgrounds/' + temporaryId + '/skills/1', { value: 8 })
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of backgrounds', function(done) {
            app.get('/backgrounds')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/manifestation/:typeId should return a list of backgrounds', function(done) {
            app.get('/backgrounds/manifestation/' + manifestationId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:typeId should return a list of backgrounds', function(done) {
            app.get('/backgrounds/species/' + speciesId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:backgroundId should return one background', function(done) {
            app.get('/backgrounds/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:backgroundId/ownership should return ownership status', function(done) {
            app.get('/backgrounds/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:backgroundId/comments should get all available comments', function(done) {
            app.get('/backgrounds/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:backgroundId/assets should return a list of assets', function(done) {
            app.get('/backgrounds/' + temporaryId + '/assets')
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

        it('/:backgroundId/attributes should return a list', function(done) {
            app.get('/backgrounds/' + temporaryId + '/attributes')
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

        it('/:backgroundId/augmentations should return a list of augmentations', function(done) {
            app.get('/backgrounds/' + temporaryId + '/augmentations')
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

        it('/:backgroundId/doctrines should return a list', function(done) {
            app.get('/backgrounds/' + temporaryId + '/doctrines')
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

        it('/:backgroundId/skills should return a list', function(done) {
            app.get('/backgrounds/' + temporaryId + '/skills')
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

        it('/:backgroundId/weapons should return a list', function(done) {
            app.get('/backgrounds/' + temporaryId + '/weapons')
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

        it('/:backgroundId/attributes should remove the attribute from the background', function(done) {
            app.delete('/backgrounds/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:backgroundId/assets should remove the asset from the background', function(done) {
            app.delete('/backgrounds/' + temporaryId + '/assets/1')
                .expect(204)
                .end(done);
        });

        it('/:backgroundId/skills should remove the skill from the background', function(done) {
            app.delete('/backgrounds/' + temporaryId + '/skills/1')
                .expect(204)
                .end(done);
        });

        it('/:backgroundId should update the background deleted field', function(done) {
            app.delete('/backgrounds/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});