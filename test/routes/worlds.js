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

describe('/worlds', function() {

    var baseRoute = '/worlds';

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

    var backgroundId;
    before(function(done) {
        app.get('/backgrounds')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                backgroundId = res.body.results[0].id;

                done();
            });
    });

    var bionicId;
    before(function(done) {
        app.get('/bionics')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                bionicId = res.body.results[0].id;

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

    var expertiseId;
    before(function(done) {
        app.get('/expertises')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                expertiseId = res.body.results[0].id;

                done();
            });
    });

    var giftId;
    before(function(done) {
        app.get('/gifts')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                giftId = res.body.results[0].id;

                done();
            });
    });

    var identityId;
    before(function(done) {
        app.get('/identities')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                identityId = res.body.results[0].id;

                done();
            });
    });

    var imperfectionId;
    before(function(done) {
        app.get('/imperfections')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                imperfectionId = res.body.results[0].id;

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

    var milestoneId;
    before(function(done) {
        app.get('/milestones')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                milestoneId = res.body.results[0].id;

                done();
            });
    });

    var natureId;
    before(function(done) {
        app.get('/natures')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                natureId = res.body.results[0].id;

                done();
            });
    });

    var protectionId;
    before(function(done) {
        app.get('/protection')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                protectionId = res.body.results[0].id;

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

    var softwareId;
    before(function(done) {
        app.get('/software')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                softwareId = res.body.results[0].id;

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
                augmentation: 1,
                bionic: 1,
                manifestation: 1,
                software: 1,
                split_doctrine: 2,
                split_expertise: 3,
                split_milestone: 4,
                split_relationship: 5,
                split_skill: 6,
                max_doctrine: 7,
                max_expertise: 8,
                max_gift: 9,
                max_imperfection: 10,
                max_milestone: 11,
                max_relationship: 12,
                max_skill: 13
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
            app.post(baseRoute + '/' + temporaryId + '/assets', { insert_id: assetId }).expect(201).end(done);
        });

        it('/:id/attributes should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/attributes', { insert_id: attributeId }).expect(201).end(done);
        });

        it('/:id/backgrounds should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/backgrounds', { insert_id: backgroundId }).expect(201).end(done);
        });

        it('/:id/bionics should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/bionics', { insert_id: bionicId }).expect(201).end(done);
        });

        it('/:id/doctrines should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/doctrines', { insert_id: doctrineId }).expect(201).end(done);
        });

        it('/:id/expertises should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/expertises', { insert_id: expertiseId }).expect(201).end(done);
        });

        it('/:id/gifts should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/gifts', { insert_id: giftId }).expect(201).end(done);
        });

        it('/:id/identities should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/identities', { insert_id: identityId }).expect(201).end(done);
        });

        it('/:id/imperfections should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/imperfections', { insert_id: imperfectionId }).expect(201).end(done);
        });

        it('/:id/manifestations should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/manifestations', { insert_id: manifestationId }).expect(201).end(done);
        });

        it('/:id/milestones should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/milestones', { insert_id: milestoneId }).expect(201).end(done);
        });

        it('/:id/natures should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/natures', { insert_id: natureId }).expect(201).end(done);
        });

        it('/:id/protection should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/protection', { insert_id: protectionId }).expect(201).end(done);
        });

        it('/:id/skills should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/skills', { insert_id: skillId }).expect(201).end(done);
        });

        it('/:id/software should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/software', { insert_id: softwareId }).expect(201).end(done);
        });

        it('/:id/species should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/species', { insert_id: speciesId }).expect(201).end(done);
        });

        it('/:id/weapons should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/weapons', { insert_id: weaponId }).expect(201).end(done);
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

        it('/:id/backgrounds should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/backgrounds')
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

        it('/:id/expertises should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/expertises')
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

        it('/:id/gifts should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/gifts')
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

        it('/:id/identities should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/identities')
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

        it('/:id/imperfections should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/imperfections')
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

        it('/:id/manifestations should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/manifestations')
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

        it('/:id/milestones should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/milestones')
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

        it('/:id/natures should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/natures')
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

        it('/:id/protection should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/protection')
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

        it('/:id/software should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/software')
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

        it('/:id/species should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/species')
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