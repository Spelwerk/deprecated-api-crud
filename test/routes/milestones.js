let async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

let should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

let app = require('../app'),
    verifier = require('../verifier'),
    hasher = require('../../lib/hasher');

describe('/milestones', function() {

    function verifyItem(item) {
        verifier.generic(item);

        if(item.manifestation_id) assert.isNumber(item.manifestation_id);
        if(item.species_id) assert.isNumber(item.species_id);
    }

    let baseRoute = '/milestones';
    let temporaryId;

    before(function(done) {
        app.login(done);
    });

    let backgroundId;
    before(function(done) {
        app.get('/backgrounds')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                backgroundId = res.body.results[0].id;

                done();
            });
    });

    let manifestationId;
    before(function(done) {
        app.get('/manifestations')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                manifestationId = res.body.results[0].id;

                done();
            });
    });

    let speciesId;
    before(function(done) {
        app.get('/species')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                speciesId = res.body.results[0].id;

                done();
            });
    });

    describe('POST', function() {

        it('/ should create a new item', function(done) {
            let payload = {
                name: hasher(20),
                description: hasher(20),
                background_id: backgroundId,
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

        it('/:id/comments should create a new comment', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:id should update the item with new values', function(done) {
            let payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put(baseRoute + '/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:id/canon/:canon should update the canon status', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/canon/1').expect(204).end(done);
        });

        it('/:id/permissions/favorite/1 should set it as favorite', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/permissions/favorite/1').expect(204).end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list', function(done) {
            app.get(baseRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.lists(res.body, verifyItem);

                    done();
                });
        });

        it('/deleted should return a list of deleted items', function(done) {
            app.get(baseRoute + '/deleted')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.lists(res.body, verifyItem);

                    done();
                });
        });

        it('/manifestation/:typeId should return a list', function(done) {
            app.get('/milestones/manifestation/' + manifestationId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.lists(res.body, verifyItem);

                    done();
                });
        });

        it('/species/:typeId should return a list', function(done) {
            app.get('/milestones/species/' + speciesId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.lists(res.body, verifyItem);

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

        it('/:id/permissions should return user permissions', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/permissions').expect(200).end(function(err, res) { verifier.ownership(err, res, done); });
        });

        it('/:id/comments should get all available comments', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/comments').expect(200).end(function(err, res) { verifier.comments(err, res, done); });
        });

    });


    describe('/armours', function() {
        let relationRoute = 'armours',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

    });

    describe('/assets', function() {
        let relationRoute = 'assets',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

    });

    describe('/attributes', function() {
        let relationRoute = 'attributes',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

    });

    describe('/bionics', function() {
        let relationRoute = 'bionics',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

    });

    describe('/primals', function() {
        let relationRoute = 'primals',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

    });

    describe('/loyalties', function() {
        let relationRoute = 'loyalties',
            relationId,
            wealthId,
            uqId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        before(function(done) {
            app.get('/wealth')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    wealthId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, wealth_id: wealthId, occupation: hasher(20)}).expect(201).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.id);
                uqId = res.body.id;

                done();
            });
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uqId, {wealth_id: wealthId, occupation: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);

                _.each(res.body.results, function(item) {
                    assert.isNumber(item.id);
                    assert.isNumber(item.loyalty_id);
                    assert.isNumber(item.wealth_id);
                    assert.isString(item.occupation);
                });

                done();
            });
        });

    });

    describe('/shields', function() {
        let relationRoute = 'shields',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

    });

    describe('/skills', function() {
        let relationRoute = 'skills',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

    });

    describe('/weapons', function() {
        let relationRoute = 'weapons',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

    });


    describe('CLONE', function() {

        it('/:id/clone should create a copy', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

});