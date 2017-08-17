var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/milestones', function() {

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
        if(item.background_id) assert.isNumber(item.background_id);
        if(item.manifestation_id) assert.isNumber(item.manifestation_id);
        if(item.species_id) assert.isNumber(item.species_id);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new milestone', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                background_id: 1,
                manifestation_id: 1,
                species_id: 1
            };

            app.post('/milestones', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:milestoneId/clone should create a copy of the milestone', function(done) {
            app.post('/milestones/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:milestoneId/comments should create a new comment for the milestone', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/milestones/' + temporaryId + '/comments', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:milestoneId/assets should add an asset to the milestone', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/milestones/' + temporaryId + '/assets', payload)
                .expect(201)
                .end(done);
        });

        it('/:milestoneId/attributes should add an attribute to the milestone', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/milestones/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        xit('/:milestoneId/loyalties should add an loyalty to the milestone', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/milestones/' + temporaryId + '/loyalties', payload)
                .expect(201)
                .end(done);
        });

        it('/:milestoneId/skills should add an skill to the milestone', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/milestones/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:milestoneId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/milestones/' + temporaryId, payload)
                .expect(200)
                .end(done);
        });

        it('/:milestoneId/canon should update the milestone canon field', function(done) {
            app.put('/milestones/' + temporaryId + '/canon')
                .expect(200)
                .end(done);
        });

        it('/:milestoneId/assets should change the asset value for the milestone', function(done) {
            var payload = {
                value: 8
            };

            app.put('/milestones/' + temporaryId + '/assets/1', payload)
                .expect(200)
                .end(done);
        });

        it('/:milestoneId/attributes should change the attribute value for the milestone', function(done) {
            var payload = {
                value: 8
            };

            app.put('/milestones/' + temporaryId + '/attributes/1', payload)
                .expect(200)
                .end(done);
        });

        xit('/:milestoneId/loyalties should change the loyalty value for the milestone', function(done) {
            var payload = {
                value: 8
            };

            app.put('/milestones/' + temporaryId + '/loyalties/1', payload)
                .expect(200)
                .end(done);
        });

        it('/:milestoneId/skills should change the skill value for the milestone', function(done) {
            var payload = {
                value: 8
            };

            app.put('/milestones/' + temporaryId + '/skills/1', payload)
                .expect(200)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of milestones', function(done) {
            app.get('/milestones')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/background/:backgroundId should return a list of milestones', function(done) {
            app.get('/milestones/background/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/manifestation/:manifestationId should return a list of milestones', function(done) {
            app.get('/milestones/manifestation/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/species/:speciesId should return a list of milestones', function(done) {
            app.get('/milestones/species/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:milestoneId should return one milestone', function(done) {
            app.get('/milestones/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:milestoneId/ownership should return ownership status of the milestone if user is logged in', function(done) {
            app.get('/milestones/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:milestoneId/comments should get all available comments for the milestone', function(done) {
            app.get('/milestones/' + temporaryId + '/comments')
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

        it('/:milestoneId/assets should return a list of assets', function(done) {
            app.get('/milestones/' + temporaryId + '/assets')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.milestone_id);
                        assert.isNumber(item.asset_id);
                        assert.isNumber(item.value);

                        assert.isNumber(item.id);
                        assert.isBoolean(item.canon);
                        assert.isNumber(item.popularity);
                        assert.isString(item.name);
                        if(item.description) assert.isString(item.description);
                        assert.isNumber(item.price);
                        assert.isBoolean(item.legal);
                        assert.isNumber(item.assettype_id);

                        assert.isString(item.created);
                        if(item.deleted) assert.isString(item.deleted);
                        if(item.updated) assert.isString(item.updated);
                    });

                    done();
                });
        });

        it('/:milestoneId/attributes should return a list of attributes', function(done) {
            app.get('/milestones/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.milestone_id);
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

        xit('/:milestoneId/loyalties should return a list of loyalties', function(done) {
            app.get('/milestones/' + temporaryId + '/loyalties')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.milestone_id);
                        assert.isNumber(item.loyalty_id);
                        assert.isNumber(item.value);

                        assert.isNumber(item.id);
                        assert.isBoolean(item.canon);
                        assert.isNumber(item.popularity);
                        assert.isString(item.name);
                        if(item.description) assert.isString(item.description);
                        assert.isNumber(item.value);
                        if(item.icon) assert.equal(validator.isURL(item.icon), true);

                        assert.isString(item.created);
                        if(item.deleted) assert.isString(item.deleted);
                        if(item.updated) assert.isString(item.updated);
                    });

                    done();
                });
        });

        it('/:milestoneId/skills should return a list of skills', function(done) {
            app.get('/milestones/' + temporaryId + '/skills')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.milestone_id);
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

        it('/:milestoneId/assets should remove the asset from the milestone', function(done) {
            app.delete('/milestones/' + temporaryId + '/assets/1')
                .expect(200)
                .end(done);
        });

        it('/:milestoneId/attributes should remove the attribute from the milestone', function(done) {
            app.delete('/milestones/' + temporaryId + '/attributes/1')
                .expect(200)
                .end(done);
        });

        xit('/:milestoneId/loyalties should remove the loyalty from the milestone', function(done) {
            app.delete('/milestones/' + temporaryId + '/loyalties/1')
                .expect(200)
                .end(done);
        });

        it('/:milestoneId/skills should remove the skill from the milestone', function(done) {
            app.delete('/milestones/' + temporaryId + '/skills/1')
                .expect(200)
                .end(done);
        });

        it('/:milestoneId should update the milestone deleted field', function(done) {
            app.delete('/milestones/' + temporaryId)
                .expect(200)
                .end(done);
        });

    });

});