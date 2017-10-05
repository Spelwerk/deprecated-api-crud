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

describe('/bionics', function() {

    var baseRoute = '/bionics';

    var temporaryId;

    before(function(done) {
        app.login(done);
    });

    var bodyPartId;
    before(function(done) {
        app.get('/bodyparts')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                bodyPartId = res.body.results[0].id;

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
        assert.isBoolean(item.legal);
        assert.isNumber(item.price);
        assert.isNumber(item.hacking_difficulty);
    }


    describe('POST', function() {

        it('/ should create a new item', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                bodypart_id: bodyPartId,
                legal: true,
                price: 10,
                hacking_difficulty: 10
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

        it('/:id/attributes should add a relation to the item', function(done) {
            var payload = {
                insert_id: attributeId,
                value: 10
            };

            app.post(baseRoute + '/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:id/software should add a relation to the item', function(done) {
            var payload = {
                insert_id: softwareId
            };

            app.post(baseRoute + '/' + temporaryId + '/software', payload)
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

        it('/:id/attributes should change the value', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/attributes/' + attributeId, { value: 8 })
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

        it('/bodypart/:bodyPartId should return a list', function(done) {
            app.get('/bionics/bodypart/' + bodyPartId)
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
            app.get(baseRoute + '/' + temporaryId + '/ownership').expect(200).end(function(err, res) { verifier.ownership(err, res, done); });
        });

        it('/:id/comments should get all available comments', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/comments').expect(200).end(function(err, res) { verifier.comments(err, res, done); });
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

    });

    describe('/augmentations', function() {
        var relationRoute = 'augmentations',
            relationId;

        before(function(done) {
            app.get('/augmentations')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    var length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('GET / should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

    });

});