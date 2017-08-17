var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/assets', function() {

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
        assert.isNumber(item.assettype_id);
        if(item.icon) assert.equal(validator.isURL(item.icon), true);
        assert.isNumber(item.assetgroup_id);
        assert.isBoolean(item.equippable);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new asset', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                price: 10,
                legal: true,
                assettype_id: 1
            };

            app.post('/assets', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:assetId/clone should create a copy of the asset', function(done) {
            app.post('/assets/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:assetId/comments should create a new comment for the asset', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/assets/' + temporaryId + '/comments', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:assetId/attributes should add an attribute to the asset', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/assets/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:assetId/doctrines should add an doctrine to the asset', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/assets/' + temporaryId + '/doctrines', payload)
                .expect(201)
                .end(done);
        });

        it('/:assetId/expertises should add an expertise to the asset', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/assets/' + temporaryId + '/expertises', payload)
                .expect(201)
                .end(done);
        });

        it('/:assetId/skills should add an skill to the asset', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/assets/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:assetId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/assets/' + temporaryId, payload)
                .expect(200)
                .end(done);
        });

        it('/:assetId/canon should update the asset canon field', function(done) {
            app.put('/assets/' + temporaryId + '/canon')
                .expect(200)
                .end(done);
        });

        it('/:assetId/attributes should change the attribute value for the asset', function(done) {
            var payload = {
                value: 8
            };

            app.put('/assets/' + temporaryId + '/attributes/1', payload)
                .expect(200)
                .end(done);
        });

        it('/:assetId/doctrines should change the doctrine value for the asset', function(done) {
            var payload = {
                value: 8
            };

            app.put('/assets/' + temporaryId + '/doctrines/1', payload)
                .expect(200)
                .end(done);
        });

        it('/:assetId/expertises should change the expertise value for the asset', function(done) {
            var payload = {
                value: 8
            };

            app.put('/assets/' + temporaryId + '/expertises/1', payload)
                .expect(200)
                .end(done);
        });

        it('/:assetId/skills should change the skill value for the asset', function(done) {
            var payload = {
                value: 8
            };

            app.put('/assets/' + temporaryId + '/skills/1', payload)
                .expect(200)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of assets', function(done) {
            app.get('/assets')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/type/:typeId should return a list of assets', function(done) {
            app.get('/assets/type/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:assetId should return one asset', function(done) {
            app.get('/assets/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:assetId/ownership should return ownership status of the asset if user is logged in', function(done) {
            app.get('/assets/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:assetId/comments should get all available comments for the asset', function(done) {
            app.get('/assets/' + temporaryId + '/comments')
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

        it('/:assetId/attributes should return a list of attributes', function(done) {
            app.get('/assets/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.asset_id);
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

        it('/:assetId/doctrines should return a list of doctrines', function(done) {
            app.get('/assets/' + temporaryId + '/doctrines')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.asset_id);
                        assert.isNumber(item.doctrine_id);
                        assert.isNumber(item.value);

                        assert.isNumber(item.id);
                        assert.isBoolean(item.canon);
                        assert.isNumber(item.popularity);
                        assert.isString(item.name);
                        if(item.description) assert.isString(item.description);
                        assert.isNumber(item.manifestation_id);
                        assert.isNumber(item.expertise_id);
                        if(item.icon) assert.equal(validator.isURL(item.icon), true);

                        assert.isString(item.created);
                        if(item.deleted) assert.isString(item.deleted);
                        if(item.updated) assert.isString(item.updated);
                    });

                    done();
                });
        });

        it('/:assetId/expertises should return a list of expertises', function(done) {
            app.get('/assets/' + temporaryId + '/expertises')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.asset_id);
                        assert.isNumber(item.expertise_id);
                        assert.isNumber(item.value);

                        assert.isNumber(item.id);
                        assert.isBoolean(item.canon);
                        assert.isNumber(item.popularity);
                        assert.isString(item.name);
                        if(item.description) assert.isString(item.description);
                        assert.isNumber(item.skill_id);
                        if(item.species_id) assert.isNumber(item.species_id);
                        if(item.species_id) assert.isNumber(item.manifestation_id);

                        assert.isString(item.created);
                        if(item.deleted) assert.isString(item.deleted);
                        if(item.updated) assert.isString(item.updated);
                    });

                    done();
                });
        });

        it('/:assetId/skills should return a list of skills', function(done) {
            app.get('/assets/' + temporaryId + '/skills')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.asset_id);
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

        it('/:assetId/attributes should remove the attribute from the asset', function(done) {
            app.delete('/assets/' + temporaryId + '/attributes/1')
                .expect(200)
                .end(done);
        });

        it('/:assetId/doctrines should remove the doctrine from the asset', function(done) {
            app.delete('/assets/' + temporaryId + '/doctrines/1')
                .expect(200)
                .end(done);
        });

        it('/:assetId/expertises should remove the expertise from the asset', function(done) {
            app.delete('/assets/' + temporaryId + '/expertises/1')
                .expect(200)
                .end(done);
        });

        it('/:assetId/skills should remove the skill from the asset', function(done) {
            app.delete('/assets/' + temporaryId + '/skills/1')
                .expect(200)
                .end(done);
        });

        it('/:assetId should update the asset deleted field', function(done) {
            app.delete('/assets/' + temporaryId)
                .expect(200)
                .end(done);
        });

    });

});