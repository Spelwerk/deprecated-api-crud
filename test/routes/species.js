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

describe('/species', function() {

    var baseRoute = '/species';

    var temporaryId,
        attributeId;

    before(function(done) {
        app.login(done);
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
        assert.isNumber(item.id);
        assert.isBoolean(item.canon);

        assert.isString(item.name);
        if(item.description) assert.isString(item.description);
        assert.isBoolean(item.playable);
        assert.isNumber(item.max_age);
        assert.isNumber(item.multiply_skill);
        assert.isNumber(item.multiply_expertise);
        if(item.icon) assert.equal(validator.isURL(item.icon), true);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new species', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                playable: true,
                manifestation: true,
                max_age: 10,
                multiply_doctrine: 10,
                multiply_expertise: 10,
                multiply_skill: 10,
                icon: 'http://fakeicon.com/' + hasher(20) + '.png'
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

        it('/:id/attributes should add an attribute', function(done) {
            var payload = {
                insert_id: attributeId,
                value: 10
            };

            app.post(baseRoute + '/' + temporaryId + '/attributes', payload)
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
            app.put(baseRoute + '/' + temporaryId + '/attributes/1', { value: 8 })
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

        it('/playable/:playable should return a list', function(done) {
            app.get(baseRoute)
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

        it('/:id/attributes should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        verifier.generic(item);

                        assert.isNumber(item.generic_id);
                        assert.isNumber(item.relation_id);
                        assert.isNumber(item.value);
                    });

                    done();
                });
        });

    });

    xdescribe('DELETE', function() {

        it('/:id/attributes should remove the attribute from the species', function(done) {
            app.delete(baseRoute + '/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:id/weapons should remove the weapon from the species', function(done) {
            app.delete(baseRoute + '/' + temporaryId + '/weapons/1')
                .expect(204)
                .end(done);
        });

        it('/:id should update the species deleted field', function(done) {
            app.delete(baseRoute + '/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});