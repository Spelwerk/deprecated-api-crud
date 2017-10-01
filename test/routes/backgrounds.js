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

    var baseRoute = '/backgrounds';

    var temporaryId;

    before(function(done) {
        app.login(done);
    });

    var assetId;
    before(function(done) {
        app.get('/assets')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                assetId = res.body.results[0].id;

                done();
            });
    });

    var attributeId;
    before(function(done) {
        app.get('/attributes')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                attributeId = res.body.results[0].id;

                done();
            });
    });

    var doctrineId;
    before(function(done) {
        app.get('/doctrines')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                doctrineId = res.body.results[0].id;

                done();
            });
    });

    var manifestationId;
    before(function(done) {
        app.get('/manifestations')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                manifestationId = res.body.results[0].id;

                done();
            });
    });

    var skillId;
    before(function(done) {
        app.get('/skills')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                skillId = res.body.results[0].id;

                done();
            });
    });

    var speciesId;
    before(function(done) {
        app.get('/species')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                speciesId = res.body.results[0].id;

                done();
            });
    });

    var weaponId;
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

        it('/ should create a new item', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                icon: 'http://fakeicon.com/' + hasher(20) + '.png',
                manifestation_id: manifestationId,
                species_id: speciesId
            };

            app.post(baseRoute, payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:id/clone should create a copy', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:id/comments should create a new comment', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:id/assets should add a relation to the item', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post(baseRoute + '/' + temporaryId + '/assets', payload)
                .expect(201)
                .end(done);
        });

        it('/:id/attributes should add a relation to the item', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post(baseRoute + '/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:id/bionics should add a relation to the item', function(done) {
            var payload = {
                insert_id: 1
            };

            app.post(baseRoute + '/' + temporaryId + '/bionics', payload)
                .expect(201)
                .end(done);
        });

        it('/:id/doctrines should add a relation to the item', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post(baseRoute + '/' + temporaryId + '/doctrines', payload)
                .expect(201)
                .end(done);
        });

        it('/:id/skills should add a relation to the item', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post(baseRoute + '/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

        it('/:id/weapons should add a relation to the item', function(done) {
            var payload = {
                insert_id: 1
            };

            app.post(baseRoute + '/' + temporaryId + '/weapons', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:id should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put(baseRoute + '/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:id/canon/:canon should update the canon status', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/canon/1')
                .expect(204)
                .end(done);
        });

        it('/:id/assets should change the value', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/assets/1', { value: 8 })
                .expect(204)
                .end(done);
        });

        it('/:id/attributes should change the value', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/attributes/1', { value: 8 })
                .expect(204)
                .end(done);
        });

        it('/:id/doctrines should change the value', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/doctrines/1', { value: 8 })
                .expect(204)
                .end(done);
        });

        it('/:id/skills should change the value', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/skills/1', { value: 8 })
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list', function(done) {
            app.get(baseRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/deleted should return a list of deleted items', function(done) {
            app.get(baseRoute + '/deleted')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/manifestation/:manifestationId should return a list', function(done) {
            app.get('/backgrounds/manifestation/' + manifestationId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:speciesId should return a list', function(done) {
            app.get('/backgrounds/species/' + speciesId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:id should return one item', function(done) {
            app.get(baseRoute + '/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:id/ownership should return ownership status', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:id/comments should get all available comments', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:id/assets should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/assets')
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

        it('/:id/attributes should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/attributes')
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

        it('/:id/bionics should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/bionics')
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

        it('/:id/doctrines should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/doctrines')
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

        it('/:id/skills should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/skills')
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

        it('/:id/weapons should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/weapons')
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

});