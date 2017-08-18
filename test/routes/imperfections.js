var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/imperfections', function() {

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
        if(item.manifestation_id) assert.isNumber(item.manifestation_id);
        if(item.species_id) assert.isNumber(item.species_id);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new asset', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                manifestation_id: 1,
                species_id: 1
            };

            app.post('/imperfections', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:imperfectionId/clone should create a copy of the asset', function(done) {
            app.post('/imperfections/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:imperfectionId/comments should create a new comment for the asset', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/imperfections/' + temporaryId + '/comments', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:imperfectionId/attributes should add an attribute to the imperfection', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/imperfections/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:imperfectionId/skills should add an skill to the imperfection', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/imperfections/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:imperfectionId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/imperfections/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId/canon should update the asset canon field', function(done) {
            app.put('/imperfections/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId/attributes should change the attribute value for the imperfection', function(done) {
            var payload = {value: 8};

            app.put('/imperfections/' + temporaryId + '/attributes/1', payload)
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId/skills should change the skill value for the imperfection', function(done) {
            var payload = {value: 8};

            app.put('/imperfections/' + temporaryId + '/skills/1', payload)
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of imperfections', function(done) {
            app.get('/imperfections')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/manifestation/:manifestationId should return a list of imperfections', function(done) {
            app.get('/imperfections/manifestation/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:speciesId should return a list of imperfections', function(done) {
            app.get('/imperfections/species/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:imperfectionId should return one asset', function(done) {
            app.get('/imperfections/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:imperfectionId/ownership should return ownership status of the asset if user is logged in', function(done) {
            app.get('/imperfections/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:imperfectionId/comments should get all available comments for the asset', function(done) {
            app.get('/imperfections/' + temporaryId + '/comments')
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

        it('/:imperfectionId/attributes should return a list of attributes', function(done) {
            app.get('/imperfections/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.imperfection_id);
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

        it('/:imperfectionId/skills should return a list of skills', function(done) {
            app.get('/imperfections/' + temporaryId + '/skills')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.imperfection_id);
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

        it('/:imperfectionId/attributes should remove the attribute from the imperfection', function(done) {
            app.delete('/imperfections/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId/skills should remove the skill from the imperfection', function(done) {
            app.delete('/imperfections/' + temporaryId + '/skills/1')
                .expect(204)
                .end(done);
        });

        it('/:imperfectionId should update the asset deleted field', function(done) {
            app.delete('/imperfections/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});