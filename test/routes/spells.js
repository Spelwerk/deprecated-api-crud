const assert = require('chai').assert;

const app = require('../app');
const verifier = require('../verifier');
const hasher = require('../../lib/hasher');

describe('/spell', function() {

    function verifyItem(item) {
        verifier.generic(item);
    }

    let baseRoute = '/spells';
    let temporaryId;

    before(function(done) {
        app.login(done);
    });

    let attributeId;
    before(function(done) {
        app.get('/attributes')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                attributeId = res.body.results[0].id;

                done();
            });
    });

    let expertiseId;
    before(function(done) {
        app.get('/expertises')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                let length = res.body.length - 1;
                expertiseId = res.body.results[length].id;

                done();
            });
    });

    let manifestationId;
    before(function(done) {
        app.get('/manifestations')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                let length = res.body.length - 1;
                manifestationId = res.body.results[length].id;

                done();
            });
    });

    let spellTypeId;
    before(function(done) {
        app.get('/spelltypes')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                let length = res.body.length - 1;
                spellTypeId = res.body.results[length].id;

                done();
            });
    });

    describe('POST', function() {

        it('/ should create a new item', function(done) {
            let payload = {
                name: hasher(20),
                description: hasher(20),
                icon: 'http://fakeicon.com/' + hasher(20) + '.png',
                manifestation_id: manifestationId,
                spelltype_id: spellTypeId,
                effect: hasher(20),
                effect_dice: 1,
                effect_bonus: 2,
                damage_dice: 3,
                damage_bonus: 4,
                critical_dice: 5,
                critical_bonus: 6,
                distance: 7,
                cost: 8,
                attribute_id: attributeId
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
            app.post(baseRoute + '/' + temporaryId + '/comments', { comment: hasher(20) }).expect(204).end(done);
        });

    });

    describe('PUT', function() {

        it('/:id should update the item with new values', function(done) {
            let payload = {
                name: hasher(20),
                description: hasher(20),
                effect: hasher(20)
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