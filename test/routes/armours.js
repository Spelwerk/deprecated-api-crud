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

describe('/armours', function() {

    let baseRoute = '/armours';

    let temporaryId;

    before(function(done) {
        app.login(done);
    });

    let bodyPartId;
    before(function(done) {
        app.get('/bodyparts')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                bodyPartId = res.body.results[0].id;

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

        assert.isNumber(item.bodypart_id);
        assert.isNumber(item.price);
    }


    describe('POST', function() {

        it('/ should create a new item', function(done) {
            let payload = {
                name: hasher(20),
                description: hasher(20),
                bodypart_id: bodyPartId,
                price: 10
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

        it('/bodypart/:bodyPartId should return a list', function(done) {
            app.get(baseRoute + '/bodypart/' + bodyPartId)
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

        it('/:id/permissions should return user permissions', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/permissions').expect(200).end(function(err, res) { verifier.ownership(err, res, done); });
        });

        it('/:id/comments should get all available comments', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/comments').expect(200).end(function(err, res) { verifier.comments(err, res, done); });
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
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
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
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
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
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
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