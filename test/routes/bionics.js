var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/bionics', function() {

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
        assert.isNumber(item.id);
        assert.isBoolean(item.canon);
        assert.isNumber(item.popularity);

        assert.isString(item.name);
        if(item.description) assert.isString(item.description);
        assert.isNumber(item.price);
        assert.isBoolean(item.legal);
        assert.isNumber(item.bodypart_id);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('POST / should create a new bionic', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                price: 10,
                legal: true,
                bodypart_id: 1
            };

            app.post('/bionics', payload)
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

        it('POST /:bionicId/clone should create a copy of the bionic', function(done) {
            app.post('/bionics/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('POST /:bionicId/comments should create a new comment for the bionic', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/bionics/' + temporaryId + '/comments', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('POST /:bionicId/attributes should add an attribute to the bionic', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/bionics/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);

                    done();
                });
        });

        it('POST /:bionicId/augmentations should add an augmentation to the bionic', function(done) {
            var payload = {
                insert_id: 1
            };

            app.post('/bionics/' + temporaryId + '/augmentations', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('PUT /:bionicId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/bionics/' + temporaryId, payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);
                    assert.notEqual(res.body.changed, 0);

                    assert.isNumber(res.body.id);

                    done();
                })
        });

        it('PUT /:bionicId/canon should update the bionic canon field', function(done) {
            app.put('/bionics/' + temporaryId + '/canon')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);
                    assert.notEqual(res.body.changed, 0);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('PUT /:bionicId/attributes should change the attribute value for the bionic', function(done) {
            var payload = {
                value: 8
            };

            app.put('/bionics/' + temporaryId + '/attributes/1', payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);

                    done();
                });
        });

    });

    describe('GET', function() {

        it('GET / should return a list of bionics', function(done) {
            app.get('/bionics')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('GET /bodypart/:bodyPartId should return a list of bionics', function(done) {
            app.get('/bionics/bodypart/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('GET /:bionicId should return one bionic', function(done) {
            app.get('/bionics/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('GET /:bionicId/ownership should return ownership status of the bionic if user is logged in', function(done) {
            app.get('/bionics/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('GET /:bionicId/comments should get all available comments for the bionic', function(done) {
            app.get('/bionics/' + temporaryId + '/comments')
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

        it('GET /:bionicId/attributes should return a list of attributes', function(done) {
            app.get('/bionics/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.bionic_id);
                        assert.isNumber(item.attribute_id);
                        assert.isNumber(item.value);

                        assert.isNumber(item.id);
                        assert.isBoolean(item.canon);
                        assert.isString(item.name);
                        if(item.description) assert.isString(item.description);
                        assert.isNumber(item.attributetype_id);
                        if(item.icon) assert.equal(validator.isURL(item.icon), true);

                        assert.isString(item.created);
                        if(item.deleted) assert.isString(item.deleted);
                        if(item.updated) assert.isString(item.updated);
                    });

                    done();
                });
        });

        it('GET /:bionicId/augmentations should return a list of augmentations', function(done) {
            app.get('/bionics/' + temporaryId + '/augmentations')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.bionic_id);
                        assert.isNumber(item.augmentation_id);

                        assert.isNumber(item.id);
                        assert.isBoolean(item.canon);
                        assert.isNumber(item.popularity);
                        assert.isString(item.name);
                        if(item.description) assert.isString(item.description);
                        assert.isNumber(item.price);
                        assert.isBoolean(item.legal);
                        if(item.weapon_id) assert.isNumber(item.weapon_id);

                        assert.isString(item.created);
                        if(item.deleted) assert.isString(item.deleted);
                        if(item.updated) assert.isString(item.updated);
                    });

                    done();
                });
        });

    });

    describe('DELETE', function() {

        it('DELETE /:bionicId/attributes should remove the attribute from the bionic', function(done) {
            app.delete('/bionics/' + temporaryId + '/attributes/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);

                    done();
                });
        });

        it('DELETE /:bionicId/augmentations should remove the augmentation from the bionic', function(done) {
            app.delete('/bionics/' + temporaryId + '/augmentations/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);

                    done();
                });
        });

        it('DELETE /:bionicId should update the bionic deleted field', function(done) {
            app.delete('/bionics/' + temporaryId)
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