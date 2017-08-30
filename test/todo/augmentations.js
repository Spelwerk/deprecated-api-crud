var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('../app'),
    verifier = require('./../verifier'),
    hasher = require('../../lib/hasher');

describe('/augmentations', function() {

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

        assert.isString(item.name);
        if(item.description) assert.isString(item.description);
        assert.isNumber(item.price);
        assert.isBoolean(item.legal);
        if(item.weapon_id) assert.isNumber(item.weapon_id);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new augmentation', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                price: 10,
                legal: true,
                weapon_id: 1
            };

            app.post('/augmentations', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:augmentationId/clone should create a copy of the augmentation', function(done) {
            app.post('/augmentations/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:augmentationId/comments should create a new comment for the augmentation', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/augmentations/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:augmentationId/attributes should add an attribute to the augmentation', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/augmentations/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:augmentationId/skills should add an skill to the augmentation', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/augmentations/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:augmentationId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/augmentations/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:augmentationId/canon should update the augmentation canon field', function(done) {
            app.put('/augmentations/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:augmentationId/attributes should change the attribute value for the augmentation', function(done) {
            var payload = {value: 8};

            app.put('/augmentations/' + temporaryId + '/attributes/1', payload)
                .expect(204)
                .end(done);
        });

        it('/:augmentationId/skills should change the skill value for the augmentation', function(done) {
            var payload = {value: 8};

            app.put('/augmentations/' + temporaryId + '/skills/1', payload)
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of augmentations', function(done) {
            app.get('/augmentations')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:augmentationId should return one augmentation', function(done) {
            app.get('/augmentations/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:augmentationId/ownership should return ownership status of the augmentation if user is logged in', function(done) {
            app.get('/augmentations/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:augmentationId/comments should get all available comments for the augmentation', function(done) {
            app.get('/augmentations/' + temporaryId + '/comments')
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

        it('/:augmentationId/attributes should return a list of attributes', function(done) {
            app.get('/augmentations/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.augmentation_id);
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

        it('/:augmentationId/skills should return a list of skills', function(done) {
            app.get('/augmentations/' + temporaryId + '/skills')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.augmentation_id);
                        assert.isNumber(item.skill_id);
                        assert.isNumber(item.value);

                        assert.isNumber(item.id);
                        assert.isBoolean(item.canon);
                        assert.isNumber(item.popularity);
                        assert.isBoolean(item.manifestation);
                        assert.isString(item.name);
                        if(item.description) assert.isString(item.description);
                        if(item.species_id) assert.isNumber(item.species_id);
                        if(item.icon) assert.equal(validator.isURL(item.icon), true);

                        assert.isString(item.created);
                        if(item.deleted) assert.isString(item.deleted);
                        if(item.updated) assert.isString(item.updated);
                    });

                    done();
                });
        });

    });

    describe('DELETE', function() {

        it('/:augmentationId/attributes should remove the attribute from the augmentation', function(done) {
            app.delete('/augmentations/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:augmentationId/skills should remove the skill from the augmentation', function(done) {
            app.delete('/augmentations/' + temporaryId + '/skills/1')
                .expect(204)
                .end(done);
        });

        it('/:augmentationId should update the augmentation deleted field', function(done) {
            app.delete('/augmentations/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});