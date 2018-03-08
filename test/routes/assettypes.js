const assert = require('chai').assert;

const app = require('../app');
const verifier = require('../verifier');
const hasher = require('../../lib/hasher');

describe('/assettypes', function() {

    function verifyItem(item) {
        verifier.generic(item);
    }

    let baseRoute = '/assettypes';
    let temporaryId;

    before(function(done) {
        app.login(done);
    });

    describe('POST', function() {

        it('/ should create a new item', function(done) {
            let payload = {
                name: hasher(20)
            };

            app.post(baseRoute, payload)
                .expect(201)
                .end(function(err, res) {
                    if (err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:id should update the item with new values', function(done) {
            let payload = {name: hasher(20)};

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
                    if (err) return done(err);

                    verifier.lists(res.body, verifyItem);

                    done();
                });
        });

        it('/deleted should return a list of deleted items', function(done) {
            app.get(baseRoute + '/deleted')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    verifier.lists(res.body, verifyItem);

                    done();
                });
        });

        it('/group/:assetGroupId should return a list', function(done) {
            app.get(baseRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    verifier.lists(res.body, verifyItem);

                    done();
                });
        });

        it('/:id should return one item', function(done) {
            app.get(baseRoute + '/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:id/permissions should return user permissions', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/permissions').expect(200).end(function(err, res) { verifier.ownership(err, res, done); });
        });

    });


    describe('CLONE', function() {

        it('/:id/clone should create a copy', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if (err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

});