var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/gifts', function() {

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
        if(item.species_id) assert.isNumber(item.species_id);
        if(item.manifestation_id) assert.isNumber(item.manifestation_id);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new gift', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                species_id: 1,
                manifestation_id: 1
            };

            app.post('/gifts', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:giftId/clone should create a copy of the gift', function(done) {
            app.post('/gifts/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:giftId/comments should create a new comment for the gift', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/gifts/' + temporaryId + '/comments', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:giftId/attributes should add an attribute to the gift', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/gifts/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:giftId/skills should add an skill to the gift', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/gifts/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:giftId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/gifts/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:giftId/canon should update the gift canon field', function(done) {
            app.put('/gifts/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:giftId/attributes should change the attribute value for the gift', function(done) {
            var payload = {value: 8};

            app.put('/gifts/' + temporaryId + '/attributes/1', payload)
                .expect(204)
                .end(done);
        });

        it('/:giftId/skills should change the skill value for the gift', function(done) {
            var payload = {value: 8};

            app.put('/gifts/' + temporaryId + '/skills/1', payload)
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of gifts', function(done) {
            app.get('/gifts')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/manifestation/:manifestationId should return a list of gifts', function(done) {
            app.get('/gifts/manifestation/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:speciesId should return a list of gifts', function(done) {
            app.get('/gifts/species/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:giftId should return one gift', function(done) {
            app.get('/gifts/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:giftId/ownership should return ownership status of the gift if user is logged in', function(done) {
            app.get('/gifts/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:giftId/comments should get all available comments for the gift', function(done) {
            app.get('/gifts/' + temporaryId + '/comments')
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

        it('/:giftId/attributes should return a list of attributes', function(done) {
            app.get('/gifts/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.gift_id);
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

        it('/:giftId/skills should return a list of skills', function(done) {
            app.get('/gifts/' + temporaryId + '/skills')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.gift_id);
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

        it('/:giftId/attributes should remove the attribute from the gift', function(done) {
            app.delete('/gifts/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:giftId/skills should remove the skill from the gift', function(done) {
            app.delete('/gifts/' + temporaryId + '/skills/1')
                .expect(204)
                .end(done);
        });

        it('/:giftId should update the gift deleted field', function(done) {
            app.delete('/gifts/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});