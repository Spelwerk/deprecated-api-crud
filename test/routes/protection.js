var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/protection', function() {

    before(function(done) {
        app.login(done);
    });

    var temporaryId;

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
        assert.isBoolean(item.canon);
        assert.isNumber(item.popularity);

        assert.isString(item.name);
        if(item.description) assert.isString(item.description);
        assert.isNumber(item.price);
        assert.isNumber(item.bodypart_id);
        if(item.icon) assert.equal(validator.isURL(item.icon), true);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('POST / should create a new protection', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                price: 10,
                bodypart_id: 1
            };

            app.post('/protection', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.notEqual(res.body.affected, 0);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('POST /:protectionId/clone should create a copy of the protection', function(done) {
            app.post('/protection/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('POST /:protectionId/comments should create a new comment for the protection', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/protection/' + temporaryId + '/comments', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('POST /:protectionId/attributes should add an attribute to the protection', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/protection/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('PUT /:protectionId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                price: 10
            };

            app.put('/protection/' + temporaryId, payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);
                    assert.notEqual(res.body.changed, 0);

                    assert.isNumber(res.body.id);

                    done();
                })
        });

        it('PUT /:protectionId/canon should update the protection canon field', function(done) {
            app.put('/protection/' + temporaryId + '/canon')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);
                    assert.notEqual(res.body.changed, 0);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('PUT /:protectionId/attributes should change the attribute value for the protection', function(done) {
            var payload = {
                value: 8
            };

            app.put('/protection/' + temporaryId + '/attributes/1', payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);

                    done();
                });
        });

    });

    describe('GET', function() {

        it('GET / should return a list of protection', function(done) {
            app.get('/protection')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('GET /bodypart/:bodyPartId should return a list of protection', function(done) {
            app.get('/protection/bodypart/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('GET /:protectionId should return one protection', function(done) {
            app.get('/protection/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('GET /:protectionId/ownership should return ownership status of the protection if user is logged in', function(done) {
            app.get('/protection/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('GET /:protectionId/comments should get all available comments for the protection', function(done) {
            app.get('/protection/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    _.each(res.body.results, function(comment) {
                        assert.isNumber(comment.id);
                        assert.isString(comment.content);

                        assert.isNumber(comment.user_id);
                        assert.isString(comment.displayname);

                        assert.isString(comment.created);
                        if(comment.updated) assert.isString(comment.updated);
                        assert.isNull(comment.deleted);
                    });

                    done();
                })
        });

        it('GET /:protectionId/attributes should return a list of attributes', function(done) {
            app.get('/protection/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.protection_id);
                        assert.isNumber(item.attribute_id);
                        assert.isNumber(item.value);

                        assert.isNumber(item.id);
                        assert.isBoolean(item.canon);
                        assert.isString(item.name);
                        if(item.description) assert.isString(item.description);
                        assert.isNumber(item.attributetype_id);
                        if(item.icon) assert.equal(validator.isURL(item.icon), true);

                        assert.isString(item.created);
                        if(item.deleted) assert.isNumber(item.deleted);
                        if(item.updated) assert.isNumber(item.updated);
                    });

                    done();
                });
        });

    });

    describe('DELETE', function() {

        it('DELETE /:protectionId/attributes should remove the attribute from the protection', function(done) {
            app.delete('/protection/' + temporaryId + '/attributes/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);

                    done();
                });
        });

        it('DELETE /:protectionId should update the protection deleted field', function(done) {
            app.delete('/protection/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.notEqual(res.body.affected, 0);

                    done();
                })
        });

    });

});